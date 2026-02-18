-- Create or update deposits table
create table if not exists public.deposits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  currency text not null, -- USDT or USDC
  network text not null,
  address text not null,
  txid text not null,
  amount numeric not null,
  status text default 'completed',
  created_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists deposits_user_id_idx on public.deposits (user_id);

-- Enable RLS
alter table public.deposits enable row level security;

-- Policies for deposits
create policy "Users can view their own deposits"
  on public.deposits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own deposits"
  on public.deposits for insert
  with check (auth.uid() = user_id);

-- Ensure profiles table has balance update logic (assuming profiles table exists with balance)
-- This logic will be handled in the frontend for "semi-automatic" behavior as requested.
