-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user',
  is_admin boolean default false,
  referral_code text unique,
  referrer_id uuid references public.profiles(id),
  deposit_balance decimal(12,2) default 0.00,
  earnings_balance decimal(12,2) default 0.00,
  total_withdrawn decimal(12,2) default 0.00,
  btc_address text,
  eth_address text,
  bnb_address text,
  tron_address text,
  solana_address text,
  ton_address text,
  base_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. HELPER FUNCTIONS
-- Function to generate a random referral code
create or replace function public.generate_referral_code()
returns text as $$
declare
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := '';
    i integer := 0;
begin
    for i in 1..8 loop
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    end loop;
    return result;
end;
$$ language plpgsql;

-- 3. TRIGGERS
-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
declare
    v_referrer_code text;
    v_referrer_id uuid;
begin
    -- Extract referrer code from metadata
    v_referrer_code := (new.raw_user_meta_data->>'referrer_code');
    
    -- Find referrer_id if code exists
    if v_referrer_code is not null then
        select id into v_referrer_id from public.profiles where referral_code = v_referrer_code;
    end if;

    insert into public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url, 
        referral_code, 
        referrer_id
    )
    values (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url', 
        public.generate_referral_code(),
        v_referrer_id
    );
    
    -- If there was a valid referrer, creating a referral record could happen here or in a separate trigger
    -- We'll leave it simple for now as the 'referrals' table might be handled separately
    if v_referrer_id is not null then
        insert into public.referrals (referrer_id, referred_id)
        values (v_referrer_id, new.id);
    end if;

    return new;
exception 
    when others then
        -- In case of error (e.g. race condition on referral code), try again or log
        -- For now, fallback to inserting without referral stuff to at least allow login
        insert into public.profiles (id, email, full_name, referral_code)
        values (
            new.id, 
            new.email, 
            new.raw_user_meta_data->>'full_name',
            public.generate_referral_code() || '_fallback' 
        );
        return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. OTHER TABLES (ENSURE EXISTENCE)
create table if not exists public.deposits (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    plan_id text,
    amount decimal(12,2),
    status text default 'pending', -- pending, approved, rejected
    created_at timestamp with time zone default now()
);

create table if not exists public.withdrawals (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    amount decimal(12,2),
    currency text,
    wallet_address text,
    status text default 'pending',
    created_at timestamp with time zone default now()
);

create table if not exists public.referrals (
    id uuid default uuid_generate_v4() primary key,
    referrer_id uuid references public.profiles(id),
    referred_id uuid references public.profiles(id),
    commission_paid boolean default false, -- Track if 5% reward was paid
    created_at timestamp with time zone default now(),
    unique(referrer_id, referred_id)
);

create table if not exists public.transactions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    type text not null, -- deposit, withdrawal, investment, profit, referral, payout
    amount decimal(12,2) not null,
    status text default 'completed',
    reference_id uuid, -- Optional link to other tables
    created_at timestamp with time zone default now()
);

-- Enable RLS for transactions
alter table public.transactions enable row level security;
create policy "Users can see own transactions" on transactions for select using (auth.uid() = user_id);

-- 5. USER PLANS (My Miners)
create table if not exists public.user_plans (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null, -- Changed to profiles
    plan_id text not null,
    amount decimal(12,2) not null,
    daily_percent decimal(5,2) not null,
    duration_days integer not null,
    total_profit decimal(12,2) default 0.00,
    total_return decimal(12,2) default 0.00,
    start_date timestamp with time zone default now(),
    end_date timestamp with time zone default now(),
    last_profit_at timestamp with time zone default now(), -- Added for anti-abuse
    status text default 'active',
    created_at timestamp with time zone default now()
);

-- RLS for user_plans
alter table public.user_plans enable row level security;
create policy "Users can view own plans" on user_plans for select using (auth.uid() = user_id);
create policy "Users can insert own plans" on user_plans for insert with check (auth.uid() = user_id);

-- 6. RPC: Activate Plan
create or replace function public.calculate_plan_roi(
    p_amount decimal,
    p_daily_percent decimal,
    p_duration_days integer
)
returns json as $$
declare
    v_daily_profit decimal;
    v_total_profit decimal;
    v_total_return decimal;
begin
    v_daily_profit := p_amount * (p_daily_percent / 100);
    v_total_profit := v_daily_profit * p_duration_days;
    v_total_return := p_amount + v_total_profit;

    return json_build_object(
        'daily_profit', v_daily_profit,
        'total_profit', v_total_profit,
        'total_return', v_total_return
    );
end;
$$ language plpgsql;

create or replace function public.activate_plan(
    p_user_id uuid,
    p_plan_id text,
    p_amount decimal,
    p_daily_percent decimal,
    p_duration_days integer
)
returns json as $$
declare
    v_balance decimal;
    v_new_plan_id uuid;
    v_plan_record record;
    v_roi json;
