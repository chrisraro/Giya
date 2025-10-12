-- Create discount usage tracking table
create table if not exists public.discount_usage (
  id uuid primary key default gen_random_uuid(),
  discount_offer_id uuid references public.discount_offers(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade,
  used_at timestamp with time zone default now(),
  transaction_id uuid references public.points_transactions(id) on delete set null, -- link to transaction if applicable
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_discount_usage_offer on public.discount_usage(discount_offer_id);
create index if not exists idx_discount_usage_customer on public.discount_usage(customer_id);
create index if not exists idx_discount_usage_business on public.discount_usage(business_id);