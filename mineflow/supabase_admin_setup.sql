-- Add is_admin column to profiles table
alter table public.profiles 
add column if not exists is_admin boolean default false;

-- Add comment for clarity
comment on column public.profiles.is_admin is 'Flag to identify admin users for the panel access';

-- Note: You should manually set one user as admin in the Supabase Dashboard:
-- update profiles set is_admin = true where email = 'your-admin@email.com';
