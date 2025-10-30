-- Create unified deals table replacing discount_offers and exclusive_offers
-- This table consolidates both discount deals and exclusive product deals

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Deal metadata
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('discount', 'exclusive')),
  
  -- For discount deals
  discount_percentage NUMERIC(5, 2), -- e.g., 15.50 for 15.5% off
  discount_value NUMERIC(10, 2), -- Fixed amount off (e.g., ₱50 off)
  
  -- For exclusive deals - link to menu item
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  original_price NUMERIC(10, 2),
  exclusive_price NUMERIC(10, 2),
  
  -- Common fields
  points_required INTEGER DEFAULT 0,
  image_url TEXT,
  terms_and_conditions TEXT,
  
  -- Redemption tracking
  redemption_limit INTEGER, -- NULL means unlimited
  redemption_count INTEGER DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  validity_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validity_end TIMESTAMP WITH TIME ZONE,
  
  -- QR Code for redemption
  qr_code_data TEXT UNIQUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints to ensure proper deal configuration
  CONSTRAINT valid_discount_deal CHECK (
    deal_type != 'discount' OR 
    (discount_percentage IS NOT NULL OR discount_value IS NOT NULL)
  ),
  CONSTRAINT valid_exclusive_deal CHECK (
    deal_type != 'exclusive' OR 
    (menu_item_id IS NOT NULL AND exclusive_price IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_business ON public.deals(business_id);
CREATE INDEX IF NOT EXISTS idx_deals_type ON public.deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_active ON public.deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_menu_item ON public.deals(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_deals_qr_code ON public.deals(qr_code_data);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
-- Businesses can manage their own deals
CREATE POLICY "Businesses can view their own deals"
  ON public.deals
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

CREATE POLICY "Businesses can insert their own deals"
  ON public.deals
  FOR INSERT
  TO authenticated
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can update their own deals"
  ON public.deals
  FOR UPDATE
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can delete their own deals"
  ON public.deals
  FOR DELETE
  TO authenticated
  USING (business_id = auth.uid());

-- Customers can view active deals
CREATE POLICY "Customers can view active deals"
  ON public.deals
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (validity_end IS NULL OR validity_end > NOW())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deals_updated_at();
