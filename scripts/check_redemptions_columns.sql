-- Check all columns in the redemptions table
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'redemptions' 
ORDER BY ordinal_position;