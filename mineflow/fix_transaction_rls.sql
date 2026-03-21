-- FIX: Allow frontend to record transaction history
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to insert their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Ensure users can see their own transactions (should already exist but let's be sure)
DROP POLICY IF EXISTS "Users can see own transactions" ON public.transactions;
CREATE POLICY "Users can see own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Done. Now the frontend can manually record deposits in the history.
