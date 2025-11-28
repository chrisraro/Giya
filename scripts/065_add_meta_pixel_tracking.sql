-- Multi-Tenant Meta Pixel Integration
-- Phase 1: Database Schema
-- Enable merchants to track ad conversions (Signups & First Purchase) from their referral links

-- 1.1 Add Meta Pixel ID to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_meta_pixel_id ON public.businesses(meta_pixel_id);

-- Add comment to describe the column
COMMENT ON COLUMN public.businesses.meta_pixel_id IS 'Facebook/Meta Pixel ID for ad conversion tracking';

-- 1.2 Add referral attribution to profiles table
-- Track which business referred this user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.businesses(id) ON DELETE SET NULL;

-- Create index for referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- Add comment
COMMENT ON COLUMN public.profiles.referred_by IS 'Business that referred this user via their marketing link';

-- 1.3 Update RLS Policies for public access to meta_pixel_id
-- Allow unauthenticated users to read meta_pixel_id for landing page tracking

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view active businesses meta_pixel" ON public.businesses;

-- Create policy to allow public SELECT of meta_pixel_id for active, approved businesses
CREATE POLICY "Public can view active businesses meta_pixel"
  ON public.businesses
  FOR SELECT
  TO public
  USING (
    approval_status = 'approved' 
    AND is_active = true 
    AND meta_pixel_id IS NOT NULL
  );

-- Ensure existing "Anyone can view active businesses" policy allows meta_pixel_id access
-- This should already exist from previous migrations, but we'll recreate it if needed
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.businesses;

CREATE POLICY "Anyone can view active businesses"
  ON public.businesses
  FOR SELECT
  TO public
  USING (
    approval_status = 'approved' 
    AND is_active = true
  );

-- Helper function to check if customer had first transaction with a specific business
-- This will be used to determine when to fire Purchase conversion events
CREATE OR REPLACE FUNCTION is_first_transaction_for_business(
  p_customer_id UUID,
  p_business_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_count INTEGER;
BEGIN
  -- Count existing transactions for this customer-business pair
  SELECT COUNT(*)
  INTO transaction_count
  FROM public.points_transactions
  WHERE customer_id = p_customer_id
    AND business_id = p_business_id;
  
  -- Return true if this would be the first transaction
  RETURN transaction_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION is_first_transaction_for_business IS 'Check if a customer has had their first transaction with a specific business (for conversion tracking)';

-- Verification query to check the changes
-- SELECT business_name, meta_pixel_id, approval_status, is_active 
-- FROM public.businesses 
-- WHERE meta_pixel_id IS NOT NULL;
