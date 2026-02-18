-- Standardized Deposit Flow Migration
-- 1. Unique TXID Constraint
-- 2. Atomic RPC Function with Transaction History

-- 1. Add Unique Constraint to TXID if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deposits_txid_key') THEN
        ALTER TABLE deposits ADD CONSTRAINT deposits_txid_key UNIQUE (txid);
    END IF;
END $$;

-- 2. Update submit_secure_deposit Function
CREATE OR REPLACE FUNCTION submit_secure_deposit(
    p_user_id UUID,
    p_amount NUMERIC,
    p_network TEXT,
    p_txid TEXT,
    p_coin TEXT
) RETURNS JSON AS $$
DECLARE
    v_deposit_id UUID;
    v_pending_count INTEGER;
BEGIN
    -- 1. Validation: Check for duplicate TXID
    IF EXISTS (SELECT 1 FROM deposits WHERE txid = p_txid) THEN
         RAISE EXCEPTION 'Invalid TXID: This Transaction ID has already been submitted.';
    END IF;

    -- 2. Validation: Rate Limiting (Max 3 pending)
    SELECT count(*) INTO v_pending_count 
    FROM deposits 
    WHERE user_id = p_user_id AND status = 'pending';

    IF v_pending_count >= 3 THEN
        RAISE EXCEPTION 'Limit exceeded: You have too many pending deposits (Max 3).';
    END IF;

    -- 3. Create Deposit (Status: Pending)
    INSERT INTO deposits (user_id, amount, network, txid, asset, status)
    VALUES (p_user_id, p_amount, p_network, p_txid, p_coin, 'pending')
    RETURNING id INTO v_deposit_id;

    -- 4. Verification Delay (10s)
    -- This simulates the blockchain verification time
    PERFORM pg_sleep(10);

    -- 5. Atomic Finalization
    -- Update Deposit Status
    UPDATE deposits 
    SET status = 'approved', credited = true 
    WHERE id = v_deposit_id;

    -- Credit User Balance
    UPDATE profiles 
    SET deposit_balance = COALESCE(deposit_balance, 0) + p_amount 
    WHERE id = p_user_id;

    -- Create Transaction History
    INSERT INTO transactions (user_id, amount, type, status)
    VALUES (p_user_id, p_amount, 'deposit', 'approved');

    -- Return Success
    RETURN json_build_object('success', true, 'message', 'Deposit processed and credited successfully');
EXCEPTION
    WHEN OTHERS THEN
        -- Log error if possible or just return failure
        RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;
