-- Add new personalization columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_goal text DEFAULT 'preserve_muscle',
  ADD COLUMN IF NOT EXISTS glp1_frequency text DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS glp1_injection_day text,
  ADD COLUMN IF NOT EXISTS glp1_start_date date,
  ADD COLUMN IF NOT EXISTS glp1_last_dose_date date,
  ADD COLUMN IF NOT EXISTS appetite_level text DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS best_appetite_time text DEFAULT 'midday',
  ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS equipment text DEFAULT 'bodyweight',
  ADD COLUMN IF NOT EXISTS activity_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_activity text DEFAULT 'strength',
  ADD COLUMN IF NOT EXISTS activity_frequency text DEFAULT '3_4x';
