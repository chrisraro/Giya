-- Migrate existing redemption data to ensure consistency
-- This script updates existing records to have proper relationships

-- 1. Update redemptions to set customer_id from user_id if customer_id is null
UPDATE public.redemptions 
SET customer_id = user_id 
WHERE customer_id IS NULL AND user_id IS NOT NULL;

-- 2. Update redemptions to set business_id from the associated reward if business_id is null
UPDATE public.redemptions r
SET business_id = rew.business_id
FROM public.rewards rew
WHERE r.reward_id = rew.id AND r.business_id IS NULL;

-- 3. Update redemptions to set points_redeemed from the associated reward if points_redeemed is null
UPDATE public.redemptions r
SET points_redeemed = rew.points_required
FROM public.rewards rew
WHERE r.reward_id = rew.id AND r.points_redeemed IS NULL;

-- 4. Generate QR codes for redemptions that don't have them
UPDATE public.redemptions 
SET redemption_qr_code = 'GIYA-REDEEM-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || id::TEXT
WHERE redemption_qr_code IS NULL;

-- 5. Ensure all redemptions have a status
UPDATE public.redemptions 
SET status = 'pending' 
WHERE status IS NULL;