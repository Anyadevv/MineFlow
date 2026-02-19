-- Function to count referrals who have at least one approved/completed deposit
CREATE OR REPLACE FUNCTION public.get_valid_referrals_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT r.referred_id)
    INTO v_count
    FROM public.referrals r
    JOIN public.deposits d ON r.referred_id = d.user_id
    WHERE r.referrer_id = p_user_id
      AND d.status IN ('approved', 'completed');
      
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
