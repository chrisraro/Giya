-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.businesses enable row level security;
alter table public.influencers enable row level security;
alter table public.points_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_conversions enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Customers can view their own data" on public.customers;
drop policy if exists "Customers can insert their own data" on public.customers;
drop policy if exists "Customers can update their own data" on public.customers;
drop policy if exists "Businesses can view customer data when scanning" on public.customers;
drop policy if exists "Businesses can view their own data" on public.businesses;
drop policy if exists "Businesses can insert their own data" on public.businesses;
drop policy if exists "Businesses can update their own data" on public.businesses;
drop policy if exists "Anyone can view active businesses" on public.businesses;
drop policy if exists "Influencers can view their own data" on public.influencers;
drop policy if exists "Influencers can insert their own data" on public.influencers;
drop policy if exists "Influencers can update their own data" on public.influencers;
drop policy if exists "Customers can view their own transactions" on public.points_transactions;
drop policy if exists "Businesses can view their transactions" on public.points_transactions;
drop policy if exists "Businesses can create transactions" on public.points_transactions;
drop policy if exists "Anyone can view active rewards" on public.rewards;
drop policy if exists "Businesses can view their own rewards" on public.rewards;
drop policy if exists "Businesses can create rewards" on public.rewards;
drop policy if exists "Businesses can update their own rewards" on public.rewards;
drop policy if exists "Businesses can delete their own rewards" on public.rewards;
drop policy if exists "Users can view their own redemptions" on public.redemptions;
drop policy if exists "Users can create redemptions" on public.redemptions;
drop policy if exists "Businesses can view redemptions for their rewards" on public.redemptions;
drop policy if exists "Influencers can view their own affiliate links" on public.affiliate_links;
drop policy if exists "Influencers can create affiliate links" on public.affiliate_links;
drop policy if exists "Influencers can view their conversions" on public.affiliate_conversions;
drop policy if exists "System can create conversions" on public.affiliate_conversions;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Customers policies
create policy "Customers can view their own data"
  on public.customers for select
  using (auth.uid() = id);

create policy "Customers can insert their own data"
  on public.customers for insert
  with check (auth.uid() = id);

create policy "Customers can update their own data"
  on public.customers for update
  using (auth.uid() = id);

create policy "Businesses can view customer data when scanning"
  on public.customers for select
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'business'
  ));

-- Businesses policies
create policy "Businesses can view their own data"
  on public.businesses for select
  using (auth.uid() = id);

create policy "Businesses can insert their own data"
  on public.businesses for insert
  with check (auth.uid() = id);

create policy "Businesses can update their own data"
  on public.businesses for update
  using (auth.uid() = id);

create policy "Anyone can view active businesses"
  on public.businesses for select
  using (true);

-- Influencers policies
create policy "Influencers can view their own data"
  on public.influencers for select
  using (auth.uid() = id);

create policy "Influencers can insert their own data"
  on public.influencers for insert
  with check (auth.uid() = id);

create policy "Influencers can update their own data"
  on public.influencers for update
  using (auth.uid() = id);

-- Points transactions policies
create policy "Customers can view their own transactions"
  on public.points_transactions for select
  using (customer_id in (select id from public.customers where id = auth.uid()));

create policy "Businesses can view their transactions"
  on public.points_transactions for select
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can create transactions"
  on public.points_transactions for insert
  with check (business_id in (select id from public.businesses where id = auth.uid()));

-- Rewards policies
create policy "Anyone can view active rewards"
  on public.rewards for select
  using (is_active = true);

create policy "Businesses can view their own rewards"
  on public.rewards for select
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can create rewards"
  on public.rewards for insert
  with check (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can update their own rewards"
  on public.rewards for update
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can delete their own rewards"
  on public.rewards for delete
  using (business_id in (select id from public.businesses where id = auth.uid()));

-- Redemptions policies
create policy "Users can view their own redemptions"
  on public.redemptions for select
  using (user_id = auth.uid());

create policy "Users can create redemptions"
  on public.redemptions for insert
  with check (user_id = auth.uid());

create policy "Businesses can view redemptions for their rewards"
  on public.redemptions for select
  using (reward_id in (
    select id from public.rewards where business_id = auth.uid()
  ));

-- Affiliate links policies
create policy "Influencers can view their own affiliate links"
  on public.affiliate_links for select
  using (influencer_id in (select id from public.influencers where id = auth.uid()));

create policy "Influencers can create affiliate links"
  on public.affiliate_links for insert
  with check (influencer_id in (select id from public.influencers where id = auth.uid()));

-- Affiliate conversions policies
create policy "Influencers can view their conversions"
  on public.affiliate_conversions for select
  using (affiliate_link_id in (
    select id from public.affiliate_links where influencer_id = auth.uid()
  ));

create policy "System can create conversions"
  on public.affiliate_conversions for insert
  with check (true);