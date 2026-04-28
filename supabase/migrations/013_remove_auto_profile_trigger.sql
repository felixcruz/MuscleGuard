-- Remove auto-create profile trigger.
-- Profiles are now created after OTP verification in the login client,
-- preventing typo emails from appearing as users in the admin panel.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
