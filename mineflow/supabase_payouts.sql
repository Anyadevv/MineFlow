-- Create the payouts table
create table if not exists public.payouts (
  id bigint generated always as identity primary key,
  user_name text not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster queries on created_at
create index if not exists payouts_created_at_idx on public.payouts (created_at desc);

-- Enable RLS
alter table public.payouts enable row level security;

-- Allow public read access (adjust policies as needed)
create policy "Allow public read access" on public.payouts
  for select using (true);

-- Function to generate periodic payouts with "catch-up" logic
create or replace function get_payouts()
returns setof public.payouts
language plpgsql
security definer
as $$
declare
  last_payout_time timestamptz;
  next_payout_time timestamptz;
  current_time_now timestamptz := now();
  
  -- Logic variables
  random_amount numeric;
  random_roll float;
  random_user_id int;
  user_prefix text := 'User';
  
  -- Time interval config (30 to 60 minutes)
  min_interval interval := '30 minutes';
  max_interval interval := '60 minutes';
  actual_interval interval;
  
begin
  -- 1. Get the time of the most recent payout
  select created_at into last_payout_time
  from public.payouts
  order by created_at desc
  limit 1;

  -- 2. If no payouts exist, seed one in the past (e.g., 2 hours ago) so we can start generating from there
  if last_payout_time is null then
    last_payout_time := current_time_now - interval '24 hours';
  end if;

  -- 3. Loop: While the last payout time + interval is in the past, generate a new payout
  loop
    -- Calculate a random interval between 30 and 60 minutes
    -- random() returns 0.0 to 1.0. 
    -- interval = min + (random * (max - min))
    actual_interval := min_interval + (random() * (max_interval - min_interval));
    
    next_payout_time := last_payout_time + actual_interval;
    
    -- If the next computed time is still in the future, stop generating.
    if next_payout_time > current_time_now then
      exit;
    end if;

    -- Generate Weighted Random Amount
    random_roll := random(); -- 0.0 to 1.0
    
    if random_roll < 0.70 then
        -- 70%: $2 - $99
        random_amount := floor(random() * (99 - 2 + 1) + 2);
    elsif random_roll < 0.95 then
        -- 25% (0.70 to 0.95): $100 - $299
        random_amount := floor(random() * (299 - 100 + 1) + 100);
    elsif random_roll < 0.99 then
        -- 4% (0.95 to 0.99): $300 - $599
        random_amount := floor(random() * (599 - 300 + 1) + 300);
    else
        -- 1% (0.99 to 1.00): $600 - $999
        random_amount := floor(random() * (999 - 600 + 1) + 600);
    end if;

    -- Generate Random User (e.g. User4921)
    random_user_id := floor(random() * 9000 + 1000); -- 1000 to 9999

    -- Insert the new payout
    insert into public.payouts (user_name, amount, created_at)
    values (user_prefix || random_user_id::text, random_amount, next_payout_time);

    -- Advance last_payout_time
    last_payout_time := next_payout_time;
  end loop;

  -- 4. Return the latest 20 payouts
  return query
  select *
  from public.payouts
  order by created_at desc
  limit 20;

end;
$$;
