-- Detailed test of redemption query to identify issues
-- This will help us understand what's happening with the joins

-- First, let's see what a simple redemption query returns
SELECT 
    id,
    customer_id,
    reward_id,
    business_id,
    redeemed_at,
    status
FROM redemptions
LIMIT 5;

-- Now let's try the join with rewards
SELECT 
    r.id,
    r.customer_id,
    r.reward_id,
    r.business_id,
    r.redeemed_at,
    r.status,
    rew.reward_name,
    rew.points_required
FROM redemptions r
LEFT JOIN rewards rew ON r.reward_id = rew.id
LIMIT 5;

-- Now let's try the join with businesses
SELECT 
    r.id,
    r.customer_id,
    r.reward_id,
    r.business_id,
    r.redeemed_at,
    r.status,
    b.business_name,
    b.profile_pic_url
FROM redemptions r
LEFT JOIN businesses b ON r.business_id = b.id
LIMIT 5;

-- Finally, let's try the full query
SELECT 
    r.id,
    r.redeemed_at,
    r.status,
    r.business_id,
    rew.reward_name,
    rew.points_required,
    rew.image_url,
    b.business_name,
    b.profile_pic_url
FROM redemptions r
LEFT JOIN rewards rew ON r.reward_id = rew.id
LEFT JOIN businesses b ON r.business_id = b.id
LIMIT 5;