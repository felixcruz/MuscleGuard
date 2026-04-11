-- Weekly reports table
create table if not exists weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  week_start date not null,          -- Monday
  week_end date not null,            -- Sunday
  grade text not null check (grade in ('A', 'B', 'C')),
  score numeric(5,2) not null,       -- 0-100
  protein_days_hit int not null default 0,
  workouts_count int not null default 0,
  total_protein_g int not null default 0,
  protein_goal_g int not null default 0,
  summary_text text not null,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

create index if not exists weekly_reports_user_date
  on weekly_reports (user_id, week_start desc);

alter table weekly_reports enable row level security;

create policy "users manage own weekly_reports"
  on weekly_reports for all
  using (auth.uid() = user_id);
