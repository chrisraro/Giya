-- Fix redemptions table schema to unify reward_redemptions and redemptions
-- Drop the separate reward_redemptions table as we'll use the redemptions table for everything
drop table if exists public.reward_redemptions cascade;

-- Update redemptions table structure to match what the frontend expects
alter table public.redemptions 
  add column if not exists reward_id uuid references public.rewards(id) on delete cascade,
  add column if not exists points_redeemed integer,
  add column if not exists redemption_qr_code text unique,
  add column if not exists validated_at timestamp with time zone,
  add column if not exists validated_by uuid references public.businesses(id),
  add column if not exists customer_id uuid references public.customers(id) on delete cascade,
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

-- Create proper indexes
create index if not exists idx_redemptions_customer on public.redemptions(customer_id);
create index if not exists idx_redemptions_business on public.redemptions(business_id);
create index if not exists idx_redemptions_reward on public.redemptions(reward_id);
create index if not exists idx_redemptions_qr on public.redemptions(redemption_qr_code);
create index if not exists idx_redemptions_status on public.redemptions(status);

-- Update RLS policies for redemptions table
drop policy if exists "Users can view their own redemptions" on public.redemptions;
drop policy if exists "Customers can create redemptions" on public.redemptions;
drop policy if exists "Businesses can update redemptions" on public.redemptions;

create policy "Users can view their own redemptions"
  on public.redemptions for select
  using (
    auth.uid() = customer_id or 
    auth.uid() = business_id or
    auth.uid() = validated_by
  );

create policy "Customers can create redemptions"
  on public.redemptions for insert
  with check (auth.uid() = customer_id);

create policy "Businesses can update redemptions"
  on public.redemptions for update
  using (auth.uid() = business_id or auth.uid() = validated_by);

-- Fix the deduct_points_on_redemption function to work with the updated schema
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
  where id = new.reward_id;

  -- Set points_redeemed if not already set
  if new.points_redeemed is null then
    new.points_redeemed := reward_points;
  end if;

  -- Deduct points from customer
  update public.customers
  set total_points = total_points - reward_points
  where id = new.customer_id;

  return new;
end;
$$;

-- Update trigger to use the redemptions table
drop trigger if exists deduct_points_trigger on public.redemptions;
create trigger deduct_points_trigger
  after insert on public.redemptions
  for each row
  execute function deduct_points_on_redemption();