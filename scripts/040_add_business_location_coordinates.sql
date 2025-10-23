-- Add latitude and longitude fields to businesses table for precise location tracking
alter table public.businesses
add column if not exists latitude double precision,
add column if not exists longitude double precision;

-- Add indexes for better query performance on location data
create index if not exists idx_businesses_latitude on public.businesses(latitude);
create index if not exists idx_businesses_longitude on public.businesses(longitude);

-- Add comment to describe the purpose of these columns
comment on column public.businesses.latitude is 'Business location latitude coordinate';
comment on column public.businesses.longitude is 'Business location longitude coordinate';

-- Update existing businesses to populate coordinates from gmaps_link if possible
-- This is a simplified version - in practice, you might want to use a more sophisticated geocoding service
update public.businesses 
set latitude = case 
    when gmaps_link similar to '%@(-?[0-9]+\.?[0-9]*)%,(-?[0-9]+\.?[0-9]*)%,%'
    then cast(substring(gmaps_link from '@(-?[0-9]+\.?[0-9]*)%,') as double precision)
    else null
  end,
  longitude = case 
    when gmaps_link similar to '%@(-?[0-9]+\.?[0-9]*)%,(-?[0-9]+\.?[0-9]*)%,%'
    then cast(substring(gmaps_link from '%@-?[0-9]+\.?[0-9]*%,(-?[0-9]+\.?[0-9]*)%,') as double precision)
    else null
  end
where latitude is null and longitude is null and gmaps_link is not null;