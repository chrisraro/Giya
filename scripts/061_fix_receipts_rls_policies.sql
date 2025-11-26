-- Fix RLS policies for receipts table to allow INSERT operations
-- This resolves the "infinite recursion detected in policy for relation admins" error

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Customers can insert their own receipts" on public.receipts;
drop policy if exists "Customers can update their own receipts" on public.receipts;

-- Allow customers to insert their own receipts
create policy "Customers can insert their own receipts" on public.receipts
  for insert 
  with check (customer_id = auth.uid());

-- Allow customers to update their own receipts (for status updates)
create policy "Customers can update their own receipts" on public.receipts
  for update 
  using (customer_id = auth.uid());

-- Allow businesses to update receipts for their business (for processing)
drop policy if exists "Businesses can update their receipts" on public.receipts;
create policy "Businesses can update their receipts" on public.receipts
  for update 
  using (business_id = auth.uid());

-- Allow admins to insert receipts (for testing/support)
drop policy if exists "Admins can insert receipts" on public.receipts;
create policy "Admins can insert receipts" on public.receipts
  for insert 
  with check (exists (
    select 1 from public.admins 
    where admins.id = auth.uid() 
    and admins.is_active = true
  ));

-- Allow admins to update any receipt
drop policy if exists "Admins can update receipts" on public.receipts;
create policy "Admins can update receipts" on public.receipts
  for update 
  using (exists (
    select 1 from public.admins 
    where admins.id = auth.uid() 
    and admins.is_active = true
  ));
