-- Add referral_code column to customers table
alter table public.customers
add column if not exists referral_code text;

-- Add index for better query performance
create index if not exists idx_customers_referral_code on public.customers(referral_code);