begin
    -- Check balance
    select deposit_balance into v_balance from public.profiles where id = p_user_id;
    
    if coalesce(v_balance, 0) < p_amount then
        return json_build_object('success', false, 'error', 'Insufficient balance');
    end if;

    -- Calculate ROI
    v_roi := public.calculate_plan_roi(p_amount, p_daily_percent, p_duration_days);

    -- Deduct balance
    update public.profiles 
    set deposit_balance = deposit_balance - p_amount 
    where id = p_user_id;

    -- Insert into user_plans
    insert into public.user_plans (
        user_id, 
        plan_id, 
        amount, 
        daily_percent, 
        duration_days, 
        total_profit,
        total_return,
        start_date, 
        end_date, 
        last_profit_at,
        status
    )
    values (
        p_user_id, 
        p_plan_id, 
        p_amount, 
        p_daily_percent, 
        p_duration_days, 
        (v_roi->>'total_profit')::decimal,
        (v_roi->>'total_return')::decimal,
        now(), 
        now() + (p_duration_days || ' days')::interval, 
        now(), -- Set last_profit_at to now on purchase (first profit is tomorrow)
        'active'
    )
    returning id into v_new_plan_id;

    -- Return the created record as JSON
    select * into v_plan_record from public.user_plans where id = v_new_plan_id;
    
    return json_build_object(
        'success', true, 
        'data', row_to_json(v_plan_record)
    );
exception when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;

-- 7. TRANSACTION LOGGING & COMMISSIONS

-- Function to handle referral commission
create or replace function public.handle_referral_commission()
returns trigger as $$
declare
    v_referrer_id uuid;
    v_commission decimal;
begin
    -- 1. Find the referrer
    select referrer_id into v_referrer_id from public.profiles where id = NEW.user_id;

    -- 2. If referrer exists, check if already paid (one-time logic)
    if v_referrer_id is not null then
        if not exists (select 1 from public.referrals where referred_id = NEW.user_id and commission_paid = true) then
            v_commission := NEW.amount * 0.05;
            
            -- Update referrer's earnings_balance
            update public.profiles 
            set earnings_balance = coalesce(earnings_balance, 0) + v_commission 
            where id = v_referrer_id;

            -- Update referral record
            update public.referrals 
            set commission_paid = true 
            where referred_id = NEW.user_id;

            -- Log transaction (type='referral')
            insert into public.transactions (user_id, type, amount, status, created_at)
            values (v_referrer_id, 'referral', v_commission, 'completed', now());
        end if;
    end if;

    return NEW;
end;
$$ language plpgsql security definer;

-- Function to log transactions automatically
create or replace function public.handle_transaction_log()
returns trigger as $$
declare
    v_type text;
    v_amount decimal;
    v_status text;
    v_user_id uuid;
begin
    -- Determine table and set values
    if TG_TABLE_NAME = 'deposits' then
        v_type := 'deposit';
        v_amount := NEW.amount;
        v_status := NEW.status; -- likely 'pending' or 'approved'
        v_user_id := NEW.user_id;
    elsif TG_TABLE_NAME = 'withdrawals' then
        v_type := 'withdrawal';
        v_amount := NEW.amount;
        v_status := NEW.status; -- likely 'pending'
        v_user_id := NEW.user_id;
    elsif TG_TABLE_NAME = 'user_plans' then
        v_type := 'investment'; -- 'investment' as per request
        v_amount := NEW.amount;
declare v_type text; v_amount decimal; v_status text; v_user_id uuid;
begin
    if TG_TABLE_NAME = 'deposits' then 
        v_type := 'deposit'; v_amount := NEW.amount; v_status := NEW.status; v_user_id := NEW.user_id;
    elsif TG_TABLE_NAME = 'withdrawals' then 
        v_type := 'withdrawal'; v_amount := NEW.amount; v_status := NEW.status; v_user_id := NEW.user_id;
    elsif TG_TABLE_NAME = 'user_plans' then 
        v_type := 'investment'; v_amount := NEW.amount; v_status := 'completed'; v_user_id := NEW.user_id;
    end if;

    -- Update existing transaction if it exists (via reference_id) or insert new
    if TG_OP = 'UPDATE' then
        update public.transactions 
        set status = v_status, amount = v_amount
        where reference_id = NEW.id;
    else
        insert into public.transactions (user_id, type, amount, status, reference_id, created_at) 
        values (v_user_id, v_type, v_amount, v_status, NEW.id, now());
    end if;
    
    return NEW;
end; $$ language plpgsql security definer;

-- Attach triggers
drop trigger if exists on_plan_activated_commission on public.user_plans;
create trigger on_plan_activated_commission
after insert on public.user_plans
for each row execute procedure public.handle_referral_commission();

-- Re-attach triggers with UPDATE support
drop trigger if exists log_deposit_tx on public.deposits;
create trigger log_deposit_tx after insert or update on public.deposits for each row execute procedure public.handle_transaction_log();

