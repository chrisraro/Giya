-- Create exclusive offers table
create table if not exists public.exclusive_offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  product_name text not null,
  original_price numeric(10, 2),
  discounted_price numeric(10, 2),
  discount_percentage numeric(5, 2),
  image_url text,
  is_active boolean default true,
  usage_limit integer, -- maximum number of times this offer can be used (-1 for unlimited)
  used_count integer default 0, -- current number of times this offer has been used
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_exclusive_offers_business on public.exclusive_offers(business_id);
create index if not exists idx_exclusive_offers_active on public.exclusive_offers(is_active);
create index if not exists idx_exclusive_offers_valid_until on public.exclusive_offers(valid_until);