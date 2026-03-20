-- MASTER FIX: CORE DATABASE SYNCHRONIZATION
-- This script unifies the schema, fixes malformed functions, and ensures all systems are functional.

-- 1. CLEANUP: Remove contradictory triggers and tables
DROP TRIGGER IF EXISTS tr_simple_referral_reward ON public.deposits;
DROP TRIGGER IF EXISTS log_deposit_tx ON public.deposits;
DROP TRIGGER IF EXISTS log_withdrawal_tx ON public.withdrawals;
DROP TRIGGER IF EXISTS log_plan_tx ON public.user_plans;
DROP TRIGGER IF EXISTS tr_on_user_created ON public.users;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. SCHEMA UNIFICATION: Ensure 'deposits' has all necessary columns
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS txid TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS asset TEXT; -- For compatibility with both field names
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS address TEXT;

-- Remove the restrictive status check if it exists
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT conname FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' AND rel.relname = 'deposits' AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%status%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.deposits DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- 3. FUNCTION REPAIR: handle_transaction_log (Unified and Non-Malformed)
CREATE OR REPLACE FUNCTION public.handle_transaction_log()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT;
    v_amount NUMERIC;
    v_status TEXT;
    v_user_id UUID;
BEGIN
    -- Determine table and set values
    IF TG_TABLE_NAME = 'deposits' THEN
        v_type := 'deposit';
        v_amount := NEW.amount;
        v_status := NEW.status;
        v_user_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'withdrawals' THEN
        v_type := 'withdrawal';
        v_amount := NEW.amount;
        v_status := NEW.status;
        v_user_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'user_plans' THEN
        v_type := 'investment';
        v_amount := NEW.amount;
        v_status := 'completed';
        v_user_id := NEW.user_id;
    END IF;

    -- Update existing transaction if it exists (via reference_id) or insert new
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.transactions 
        SET status = v_status, amount = v_amount
        WHERE reference_id = NEW.id;
    ELSE
        INSERT INTO public.transactions (user_id, type, amount, status, reference_id, created_at) 
        VALUES (v_user_id, v_type, v_amount, v_status, NEW.id, now());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCTION REPAIR: submit_secure_deposit (Unified Schema)
CREATE OR REPLACE FUNCTION public.submit_secure_deposit(
    p_user_id UUID,
    p_amount NUMERIC,
    p_network TEXT,
    p_txid TEXT,
    p_coin TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_deposit_id UUID;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
         RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Insert Deposit with 'approved' status (standardized fields)
    INSERT INTO public.deposits (user_id, amount, network, txid, currency, asset, status)
    VALUES (p_user_id, p_amount, p_network, p_txid, p_coin, p_coin, 'approved')
    RETURNING id INTO v_deposit_id;

    -- Update User's Deposit Balance
    UPDATE public.profiles
    SET deposit_balance = COALESCE(deposit_balance, 0) + p_amount
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for ID %', p_user_id;
    END IF;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'deposit_id', v_deposit_id,
        'message', 'Deposit approved successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION REPAIR: Simplified Referral (Fires on all deposit entries)
CREATE OR REPLACE FUNCTION public.handle_simple_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_commission NUMERIC;
BEGIN
    -- Trigger when status is 'approved' or 'completed'
    IF (NEW.status = 'approved' OR NEW.status = 'completed') 
       AND (TG_OP = 'INSERT' OR (OLD.status != 'approved' AND OLD.status != 'completed')) THEN
        
        -- Find the referrer from the PROFILES table
        SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;

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

-- 6. RE-ATTACH ALL TRIGGERS
CREATE TRIGGER log_deposit_tx AFTER INSERT OR UPDATE ON public.deposits FOR EACH ROW EXECUTE PROCEDURE public.handle_transaction_log();
CREATE TRIGGER log_withdrawal_tx AFTER INSERT OR UPDATE ON public.withdrawals FOR EACH ROW EXECUTE PROCEDURE public.handle_transaction_log();
CREATE TRIGGER log_plan_tx AFTER INSERT ON public.user_plans FOR EACH ROW EXECUTE PROCEDURE public.handle_transaction_log();

CREATE TRIGGER tr_simple_referral_reward
AFTER INSERT OR UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.handle_simple_referral_reward();
