-- Add new columns to existing redemptions table
alter table public.redemptions 
  add column if not exists customer_id uuid references public.customers(id) on delete cascade,
  add column if not exists business_id uuid references public.businesses(id) on delete cascade,
  add column if not exists points_redeemed integer,
  add column if not exists redemption_qr_code text unique,
  add column if not exists validated_at timestamp with time zone,
  add column if not exists validated_by uuid references public.businesses(id);

-- Update status column to have better default
alter table public.redemptions 
  alter column status set default 'pending';

-- Create indexes for better performance
create index if not exists idx_redemptions_customer on public.redemptions(customer_id);
create index if not exists idx_redemptions_business on public.redemptions(business_id);
create index if not exists idx_redemptions_qr on public.redemptions(redemption_qr_code);
create index if not exists idx_redemptions_status on public.redemptions(status);

-- Update RLS policies
drop policy if exists "Users can view their own redemptions" on public.redemptions;
drop policy if exists "Customers can create redemptions" on public.redemptions;
drop policy if exists "Businesses can update redemptions" on public.redemptions;

create policy "Users can view their own redemptions"
  on public.redemptions for select
  using (
    auth.uid() = customer_id or 
    auth.uid() = business_id or
    auth.uid() = validated_by or
    auth.uid() = user_id
  );

create policy "Customers can create redemptions"
  on public.redemptions for insert
  with check (auth.uid() = customer_id or auth.uid() = user_id);

create policy "Businesses can update redemptions"
  on public.redemptions for update
  using (auth.uid() = business_id or auth.uid() = validated_by);
