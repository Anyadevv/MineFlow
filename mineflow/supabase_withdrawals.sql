-- Migration: Semi-Automatic Withdrawal System

-- 1. Add token column if it doesn't exist
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS token TEXT DEFAULT 'USDT';

-- 2. Update status default to 'pending'
ALTER TABLE public.withdrawals ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Add constraints
ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_token_check;
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_token_check 
  CHECK (token IN ('USDT', 'USDC'));

ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_network_check;
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_network_check 
  CHECK (network IN ('BTC', 'ETH', 'TRON', 'SOLANA', 'BNB', 'TON', 'BASE'));

ALTER TABLE public.withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 4. Create function to decrement balance (used when admin approves withdrawal)
CREATE OR REPLACE FUNCTION public.decrement_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    -- Update the balance, ensuring it doesn't go negative
    UPDATE public.profiles
    SET balance = balance - p_amount
    WHERE id = p_user_id AND balance >= p_amount;
    
    -- If no row was updated, raise an error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient balance or user not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_balance(UUID, NUMERIC) TO authenticated;

-- 5. Ensure RLS policies are correct
-- Users can insert their own withdrawals
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users CANNOT update withdrawals (only admins can)
DROP POLICY IF EXISTS "Users cannot update withdrawals" ON public.withdrawals;
CREATE POLICY "Users cannot update withdrawals" ON public.withdrawals
FOR UPDATE USING (false);

-- Admin update policy should already exist from secure_admin migration
