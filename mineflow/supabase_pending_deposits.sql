-- Migration: Update deposits table for pending deposit system

-- 1. Add missing columns if they don't exist
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS txid TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS token TEXT DEFAULT 'USDT';

-- 2. Update status default to 'pending'
ALTER TABLE public.deposits ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Ensure network column exists (should already exist from previous schema)
-- ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS network TEXT;

-- 4. Add constraint to ensure valid tokens
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_token_check;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_token_check 
  CHECK (token IN ('USDT', 'USDC'));

-- 5. Add constraint to ensure valid networks
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_network_check;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_network_check 
  CHECK (network IN ('BTC', 'ETH', 'TRON', 'SOLANA', 'BNB', 'TON', 'BASE'));

-- 6. Add constraint to ensure valid status
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_status_check;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 7. Ensure RLS policies are correct (users can only insert, not update status)
-- These should already exist from previous migration, but we'll ensure they're correct

-- Drop and recreate the insert policy to be explicit
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.deposits;
CREATE POLICY "Users can insert own deposits" ON public.deposits
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure users CANNOT update deposits (only admins can)
DROP POLICY IF EXISTS "Users cannot update deposits" ON public.deposits;
CREATE POLICY "Users cannot update deposits" ON public.deposits
FOR UPDATE USING (false);

-- Admin can update (this should already exist)
-- Covered by existing "Admins can update deposits" policy from secure_admin migration
