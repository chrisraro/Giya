-- Test total points calculation
-- This script will help us verify if the total_points field is being updated correctly

-- 1. Check a sample customer's current points
SELECT 
    id,
    full_name,
    total_points
FROM customers
LIMIT 5;

-- 2. Check the customer's transaction history
SELECT 
    c.id,
    c.full_name,
    c.total_points,
    COALESCE(SUM(pt.points_earned), 0) as earned_points,
    COALESCE(SUM(r.points_redeemed), 0) as redeemed_points,
    (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
GROUP BY c.id, c.full_name, c.total_points
LIMIT 5;

-- 3. Check if there are any discrepancies
SELECT 
    c.id,
    c.full_name,
    c.total_points,
    COALESCE(SUM(pt.points_earned), 0) as earned_points,
    COALESCE(SUM(r.points_redeemed), 0) as redeemed_points,
    (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points,
    (c.total_points - (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))) as discrepancy
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
GROUP BY c.id, c.full_name, c.total_points
HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))
LIMIT 10;

-- 4. Test the trigger by creating a sample transaction
-- First, get a sample customer
SELECT id, full_name, total_points FROM customers LIMIT 1;

-- Then check their transactions
-- SELECT customer_id, points_earned FROM points_transactions WHERE customer_id = 'CUSTOMER_ID_FROM_ABOVE' ORDER BY transaction_date DESC LIMIT 5;

-- Then check their redemptions
-- SELECT customer_id, points_redeemed FROM redemptions WHERE customer_id = 'CUSTOMER_ID_FROM_ABOVE' ORDER BY redeemed_at DESC LIMIT 5;