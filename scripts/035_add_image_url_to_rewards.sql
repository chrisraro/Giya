-- Add image_url column to rewards table
alter table public.rewards
add column if not exists image_url text;