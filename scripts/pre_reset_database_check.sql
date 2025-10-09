-- Pre-reset database check
-- This script will show the current state of your database before resetting

-- 1. Show current customer points
SELECT 
    id,
    full_name,
    total_points
FROM customers
ORDER BY total_points DESC
LIMIT 10;

-- 2. Count current transactions and redemptions
SELECT 
    (SELECT COUNT(*) FROM points_transactions) as total_transactions,
    (SELECT COUNT(*) FROM redemptions) as total_redemptions,
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(*) FROM businesses) as total_businesses;

-- 3. Show sample transactions
SELECT 
    pt.id,
    c.full_name as customer_name,
    b.business_name,
    pt.amount_spent,
    pt.points_earned,
    pt.transaction_date
FROM points_transactions pt
JOIN customers c ON pt.customer_id = c.id
JOIN businesses b ON pt.business_id = b.id
ORDER BY pt.transaction_date DESC
LIMIT 5;

-- 4. Show sample redemptions
SELECT 
    r.id,
    c.full_name as customer_name,
    b.business_name,
    rew.reward_name,
    r.points_redeemed,
    r.redeemed_at,
    r.status
FROM redemptions r
JOIN customers c ON r.customer_id = c.id
JOIN businesses b ON r.business_id = b.id
JOIN rewards rew ON r.reward_id = rew.id
ORDER BY r.redeemed_at DESC
LIMIT 5;

-- 5. Show points distribution by business
SELECT 
    b.business_name,
    COUNT(pt.id) as transaction_count,
    COALESCE(SUM(pt.points_earned), 0) as total_points_earned,
    COUNT(r.id) as redemption_count,
    COALESCE(SUM(r.points_redeemed), 0) as total_points_redeemed
FROM businesses b
LEFT JOIN points_transactions pt ON b.id = pt.business_id
LEFT JOIN redemptions r ON b.id = r.business_id
GROUP BY b.id, b.business_name
ORDER BY total_points_earned DESC;

-- 6. Show customer points summary
SELECT 
    c.full_name,
    COUNT(pt.id) as transactions,
    COALESCE(SUM(pt.points_earned), 0) as points_earned,
    COUNT(r.id) as redemptions,
    COALESCE(SUM(r.points_redeemed), 0) as points_redeemed,
    c.total_points as current_total_points,
    (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_total_points,
    (c.total_points - (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))) as discrepancy
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
GROUP BY c.id, c.full_name, c.total_points
ORDER BY points_earned DESC;