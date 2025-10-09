-- Reset only points-related data for fresh testing
-- This script will clear points transactions and redemptions but preserve all other data

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

-- 4. Reset business total transaction counts (if you have such a field)
-- UPDATE businesses 
-- SET total_transactions = 0;

-- 5. Verify the reset
DO $$
DECLARE
    transaction_count INTEGER;
    redemption_count INTEGER;
    customers_with_points INTEGER;
BEGIN
    SELECT COUNT(*) INTO transaction_count FROM points_transactions;
    SELECT COUNT(*) INTO redemption_count FROM redemptions;
    SELECT COUNT(*) INTO customers_with_points FROM customers WHERE total_points > 0;
    
    RAISE NOTICE 'Reset complete. Current state:';
    RAISE NOTICE '  Points transactions: %', transaction_count;
    RAISE NOTICE '  Redemptions: %', redemption_count;
    RAISE NOTICE '  Customers with points: %', customers_with_points;
END $$;

COMMIT;