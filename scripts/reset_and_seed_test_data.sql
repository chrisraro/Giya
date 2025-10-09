-- Reset and seed test data for fresh testing
-- This script will clear points transactions and redemptions, then add sample data for testing

-- WARNING: This will delete all customer transaction and redemption data!
-- Run this only if you want to start fresh with testing.

BEGIN;

-- 1. Delete all redemptions
DELETE FROM redemptions;
RAISE NOTICE 'Deleted all redemptions';

-- 2. Delete all points transactions
DELETE FROM points_transactions;
RAISE NOTICE 'Deleted all points transactions';

-- 3. Reset customer total_points to 0
UPDATE customers 
SET total_points = 0;
RAISE NOTICE 'Reset all customer total_points to 0';

-- 4. Reset influencer total_points to 0
UPDATE influencers 
SET total_points = 0;
RAISE NOTICE 'Reset all influencer total_points to 0';

-- 5. Delete affiliate conversions
DELETE FROM affiliate_conversions;
RAISE NOTICE 'Deleted all affiliate conversions';

-- 6. Add sample points transactions for testing
-- NOTE: You'll need to replace the UUIDs with actual IDs from your database
/*
INSERT INTO points_transactions (customer_id, business_id, amount_spent, points_earned) VALUES
('CUSTOMER_UUID_1', 'BUSINESS_UUID_1', 100.00, 100),
('CUSTOMER_UUID_1', 'BUSINESS_UUID_1', 50.00, 50),
('CUSTOMER_UUID_1', 'BUSINESS_UUID_2', 75.00, 75);

INSERT INTO points_transactions (customer_id, business_id, amount_spent, points_earned) VALUES
('CUSTOMER_UUID_2', 'BUSINESS_UUID_1', 200.00, 200),
('CUSTOMER_UUID_2', 'BUSINESS_UUID_2', 150.00, 150);
*/

-- 7. Verify the reset and show current state
DO $$
DECLARE
    transaction_count INTEGER;
    redemption_count INTEGER;
    customers_with_points INTEGER;
    conversions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO transaction_count FROM points_transactions;
    SELECT COUNT(*) INTO redemption_count FROM redemptions;
    SELECT COUNT(*) INTO customers_with_points FROM customers WHERE total_points > 0;
    SELECT COUNT(*) INTO conversions_count FROM affiliate_conversions;
    
    RAISE NOTICE 'Reset and seed complete. Current state:';
    RAISE NOTICE '  Points transactions: %', transaction_count;
    RAISE NOTICE '  Redemptions: %', redemption_count;
    RAISE NOTICE '  Customers with points: %', customers_with_points;
    RAISE NOTICE '  Affiliate conversions: %', conversions_count;
END $$;

COMMIT;