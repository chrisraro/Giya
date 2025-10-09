-- Simple test to check if the basic redemption query works
SELECT 
    id,
    customer_id,
    reward_id,
    business_id,
    redeemed_at,
    status
FROM redemptions
LIMIT 5;

-- Test if we can join with rewards
SELECT 
    r.id,
    r.customer_id,
    rew.reward_name
FROM redemptions r
JOIN rewards rew ON r.reward_id = rew.id
LIMIT 5;

-- Test if we can join with businesses
SELECT 
    r.id,
    r.customer_id,
    b.business_name
FROM redemptions r
JOIN businesses b ON r.business_id = b.id
LIMIT 5;