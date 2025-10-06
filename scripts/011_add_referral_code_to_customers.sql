-- Add referral_code column to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON public.customers(referral_code);