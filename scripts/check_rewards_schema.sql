-- Check the current schema of the rewards table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' 
AND column_name IN ('name', 'reward_name')
ORDER BY column_name;