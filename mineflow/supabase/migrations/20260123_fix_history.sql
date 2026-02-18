-- Migration: Ensure Transaction History for All Actions

-- 1. Create/Update 'activate_plan' to log investment transaction
CREATE OR REPLACE FUNCTION activate_plan(
    p_user_id UUID,
    p_plan_id UUID,
    p_amount NUMERIC,
    p_daily_percent NUMERIC,
    p_duration_days INTEGER
) RETURNS JSON AS $$
DECLARE
    v_investment_id UUID;
    v_balance NUMERIC;
BEGIN
    -- Check balance
    SELECT deposit_balance INTO v_balance FROM profiles WHERE id = p_user_id;
    
    IF v_balance < p_amount THEN
         RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct Balance
    UPDATE profiles 
    SET deposit_balance = deposit_balance - p_amount 
    WHERE id = p_user_id;

    -- Create Investment Record
    INSERT INTO investments (user_id, plan_id, amount, status, start_date, ends_at)
    VALUES (
        p_user_id, 
        p_plan_id, 
        p_amount, 
        'active', 
        NOW(), 
        NOW() + (p_duration_days || ' days')::INTERVAL
    ) RETURNING id INTO v_investment_id;

    -- [NEW] Create Transaction History Record
    INSERT INTO transactions (user_id, amount, type, status, reference_id)
    VALUES (p_user_id, p_amount, 'investment', 'completed', v_investment_id);

    RETURN json_build_object('success', true, 'message', 'Plan activated successfully');
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 2. Create Trigger for Withdrawals to auto-log to 'transactions'
-- Alternatively, we can just fetch from withdrawals table, but merging into 'transactions' is cleaner for the UI.
CREATE OR REPLACE FUNCTION log_withdrawal_transaction() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transactions (user_id, amount, type, status, reference_id)
    VALUES (NEW.user_id, NEW.amount, 'withdrawal', NEW.status, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_withdrawal ON withdrawals;
CREATE TRIGGER trg_log_withdrawal
AFTER INSERT ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION log_withdrawal_transaction();

-- 3. Trigger for Withdrawal Status Updates (e.g. Pending -> Completed)
CREATE OR REPLACE FUNCTION update_withdrawal_transaction_status() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE transactions 
    SET status = NEW.status 
    WHERE reference_id = NEW.id AND type = 'withdrawal';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_withdrawal_status ON withdrawals;
CREATE TRIGGER trg_update_withdrawal_status
AFTER UPDATE OF status ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION update_withdrawal_transaction_status();
