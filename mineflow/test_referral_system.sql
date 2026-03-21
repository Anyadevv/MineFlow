-- Test Script for Referral System Flow

-- 1. Create a Referrer
INSERT INTO public.users (telegram_id, referral_code)
VALUES ('referrer_123', 'REF12345')
ON CONFLICT (telegram_id) DO NOTHING;

-- 2. Create a Referred User using the Referrer's code
INSERT INTO public.users (telegram_id, referred_by)
VALUES ('referred_999', 'REF12345')
ON CONFLICT (telegram_id) DO NOTHING;

-- 3. Verify users were created and codes assigned
SELECT id, telegram_id, referral_code, referred_by FROM public.users WHERE telegram_id IN ('referrer_123', 'referred_999');

-- 4. Create a PENDING deposit for the referred user
DO $$
DECLARE
    v_referred_id UUID;
BEGIN
    SELECT id INTO v_referred_id FROM public.users WHERE telegram_id = 'referred_999';
    
    INSERT INTO public.deposits (user_id, amount, status)
    VALUES (v_referred_id, 100.00, 'pending');
END $$;

-- 5. Verify deposit exists
SELECT * FROM public.deposits WHERE user_id = (SELECT id FROM public.users WHERE telegram_id = 'referred_999');

-- 6. Confirm the deposit
UPDATE public.deposits 
SET status = 'confirmed'
WHERE user_id = (SELECT id FROM public.users WHERE telegram_id = 'referred_999')
AND status = 'pending';

-- 7. Verify Referral Reward (Should be 5.00)
SELECT * FROM public.referral_rewards 
WHERE referred_id = (SELECT id FROM public.users WHERE telegram_id = 'referred_999');

-- 8. Verify Statistics
SELECT public.get_total_referral_earnings(id) as total_earnings
FROM public.users WHERE telegram_id = 'referrer_123';

SELECT * FROM public.get_referred_users_list(id)
FROM public.users WHERE telegram_id = 'referrer_123';
