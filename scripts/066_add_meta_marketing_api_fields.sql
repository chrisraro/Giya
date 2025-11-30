-- =====================================================
-- Add Meta Marketing API Integration Fields
-- =====================================================
-- This migration adds fields to store Meta access token and ad account ID
-- for automated ad spend and conversion data fetching

-- Add Meta access token field (encrypted in production)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS meta_access_token TEXT;

-- Add Meta ad account ID field
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;

-- Add last sync timestamp
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS meta_last_sync_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_meta_ad_account 
ON businesses(meta_ad_account_id) 
WHERE meta_ad_account_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN businesses.meta_access_token IS 'Long-lived Meta access token for Marketing API (should be encrypted in production)';
COMMENT ON COLUMN businesses.meta_ad_account_id IS 'Meta Ad Account ID in format: act_XXXXXXXX';
COMMENT ON COLUMN businesses.meta_last_sync_at IS 'Last time ad data was synced from Meta Marketing API';

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Meta Marketing API fields added successfully!';
  RAISE NOTICE 'Businesses can now connect their Meta Business accounts for automated ad analytics.';
END $$;
