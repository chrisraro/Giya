-- Test redemption query to verify it's working correctly
-- This query should return redemptions with reward and business information

SELECT 
    r.id,
    r.redeemed_at,
    r.status,
    r.business_id,
    rew.reward_name,
    rew.points_required,
    rew.image_url,
    b.business_name,
    b.profile_pic_url
FROM public.redemptions r
LEFT JOIN public.rewards rew ON r.reward_id = rew.id
LEFT JOIN public.businesses b ON r.business_id = b.id
LIMIT 5;