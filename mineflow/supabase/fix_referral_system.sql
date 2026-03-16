-- SQL Fix for MineFlow Referral System
-- Run this in your Supabase SQL Editor to unify the referral logic.

-- 1. Ensure the handle_new_user function is robust and handles referrals correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_code TEXT;
    v_referrer_id UUID;
    v_referral_code_new TEXT;
BEGIN
    -- Extract referrer code from metadata
    v_referrer_code := (new.raw_user_meta_data->>'referrer_code');
    
    -- Generate target user's own referral code
    v_referral_code_new := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));

    -- Find referrer_id if code exists
    IF v_referrer_code IS NOT NULL THEN
        SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referrer_code;
    END IF;

    -- Insert into profiles table
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        referral_code, 
        referrer_id
    )
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        v_referral_code_new,
        v_referrer_id
    );
    
    -- If there was a valid referrer, link them in the referrals table
    IF v_referrer_id IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_user_id, commission_amount)
        VALUES (v_referrer_id, new.id, 0);
    END IF;

    RETURN new;
EXCEPTION 
    WHEN OTHERS THEN
        -- Fallback to basic profile if something fails (ensures login still works)
        INSERT INTO public.profiles (id, email, referral_code)
        VALUES (new.id, new.email, UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)));
        RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Ensure the commission trigger works with the correct profiles table columns
CREATE OR REPLACE FUNCTION public.handle_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_commission DECIMAL;
BEGIN
    -- 1. Find the referrer
    SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;

    -- 2. If referrer exists, pay 5% commission on THEIR FIRST purchase
    IF v_referrer_id IS NOT NULL THEN
        -- commission_paid logic can be verified via the referrals table status or existence
        IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = NEW.user_id AND status = 'paid') THEN
            v_commission := NEW.amount * 0.05;
            
            -- Update referrer's earnings_balance
            UPDATE public.profiles 
            SET earnings_balance = COALESCE(earnings_balance, 0) + v_commission 
            WHERE id = v_referrer_id;

            -- Mark as paid in referrals table
            UPDATE public.referrals 
            SET status = 'paid', commission_amount = v_commission
            WHERE referred_user_id = NEW.user_id;

            -- Log transaction
            INSERT INTO public.transactions (user_id, type, amount, status, created_at)
            VALUES (v_referrer_id, 'referral', v_commission, 'completed', now());
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
