-- Function to redeem a discount offer
create or replace function redeem_discount_offer(p_qr_code text, p_customer_id uuid, p_business_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_discount_id uuid;
  v_discount_record record;
  v_usage_count integer;
  v_result json;
begin
  -- Find the discount offer by QR code
  select id, business_id, title, discount_type, discount_value, usage_limit, used_count
  into v_discount_record
  from public.discount_offers
  where qr_code_data = p_qr_code
  and is_active = true
  and valid_from <= now()
  and (valid_until is null or valid_until >= now());

  if not found then
    return json_build_object('success', false, 'message', 'Invalid or expired discount offer');
  end if;

  -- Check if the discount is for the correct business
  if v_discount_record.business_id != p_business_id then
    return json_build_object('success', false, 'message', 'This discount is not for your business');
  end if;

  -- Check usage limit
  if v_discount_record.usage_limit is not null and v_discount_record.used_count >= v_discount_record.usage_limit then
    return json_build_object('success', false, 'message', 'This discount has reached its usage limit');
  end if;

  -- Check if customer has already used this discount (for first visit only)
  if v_discount_record.is_first_visit_only then
    select count(*) into v_usage_count
    from public.discount_usage
    where discount_offer_id = v_discount_record.id
    and customer_id = p_customer_id;

    if v_usage_count > 0 then
      return json_build_object('success', false, 'message', 'This is a first visit only discount and you have already used it');
    end if;
  end if;

  -- Record the usage
  insert into public.discount_usage (discount_offer_id, customer_id, business_id)
  values (v_discount_record.id, p_customer_id, p_business_id);

  -- Increment the used count
  update public.discount_offers
  set used_count = used_count + 1
  where id = v_discount_record.id;

  -- Return success with discount details
  return json_build_object(
    'success', true,
    'message', 'Discount redeemed successfully',
    'discount_id', v_discount_record.id,
    'title', v_discount_record.title,
    'discount_type', v_discount_record.discount_type,
    'discount_value', v_discount_record.discount_value
  );
end;
$$;

-- Function to redeem an exclusive offer
create or replace function redeem_exclusive_offer(p_qr_code text, p_customer_id uuid, p_business_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_offer_id uuid;
  v_offer_record record;
  v_usage_count integer;
  v_result json;
begin
  -- Find the exclusive offer by QR code
  select id, business_id, title, product_name, original_price, discounted_price, usage_limit, used_count
  into v_offer_record
  from public.exclusive_offers
  where qr_code_data = p_qr_code
  and is_active = true
  and valid_from <= now()
  and (valid_until is null or valid_until >= now());

  if not found then
    return json_build_object('success', false, 'message', 'Invalid or expired exclusive offer');
  end if;

  -- Check if the offer is for the correct business
  if v_offer_record.business_id != p_business_id then
    return json_build_object('success', false, 'message', 'This offer is not for your business');
  end if;

  -- Check usage limit
  if v_offer_record.usage_limit is not null and v_offer_record.used_count >= v_offer_record.usage_limit then
    return json_build_object('success', false, 'message', 'This offer has reached its usage limit');
  end if;

  -- Record the usage
  insert into public.exclusive_offer_usage (exclusive_offer_id, customer_id, business_id)
  values (v_offer_record.id, p_customer_id, p_business_id);

  -- Increment the used count
  update public.exclusive_offers
  set used_count = used_count + 1
  where id = v_offer_record.id;

  -- Return success with offer details
  return json_build_object(
    'success', true,
    'message', 'Exclusive offer redeemed successfully',
    'offer_id', v_offer_record.id,
    'title', v_offer_record.title,
    'product_name', v_offer_record.product_name,
    'original_price', v_offer_record.original_price,
    'discounted_price', v_offer_record.discounted_price
  );
end;
$$;