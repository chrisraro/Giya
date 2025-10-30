-- Migration script to move existing discount_offers and exclusive_offers to the new deals table
-- This script should be run AFTER creating the deals table (script 042)
-- It preserves all existing data while transitioning to the unified deals system

-- Migrate discount_offers to deals table
INSERT INTO public.deals (
  business_id,
  title,
  description,
  deal_type,
  discount_percentage,
  discount_value,
  points_required,
  image_url,
  terms_and_conditions,
  redemption_limit,
  redemption_count,
  is_active,
  validity_start,
  validity_end,
  qr_code_data,
  created_at
)
SELECT 
  business_id,
  title,
  description,
  'discount' AS deal_type,
  CASE 
    WHEN discount_type = 'percentage' THEN discount_value
    ELSE NULL
  END AS discount_percentage,
  CASE 
    WHEN discount_type = 'fixed_amount' THEN discount_value
    ELSE NULL
  END AS discount_value,
  0 AS points_required, -- Old discount_offers didn't have points requirement
  NULL AS image_url, -- Old discount_offers didn't have images
  NULL AS terms_and_conditions,
  CASE 
    WHEN usage_limit = -1 THEN NULL
    ELSE usage_limit
  END AS redemption_limit,
  used_count AS redemption_count,
  is_active,
  COALESCE(valid_from, created_at) AS validity_start,
  valid_until AS validity_end,
  'GIYA-DISCOUNT-MIGRATED-' || id AS qr_code_data,
  created_at
FROM public.discount_offers
WHERE NOT EXISTS (
  -- Avoid duplicates if script is run multiple times
  SELECT 1 FROM public.deals d 
  WHERE d.business_id = discount_offers.business_id 
    AND d.title = discount_offers.title
    AND d.deal_type = 'discount'
);

-- Migrate exclusive_offers to deals table
-- Note: Old exclusive offers don't have menu_item_id, so we create menu items for them first

-- Step 1: Create menu items from exclusive offers that don't have them yet
INSERT INTO public.menu_items (
  business_id,
  name,
  description,
  category,
  base_price,
  image_url,
  is_available,
  created_at
)
SELECT 
  business_id,
  product_name AS name,
  description,
  'Product' AS category,
  original_price AS base_price,
  image_url,
  is_active AS is_available,
  created_at
FROM public.exclusive_offers
WHERE NOT EXISTS (
  -- Only create menu items that don't already exist
  SELECT 1 FROM public.menu_items mi
  WHERE mi.business_id = exclusive_offers.business_id
    AND mi.name = exclusive_offers.product_name
);

-- Step 2: Migrate exclusive_offers to deals table with menu_item_id
INSERT INTO public.deals (
  business_id,
  title,
  description,
  deal_type,
  menu_item_id,
  original_price,
  exclusive_price,
  points_required,
  image_url,
  terms_and_conditions,
  redemption_limit,
  redemption_count,
  is_active,
  validity_start,
  validity_end,
  qr_code_data,
  created_at
)
SELECT 
  eo.business_id,
  eo.title,
  eo.description,
  'exclusive' AS deal_type,
  mi.id AS menu_item_id, -- Link to the menu item we created
  eo.original_price,
  eo.discounted_price AS exclusive_price,
  0 AS points_required, -- Old exclusive_offers didn't have points requirement
  eo.image_url,
  NULL AS terms_and_conditions,
  CASE 
    WHEN eo.usage_limit = -1 THEN NULL
    ELSE eo.usage_limit
  END AS redemption_limit,
  eo.used_count AS redemption_count,
  eo.is_active,
  COALESCE(eo.valid_from, eo.created_at) AS validity_start,
  eo.valid_until AS validity_end,
  'GIYA-EXCLUSIVE-MIGRATED-' || eo.id AS qr_code_data,
  eo.created_at
