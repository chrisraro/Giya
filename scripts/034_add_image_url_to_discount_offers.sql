-- Add image_url column to discount_offers table
alter table public.discount_offers
add column if not exists image_url text;