-- Check if rewards table has data
SELECT COUNT(*) as total_rewards FROM rewards;

-- Check sample rewards
SELECT 
    id,
    business_id,
    reward_name,
    points_required
FROM rewards
LIMIT 5;

-- Check if any rewards are missing required fields
SELECT 
    id,
    reward_name
FROM rewards
WHERE reward_name IS NULL OR reward_name = '';

-- Check rewards with missing business_id
SELECT 
    id,
    reward_name
FROM rewards
WHERE business_id IS NULL;