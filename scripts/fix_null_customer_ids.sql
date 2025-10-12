-- Script to fix null customer_id values in redemption tables
-- This should be run after updating the table schemas to make customer_id NOT NULL

-- First, let's see what data we have
SELECT 
  id,
  exclusive_offer_id,
  customer_id,
  business_id,
  used_at
FROM exclusive_offer_usage 
WHERE customer_id IS NULL;

SELECT 
  id,
  discount_offer_id,
  customer_id,
  business_id,
  used_at
FROM discount_usage 
WHERE customer_id IS NULL;

-- Note: You'll need to manually update these records with the correct customer_id
-- Example update statement (replace with actual values):
-- UPDATE exclusive_offer_usage 
-- SET customer_id = 'ACTUAL_CUSTOMER_ID'
-- WHERE id = 'RECORD_ID';

-- UPDATE discount_usage 
-- SET customer_id = 'ACTUAL_CUSTOMER_ID'
-- WHERE id = 'RECORD_ID';