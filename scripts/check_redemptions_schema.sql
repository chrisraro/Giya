-- Check the current schema of the redemptions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'redemptions' 
ORDER BY column_name;

-- Check if the business_id column exists and has the correct foreign key relationship
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'redemptions' AND tc.constraint_type = 'FOREIGN KEY';