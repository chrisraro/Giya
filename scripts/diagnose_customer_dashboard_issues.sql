-- Diagnostic script to identify issues with customer dashboard data
-- This script will help identify why points are inaccurate and redemptions are missing

-- 1. Check customer data integrity
SELECT 
    id,
    full_name,
    total_points as stored_points,
    qr_code_data
FROM customers
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check points transactions for a specific customer (replace 'CUSTOMER_ID' with actual ID)
-- SELECT 
--     id,
--     amount_spent,
--     points_earned,
--     transaction_date
-- FROM points_transactions
-- WHERE customer_id = 'CUSTOMER_ID'
-- ORDER BY transaction_date DESC;

-- 3. Check redemptions for a specific customer (replace 'CUSTOMER_ID' with actual ID)
-- Check both customer_id and user_id columns
-- SELECT 
--     id,
--     reward_id,
--     user_id,
--     customer_id,
--     points_redeemed,
--     redeemed_at,
--     status
-- FROM redemptions
-- WHERE customer_id = 'CUSTOMER_ID' OR user_id = 'CUSTOMER_ID'
-- ORDER BY redeemed_at DESC;

-- 4. Check discount usage for a specific customer (replace 'CUSTOMER_ID' with actual ID)
-- SELECT 
--     id,
--     discount_offer_id,
--     customer_id,
--     used_at
-- FROM discount_usage
-- WHERE customer_id = 'CUSTOMER_ID'
-- ORDER BY used_at DESC;

-- 5. Check exclusive offer usage for a specific customer (replace 'CUSTOMER_ID' with actual ID)
-- SELECT 
--     id,
--     exclusive_offer_id,
--     customer_id,
--     used_at
-- FROM exclusive_offer_usage
-- WHERE customer_id = 'CUSTOMER_ID'
-- ORDER BY used_at DESC;

-- 6. Check for null customer_id values in redemption tables
SELECT 'redemptions' as table_name, COUNT(*) as null_count
FROM redemptions 
WHERE customer_id IS NULL AND user_id IS NOT NULL
UNION ALL
SELECT 'discount_usage' as table_name, COUNT(*) as null_count
FROM discount_usage 
WHERE customer_id IS NULL
UNION ALL
SELECT 'exclusive_offer_usage' as table_name, COUNT(*) as null_count
FROM exclusive_offer_usage 
WHERE customer_id IS NULL;

-- 7. Calculate points for all customers to identify discrepancies
-- Note: Only reward redemptions affect points, not discount or exclusive offer redemptions
WITH customer_points AS (
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
    LEFT JOIN redemptions r ON c.id = r.customer_id AND r.status = 'completed'
    GROUP BY c.id, c.full_name, c.total_points
)
SELECT 
    id,
    full_name,
    stored_points,
    earned_points,
    redeemed_points,
    calculated_points,
    discrepancy
FROM customer_points
WHERE discrepancy > 0
ORDER BY discrepancy DESC;

-- 8. Check redemption data structure
SELECT 
    'redemptions' as source,
    COUNT(*) as count,
    STRING_AGG(DISTINCT status, ', ') as statuses
FROM redemptions
UNION ALL
SELECT 
    'discount_usage' as source,
    COUNT(*) as count,
    'completed' as statuses  -- discount_usage records are always completed
FROM discount_usage
UNION ALL
SELECT 
    'exclusive_offer_usage' as source,
    COUNT(*) as count,
    'completed' as statuses  -- exclusive_offer_usage records are always completed
FROM exclusive_offer_usage;

-- 9. Check for orphaned records (records without matching customer)
SELECT 'redemptions' as table_name, COUNT(*) as orphaned_count
FROM redemptions r
LEFT JOIN customers c ON r.customer_id = c.id
WHERE r.customer_id IS NOT NULL AND c.id IS NULL
UNION ALL
SELECT 'discount_usage' as table_name, COUNT(*) as orphaned_count
FROM discount_usage du
LEFT JOIN customers c ON du.customer_id = c.id
WHERE du.customer_id IS NOT NULL AND c.id IS NULL
UNION ALL
SELECT 'exclusive_offer_usage' as table_name, COUNT(*) as orphaned_count
FROM exclusive_offer_usage eou
LEFT JOIN customers c ON eou.customer_id = c.id
WHERE eou.customer_id IS NOT NULL AND c.id IS NULL;

-- 10. Check recent redemption activity
SELECT 
    'redemptions' as type,
    COUNT(*) as count,
    MAX(redeemed_at) as last_redeemed
FROM redemptions
WHERE redeemed_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'discount_usage' as type,
    COUNT(*) as count,
    MAX(used_at) as last_redeemed
FROM discount_usage
WHERE used_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
    'exclusive_offer_usage' as type,
    COUNT(*) as count,
    MAX(used_at) as last_redeemed
FROM exclusive_offer_usage
WHERE used_at >= NOW() - INTERVAL '30 days';