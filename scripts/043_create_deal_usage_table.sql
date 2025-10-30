-- Create deal_usage table to track deal redemptions
-- This replaces discount_usage and exclusive_offer_usage tables

CREATE TABLE IF NOT EXISTS public.deal_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Points deducted (if applicable)
  points_used INTEGER DEFAULT 0,
  
  -- Tracking
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMP WITH TIME ZONE,
  validated_by UUID REFERENCES public.profiles(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deal_usage_deal ON public.deal_usage(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_usage_customer ON public.deal_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_deal_usage_business ON public.deal_usage(business_id);

-- Enable RLS
ALTER TABLE public.deal_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Customers can view their own deal usage"
  ON public.deal_usage
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Businesses can view their deal usage"
  ON public.deal_usage
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

CREATE POLICY "Customers can insert deal usage"
  ON public.deal_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Businesses can update deal validation"
  ON public.deal_usage
  FOR UPDATE
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Function to increment deal redemption count
CREATE OR REPLACE FUNCTION increment_deal_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment redemption_count in deals table
  UPDATE public.deals
  SET redemption_count = redemption_count + 1
  WHERE id = NEW.deal_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment deal usage count
CREATE TRIGGER deal_usage_increment
  AFTER INSERT ON public.deal_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_deal_usage();

-- Function to redeem a deal (replaces separate discount/exclusive functions)
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