FROM public.exclusive_offers eo
INNER JOIN public.menu_items mi ON (
  mi.business_id = eo.business_id 
  AND mi.name = eo.product_name
)
WHERE NOT EXISTS (
  -- Avoid duplicates if script is run multiple times
  SELECT 1 FROM public.deals d 
  WHERE d.business_id = eo.business_id 
    AND d.title = eo.title
    AND d.deal_type = 'exclusive'
);

-- Migrate discount_usage to deal_usage
INSERT INTO public.deal_usage (
  deal_id,
  customer_id,
  business_id,
  points_used,
  used_at,
  validated,
  validated_at
)
SELECT 
  d.id AS deal_id,
  du.customer_id,
  du.business_id,
  0 AS points_used, -- Old discount usage didn't track points
  du.used_at,
  true AS validated, -- All usage records are already validated
  du.used_at AS validated_at
FROM public.discount_usage du
INNER JOIN public.discount_offers do_old ON du.discount_offer_id = do_old.id
INNER JOIN public.deals d ON (
  d.business_id = do_old.business_id 
  AND d.title = do_old.title
  AND d.deal_type = 'discount'
)
WHERE NOT EXISTS (
  -- Avoid duplicates
  SELECT 1 FROM public.deal_usage du2
  WHERE du2.customer_id = du.customer_id
    AND du2.deal_id = d.id
    AND du2.used_at = du.used_at
);

-- Migrate exclusive_offer_usage to deal_usage
INSERT INTO public.deal_usage (
  deal_id,
  customer_id,
  business_id,
  points_used,
  used_at,
  validated,
  validated_at
)
SELECT 
  d.id AS deal_id,
  eou.customer_id,
  eou.business_id,
  0 AS points_used, -- Old exclusive offer usage didn't track points
  eou.used_at,
  true AS validated, -- All usage records are already validated
  eou.used_at AS validated_at
FROM public.exclusive_offer_usage eou
INNER JOIN public.exclusive_offers eo_old ON eou.exclusive_offer_id = eo_old.id
INNER JOIN public.deals d ON (
  d.business_id = eo_old.business_id 
  AND d.title = eo_old.title 
  AND d.deal_type = 'exclusive'
)
WHERE NOT EXISTS (
  -- Avoid duplicates
  SELECT 1 FROM public.deal_usage du2
  WHERE du2.customer_id = eou.customer_id
    AND du2.deal_id = d.id
    AND du2.used_at = eou.used_at
);

-- Generate QR codes for migrated deals that don't have one
UPDATE public.deals
SET qr_code_data = 'GIYA-DEAL-MIGRATED-' || id
WHERE qr_code_data IS NULL;

-- Output migration summary
DO $$
DECLARE
  discount_count INT;
  exclusive_count INT;
  discount_usage_count INT;
  exclusive_usage_count INT;
BEGIN
  SELECT COUNT(*) INTO discount_count FROM public.deals WHERE deal_type = 'discount';
  SELECT COUNT(*) INTO exclusive_count FROM public.deals WHERE deal_type = 'exclusive';
  SELECT COUNT(*) INTO discount_usage_count FROM public.deal_usage du
    INNER JOIN public.deals d ON du.deal_id = d.id
    WHERE d.deal_type = 'discount';
  SELECT COUNT(*) INTO exclusive_usage_count FROM public.deal_usage du
    INNER JOIN public.deals d ON du.deal_id = d.id
    WHERE d.deal_type = 'exclusive';
  
  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Migrated % discount deals', discount_count;
  RAISE NOTICE 'Migrated % exclusive deals', exclusive_count;
  RAISE NOTICE 'Migrated % discount usage records', discount_usage_count;
  RAISE NOTICE 'Migrated % exclusive usage records', exclusive_usage_count;
  RAISE NOTICE '========================';
END $$;

-- NOTE: After successful migration and testing, you can optionally drop the old tables:
-- DROP TABLE IF EXISTS public.discount_usage;
-- DROP TABLE IF EXISTS public.exclusive_offer_usage;
-- DROP TABLE IF EXISTS public.discount_offers;
-- DROP TABLE IF EXISTS public.exclusive_offers;
-- (Keep them for now as backup until you're confident the migration worked correctly)
