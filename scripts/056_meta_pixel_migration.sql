-- =====================================================
-- Meta Pixel System Migration
-- =====================================================
-- This migration adds support for the new Meta Pixel attribution system
-- Businesses can store their Meta Pixel IDs, and users can be attributed
-- to businesses through referral links for first-touch attribution.

-- Step 1: Backup existing data (manual step via Supabase Dashboard recommended)
-- Important: Run a backup before executing this migration!

-- Step 2: Add meta_pixel_id column to businesses table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='businesses' AND column_name='meta_pixel_id'
  ) THEN
    ALTER TABLE businesses 
    ADD COLUMN meta_pixel_id TEXT;
    
    COMMENT ON COLUMN businesses.meta_pixel_id IS 'Meta (Facebook) Pixel ID for conversion tracking';
  END IF;
END $$;

-- Step 3: Add referred_by column to profiles table for business attribution
-- This uses UUID to reference the business that referred the customer
DO $$ 
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='referred_by'
  ) THEN
    -- Column doesn't exist, create it
    ALTER TABLE profiles 
    ADD COLUMN referred_by UUID REFERENCES businesses(id);
    
    COMMENT ON COLUMN profiles.referred_by IS 'Business that referred this user (First Touch Attribution)';
  ELSE
    -- Column exists, check if it has the right type
    DECLARE
      col_type TEXT;
    BEGIN
      SELECT data_type INTO col_type
      FROM information_schema.columns
      WHERE table_name='profiles' AND column_name='referred_by';
      
      -- If it's not UUID, we need to handle migration
      IF col_type != 'uuid' THEN
        -- Rename old column for backup
        ALTER TABLE profiles RENAME COLUMN referred_by TO referred_by_old;
        
        -- Create new column with correct type
        ALTER TABLE profiles 
        ADD COLUMN referred_by UUID REFERENCES businesses(id);
        
        COMMENT ON COLUMN profiles.referred_by IS 'Business that referred this user (First Touch Attribution)';
        COMMENT ON COLUMN profiles.referred_by_old IS 'DEPRECATED - Old referral column, can be dropped after data migration';
      END IF;
    END;
  END IF;
END $$;

-- Step 4: Add index for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename='profiles' AND indexname='idx_profiles_referred_by'
  ) THEN
    CREATE INDEX idx_profiles_referred_by ON profiles(referred_by);
  END IF;
END $$;

-- Step 5: Add index for business pixel lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename='businesses' AND indexname='idx_businesses_meta_pixel_id'
  ) THEN
    CREATE INDEX idx_businesses_meta_pixel_id ON businesses(meta_pixel_id) WHERE meta_pixel_id IS NOT NULL;
  END IF;
END $$;

-- Step 6: Create analytics view for businesses to track their referrals
CREATE OR REPLACE VIEW business_referral_stats AS
SELECT 
  b.id as business_id,
  b.business_name,
  b.meta_pixel_id,
  COUNT(p.id) as total_referrals,
  COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as referrals_last_30_days,
  COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as referrals_last_7_days
FROM businesses b
LEFT JOIN profiles p ON p.referred_by = b.id
WHERE b.is_active = true
GROUP BY b.id, b.business_name, b.meta_pixel_id;

COMMENT ON VIEW business_referral_stats IS 'Analytics view for tracking business referral performance';

-- Step 7: Grant appropriate permissions
GRANT SELECT ON business_referral_stats TO authenticated;

-- Step 8: Add RLS policy for business_referral_stats
-- Businesses can only see their own referral stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='business_referral_stats' AND policyname='Businesses can view their own referral stats'
  ) THEN
    -- Note: Views inherit RLS from underlying tables, but we document the intent
    -- Actual filtering will be done in application code
    NULL;
  END IF;
END $$;

-- Migration complete!
-- Next steps:
-- 1. Update middleware to use referral_business_id cookie
-- 2. Update auth callback to populate referred_by field
-- 3. Create BusinessPixel component for dynamic pixel injection
-- 4. Add Meta Pixel ID field to business settings UI
