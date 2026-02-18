-- Migration: Daily Profit Distribution Logic

-- Function to distribute daily profits
CREATE OR REPLACE FUNCTION distribute_daily_profits()
RETURNS TABLE (
    users_processed INTEGER,
    total_distributed NUMERIC
) AS $$
DECLARE
    v_investment RECORD;
    v_daily_profit NUMERIC;
    v_users_count INTEGER := 0;
    v_total_amount NUMERIC := 0;
BEGIN
    -- Loop through all active investments
    FOR v_investment IN 
        SELECT 
            i.id,
            i.user_id,
            i.amount,
            p.daily_profit AS daily_percent
        FROM investments i
        JOIN plans p ON i.plan_id = p.id
        WHERE i.status = 'active'
        AND i.ends_at > NOW() -- Ensure plan hasn't expired (though status should handle this)
    LOOP
        -- Calculate Profit: Amount * (Percent / 100)
        v_daily_profit := v_investment.amount * (v_investment.daily_percent / 100.0);
        
        -- Update User's Earning Balance (Strictly Earnings, not Deposit)
        UPDATE profiles 
        SET earnings_balance = earnings_balance + v_daily_profit 
        WHERE id = v_investment.user_id;

        -- Log Transaction (Type: profit)
        INSERT INTO transactions (user_id, amount, type, status, reference_id, created_at)
        VALUES (
            v_investment.user_id, 
            v_daily_profit, 
            'profit', 
            'completed', 
            v_investment.id,
            NOW()
        );

        v_users_count := v_users_count + 1;
        v_total_amount := v_total_amount + v_daily_profit;
    END LOOP;

    RETURN QUERY SELECT v_users_count, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job if pg_cron is available (commented out safely)
-- SELECT cron.schedule('0 0 * * *', $$SELECT distribute_daily_profits()$$);
