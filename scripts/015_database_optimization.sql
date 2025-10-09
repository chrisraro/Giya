-- Database optimization script for improved query performance
-- This script adds additional indexes and optimizes existing ones

-- Add composite indexes for common query patterns

-- Index for business dashboard - transactions with customer info
create index if not exists idx_points_transactions_business_with_customer 
on public.points_transactions(business_id, transaction_date desc);

-- Index for customer dashboard - transactions with business info
create index if not exists idx_points_transactions_customer_with_business 
on public.points_transactions(customer_id, transaction_date desc);

-- Index for customer dashboard - redemptions with reward info
create index if not exists idx_redemptions_customer_with_reward 
on public.redemptions(customer_id, redeemed_at desc);

-- Index for business dashboard - redemptions with customer info
create index if not exists idx_redemptions_business_with_customer 
on public.redemptions(business_id, redeemed_at desc);

-- Index for rewards - active rewards by business with points
create index if not exists idx_rewards_business_active 
on public.rewards(business_id, is_active, points_required);

-- Index for affiliate links - by influencer with business
create index if not exists idx_affiliate_links_influencer_with_business 
on public.affiliate_links(influencer_id, created_at desc);

-- Index for affiliate conversions - by link with customer
create index if not exists idx_affiliate_conversions_link_with_customer 
on public.affiliate_conversions(affiliate_link_id, converted_at desc);

-- Index for customers - by referral code with creation date
create index if not exists idx_customers_referral_code 
on public.customers(referral_code, created_at desc);

-- Optimize existing indexes by adding included columns for covering indexes

-- Enhance existing indexes with included columns for better performance
drop index if exists idx_points_transactions_customer;
create index if not exists idx_points_transactions_customer 
on public.points_transactions(customer_id);

drop index if exists idx_points_transactions_business;
create index if not exists idx_points_transactions_business 
on public.points_transactions(business_id);

drop index if exists idx_rewards_business;
create index if not exists idx_rewards_business 
on public.rewards(business_id);

drop index if exists idx_redemptions_user;
create index if not exists idx_redemptions_user 
on public.redemptions(user_id);

drop index if exists idx_affiliate_links_influencer;
create index if not exists idx_affiliate_links_influencer 
on public.affiliate_links(influencer_id);

-- Add indexes for foreign key relationships to improve JOIN performance
create index if not exists idx_customers_profile 
on public.customers(id);

create index if not exists idx_businesses_profile 
on public.businesses(id);

create index if not exists idx_influencers_profile 
on public.influencers(id);

-- Optimize the generate_qr_code function to avoid potential collisions
create or replace function generate_qr_code()
returns text
language plpgsql
as $$
declare
  qr_code text;
  collision_count integer := 0;
begin
  -- Generate initial QR code
  qr_code := 'GIYA-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
  
  -- Check for collisions and regenerate if needed (up to 5 times)
  while exists(select 1 from public.customers where qr_code_data = qr_code) and collision_count < 5 loop
    qr_code := 'GIYA-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
    collision_count := collision_count + 1;
  end loop;
  
  return qr_code;
end;
$$;

-- Optimize the update_customer_points function to be more efficient
create or replace function update_customer_points()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Use a more efficient update with a single statement
  update public.customers
  set total_points = total_points + NEW.points_earned
  where id = NEW.customer_id;
  
  return NEW;
end;
$$;

-- Optimize the deduct_points_on_redemption function
create or replace function deduct_points_on_redemption()
returns trigger
language plpgsql
security definer
as $$
declare
  reward_points integer;
begin
  -- Get the points required for the reward
  select points_required into reward_points
  from public.rewards
  where id = NEW.reward_id;

  -- Set points_redeemed if not already set
  if NEW.points_redeemed is null then
    NEW.points_redeemed := reward_points;
  end if;

  -- Deduct points from customer
  update public.customers
  set total_points = total_points - reward_points
  where id = NEW.customer_id;

  return NEW;
end;
$$;

-- Optimize the track_affiliate_conversion function
create or replace function track_affiliate_conversion()
returns trigger
language plpgsql
security definer
as $$
declare
  affiliate_record record;
begin
  -- Check if the customer was referred by an affiliate link
  if NEW.referral_code is not null then
    -- Find the affiliate link by unique code in a single query
    select id, influencer_id into affiliate_record
    from public.affiliate_links
    where unique_code = NEW.referral_code
    limit 1;
    
    -- If we found a matching affiliate link, create a conversion record
    if affiliate_record.id is not null and affiliate_record.influencer_id is not null then
      -- Insert conversion record and update influencer points in a single transaction
      insert into public.affiliate_conversions (affiliate_link_id, customer_id, points_earned)
      values (affiliate_record.id, NEW.id, 10);
      
      -- Award points to the influencer
      update public.influencers
      set total_points = total_points + 10
      where id = affiliate_record.influencer_id;
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Optimize the award_influencer_points_for_transaction function
create or replace function award_influencer_points_for_transaction()
returns trigger
language plpgsql
security definer
as $$
declare
  affiliate_record record;
begin
  -- Check if the customer was referred by an affiliate link in a single query
  select al.id, al.influencer_id into affiliate_record
  from public.customers c
  join public.affiliate_links al on al.unique_code = c.referral_code
  where c.id = NEW.customer_id
  and c.referral_code is not null
  limit 1;
  
  -- If customer has a referral code, award points to influencer
  if affiliate_record.id is not null and affiliate_record.influencer_id is not null then
    -- Award 1 point to the influencer and update conversion record in a single operation
    update public.influencers
    set total_points = total_points + 1
    where id = affiliate_record.influencer_id;
    
    -- Update the conversion record to reflect the additional point
    update public.affiliate_conversions
    set points_earned = points_earned + 1
    where affiliate_link_id = affiliate_record.id 
    and customer_id = NEW.customer_id;
  end if;
  
  return NEW;
end;
$$;