-- Add points_required column to exclusive_offers table
alter table public.exclusive_offers
add column if not exists points_required integer default 0;