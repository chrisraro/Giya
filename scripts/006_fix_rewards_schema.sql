-- Fix rewards table to match the application code
-- The code uses 'reward_name' but schema has 'name'
alter table public.rewards rename column name to reward_name;

-- Add reward_redemptions table if it doesn't exist (for customer redemptions)
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  reward_id uuid references public.rewards(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  points_redeemed integer not null,
  redeemed_at timestamp with time zone default now(),
  status text default 'pending'
);

-- Enable RLS
alter table public.reward_redemptions enable row level security;

-- RLS policies for reward_redemptions
create policy "Customers can view their own redemptions"
  on public.reward_redemptions for select
  using (customer_id = auth.uid());

create policy "Customers can create redemptions"
  on public.reward_redemptions for insert
  with check (customer_id = auth.uid());

create policy "Businesses can view redemptions for their rewards"
  on public.reward_redemptions for select
  using (business_id = auth.uid());

-- Create index
create index if not exists idx_reward_redemptions_customer on public.reward_redemptions(customer_id);
create index if not exists idx_reward_redemptions_business on public.reward_redemptions(business_id);
