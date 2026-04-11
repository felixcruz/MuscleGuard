create table if not exists medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  medication text not null,
  dose_mg decimal(5,2) not null,
  change_date date not null default current_date,
  change_type text not null check (change_type in ('start','increase','decrease','switch','pause','dose_taken')),
  previous_dose_mg decimal(5,2),
  appetite_level text,
  energy_level text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists medication_logs_user_date on medication_logs(user_id, created_at desc);
alter table medication_logs enable row level security;
create policy "users manage own medication_logs" on medication_logs for all using (auth.uid() = user_id);
