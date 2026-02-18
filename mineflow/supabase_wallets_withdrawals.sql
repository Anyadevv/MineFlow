-- Create user_wallets table
create table if not exists public.user_wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  network text not null,
  address text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, network)
);

-- Index for faster lookups
create index if not exists user_wallets_user_id_idx on public.user_wallets (user_id);

-- Enable RLS
alter table public.user_wallets enable row level security;

-- Policies for user_wallets
create policy "Users can view their own wallets"
  on public.user_wallets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wallets"
  on public.user_wallets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wallets"
  on public.user_wallets for update
  using (auth.uid() = user_id);

-- Create withdrawals table
create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  currency text not null,
  network text not null,
  address text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Index for faster lookups
create index if not exists withdrawals_user_id_idx on public.withdrawals (user_id);

-- Enable RLS
alter table public.withdrawals enable row level security;

-- Policies for withdrawals
create policy "Users can view their own withdrawals"
  on public.withdrawals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own withdrawals"
  on public.withdrawals for insert
  with check (auth.uid() = user_id);

-- Trigger for updated_at in user_wallets
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.user_wallets
for each row
execute function public.handle_updated_at();
