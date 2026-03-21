-- DEFINITIVE RESET & SIMPLIFIED REFERRAL SYSTEM
-- This script rolls back the previous problematic implementation and
-- sets up a lightweight referral system using the existing 'profiles' and 'deposits' tables.

-- 1. CLEANUP: Remove previous conflicting elements
DROP TRIGGER IF EXISTS tr_on_deposit_confirmed ON public.deposits;
DROP TRIGGER IF EXISTS tr_on_user_created ON public.users;
DROP TRIGGER IF EXISTS tr_handle_user_registration ON public.users;
DROP TRIGGER IF EXISTS tr_process_referral_reward ON public.deposits;
DROP TRIGGER IF EXISTS tr_on_user_created ON public.users;
DROP TABLE IF EXISTS public.users CASCADE; -- Uses 'profiles' instead
DROP TABLE IF EXISTS public.referral_rewards CASCADE; -- Optional, keeping it simple inside profiles/transactions

-- 2. RESTORE DEPOSITS TABLE
-- Remove the restrictive status check that broke the 'approved'/'completed' flow
-- We try to drop any check constraint on the status column
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' 
        AND rel.relname = 'deposits'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.deposits DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- 3. SIMPLIFIED REFERRAL LOGIC
-- Function to handle referral commission automatically
CREATE OR REPLACE FUNCTION public.handle_simple_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_commission NUMERIC;
BEGIN
    -- Trigger when status becomes 'approved' or 'completed' (matches your original system)
    IF (NEW.status = 'approved' OR NEW.status = 'completed') 
       AND (OLD.status IS NULL OR (OLD.status != 'approved' AND OLD.status != 'completed')) THEN
        
        -- 1. Find the referrer from the PROFILES table (the one the app actually uses)
        SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;

        -- 2. If referrer exists, calculate 5% and pay
        IF v_referrer_id IS NOT NULL THEN
            v_commission := NEW.amount * 0.05;

            -- Update referrer's earnings_balance
            UPDATE public.profiles 
            SET earnings_balance = COALESCE(earnings_balance, 0) + v_commission 
            WHERE id = v_referrer_id;

            -- Log Transaction for Referrer
            INSERT INTO public.transactions (user_id, type, amount, status, reference_id, created_at)
            VALUES (v_referrer_id, 'referral', v_commission, 'completed', NEW.id, now());
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ATTACH TRIGGER TO EXISTING DEPOSITS TABLE
DROP TRIGGER IF EXISTS tr_simple_referral_reward ON public.deposits;
CREATE TRIGGER tr_simple_referral_reward
AFTER UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.handle_simple_referral_reward();

-- 5. ENSURE REFERRAL CODE GENERATION (On existing profiles)
-- This logic already exists in most of your scripts, reinforcing it.
CREATE OR REPLACE FUNCTION public.generate_referral_code_simple()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ensure_ref_code ON public.profiles;
CREATE TRIGGER tr_ensure_ref_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code_simple();
