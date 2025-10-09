-- Verify redemption data integrity
-- Check if redemptions have proper relationships

-- 1. Check how many redemptions exist
SELECT COUNT(*) as total_redemptions FROM redemptions;

-- 2. Check redemptions with missing business_id
SELECT COUNT(*) as missing_business_id 
FROM redemptions 
WHERE business_id IS NULL;

-- 3. Check redemptions with missing reward_id
SELECT COUNT(*) as missing_reward_id 
FROM redemptions 
WHERE reward_id IS NULL;

-- 4. Check sample redemptions with all data
SELECT 
    r.id,
    r.customer_id,
    r.reward_id,
    r.business_id,
    r.points_redeemed,
    r.status,
    rew.reward_name,
    b.business_name
FROM redemptions r
LEFT JOIN rewards rew ON r.reward_id = rew.id
LEFT JOIN businesses b ON r.business_id = b.id
WHERE r.reward_id IS NOT NULL 
  AND r.business_id IS NOT NULL
LIMIT 10;

-- 5. Check redemptions with missing reward data
SELECT 
    r.id,
    r.customer_id,
    r.reward_id,
    r.business_id,
    r.points_redeemed,
    r.status
FROM redemptions r
WHERE r.reward_id IS NULL OR r.business_id IS NULL
LIMIT 10;