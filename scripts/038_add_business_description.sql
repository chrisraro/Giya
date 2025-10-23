-- Add business description field to businesses table
alter table public.businesses
add column if not exists description text;

-- Add index for better query performance
create index if not exists idx_businesses_description on public.businesses(description);