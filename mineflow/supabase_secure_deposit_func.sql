-- Migration: Instant Secure Deposit Function
-- Description: Creates submit_secure_deposit RPC function for instant processing.

-- 1. Ensure deposit_balance exists in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC DEFAULT 0;

-- 2. Create the RPC function
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
    -- Duplicate TXID check removed as per user request

    -- Validate amount
    IF p_amount <= 0 THEN
         RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Instant processing (No delay)

    -- Insert Deposit with 'approved' status
    INSERT INTO public.deposits (user_id, amount, network, txid, asset, status)
    VALUES (p_user_id, p_amount, p_network, p_txid, p_coin, 'approved')
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
