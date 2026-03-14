-- Execute this script in your Supabase SQL Editor to fix the "Database error saving new user" issue.

-- Issue: There are two competing triggers trying to handle user creation and generate referral codes:
-- 1. `on_auth_user_created` (from auth.users AFTER INSERT) - Correctly handles new user creation.
-- 2. `tr_on_profile_created` (from public.profiles BEFORE INSERT) - Conflicts with the first trigger and causes a foreign key violation on public.referrals.

-- Solution: Drop the duplicate before insert trigger. The primary handle_new_user trigger already generates referral codes and processes referrers properly.

DROP TRIGGER IF EXISTS tr_on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.on_profile_created();

-- After running this, signup will work normally without throwing the "Database error saving new user" exception.
