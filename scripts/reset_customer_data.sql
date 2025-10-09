-- Reset customer transaction and redemption data for fresh testing
-- This script will clear points transactions and redemptions while preserving customer accounts and business data

-- WARNING: This will delete all customer transaction and redemption data!
-- Run this only if you want to start fresh with testing.

-- 1. Delete all redemptions
DELETE FROM redemptions;

-- 2. Delete all points transactions
DELETE FROM points_transactions;

-- 3. Reset customer total_points to 0
UPDATE customers 
SET total_points = 0;

-- 4. Reset influencer total_points to 0 (if any points were awarded)
UPDATE influencers 
SET total_points = 0;

-- 5. Delete affiliate conversions (if any)
DELETE FROM affiliate_conversions;

-- 6. Reset customer referral codes (optional, uncomment if needed)
-- UPDATE customers 
-- SET referral_code = NULL;

-- 7. Verify the reset
SELECT 
    (SELECT COUNT(*) FROM points_transactions) as transaction_count,
    (SELECT COUNT(*) FROM redemptions) as redemption_count,
    (SELECT COUNT(*) FROM customers WHERE total_points > 0) as customers_with_points,
    (SELECT COUNT(*) FROM affiliate_conversions) as conversion_count;

-- 8. Show sample customer data to confirm accounts still exist
SELECT 
    id,
    full_name,
    total_points
FROM customers
LIMIT 5;