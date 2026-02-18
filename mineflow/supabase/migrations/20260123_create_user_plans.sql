-- Migration: Create user_plans table and update logic
-- 1. Create user_plans table with ROI storage
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    amount NUMERIC NOT NULL,
    daily_percent NUMERIC NOT NULL,
    duration_days INTEGER NOT NULL,
    total_profit NUMERIC NOT NULL,
    total_return NUMERIC NOT NULL,
    status TEXT DEFAULT 'active',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update activate_plan RPC to calculate ROI and insert into user_plans
CREATE OR REPLACE FUNCTION activate_plan(
    p_user_id UUID,
    p_plan_id UUID,
    p_amount NUMERIC,
    p_daily_percent NUMERIC,
    p_duration_days INTEGER
) RETURNS JSON AS $$
DECLARE
    v_user_plan_id UUID;
    v_balance NUMERIC;
    v_total_profit NUMERIC;
    v_total_return NUMERIC;
BEGIN
    -- Check balance (must use deposit_balance)
    SELECT deposit_balance INTO v_balance FROM profiles WHERE id = p_user_id;
    
    IF v_balance < p_amount THEN
         RETURN json_build_object('success', false, 'error', 'Insufficient deposit balance');
    END IF;

    -- Calculate ROI
    v_total_profit := p_amount * (p_daily_percent / 100.0) * p_duration_days;
    v_total_return := p_amount + v_total_profit;

    -- Deduct Balance
    UPDATE profiles 
    SET deposit_balance = deposit_balance - p_amount 
    WHERE id = p_user_id;

    -- Create User Plan Record
    INSERT INTO user_plans (user_id, plan_id, amount, daily_percent, duration_days, total_profit, total_return, status, start_date, end_date)
    VALUES (
        p_user_id, 
        p_plan_id, 
        p_amount, 
        p_daily_percent, 
        p_duration_days, 
        v_total_profit,
        v_total_return,
        'active', 
        NOW(), 
        NOW() + (p_duration_days || ' days')::INTERVAL
    ) RETURNING id INTO v_user_plan_id;

    -- Log Transaction History Record
    INSERT INTO transactions (user_id, amount, type, status, reference_id, created_at)
    VALUES (p_user_id, p_amount, 'investment', 'completed', v_user_plan_id, NOW());

    RETURN json_build_object('success', true, 'message', 'Plan activated successfully', 'plan_id', v_user_plan_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 3. Add reinvest_plan RPC (Uses earnings_balance)
CREATE OR REPLACE FUNCTION reinvest_plan(
    p_user_id UUID,
    p_plan_id UUID,
    p_amount NUMERIC,
    p_daily_percent NUMERIC,
    p_duration_days INTEGER
) RETURNS JSON AS $$
DECLARE
    v_user_plan_id UUID;
    v_balance NUMERIC;
    v_total_profit NUMERIC;
    v_total_return NUMERIC;
BEGIN
    -- Check balance (must use earnings_balance)
    SELECT earnings_balance INTO v_balance FROM profiles WHERE id = p_user_id;
    
    IF v_balance < p_amount THEN
         RETURN json_build_object('success', false, 'error', 'Saldos de ganhos insuficiente');
    END IF;

    -- Calculate ROI
    v_total_profit := p_amount * (p_daily_percent / 100.0) * p_duration_days;
    v_total_return := p_amount + v_total_profit;

    -- Deduct Balance from earnings_balance
    UPDATE profiles 
    SET earnings_balance = earnings_balance - p_amount 
    WHERE id = p_user_id;

    -- Create User Plan Record
    INSERT INTO user_plans (user_id, plan_id, amount, daily_percent, duration_days, total_profit, total_return, status, start_date, end_date)
    VALUES (
        p_user_id, 
        p_plan_id, 
        p_amount, 
        p_daily_percent, 
        p_duration_days, 
        v_total_profit,
        v_total_return,
        'active', 
        NOW(), 
        NOW() + (p_duration_days || ' days')::INTERVAL
    ) RETURNING id INTO v_user_plan_id;

    -- Log Transaction History Record
    INSERT INTO transactions (user_id, amount, type, status, reference_id, created_at)
    VALUES (p_user_id, p_amount, 'reinvest', 'completed', v_user_plan_id, NOW());

    RETURN json_build_object('success', true, 'message', 'Reinvestimento processado com sucesso');
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- 4. Update profit distribution to read from user_plans
CREATE OR REPLACE FUNCTION distribute_daily_profits()
RETURNS TABLE (
    users_processed INTEGER,
    total_distributed NUMERIC
) AS $$
DECLARE
    v_plan RECORD;
    v_daily_profit NUMERIC;
    v_users_count INTEGER := 0;
    v_total_amount NUMERIC := 0;
BEGIN
    -- Loop through all active user_plans
    FOR v_plan IN 
        SELECT 
            id,
            user_id,
            amount,
            daily_percent
        FROM user_plans
        WHERE status = 'active'
        AND end_date > NOW() 
    LOOP
        -- Calculate Profit: Amount * (Percent / 100)
        v_daily_profit := v_plan.amount * (v_plan.daily_percent / 100.0);
        
        -- Update User's Earning Balance
        UPDATE profiles 
        SET earnings_balance = COALESCE(earnings_balance, 0) + v_daily_profit 
        WHERE id = v_plan.user_id;

        -- Log Transaction (Type: profit)
        INSERT INTO transactions (user_id, amount, type, status, reference_id, created_at)
        VALUES (
            v_plan.user_id, 
            v_daily_profit, 
            'profit', 
            'completed', 
            v_plan.id,
            NOW()
        );

        v_users_count := v_users_count + 1;
        v_total_amount := v_total_amount + v_daily_profit;
    END LOOP;

    RETURN QUERY SELECT v_users_count, v_total_amount;
END;
$$ LANGUAGE plpgsql;
