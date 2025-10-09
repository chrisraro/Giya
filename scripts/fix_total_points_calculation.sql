-- Fix total points calculation for all customers
-- This script will recalculate and update the total_points field for all customers

-- First, let's see the discrepancies
SELECT 
    c.id,
    c.full_name,
    c.total_points as current_points,
    COALESCE(SUM(pt.points_earned), 0) as earned_points,
    COALESCE(SUM(r.points_redeemed), 0) as redeemed_points,
    (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points,
    (c.total_points - (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))) as discrepancy
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
GROUP BY c.id, c.full_name, c.total_points
HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0));

-- Now update the total_points for all customers with discrepancies
UPDATE customers
SET total_points = calculated_points.calculated_points
FROM (
    SELECT 
        c.id as customer_id,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id
) as calculated_points
WHERE customers.id = calculated_points.customer_id
AND customers.total_points != calculated_points.calculated_points;

-- Verify the update
SELECT 
    COUNT(*) as customers_with_discrepancies
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
GROUP BY c.id, c.total_points
HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0));