-- 1. Create a function to generate a random referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Update existing profiles with a referral code if they don't have one
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- 3. Trigger Function for Handling New Users (Auth -> Public)
-- This function is likely already existing to create profiles, we expand it.
-- If it doesn't exist, we create a basic version.
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_code TEXT;
    v_referrer_id UUID;
BEGIN
    -- Get referrer_code from metadata
    v_referrer_code := (new.raw_user_meta_data->>'referrer_code');

    -- Find referrer_id
    IF v_referrer_code IS NOT NULL THEN
        SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referrer_code;
    END IF;

    -- Update the profile that was just created (or is about to be created)
    -- This assumes there's a trigger created for profiles already.
    -- If not, we might need to handle this in a 'create_profile' function.
    
    -- For simplicity, let's assume we have a profile row being created elsewhere.
    -- We will create a separate trigger to handle the updates after insert on profiles.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Improve the profile creation trigger
CREATE OR REPLACE FUNCTION public.on_profile_created()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_code TEXT;
    v_referrer_id UUID;
    v_full_name TEXT;
BEGIN
    -- Get data from auth.users metadata
    SELECT 
        (raw_user_meta_data->>'referrer_code'),
        (raw_user_meta_data->>'full_name')
    INTO v_referrer_code, v_full_name
    FROM auth.users 
    WHERE id = NEW.id;

    -- Generate a unique referral code for the new user
    NEW.referral_code := public.generate_referral_code();
    
    -- Link referrer
    IF v_referrer_code IS NOT NULL THEN
        SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referrer_code;
        IF v_referrer_id IS NOT NULL THEN
            NEW.referrer_id := v_referrer_id;
            
            -- Insert into referrals table
            INSERT INTO public.referrals (referrer_id, referred_id)
            VALUES (v_referrer_id, NEW.id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to profiles if not exists
DROP TRIGGER IF EXISTS tr_on_profile_created ON public.profiles;
CREATE TRIGGER tr_on_profile_created
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_profile_created();

-- 5. Commission Logic (Trigger on Purchases)
CREATE OR REPLACE FUNCTION public.handle_purchase_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_purchase_count INTEGER;
    v_commission_amount DECIMAL;
BEGIN
    -- Get the referrer for this user
    SELECT referrer_id INTO v_referrer_id FROM public.profiles WHERE id = NEW.user_id;

    IF v_referrer_id IS NOT NULL THEN
        -- Check if this is the user's first purchase
        SELECT COUNT(*) INTO v_purchase_count FROM public.purchases WHERE user_id = NEW.user_id;

        -- If v_purchase_count is 1 (the one just inserted), pay commission
        IF v_purchase_count = 1 THEN
            v_commission_amount := NEW.amount * 0.05;

            -- 1. Add to referrer's earnings_balance
            UPDATE public.profiles 
            SET earnings_balance = COALESCE(earnings_balance, 0) + v_commission_amount
            WHERE id = v_referrer_id;

            -- 2. Record a transaction for the referrer
            INSERT INTO public.transactions (user_id, amount, type, description)
            VALUES (v_referrer_id, v_commission_amount, 'referral_commission', 'Commission from referral ' || NEW.user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to purchases
DROP TRIGGER IF EXISTS tr_handle_purchase_commission ON public.purchases;
CREATE TRIGGER tr_handle_purchase_commission
AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.handle_purchase_commission();
