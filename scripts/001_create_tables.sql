-- Create enum for user roles
create type user_role as enum ('customer', 'business', 'influencer');

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  email text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Customer profiles
create table if not exists public.customers (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null,
  nickname text,
  profile_pic_url text,
  qr_code_data text unique not null,
  total_points integer default 0,
  created_at timestamp with time zone default now()
);

-- Business profiles
create table if not exists public.businesses (
  id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  business_category text not null,
  address text not null,
  gmaps_link text,
  business_hours jsonb,
  profile_pic_url text,
  points_per_currency integer default 100, -- 1 point per 100 pesos by default
  created_at timestamp with time zone default now()
);

-- Influencer profiles
create table if not exists public.influencers (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null,
  profile_pic_url text,
  address text,
  facebook_link text,
  tiktok_link text,
  twitter_link text,
  youtube_link text,
  total_points integer default 0,
  created_at timestamp with time zone default now()
);

-- Points transactions
create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  amount_spent numeric(10, 2) not null,
  points_earned integer not null,
  transaction_date timestamp with time zone default now()
);

-- Rewards
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  points_required integer not null,
  image_url text,
  terms text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Redemptions
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid references public.rewards(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  redeemed_at timestamp with time zone default now(),
  status text default 'pending' -- pending, completed, cancelled
);

-- Affiliate links
create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid references public.influencers(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  unique_code text unique not null,
  created_at timestamp with time zone default now()
);

-- Affiliate conversions
create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid references public.affiliate_links(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  converted_at timestamp with time zone default now(),
  points_earned integer default 0
);

-- Create indexes for better query performance
create index if not exists idx_customers_qr_code on public.customers(qr_code_data);
create index if not exists idx_points_transactions_customer on public.points_transactions(customer_id);
create index if not exists idx_points_transactions_business on public.points_transactions(business_id);
create index if not exists idx_rewards_business on public.rewards(business_id);
create index if not exists idx_redemptions_user on public.redemptions(user_id);
create index if not exists idx_affiliate_links_influencer on public.affiliate_links(influencer_id);
create index if not exists idx_affiliate_links_business on public.affiliate_links(business_id);
