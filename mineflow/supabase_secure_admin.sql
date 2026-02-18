-- 1. Create Helper Function for Admin Check (Email-based as requested)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Strict check for the specific admin email
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'kenagostinhops@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the specific user to have 'admin' role in profiles (for frontend logic)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'kenagostinhops@gmail.com';

-- 3. Enable RLS on all core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing policies (to ensure clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.deposits;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.withdrawals;

DROP POLICY IF EXISTS "Users can view own bounties" ON public.bounties;
DROP POLICY IF EXISTS "Admins can view all bounties" ON public.bounties;
DROP POLICY IF EXISTS "Users can insert own bounties" ON public.bounties;
DROP POLICY IF EXISTS "Admins can update bounties" ON public.bounties;

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;

-- 5. Create Policies

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE USING (public.is_admin());

-- DEPOSITS
CREATE POLICY "Users can view own deposits" ON public.deposits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits" ON public.deposits
FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can insert own deposits" ON public.deposits
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WITHDRAWALS
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
FOR UPDATE USING (public.is_admin());

-- BOUNTIES
CREATE POLICY "Users can view own bounties" ON public.bounties
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bounties" ON public.bounties
FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can insert own bounties" ON public.bounties
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update bounties" ON public.bounties
FOR UPDATE USING (public.is_admin());

-- REFERRALS
CREATE POLICY "Users can view own referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals" ON public.referrals
FOR SELECT USING (public.is_admin());
