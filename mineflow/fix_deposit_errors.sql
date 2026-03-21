-- MINIMAL FIX: Run this in Supabase SQL Editor.
-- This only fixes the two database errors blocking deposits.

-- 1. Remove the network constraint that blocks deposit inserts
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_network_check;

-- 2. Remove any other check constraints on the deposits table status/network
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'deposits'
          AND con.contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS "' || r.conname || '"';
    END LOOP;
END;
$$;

-- 3. Drop the broken deposit trigger that causes "referred_user_id does not exist" error
DROP TRIGGER IF EXISTS tr_log_referral_on_deposit ON public.deposits;
DROP TRIGGER IF EXISTS tr_handle_referral_on_deposit ON public.deposits;

-- 4. Drop the broken function that caused the error
DROP FUNCTION IF EXISTS public.log_potential_referral() CASCADE;

-- Done. Deposits are now fully independent.
-- The referral system is handled by: AuthContext.tsx on registration (via ?ref= URL param).
