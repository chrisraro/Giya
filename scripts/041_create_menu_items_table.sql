-- Create menu_items table for business products/items
-- This table stores all menu items/products that businesses can use in rewards and deals

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'Food', 'Beverage', 'Service', 'Product'
  base_price NUMERIC(10, 2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_business ON public.menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items
-- Businesses can manage their own menu items
CREATE POLICY "Businesses can view their own menu items"
  ON public.menu_items
  FOR SELECT
  TO authenticated
  USING (business_id = auth.uid());

CREATE POLICY "Businesses can insert their own menu items"
  ON public.menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can update their own menu items"
  ON public.menu_items
  FOR UPDATE
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Businesses can delete their own menu items"
  ON public.menu_items
  FOR DELETE
  TO authenticated
  USING (business_id = auth.uid());

-- Customers can view available menu items from any business
CREATE POLICY "Customers can view available menu items"
  ON public.menu_items
  FOR SELECT
  TO authenticated
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_items_updated_at();
