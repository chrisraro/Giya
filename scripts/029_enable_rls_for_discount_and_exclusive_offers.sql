-- Enable Row Level Security on discount and exclusive offers tables
alter table public.discount_offers enable row level security;
alter table public.discount_usage enable row level security;
alter table public.exclusive_offers enable row level security;
alter table public.exclusive_offer_usage enable row level security;

-- Discount offers policies
create policy "Businesses can view their own discount offers"
  on public.discount_offers for select
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can create their own discount offers"
  on public.discount_offers for insert
  with check (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can update their own discount offers"
  on public.discount_offers for update
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can delete their own discount offers"
  on public.discount_offers for delete
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Customers can view active discount offers from businesses they've interacted with"
  on public.discount_offers for select
  using (
    is_active = true 
    and valid_from <= now() 
    and (valid_until is null or valid_until >= now())
    and business_id in (
      select distinct business_id 
      from public.points_transactions 
      where customer_id = auth.uid()
    )
  );

create policy "Anyone can view active discount offers"
  on public.discount_offers for select
  using (
    is_active = true 
    and valid_from <= now() 
    and (valid_until is null or valid_until >= now())
  );

-- Discount usage policies
create policy "Customers can view their own discount usage"
  on public.discount_usage for select
  using (customer_id = auth.uid());

create policy "Businesses can view discount usage for their offers"
  on public.discount_usage for select
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "System can insert discount usage"
  on public.discount_usage for insert
  with check (true);

-- Exclusive offers policies
create policy "Businesses can view their own exclusive offers"
  on public.exclusive_offers for select
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can create their own exclusive offers"
  on public.exclusive_offers for insert
  with check (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can update their own exclusive offers"
  on public.exclusive_offers for update
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Businesses can delete their own exclusive offers"
  on public.exclusive_offers for delete
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "Customers can view active exclusive offers from businesses they've interacted with"
  on public.exclusive_offers for select
  using (
    is_active = true 
    and valid_from <= now() 
    and (valid_until is null or valid_until >= now())
    and business_id in (
      select distinct business_id 
      from public.points_transactions 
      where customer_id = auth.uid()
    )
  );

create policy "Anyone can view active exclusive offers"
  on public.exclusive_offers for select
  using (
    is_active = true 
    and valid_from <= now() 
    and (valid_until is null or valid_until >= now())
  );

-- Exclusive offer usage policies
create policy "Customers can view their own exclusive offer usage"
  on public.exclusive_offer_usage for select
  using (customer_id = auth.uid());

create policy "Businesses can view exclusive offer usage for their offers"
  on public.exclusive_offer_usage for select
  using (business_id in (select id from public.businesses where id = auth.uid()));

create policy "System can insert exclusive offer usage"
  on public.exclusive_offer_usage for insert
  with check (true);