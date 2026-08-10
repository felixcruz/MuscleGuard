-- Tracks profile changes so admins can see when a user last interacted with the app
create table if not exists user_activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  action text not null,            -- e.g. 'profile_updated'
  changed_fields jsonb,            -- keys that changed + old/new values
  created_at timestamptz default now() not null
);

create index user_activity_log_user_date on user_activity_log(user_id, created_at desc);

alter table user_activity_log enable row level security;

-- Users can read their own activity
create policy "Users can read own activity"
  on user_activity_log for select
  using (auth.uid() = user_id);

-- Only service role inserts (via trigger)
create policy "Service role inserts activity"
  on user_activity_log for insert
  with check (true);

-- Trigger function: log profile changes
create or replace function fn_log_profile_update()
returns trigger as $$
declare
  changes jsonb := '{}';
  col text;
begin
  -- Compare each column, record changed ones
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

  -- Only log if something actually changed
  if changes != '{}' then
    insert into user_activity_log (user_id, action, changed_fields)
    values (NEW.id, 'profile_updated', changes);
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_profile_update_log
  after update on profiles
  for each row
  execute function fn_log_profile_update();
