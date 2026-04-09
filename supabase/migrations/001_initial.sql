-- MuscleGuard initial schema
-- Run this in your Supabase SQL editor or via `supabase db push`

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  weight_kg decimal(5,2),
  target_weight_kg decimal(5,2),
  glp1_medication text,
  glp1_dose_mg decimal(4,2),
  titration_week int,
  dietary_prefs text[] default '{}',
  protein_goal_g decimal(6,1),
  onboarding_done boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trial',
  trial_ends_at timestamptz default (now() + interval '7 days'),
  updated_at timestamptz default now()
);

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  log_date date not null default current_date,
  food_name text not null,
  protein_g decimal(6,1) not null,
  calories int,
  portion_g int,
  logged_at timestamptz default now()
);

create table if not exists body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  measured_at date not null,
  weight_kg decimal(5,2),
  muscle_mass_kg decimal(5,2),
  body_fat_pct decimal(4,1),
  notes text,
  created_at timestamptz default now()
);

create table if not exists generated_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  generated_at timestamptz default now(),
  meals jsonb not null,
  prefs_snapshot jsonb
);

-- Indexes
create index if not exists food_logs_user_date on food_logs (user_id, log_date);
create index if not exists body_measurements_user_date on body_measurements (user_id, measured_at desc);

-- Row Level Security
alter table profiles enable row level security;
alter table food_logs enable row level security;
alter table body_measurements enable row level security;
alter table generated_meals enable row level security;

create policy "users manage own profile"
  on profiles for all
  using (auth.uid() = id);

create policy "users manage own food_logs"
  on food_logs for all
  using (auth.uid() = user_id);

create policy "users manage own measurements"
  on body_measurements for all
  using (auth.uid() = user_id);

create policy "users manage own meals"
  on generated_meals for all
  using (auth.uid() = user_id);

-- Auto-create profile on user sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
