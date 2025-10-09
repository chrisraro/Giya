-- Fix missing business_id data in redemptions
-- This script updates redemptions that are missing business_id by getting it from the reward

UPDATE public.redemptions r
SET business_id = rew.business_id
FROM public.rewards rew
WHERE r.reward_id = rew.id 
  AND r.business_id IS NULL
  AND rew.business_id IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as still_missing_business_id 
FROM redemptions 
WHERE business_id IS NULL;