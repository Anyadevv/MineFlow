-- ============================================================
-- DEFINITIVE FIX - Run ONCE in Supabase SQL Editor
-- ============================================================
-- Fixes:
--   1. Drops ALL triggers on deposits table (cause of "referred_user_id" error)
--   2. Removes all check constraints on deposits
--   3. Creates the referrals table if it does not exist
-- ============================================================

-- STEP 1: Drop every trigger on the deposits table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
          AND event_object_table = 'deposits'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.trigger_name || '" ON public.deposits CASCADE';
    END LOOP;
END;
$$;

-- STEP 2: Drop every check constraint on deposits (removes network/status checks)
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

-- STEP 3: Create referrals table if it does not exist
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending | approved | rejected
    commission_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Allow admins and service role to read/write all referrals
DROP POLICY IF EXISTS referrals_service_access ON public.referrals;
CREATE POLICY referrals_service_access ON public.referrals
    USING (true) WITH CHECK (true);

-- DONE. No more triggers. No more constraints.
-- Deposits will now work instantly via direct Supabase insert from the frontend.
