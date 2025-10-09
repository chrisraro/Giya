-- Fix total points calculation for all customers (simple version)
-- This script ensures that the total_points field is correctly calculated for all customers

-- 1. First, let's see how many customers have discrepancies
SELECT 
    COUNT(*) as customers_with_discrepancies
FROM (
    SELECT 
        c.id,
        c.total_points as current_points,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id, c.total_points
    HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))
) as discrepancies;

-- 2. Update total_points for all customers with discrepancies
WITH customer_points AS (
    SELECT 
        c.id as customer_id,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id
)
UPDATE customers
SET total_points = customer_points.calculated_points
FROM customer_points
WHERE customers.id = customer_points.customer_id
AND customers.total_points != customer_points.calculated_points;

-- 3. Verify that there are no more discrepancies
SELECT 
    COUNT(*) as remaining_discrepancies
FROM (
    SELECT 
        c.id,
        c.total_points as current_points,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id, c.total_points
    HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))
) as remaining;