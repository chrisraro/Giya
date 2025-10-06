-- Function to generate unique QR code data
create or replace function generate_qr_code()
returns text
language plpgsql
as $$
declare
  qr_code text;
begin
  qr_code := 'GIYA-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
  return qr_code;
end;
$$;

-- Function to update customer points
create or replace function update_customer_points()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.customers
  set total_points = total_points + new.points_earned
  where id = new.customer_id;
  return new;
end;
$$;

-- Trigger to update customer points after transaction
create trigger update_customer_points_trigger
  after insert on public.points_transactions
  for each row
  execute function update_customer_points();

-- Function to deduct points on redemption
create or replace function deduct_points_on_redemption()
returns trigger
language plpgsql
security definer
as $$
declare
  reward_points integer;
  user_role user_role;
begin
  -- Get the points required for the reward
  select points_required into reward_points
  from public.rewards
  where id = new.reward_id;

  -- Get user role
  select role into user_role
  from public.profiles
  where id = new.user_id;

  -- Deduct points based on user role
  if user_role = 'customer' then
    update public.customers
    set total_points = total_points - reward_points
    where id = new.user_id;
  elsif user_role = 'influencer' then
    update public.influencers
    set total_points = total_points - reward_points
    where id = new.user_id;
  end if;

  return new;
end;
$$;

-- Trigger to deduct points on redemption
create trigger deduct_points_trigger
  after insert on public.redemptions
  for each row
  execute function deduct_points_on_redemption();
