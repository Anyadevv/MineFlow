-- FINAL FIX: INSTANT DEPOSIT & REFERRAL SYSTEM
-- This script unifies everything into one simple, robust flow.

-- 1. CLEANUP: Remove all conflicting triggers and broken functions
DROP TRIGGER IF EXISTS tr_simple_referral_reward ON public.deposits;
DROP TRIGGER IF EXISTS log_deposit_tx ON public.deposits;
DROP TRIGGER IF EXISTS log_withdrawal_tx ON public.withdrawals;
DROP TRIGGER IF EXISTS log_plan_tx ON public.user_plans;
DROP TRIGGER IF EXISTS tr_on_deposit_confirmed ON public.deposits;

-- Fix the malformed function (CLEAN VERSION)
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

    INSERT INTO public.transactions (user_id, type, amount, status, reference_id, created_at) 
    VALUES (NEW.user_id, v_type, NEW.amount, v_status, NEW.id, now());
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Don't let logging break the main transaction
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RE-ATTACH CLEAN LOGGING (Optional but safe)
CREATE TRIGGER log_deposit_tx AFTER INSERT OR UPDATE ON public.deposits FOR EACH ROW EXECUTE PROCEDURE public.handle_transaction_log();

-- 3. THE MASTER INSTANT FUNCTION: process_instant_deposit
-- This handles registration of deposit, balance update, and referral reward in one shot.
CREATE OR REPLACE FUNCTION public.process_instant_deposit(
    p_user_id UUID,
    p_amount NUMERIC,
    p_network TEXT,
    p_txid TEXT,
    p_coin TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_referrer_id UUID;
    v_commission NUMERIC;
    v_deposit_id UUID;
BEGIN
    -- 1. Record the deposit as 'approved' immediately
    INSERT INTO public.deposits (user_id, amount, network, txid, asset, currency, status, created_at)
    VALUES (p_user_id, p_amount, p_network, p_txid, p_coin, p_coin, 'approved', now())
    RETURNING id INTO v_deposit_id;

    -- 2. Update the user's balance instantly
    UPDATE public.profiles
    SET 
        deposit_balance = COALESCE(deposit_balance, 0) + p_amount,
        total_deposited = COALESCE(total_deposited, 0) + p_amount
    WHERE id = p_user_id;

    -- 3. Handle Referral Reward (Instant 5%)
    SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = p_user_id;

    IF v_referrer_id IS NOT NULL THEN
        v_commission := p_amount * 0.05;

        -- Credit Referrer
        UPDATE public.profiles 
        SET earnings_balance = COALESCE(earnings_balance, 0) + v_commission 
        WHERE id = v_referrer_id;

        -- Record Referral Transaction
        INSERT INTO public.transactions (user_id, type, amount, status, reference_id, created_at)
        VALUES (v_referrer_id, 'referral', v_commission, 'completed', v_deposit_id, now());
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Deposit processed and credited instantly',
        'deposit_id', v_deposit_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
