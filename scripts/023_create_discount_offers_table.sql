-- Create discount offers table
create table if not exists public.discount_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  discount_type text not null, -- 'percentage', 'fixed_amount', 'first_visit'
  discount_value numeric(5, 2) not null, -- percentage (e.g., 10 for 10%) or fixed amount
  minimum_purchase numeric(10, 2), -- minimum purchase required to avail discount
  is_active boolean default true,
  usage_limit integer, -- maximum number of times this offer can be used (-1 for unlimited)
  used_count integer default 0, -- current number of times this offer has been used
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_first_visit_only boolean default false, -- whether this offer is only for first-time visitors
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_discount_offers_business on public.discount_offers(business_id);
create index if not exists idx_discount_offers_active on public.discount_offers(is_active);
create index if not exists idx_discount_offers_first_visit on public.discount_offers(is_first_visit_only);