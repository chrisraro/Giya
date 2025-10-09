-- Check if foreign key constraints are properly set up
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS referenced_table,
    af.attname AS referenced_column
FROM pg_constraint AS c
JOIN pg_attribute AS a 
    ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute AS af 
    ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
    AND c.conrelid::regclass::text = 'redemptions'
ORDER BY constraint_name, a.attnum;