drop trigger if exists log_withdrawal_tx on public.withdrawals;
create trigger log_withdrawal_tx after insert or update on public.withdrawals for each row execute procedure public.handle_transaction_log();

drop trigger if exists log_plan_tx on public.user_plans;
create trigger log_plan_tx after insert on public.user_plans for each row execute procedure public.handle_transaction_log();


-- 8. DAILY PROFIT PROCESSING (Cron Job or Manual Call)
create or replace function public.process_daily_roi()
returns json as $$
declare
    v_plan record;
    v_profit decimal;
    v_count integer := 0;
begin
    -- 1. Handle expired plans: Return Principal + Mark as Completed
    for v_plan in 
        select * from public.user_plans 
        where status = 'active' and end_date <= now()
    loop
        -- Update user balance (Return Principal to Earnings)
        update public.profiles 
        set earnings_balance = coalesce(earnings_balance, 0) + v_plan.amount 
        where id = v_plan.user_id;

        -- Log Principal Return Transaction
        insert into public.transactions (user_id, type, amount, status, created_at)
        values (v_plan.user_id, 'payout', v_plan.amount, 'completed', now());

        -- Mark as completed
        update public.user_plans set status = 'completed' where id = v_plan.id;
    end loop;

    -- 2. Iterate over active plans that need processing
    for v_plan in 
        select * from public.user_plans 
        where status = 'active' 
        and (last_profit_at is null or last_profit_at < now() - interval '23 hours')
    loop
        -- Calculate daily profit
        v_profit := (v_plan.amount * v_plan.daily_percent) / 100;
        
        -- Update user balance (EARNINGS ONLY)
        update public.profiles 
        set earnings_balance = coalesce(earnings_balance, 0) + v_profit 
        where id = v_plan.user_id;

        -- Update plan last_profit_at
        update public.user_plans 
        set last_profit_at = now() 
        where id = v_plan.id;

        -- Log transaction (Profit)
        insert into public.transactions (user_id, type, amount, status, created_at)
        values (v_plan.user_id, 'profit', v_profit, 'completed', now());

        v_count := v_count + 1;
    end loop;

    return json_build_object('success', true, 'processed_count', v_count);
end;
$$ language plpgsql security definer;

create or replace function public.reinvest_plan(
    p_user_id uuid,
    p_plan_id text,
    p_amount decimal,
    p_daily_percent decimal,
    p_duration_days integer
)
returns json as $$
declare
    v_earnings decimal;
    v_new_plan_id uuid;
    v_plan_record record;
    v_roi json;
begin
    -- Check earnings balance
    select earnings_balance into v_earnings from public.profiles where id = p_user_id;
    
    if coalesce(v_earnings, 0) < p_amount then
        return json_build_object('success', false, 'error', 'Saldos de ganhos insuficientes para reinvestir.');
    end if;

    -- Calculate ROI
    v_roi := public.calculate_plan_roi(p_amount, p_daily_percent, p_duration_days);

    -- Deduct earnings balance
    update public.profiles 
    set earnings_balance = earnings_balance - p_amount 
    where id = p_user_id;

    -- Insert into user_plans
    insert into public.user_plans (
        user_id, 
        plan_id, 
        amount, 
        daily_percent, 
        duration_days, 
        total_profit,
        total_return,
        start_date, 
        end_date, 
        last_profit_at,
        status
    )
    values (
        p_user_id, 
        p_plan_id, 
        p_amount, 
        p_daily_percent, 
        p_duration_days, 
        (v_roi->>'total_profit')::decimal,
        (v_roi->>'total_return')::decimal,
        now(), 
        now() + (p_duration_days || ' days')::interval, 
        now(),
        'active'
    )
    returning id into v_new_plan_id;

    -- Get the record
    select * into v_plan_record from public.user_plans where id = v_new_plan_id;
    
    return json_build_object(
        'success', true, 
        'data', row_to_json(v_plan_record)
    );
exception when others then
    return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
create or replace function public.submit_secure_deposit(
    p_user_id uuid,
    p_amount decimal,
    p_network text,
    p_txid text,
    p_coin text
)
returns json as $$
begin
    -- 1. Check for duplicate TXID
    if exists (select 1 from public.deposits where txid = p_txid) then
        return json_build_object('success', false, 'error', 'Duplicate Transaction ID detectado.');
    end if;

    -- 2. Insert the deposit
    insert into public.deposits (
        user_id, 
        amount, 
        network, 
        txid, 
        status, 
        created_at
    ) 
    values (
        p_user_id, 
        p_amount, 
        p_network, 
        p_txid, 
        'pending', 
        now()
    );

    return json_build_object('success', true, 'message', 'Depósito enviado com sucesso. Aguarde a confirmação.');
end;
$$ language plpgsql security definer;
