-- Verify that the points triggers are working correctly

-- 1. Check if the update_customer_points function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_customer_points';

-- 2. Check if the deduct_points_on_redemption function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'deduct_points_on_redemption';

-- 3. Check if the triggers exist
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname IN ('update_customer_points_trigger', 'deduct_points_trigger');

-- 4. Test the update_customer_points function manually
-- First, get a sample customer
SELECT id, full_name, total_points FROM customers LIMIT 1;

-- Then check their transactions
-- SELECT customer_id, points_earned FROM points_transactions WHERE customer_id = 'CUSTOMER_ID_FROM_ABOVE' ORDER BY transaction_date DESC LIMIT 5;

-- 5. Test the deduct_points_on_redemption function manually
-- First, get a sample customer with redemptions
SELECT c.id, c.full_name, c.total_points 
FROM customers c
JOIN redemptions r ON c.id = r.customer_id
LIMIT 1;

-- Then check their redemptions
-- SELECT customer_id, points_redeemed FROM redemptions WHERE customer_id = 'CUSTOMER_ID_FROM_ABOVE' ORDER BY redeemed_at DESC LIMIT 5;