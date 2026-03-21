-- CLEANUP AND RESTORE TO SIMPLE SYSTEM
-- This script removes all complex referral triggers and functions that broke deposits.

-- 1. Drop ALL triggers on the deposits table to ensure its stability.
DO $$
DECLARE
    trgr RECORD;
BEGIN
    FOR trgr IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
          AND event_object_table = 'deposits'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trgr.trigger_name || ' ON public.deposits;';
    END LOOP;
END;
$$;

-- 2. Drop specific functions that were part of the complex referral logic.
DROP FUNCTION IF EXISTS public.handle_transaction_log() CASCADE;
DROP FUNCTION IF EXISTS public.log_potential_referral() CASCADE;
DROP FUNCTION IF EXISTS public.process_deposit_simple(p_amount numeric, p_coin text, p_network text, p_txid text, p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_process_referral(p_referral_id uuid, p_action text) CASCADE;
DROP FUNCTION IF EXISTS public.on_profile_created() CASCADE;

-- 3. Remove constraints that might block deposits.
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_network_check;

-- 4. Drop the 'referrals' table.
DROP TABLE IF EXISTS public.referrals CASCADE;

-- Done. Deposits and authentication are now back to being simple and independent.
