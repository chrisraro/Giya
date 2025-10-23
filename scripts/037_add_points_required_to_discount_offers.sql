-- Add points_required column to discount_offers table
alter table public.discount_offers
add column if not exists points_required integer default 0;