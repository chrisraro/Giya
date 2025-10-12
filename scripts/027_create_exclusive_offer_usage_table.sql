-- Create exclusive offer usage tracking table
create table if not exists public.exclusive_offer_usage (
  id uuid primary key default gen_random_uuid(),
  exclusive_offer_id uuid references public.exclusive_offers(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade,
  used_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_exclusive_offer_usage_offer on public.exclusive_offer_usage(exclusive_offer_id);
create index if not exists idx_exclusive_offer_usage_customer on public.exclusive_offer_usage(customer_id);
create index if not exists idx_exclusive_offer_usage_business on public.exclusive_offer_usage(business_id);