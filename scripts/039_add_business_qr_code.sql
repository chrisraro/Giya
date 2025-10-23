-- Add QR code access link field to businesses table
alter table public.businesses
add column if not exists access_qr_code text unique;

-- Add access link field to businesses table
alter table public.businesses
add column if not exists access_link text unique;

-- Create indexes for better query performance
create index if not exists idx_businesses_access_qr_code on public.businesses(access_qr_code);
create index if not exists idx_businesses_access_link on public.businesses(access_link);

-- Function to generate unique access code for businesses
create or replace function generate_business_access_code(business_id uuid)
returns text as $$
declare
  access_code text;
  code_exists boolean;
begin
  -- Generate a unique access code based on business ID and timestamp
  access_code := 'BUS-' || substring(business_id::text, 1, 8) || '-' || extract(epoch from now())::bigint;
  
  -- Ensure uniqueness (though highly unlikely with timestamp)
  loop
    select exists(select 1 from businesses where access_link = access_code or access_qr_code = access_code)
    into code_exists;
    
    exit when not code_exists;
    
    -- If somehow there's a collision, add a random suffix
    access_code := access_code || '-' || substr(md5(random()::text), 1, 6);
  end loop;
  
  return access_code;
end;
$$ language plpgsql;

-- Trigger function to automatically generate access codes when a business is created
create or replace function generate_business_access_codes()
returns trigger as $$
begin
  if new.access_qr_code is null then
    new.access_qr_code := generate_business_access_code(new.id);
  end if;
  
  if new.access_link is null then
    new.access_link := generate_business_access_code(new.id);
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically generate access codes
drop trigger if exists trigger_generate_business_access_codes on public.businesses;
create trigger trigger_generate_business_access_codes
  before insert on public.businesses
  for each row
  execute function generate_business_access_codes();

-- Update existing businesses to have access codes
update public.businesses 
set access_qr_code = generate_business_access_code(id),
    access_link = generate_business_access_code(id)
where access_qr_code is null or access_link is null;