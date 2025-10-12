-- Add image_url column to exclusive_offers table
alter table public.exclusive_offers
add column if not exists image_url text;