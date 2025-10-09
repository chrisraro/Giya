-- This script updates the redemptions table to ensure proper relationships
-- It should be run in the Supabase SQL editor

-- Add business relationship to redemptions if it doesn't exist
alter table public.redemptions 
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

-- Create index for business_id if it doesn't exist
create index if not exists idx_redemptions_business on public.redemptions(business_id);

-- Update existing redemptions to have business_id from the associated reward
update public.redemptions r
set business_id = rew.business_id
from public.rewards rew
where r.reward_id = rew.id and r.business_id is null;