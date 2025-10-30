-- Update redeem_deal function to check schedule restrictions
-- This ensures deals can only be redeemed during their scheduled times/days

CREATE OR REPLACE FUNCTION redeem_deal(
  p_qr_code TEXT,
  p_customer_id UUID,
  p_business_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_deal RECORD;
  v_usage_id UUID;
  v_customer_points INTEGER;
BEGIN
  -- Find the deal
  SELECT * INTO v_deal
  FROM public.deals
  WHERE qr_code_data = p_qr_code
    AND is_active = true
    AND (validity_end IS NULL OR validity_end > NOW());
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Deal not found or expired'
    );
  END IF;
  
  -- Verify business owns this deal
  IF v_deal.business_id != p_business_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This deal does not belong to your business'
    );
  END IF;
  
  -- Check if deal is currently active based on schedule
  IF NOT is_deal_currently_active(v_deal.id) THEN
    -- Provide helpful message based on schedule type
    CASE v_deal.schedule_type
      WHEN 'time_based' THEN
        RETURN json_build_object(
          'success', false,
          'message', format('This deal is only available from %s to %s', 
            v_deal.start_time::TEXT, v_deal.end_time::TEXT)
        );
      WHEN 'day_based' THEN
        RETURN json_build_object(
          'success', false,
          'message', 'This deal is not available on this day of the week'
        );
      WHEN 'time_and_day' THEN
        RETURN json_build_object(
          'success', false,
          'message', format('This deal is only available on specific days from %s to %s', 
            v_deal.start_time::TEXT, v_deal.end_time::TEXT)
        );
      ELSE
        RETURN json_build_object(
          'success', false,
          'message', 'This deal is not currently available'
        );
    END CASE;
  END IF;
  
  -- Check redemption limit
  IF v_deal.redemption_limit IS NOT NULL 
     AND v_deal.redemption_count >= v_deal.redemption_limit THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Deal redemption limit reached'
    );
  END IF;
  
  -- Check if customer has enough points (if required)
  IF v_deal.points_required > 0 THEN
    SELECT total_points INTO v_customer_points
    FROM public.customers
    WHERE id = p_customer_id;
    
    IF v_customer_points < v_deal.points_required THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Customer does not have enough points'
      );
    END IF;
    
    -- Deduct points from customer
    UPDATE public.customers
    SET total_points = total_points - v_deal.points_required
    WHERE id = p_customer_id;
  END IF;
  
  -- Record the usage
  INSERT INTO public.deal_usage (
    deal_id,
    customer_id,
    business_id,
    points_used,
    validated,
    validated_at,
    validated_by
  ) VALUES (
    v_deal.id,
    p_customer_id,
    p_business_id,
    v_deal.points_required,
    true,
    NOW(),
    p_business_id
  ) RETURNING id INTO v_usage_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Deal redeemed successfully',
    'usage_id', v_usage_id,
    'points_used', v_deal.points_required
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on function
COMMENT ON FUNCTION redeem_deal IS 'Redeems a deal with schedule validation (time and day restrictions)';
