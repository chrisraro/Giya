-- Verify the current schema of the rewards table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rewards' 
ORDER BY ordinal_position;

-- Verify the current schema of the redemptions table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'redemptions' 
ORDER BY ordinal_position;

-- Check if there are any rewards in the table
SELECT COUNT(*) as reward_count FROM rewards;

-- Check a sample reward to see the column names
SELECT * FROM rewards LIMIT 1;

-- Check if there are any redemptions in the table
SELECT COUNT(*) as redemption_count FROM redemptions;

-- Check a sample redemption to see the column names
SELECT * FROM redemptions LIMIT 1;