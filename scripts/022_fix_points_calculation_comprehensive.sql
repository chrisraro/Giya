-- Comprehensive fix for points calculation issues
-- This script addresses multiple potential causes of points calculation discrepancies

-- 1. First, identify customers with points calculation issues
WITH customer_point_summary AS (
    SELECT 
        c.id as customer_id,
        c.total_points as stored_total_points,
        COALESCE(SUM(pt.points_earned), 0) as total_earned,
        COALESCE(SUM(r.points_redeemed), 0) as total_redeemed,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_total_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id, c.total_points
)
SELECT 
    customer_id,
    stored_total_points,
    total_earned,
    total_redeemed,
    calculated_total_points,
    (stored_total_points - calculated_total_points) as discrepancy
FROM customer_point_summary
WHERE stored_total_points != calculated_total_points;

-- 2. Fix redemptions that are missing business_id by getting it from the reward
UPDATE redemptions r
SET business_id = rew.business_id
FROM rewards rew
WHERE r.reward_id = rew.id 
AND r.business_id IS NULL 
AND rew.business_id IS NOT NULL;

-- 3. Verify the fix for missing business_id
SELECT COUNT(*) as still_missing_business_id
FROM redemptions 
WHERE business_id IS NULL AND reward_id IS NOT NULL;

-- 4. Recalculate and update total_points for all customers with discrepancies
WITH customer_point_summary AS (
    SELECT 
        c.id as customer_id,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_total_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id
)
UPDATE customers
SET total_points = customer_point_summary.calculated_total_points
FROM customer_point_summary
WHERE customers.id = customer_point_summary.customer_id
AND customers.total_points != customer_point_summary.calculated_total_points;

-- 5. Verify that there are no more discrepancies
WITH customer_point_summary AS (
    SELECT 
        c.id as customer_id,
        c.total_points as stored_total_points,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_total_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id, c.total_points
)
SELECT COUNT(*) as remaining_discrepancies
FROM customer_point_summary
WHERE stored_total_points != calculated_total_points;

-- 6. Create a function to ensure future consistency
CREATE OR REPLACE FUNCTION ensure_points_consistency()
RETURNS void AS $$
BEGIN
    -- Fix missing business_id in redemptions
    UPDATE redemptions r
    SET business_id = rew.business_id
    FROM rewards rew
    WHERE r.reward_id = rew.id 
    AND r.business_id IS NULL 
    AND rew.business_id IS NOT NULL;
    
    -- Recalculate total_points for all customers
    WITH customer_point_summary AS (
        SELECT 
            c.id as customer_id,
            (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_total_points
        FROM customers c
        LEFT JOIN points_transactions pt ON c.id = pt.customer_id
        LEFT JOIN redemptions r ON c.id = r.customer_id
        GROUP BY c.id
    )
    UPDATE customers
    SET total_points = customer_point_summary.calculated_total_points
    FROM customer_point_summary
    WHERE customers.id = customer_point_summary.customer_id
    AND customers.total_points != customer_point_summary.calculated_total_points;
END;
$$ LANGUAGE plpgsql;

-- 7. Optionally run the consistency function
-- SELECT ensure_points_consistency();