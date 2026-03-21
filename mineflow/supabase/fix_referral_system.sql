-- SQL Fix for MineFlow Referral System (Deposit-Validated)
-- Run this in your Supabase SQL Editor.

-- 1. Unified handle_new_user (Sign-up logic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_code TEXT;
    v_referrer_id UUID;
    v_new_ref_code TEXT;
BEGIN
    v_referrer_code := (new.raw_user_meta_data->>'referrer_code');
    v_new_ref_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));

    IF v_referrer_code IS NOT NULL THEN
        SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referrer_code;
    END IF;

    -- Create Profile
    INSERT INTO public.profiles (id, email, full_name, referral_code, referrer_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', v_new_ref_code, v_referrer_id);
    
    -- Create Referral Row (Pending until deposit)
    IF v_referrer_id IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id, status, commission_amount)
        VALUES (v_referrer_id, new.id, 'pending', 0);
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.profiles (id, email, referral_code)
    VALUES (new.id, new.email, UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on DEPOSITS to validate referrals
CREATE OR REPLACE FUNCTION public.validate_referral_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- If a deposit is approved/completed, mark the referral as 'active' (contabiliza no dashboard)
    IF (NEW.status = 'approved' OR NEW.status = 'completed') THEN
        UPDATE public.referrals 
        SET status = 'active'
        WHERE referred_user_id = NEW.user_id AND status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_validate_referral_on_deposit ON public.deposits;
CREATE TRIGGER tr_validate_referral_on_deposit
AFTER INSERT OR UPDATE OF status ON public.deposits
FOR EACH ROW EXECUTE PROCEDURE public.validate_referral_on_deposit();

-- 3. Trigger on USER_PLANS (Investment) to pay 5% commission
CREATE OR REPLACE FUNCTION public.handle_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_commission DECIMAL;
BEGIN
    SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;

    IF v_referrer_id IS NOT NULL THEN
        -- Only pay commission ONCE (first investment)
        IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = NEW.user_id AND status = 'paid') THEN
            v_commission := NEW.amount * 0.05;
            
            -- Update Referrer Balance
            UPDATE public.profiles 
            SET earnings_balance = COALESCE(earnings_balance, 0) + v_commission 
            WHERE id = v_referrer_id;

            -- Mark as PAID (already active + commission done)
            UPDATE public.referrals 
            SET status = 'paid', commission_amount = v_commission
            WHERE referred_user_id = NEW.user_id;

            -- Log Transaction for Referrer
            INSERT INTO public.transactions (user_id, type, amount, status, created_at)
            VALUES (v_referrer_id, 'referral', v_commission, 'completed', now());
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_plan_activated_commission ON public.user_plans;
CREATE TRIGGER on_plan_activated_commission AFTER INSERT ON public.user_plans FOR EACH ROW EXECUTE PROCEDURE public.handle_referral_commission();

