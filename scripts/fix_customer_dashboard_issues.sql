-- Fix script for customer dashboard issues
-- This script addresses inaccurate points and missing redemption history

-- 1. Fix redemptions that have user_id but missing customer_id
UPDATE redemptions 
SET customer_id = user_id
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- 2. Fix redemptions with incorrect business_id by getting it from the reward
UPDATE redemptions r
SET business_id = rew.business_id
FROM rewards rew
WHERE r.reward_id = rew.id 
AND r.business_id IS NULL 
AND rew.business_id IS NOT NULL;

-- 3. Ensure all redemptions have a proper status
UPDATE redemptions
SET status = 'completed'
WHERE status IS NULL OR status = '';

-- 4. Fix points_redeemed values that might be null
UPDATE redemptions
SET points_redeemed = (
    SELECT points_required 
    FROM rewards 
    WHERE rewards.id = redemptions.reward_id
)
WHERE points_redeemed IS NULL AND reward_id IS NOT NULL;

-- 5. Fix discount_usage records with missing business_id
UPDATE discount_usage du
SET business_id = dof.business_id
FROM discount_offers dof
WHERE du.discount_offer_id = dof.id 
AND du.business_id IS NULL 
AND dof.business_id IS NOT NULL;

-- 6. Fix exclusive_offer_usage records with missing business_id
UPDATE exclusive_offer_usage eou
SET business_id = eo.business_id
FROM exclusive_offers eo
WHERE eou.exclusive_offer_id = eo.id 
AND eou.business_id IS NULL 
AND eo.business_id IS NOT NULL;

-- 7. Recalculate and update total_points for all customers
-- Note: Only reward redemptions affect points, not discount or exclusive offer redemptions
WITH customer_point_summary AS (
    SELECT 
        c.id as customer_id,
        (COALESCE(SUM(pt.points_earned), 0) - 
         COALESCE(SUM(r.points_redeemed), 0)
        ) as calculated_total_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id AND r.status IN ('completed', 'validated')
    GROUP BY c.id
)
UPDATE customers
SET total_points = customer_point_summary.calculated_total_points
FROM customer_point_summary
WHERE customers.id = customer_point_summary.customer_id
AND customers.total_points != customer_point_summary.calculated_total_points;

-- 8. Create a function to ensure future consistency
CREATE OR REPLACE FUNCTION ensure_customer_points_consistency()
RETURNS void AS $$
BEGIN
    -- Fix missing customer_id in redemptions
    UPDATE redemptions 
    SET customer_id = user_id
    WHERE customer_id IS NULL AND user_id IS NOT NULL;
    
    -- Fix missing business_id in redemptions
    UPDATE redemptions r
    SET business_id = rew.business_id
    FROM rewards rew
    WHERE r.reward_id = rew.id 
    AND r.business_id IS NULL 
    AND rew.business_id IS NOT NULL;
    
    -- Fix missing business_id in discount_usage
    UPDATE discount_usage du
    SET business_id = dof.business_id
    FROM discount_offers dof
    WHERE du.discount_offer_id = dof.id 
    AND du.business_id IS NULL 
    AND dof.business_id IS NOT NULL;
    
    -- Fix missing business_id in exclusive_offer_usage
    UPDATE exclusive_offer_usage eou
    SET business_id = eo.business_id
    FROM exclusive_offers eo
    WHERE eou.exclusive_offer_id = eo.id 
    AND eou.business_id IS NULL 
    AND eo.business_id IS NOT NULL;
    
    -- Recalculate total_points for all customers
    -- Note: Only reward redemptions affect points, not discount or exclusive offer redemptions
    WITH customer_point_summary AS (
        SELECT 
            c.id as customer_id,
            (COALESCE(SUM(pt.points_earned), 0) - 
             COALESCE(SUM(r.points_redeemed), 0)
            ) as calculated_total_points
        FROM customers c
        LEFT JOIN points_transactions pt ON c.id = pt.customer_id
        LEFT JOIN redemptions r ON c.id = r.customer_id AND r.status IN ('completed', 'validated')
        GROUP BY c.id
    )
    UPDATE customers
    SET total_points = customer_point_summary.calculated_total_points
    FROM customer_point_summary
    WHERE customers.id = customer_point_summary.customer_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Optionally run the consistency function
-- SELECT ensure_customer_points_consistency();

-- 10. Verify the fixes
WITH customer_point_summary AS (
    SELECT 
        c.id,
        c.full_name,
        c.total_points as stored_points,
        COALESCE(SUM(pt.points_earned), 0) as earned_points,
        COALESCE(SUM(r.points_redeemed), 0) as redeemed_points,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points,
        ABS(c.total_points - (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))) as discrepancy
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id AND r.status IN ('completed', 'validated')
    GROUP BY c.id, c.full_name, c.total_points
)
SELECT 
    COUNT(*) as customers_with_discrepancies
FROM customer_point_summary
WHERE discrepancy > 1;