-- Add QR code columns to discount_offers and exclusive_offers tables
alter table public.discount_offers 
  add column if not exists qr_code_data text unique;

alter table public.exclusive_offers 
  add column if not exists qr_code_data text unique;

-- Create indexes for QR code columns
create index if not exists idx_discount_offers_qr_code on public.discount_offers(qr_code_data);
create index if not exists idx_exclusive_offers_qr_code on public.exclusive_offers(qr_code_data);

-- Function to generate QR code data for discount offers
create or replace function generate_discount_qr_code()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Generate QR code data if not already set
  if new.qr_code_data is null then
    new.qr_code_data := 'GIYA-DISCOUNT-' || gen_random_uuid()::text;
  end if;
  return new;
end;
$$;

-- Function to generate QR code data for exclusive offers
create or replace function generate_exclusive_offer_qr_code()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Generate QR code data if not already set
  if new.qr_code_data is null then
    new.qr_code_data := 'GIYA-EXCLUSIVE-' || gen_random_uuid()::text;
  end if;
  return new;
end;
$$;

-- Create triggers to automatically generate QR codes
drop trigger if exists generate_discount_qr_code_trigger on public.discount_offers;
create trigger generate_discount_qr_code_trigger
  before insert on public.discount_offers
  for each row
  execute function generate_discount_qr_code();

drop trigger if exists generate_exclusive_offer_qr_code_trigger on public.exclusive_offers;
create trigger generate_exclusive_offer_qr_code_trigger
  before insert on public.exclusive_offers
  for each row
  execute function generate_exclusive_offer_qr_code();