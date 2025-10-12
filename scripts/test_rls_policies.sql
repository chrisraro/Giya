-- Test script to verify RLS policies for customer data access

-- Replace 'CUSTOMER_ID' with an actual customer ID for testing
-- \set customer_id 'YOUR_CUSTOMER_ID_HERE'

-- 1. Test customer data access
SELECT 
    id,
    full_name,
    total_points
FROM customers 
WHERE id = :'customer_id';

-- 2. Test points transactions access
SELECT 
    id,
    business_id,
    amount_spent,
    points_earned
FROM points_transactions 
WHERE customer_id = :'customer_id'
ORDER BY transaction_date DESC
LIMIT 5;

-- 3. Test redemptions access (both customer_id and user_id)
SELECT 
    id,
    reward_id,
    customer_id,
    user_id,
    points_redeemed,
    redeemed_at,
    status
FROM redemptions 
WHERE customer_id = :'customer_id' OR user_id = :'customer_id'
ORDER BY redeemed_at DESC
LIMIT 5;

-- 4. Test discount usage access
SELECT 
    id,
    discount_offer_id,
    customer_id,
    used_at
FROM discount_usage 
WHERE customer_id = :'customer_id'
ORDER BY used_at DESC
LIMIT 5;

-- 5. Test exclusive offer usage access
SELECT 
    id,
    exclusive_offer_id,
    customer_id,
    used_at
FROM exclusive_offer_usage 
WHERE customer_id = :'customer_id'
ORDER BY used_at DESC
LIMIT 5;

-- 6. Check RLS policies for redemptions table
SELECT 
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as qualification
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'redemptions' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Check RLS policies for discount_usage table
SELECT 
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as qualification
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'discount_usage' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 8. Check RLS policies for exclusive_offer_usage table
SELECT 
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as qualification
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'exclusive_offer_usage' 
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');