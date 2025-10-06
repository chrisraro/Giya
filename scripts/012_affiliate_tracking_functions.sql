-- Function to track affiliate conversions when customers sign up
create or replace function track_affiliate_conversion()
returns trigger
language plpgsql
security definer
as $$
declare
  affiliate_link_id uuid;
  influencer_id uuid;
begin
  -- Check if the customer was referred by an affiliate link
  if NEW.referral_code is not null then
    -- Find the affiliate link by unique code
    select id, influencer_id into affiliate_link_id, influencer_id
    from public.affiliate_links
    where unique_code = NEW.referral_code
    limit 1;
    
    -- If we found a matching affiliate link, create a conversion record
    if affiliate_link_id is not null and influencer_id is not null then
      -- Insert conversion record with 10 points for successful referral
      insert into public.affiliate_conversions (affiliate_link_id, customer_id, points_earned)
      values (affiliate_link_id, NEW.id, 10);
      
      -- Award points to the influencer
      update public.influencers
      set total_points = total_points + 10
      where id = influencer_id;
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Trigger to track affiliate conversions after customer creation
drop trigger if exists track_affiliate_conversion_trigger on public.customers;
create trigger track_affiliate_conversion_trigger
  after insert on public.customers
  for each row
  execute function track_affiliate_conversion();

-- Function to award points to influencers for customer transactions
create or replace function award_influencer_points_for_transaction()
returns trigger
language plpgsql
security definer
as $$
declare
  customer_referral_code text;
  affiliate_link_id uuid;
  influencer_id uuid;
begin
  -- Check if the customer was referred by an affiliate link
  select referral_code into customer_referral_code
  from public.customers
  where id = NEW.customer_id;
  
  -- If customer has a referral code, award points to influencer
  if customer_referral_code is not null then
    -- Find the affiliate link by unique code
    select al.id, al.influencer_id into affiliate_link_id, influencer_id
    from public.affiliate_links al
    where al.unique_code = customer_referral_code
    limit 1;
    
    -- If we found a matching affiliate link, award 1 point to the influencer
    if affiliate_link_id is not null and influencer_id is not null then
      -- Award 1 point to the influencer
      update public.influencers
      set total_points = total_points + 1
      where id = influencer_id;
      
      -- Update the conversion record to reflect the additional point
      update public.affiliate_conversions
      set points_earned = points_earned + 1
      where affiliate_link_id = affiliate_link_id 
      and customer_id = NEW.customer_id;
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Trigger to award points to influencers after customer transactions
drop trigger if exists award_influencer_points_trigger on public.points_transactions;
create trigger award_influencer_points_trigger
  after insert on public.points_transactions
  for each row
  execute function award_influencer_points_for_transaction();