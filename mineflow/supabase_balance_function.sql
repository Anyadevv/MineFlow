-- Create function to increment user balance safely
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    -- Update the balance, creating a default value if NULL
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id = p_user_id;
    
    -- If no row was updated, raise an error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found', p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin will use this via RLS)
GRANT EXECUTE ON FUNCTION public.increment_balance(UUID, NUMERIC) TO authenticated;
