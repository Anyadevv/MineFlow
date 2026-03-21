-- MiniFlow Secure Referral System Implementation
-- This script sets up the tables, functions, and triggers for the referral program.

-- 1. Tables Setup

-- Users table (Extending or creating public.users as requested)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id TEXT UNIQUE,
    referral_code TEXT UNIQUE,
    referred_by TEXT, -- Stores the referral_code of the person who invited them
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Deposits table
-- Using the structure requested by the user
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Referral Rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    deposit_id UUID UNIQUE REFERENCES public.deposits(id) ON DELETE CASCADE, -- Unique to prevent multiple rewards for one deposit
    reward NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Helper Functions

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        -- Generate a random 8-character uppercase alphanumeric code
        new_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
        
        -- Check for uniqueness
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = new_code) THEN
            done := TRUE;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Automation Triggers

-- Trigger Function: Automatic referral code generation and validation
CREATE OR REPLACE FUNCTION public.tr_handle_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Automatic referral code generation for new users
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        NEW.referral_code := public.generate_unique_referral_code();
    END IF;

    -- 2. Validate referral code (referred_by)
    -- Security checks removed as per user request (allow self-referral and any code)
    -- NEW.referred_by remains as provided

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS tr_on_user_created ON public.users;
CREATE TRIGGER tr_on_user_created
BEFORE INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.tr_handle_user_registration();

-- Trigger Function: Referral Reward Processing
CREATE OR REPLACE FUNCTION public.tr_process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_reward_amount NUMERIC;
    v_referrer_code TEXT;
BEGIN
    -- Only proceed if status changed to 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        -- Get the referrer for the user who made the deposit
        SELECT referred_by INTO v_referrer_code FROM public.users WHERE id = NEW.user_id;

        -- If the user was referred by someone
        IF v_referrer_code IS NOT NULL THEN
            -- Find the referrer's UUID
            SELECT id INTO v_referrer_id FROM public.users WHERE referral_code = v_referrer_code;

            IF v_referrer_id IS NOT NULL THEN
                -- Calculate reward (5% of deposit amount)
                v_reward_amount := NEW.amount * 0.05;

                -- Insert into referral_rewards (UNIQUE constraint on deposit_id prevents duplicates)
                INSERT INTO public.referral_rewards (referrer_id, referred_id, deposit_id, reward)
                VALUES (v_referrer_id, NEW.user_id, NEW.id, v_reward_amount)
                ON CONFLICT (deposit_id) DO NOTHING;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to deposits table
DROP TRIGGER IF EXISTS tr_on_deposit_confirmed ON public.deposits;
CREATE TRIGGER tr_on_deposit_confirmed
AFTER UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.tr_process_referral_reward();

-- 4. Additional Feature Queries (Functions)

-- Query to retrieve the total earnings of a referrer
CREATE OR REPLACE FUNCTION public.get_total_referral_earnings(p_referrer_id UUID)
RETURNS NUMERIC AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(reward), 0) FROM public.referral_rewards WHERE referrer_id = p_referrer_id);
END;
$$ LANGUAGE plpgsql STABLE;

-- Query to list all users referred by a specific user
CREATE OR REPLACE FUNCTION public.get_referred_users_list(p_referrer_id UUID)
RETURNS TABLE (
    user_id UUID,
    telegram_id TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY 
    SELECT u.id, u.telegram_id, u.created_at
    FROM public.users u
    JOIN public.users r ON u.referred_by = r.referral_code
    WHERE r.id = p_referrer_id;
END;
$$ LANGUAGE plpgsql STABLE;
