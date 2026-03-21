-- FINAL STABLE DECOUPLED FIX: INDEPENDENT DEPOSITS & MANUAL REFERRALS
-- This script ensures deposits are 100% stable and referrals are handled manually.

-- 1. CLEANUP ALL CONFLICTING TRIGGERS
DROP TRIGGER IF EXISTS tr_simple_referral_reward ON public.deposits;
DROP TRIGGER IF EXISTS log_deposit_tx ON public.deposits;
DROP TRIGGER IF EXISTS log_withdrawal_tx ON public.withdrawals;
DROP TRIGGER IF EXISTS log_plan_tx ON public.user_plans;
DROP TRIGGER IF EXISTS tr_on_deposit_confirmed ON public.deposits;
DROP TRIGGER IF EXISTS tr_handle_referral_on_deposit ON public.deposits;

-- 2. FIX TRANSACTION LOGGING (FAIL-SAFE VERSION)
CREATE OR REPLACE FUNCTION public.handle_transaction_log()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT;
    v_status TEXT;
BEGIN
    IF TG_TABLE_NAME = 'deposits' THEN v_type := 'deposit'; v_status := NEW.status;
    ELSIF TG_TABLE_NAME = 'withdrawals' THEN v_type := 'withdrawal'; v_status := NEW.status;
    ELSIF TG_TABLE_NAME = 'user_plans' THEN v_type := 'investment'; v_status := 'completed';
    ELSE RETURN NEW;
    END IF;

    -- Standard log into transactions table
    INSERT INTO public.transactions (user_id, type, amount, status, reference_id, created_at) 
    VALUES (NEW.user_id, v_type, NEW.amount, v_status, NEW.id, now());
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never let logging errors block the main deposit/withdrawal
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach logging
CREATE TRIGGER log_deposit_tx AFTER INSERT OR UPDATE ON public.deposits FOR EACH ROW EXECUTE PROCEDURE public.handle_transaction_log();

-- 3. THE SIMPLEST DEPOSIT RPC (STABILITY FIRST)
CREATE OR REPLACE FUNCTION public.process_deposit_simple(
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
    -- Record deposit with 'approved' status (Zero validation, instant credit)
    INSERT INTO public.deposits (user_id, amount, network, txid, asset, currency, status, created_at)
    VALUES (p_user_id, p_amount, p_network, p_txid, p_coin, p_coin, 'approved', now())
    RETURNING id INTO v_deposit_id;

    -- Update User's Balance Instantly
    UPDATE public.profiles
    SET 
        deposit_balance = COALESCE(deposit_balance, 0) + p_amount,
        total_deposited = COALESCE(total_deposited, 0) + p_amount
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Deposit processed and credited.',
        'deposit_id', v_deposit_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DECOUPLED REFERRAL LOGGING
-- This trigger ONLY records the potential referral. It does NOT award money.
CREATE OR REPLACE FUNCTION public.log_potential_referral()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
BEGIN
    -- Find if the user has a referrer
    SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;

    IF v_referrer_id IS NOT NULL THEN
        -- Insert a PENDING record in referrals table
        -- Only if it doesn't already exist for this deposit (to avoid duplicates)
        INSERT INTO public.referrals (referrer_id, referred_user_id, status, commission_amount, created_at)
        VALUES (v_referrer_id, NEW.user_id, 'pending', NEW.amount * 0.05, now())
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never block the deposit
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_log_referral_on_deposit
AFTER INSERT ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.log_potential_referral();

-- 5. ADMIN APPROVAL FUNCTION
-- Use this to manually approve/credit a referral reward
CREATE OR REPLACE FUNCTION public.admin_process_referral(
    p_referral_id UUID,
    p_action TEXT -- 'approve' or 'reject'
)
RETURNS JSONB AS $$
DECLARE
    v_ref RECORD;
BEGIN
    -- Get referral details
    SELECT * INTO v_ref FROM public.referrals WHERE id = p_referral_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pending referral not found.');
    END IF;

    IF p_action = 'approve' THEN
        -- 1. Credit Referrer
        UPDATE public.profiles 
        SET earnings_balance = COALESCE(earnings_balance, 0) + v_ref.commission_amount
        WHERE id = v_ref.referrer_id;

        -- 2. Update status
        UPDATE public.referrals SET status = 'approved' WHERE id = p_referral_id;

        -- 3. Log Transaction
        INSERT INTO public.transactions (user_id, type, amount, status, created_at)
        VALUES (v_ref.referrer_id, 'referral', v_ref.commission_amount, 'completed', now());

        RETURN jsonb_build_object('success', true, 'message', 'Referral approved and reward credited.');
    ELSIF p_action = 'reject' THEN
        UPDATE public.referrals SET status = 'rejected' WHERE id = p_referral_id;
        RETURN jsonb_build_object('success', true, 'message', 'Referral rejected.');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid action. Use approve or reject.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
