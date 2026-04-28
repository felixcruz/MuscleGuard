-- Track when the current billing period ends (for cancel-at-period-end flow)
alter table profiles add column if not exists subscription_period_end timestamptz;
-- Track if user has scheduled cancellation at period end
alter table profiles add column if not exists cancel_at_period_end boolean default false;
