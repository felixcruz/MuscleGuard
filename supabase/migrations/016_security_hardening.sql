-- 016_security_hardening.sql
-- Pre-launch security hardening. Three fixes:
--   1. Lock privileged columns on profiles (role / subscription / stripe) so a
--      user with the public anon key cannot escalate their own role or grant
--      themselves a paid subscription.
--   2. Durable, atomic rate limiter backed by Postgres (the in-memory limiter
--      does not work across Vercel's serverless instances).
--   3. Harden fn_log_profile_update: fixed search_path + revoke EXECUTE so it
--      cannot be called directly as a SECURITY DEFINER RPC.

-- ---------------------------------------------------------------------------
-- FIX 1: privileged columns on profiles are writable only by service_role
-- ---------------------------------------------------------------------------
-- The RLS policy "users manage own profile" (USING auth.uid() = id) let users
-- change ANY column of their own row, including role and subscription_status.
-- A BEFORE trigger now pins those columns for non-service_role callers.

create or replace function public.enforce_profile_immutable_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Only the PUBLIC-facing Postgres roles are restricted. PostgREST switches to
  -- 'authenticated' / 'anon' based on the validated JWT, and a user cannot forge
  -- any other role without the service role key. Everything else (service_role,
  -- postgres, supabase_admin — i.e. webhooks, the admin API, migrations) passes.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A user creating their own profile always starts as a trial 'user'.
    new.role := 'user';
    new.subscription_status := coalesce(new.subscription_status, 'trial');
    if new.subscription_status not in ('trial') then
      new.subscription_status := 'trial';
    end if;
    new.stripe_customer_id := null;
    new.stripe_subscription_id := null;
    new.subscription_period_end := null;
    new.cancel_at_period_end := false;
    return new;
  end if;

  -- UPDATE: privileged columns keep their previous values for regular users.
  new.role := old.role;
  new.subscription_status := old.subscription_status;
  new.stripe_customer_id := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.subscription_period_end := old.subscription_period_end;
  new.cancel_at_period_end := old.cancel_at_period_end;
  new.trial_ends_at := old.trial_ends_at;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_immutable on public.profiles;
create trigger trg_enforce_profile_immutable
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_immutable_columns();

-- ---------------------------------------------------------------------------
-- FIX 2: durable rate limiter
-- ---------------------------------------------------------------------------
create table if not exists public.api_rate_limits (
  bucket_key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
-- No policies on purpose: only service_role (which bypasses RLS) reads/writes.

create or replace function public.check_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_count int;
  v_window_start timestamptz;
begin
  insert into public.api_rate_limits (bucket_key, count, window_start)
  values (p_key, 1, v_now)
  on conflict (bucket_key) do update
    set count = case
          when public.api_rate_limits.window_start
               < v_now - make_interval(secs => p_window_seconds)
          then 1
          else public.api_rate_limits.count + 1
        end,
        window_start = case
          when public.api_rate_limits.window_start
               < v_now - make_interval(secs => p_window_seconds)
          then v_now
          else public.api_rate_limits.window_start
        end
  returning count, window_start into v_count, v_window_start;

  return jsonb_build_object(
    'allowed', v_count <= p_max,
    'remaining', greatest(0, p_max - v_count),
    'reset_at',
      (extract(epoch from (v_window_start + make_interval(secs => p_window_seconds))) * 1000)::bigint
  );
end;
$$;

revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- FIX 3: harden the profile-change logging function
-- ---------------------------------------------------------------------------
create or replace function public.fn_log_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changes jsonb := '{}';
  col text;
begin
  for col in
    select column_name from information_schema.columns
    where table_name = 'profiles' and table_schema = 'public'
      and column_name not in ('id', 'updated_at')
  loop
    if to_jsonb(NEW) ->> col is distinct from to_jsonb(OLD) ->> col then
      changes := changes || jsonb_build_object(
        col, jsonb_build_object(
          'old', to_jsonb(OLD) ->> col,
          'new', to_jsonb(NEW) ->> col
        )
      );
    end if;
  end loop;

  if changes != '{}' then
    insert into public.user_activity_log (user_id, action, changed_fields)
    values (NEW.id, 'profile_updated', changes);
  end if;

  return NEW;
end;
$$;

-- Trigger function: never meant to be called directly via the REST RPC surface.
revoke execute on function public.fn_log_profile_update() from public, anon, authenticated;
