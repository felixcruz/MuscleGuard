-- Lets a user tell us they've paused their GLP-1 so we stop sending dose reminders.
-- Reset to false automatically when they log a dose again.
alter table profiles
  ADD COLUMN IF NOT EXISTS glp1_paused boolean DEFAULT false;

update profiles set glp1_paused = false where glp1_paused is null;
