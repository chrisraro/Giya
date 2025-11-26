-- Fix RLS policies for receipts table to allow INSERT operations
-- This resolves the "infinite recursion detected in policy for relation admins" error
-- The issue: Admin policies reference admins table recursively
-- Solution: Don't check admins table for customer receipt uploads

-- Drop ALL existing policies to start fresh
drop policy if exists "Customers can view their own receipts" on public.receipts;
drop policy if exists "Businesses can view their receipts" on public.receipts;
drop policy if exists "Admins can view all receipts" on public.receipts;
drop policy if exists "Customers can insert their own receipts" on public.receipts;
drop policy if exists "Customers can update their own receipts" on public.receipts;
drop policy if exists "Businesses can update their receipts" on public.receipts;
drop policy if exists "Admins can insert receipts" on public.receipts;
drop policy if exists "Admins can update receipts" on public.receipts;

-- SELECT policies (viewing receipts)
create policy "Customers can view their own receipts" on public.receipts
  for select 
  using (customer_id = auth.uid());

create policy "Businesses can view their receipts" on public.receipts
  for select 
  using (business_id = auth.uid());

-- INSERT policy (uploading receipts) - SIMPLE VERSION WITHOUT ADMIN CHECK
create policy "Customers can insert their own receipts" on public.receipts
  for insert 
  with check (customer_id = auth.uid());

-- UPDATE policies (processing receipts)
create policy "Customers can update their own receipts" on public.receipts
  for update 
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

create policy "Businesses can update their receipts" on public.receipts
  for update 
  using (business_id = auth.uid())
  with check (business_id = auth.uid());

-- DELETE policy (only customers can delete their own)
drop policy if exists "Customers can delete their own receipts" on public.receipts;
create policy "Customers can delete their own receipts" on public.receipts
  for delete 
  using (customer_id = auth.uid());
