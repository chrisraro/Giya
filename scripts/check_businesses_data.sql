-- Check if businesses table has data
SELECT COUNT(*) as total_businesses FROM businesses;

-- Check sample businesses
SELECT 
    id,
    business_name,
    business_category,
    profile_pic_url
FROM businesses
LIMIT 5;

-- Check if any businesses are missing required fields
SELECT 
    id,
    business_name
FROM businesses
WHERE business_name IS NULL OR business_name = '';