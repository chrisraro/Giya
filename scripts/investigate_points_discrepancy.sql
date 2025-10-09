-- Investigate the points discrepancy issue
-- This script will help us understand why total_points doesn't match the sum of business points

-- 1. Get a specific customer's data
-- Replace 'CUSTOMER_ID' with an actual customer ID for testing
-- SELECT id, full_name, total_points FROM customers WHERE id = 'CUSTOMER_ID';

-- 2. Check all transactions for this customer
-- SELECT customer_id, business_id, points_earned, transaction_date 
-- FROM points_transactions 
-- WHERE customer_id = 'CUSTOMER_ID' 
-- ORDER BY transaction_date DESC;

-- 3. Check all redemptions for this customer
-- SELECT customer_id, business_id, points_redeemed, redeemed_at 
-- FROM redemptions 
-- WHERE customer_id = 'CUSTOMER_ID' 
-- ORDER BY redeemed_at DESC;

-- 4. Calculate points per business for this customer
SELECT 
    pt.business_id,
    b.business_name,
    COALESCE(SUM(pt.points_earned), 0) as earned_points,
    COALESCE(SUM(r.points_redeemed), 0) as redeemed_points,
    (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as net_points
FROM points_transactions pt
JOIN businesses b ON pt.business_id = b.id
LEFT JOIN redemptions r ON pt.customer_id = r.customer_id AND pt.business_id = r.business_id
WHERE pt.customer_id = 'CUSTOMER_ID'  -- Replace with actual customer ID
GROUP BY pt.business_id, b.business_name
ORDER BY net_points DESC;

-- 5. Calculate total points across all businesses for this customer
SELECT 
    COALESCE(SUM(pt.points_earned), 0) as total_earned,
    COALESCE(SUM(r.points_redeemed), 0) as total_redeemed,
    (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_total_points,
    c.total_points as stored_total_points,
    (c.total_points - (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))) as discrepancy
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
WHERE c.id = 'CUSTOMER_ID'  -- Replace with actual customer ID
GROUP BY c.total_points;

-- 6. Check if there are any redemptions not linked to a business_id
SELECT 
    id, 
    customer_id, 
    reward_id, 
    business_id, 
    points_redeemed
FROM redemptions 
WHERE customer_id = 'CUSTOMER_ID'  -- Replace with actual customer ID
AND business_id IS NULL;

-- 7. Check if there are any transactions not linked to a business_id
SELECT 
    id, 
    customer_id, 
    business_id, 
    points_earned
FROM points_transactions 
WHERE customer_id = 'CUSTOMER_ID'  -- Replace with actual customer ID
AND business_id IS NULL;