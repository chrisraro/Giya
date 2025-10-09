-- Fix existing redemption records that have user_id but missing customer_id
-- This script should be run after 008_fix_redemptions_schema.sql

-- Update redemptions where customer_id is null but user_id is set
-- Assume user_id refers to a customer in this case
update public.redemptions 
set customer_id = user_id
where customer_id is null and user_id is not null;

-- For records where both customer_id and user_id are null, we need to investigate
-- These might be orphaned records or data integrity issues

-- Also update the RLS policies to ensure backward compatibility
-- This is a duplicate of what's in 008 but ensures it's applied
drop policy if exists "Users can view their own redemptions" on public.redemptions;
drop policy if exists "Customers can create redemptions" on public.redemptions;
drop policy if exists "Businesses can update redemptions" on public.redemptions;

create policy "Users can view their own redemptions"
  on public.redemptions for select
  using (
    auth.uid() = customer_id or 
    auth.uid() = business_id or
    auth.uid() = validated_by or
    auth.uid() = user_id
  );

create policy "Customers can create redemptions"
  on public.redemptions for insert
  with check (auth.uid() = customer_id or auth.uid() = user_id);

create policy "Businesses can update redemptions"
  on public.redemptions for update
  using (auth.uid() = business_id or auth.uid() = validated_by);