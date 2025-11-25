-- Create enum for receipt status
create type receipt_status as enum ('uploaded', 'processing', 'processed', 'failed');

-- Create enum for authentication methods
create type auth_method as enum ('email', 'google', 'facebook');

-- Receipts table
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  image_url text not null,
  original_filename text,
  upload_timestamp timestamp with time zone default now(),
  status receipt_status default 'uploaded',
  processed_at timestamp with time zone,
  ocr_data jsonb, -- Store raw OCR extracted data
  total_amount numeric(10, 2),
  currency_code text default 'PHP',
  points_earned integer,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null, -- For attribution tracking
  auth_method_used auth_method, -- Track how the customer authenticated
  table_qr_code text, -- QR code of the table where receipt was captured
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for better query performance
create index if not exists idx_receipts_customer on public.receipts(customer_id);
create index if not exists idx_receipts_business on public.receipts(business_id);
create index if not exists idx_receipts_status on public.receipts(status);
create index if not exists idx_receipts_affiliate on public.receipts(affiliate_link_id);
create index if not exists idx_receipts_date on public.receipts(created_at);

-- Business analytics table for ad spend tracking
create table if not exists public.business_analytics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  date date not null,
  ad_spend numeric(10, 2) default 0.00,
  verified_revenue numeric(10, 2) default 0.00,
  total_receipts integer default 0,
  total_points_issued integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(business_id, date)
);

-- Indexes for business analytics
create index if not exists idx_business_analytics_business on public.business_analytics(business_id);
create index if not exists idx_business_analytics_date on public.business_analytics(date);

-- Function to update business analytics when a receipt is processed
create or replace function update_business_analytics()
returns trigger as $$
begin
  -- Insert or update the business analytics record for the current date
  insert into public.business_analytics (
    business_id, 
    date, 
    verified_revenue, 
    total_receipts, 
    total_points_issued
  )
  values (
    new.business_id, 
    new.created_at::date, 
    coalesce(new.total_amount, 0), 
    1, 
    coalesce(new.points_earned, 0)
  )
  on conflict (business_id, date) 
  do update set
    verified_revenue = business_analytics.verified_revenue + coalesce(new.total_amount, 0),
    total_receipts = business_analytics.total_receipts + 1,
    total_points_issued = business_analytics.total_points_issued + coalesce(new.points_earned, 0),
    updated_at = now();
    
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update business analytics after a receipt is processed
create trigger update_business_analytics_trigger
  after update of status on public.receipts
  for each row
  when (new.status = 'processed' and old.status != 'processed')
  execute function update_business_analytics();

-- RLS Policies for receipts
alter table public.receipts enable row level security;

-- Customers can only view their own receipts
create policy "Customers can view their own receipts" on public.receipts
  for select using (customer_id = auth.uid());

-- Businesses can only view receipts for their business
create policy "Businesses can view their receipts" on public.receipts
  for select using (business_id = auth.uid());

-- Admins can view all receipts
create policy "Admins can view all receipts" on public.receipts
  for select using (exists (
    select 1 from public.admins 
    where admins.id = auth.uid() 
    and admins.is_active = true
  ));

-- RLS Policies for business analytics
alter table public.business_analytics enable row level security;

-- Businesses can only view their own analytics
create policy "Businesses can view their analytics" on public.business_analytics
  for select using (business_id = auth.uid());

-- Admins can view all analytics
create policy "Admins can view all analytics" on public.business_analytics
  for select using (exists (
    select 1 from public.admins 
    where admins.id = auth.uid() 
    and admins.is_active = true
  ));