-- Add curated lists functionality for admin to feature businesses on landing page
-- Curated lists appear on discover section with carousel layout

-- Create curated_lists table
CREATE TABLE IF NOT EXISTS public.curated_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'trending', 'new', 'popular', 'recommended', etc.
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create curated_list_items table (businesses in each list)
CREATE TABLE IF NOT EXISTS public.curated_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  curated_list_id UUID REFERENCES public.curated_lists(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  added_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  UNIQUE(curated_list_id, business_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_curated_lists_active ON public.curated_lists(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_curated_lists_category ON public.curated_lists(category);
CREATE INDEX IF NOT EXISTS idx_curated_list_items_list ON public.curated_list_items(curated_list_id, display_order);
CREATE INDEX IF NOT EXISTS idx_curated_list_items_business ON public.curated_list_items(business_id);

-- Enable RLS
ALTER TABLE public.curated_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curated_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for curated_lists
-- Public can view active lists
CREATE POLICY "Anyone can view active curated lists"
  ON public.curated_lists
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all lists
CREATE POLICY "Admins can manage curated lists"
  ON public.curated_lists
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for curated_list_items
-- Public can view items in active lists
CREATE POLICY "Anyone can view curated list items"
  ON public.curated_list_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.curated_lists
      WHERE id = curated_list_id AND is_active = true
    )
  );

-- Admins can manage list items
CREATE POLICY "Admins can manage curated list items"
  ON public.curated_list_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Function to get curated lists with businesses
CREATE OR REPLACE FUNCTION get_curated_lists_with_businesses()
RETURNS TABLE (
  list_id UUID,
  list_title TEXT,
  list_description TEXT,
  list_category TEXT,
  businesses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.id AS list_id,
    cl.title AS list_title,
    cl.description AS list_description,
    cl.category AS list_category,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'business_name', b.business_name,
          'business_category', b.business_category,
          'address', b.address,
          'profile_pic_url', b.profile_pic_url,
          'description', b.description,
          'display_order', cli.display_order
        )
        ORDER BY cli.display_order
      ) FILTER (WHERE b.id IS NOT NULL),
      '[]'::jsonb
    ) AS businesses
  FROM public.curated_lists cl
  LEFT JOIN public.curated_list_items cli ON cl.id = cli.curated_list_id
  LEFT JOIN public.businesses b ON cli.business_id = b.id AND b.approval_status = 'approved' AND b.is_active = true
  WHERE cl.is_active = true
  GROUP BY cl.id, cl.title, cl.description, cl.category
  ORDER BY cl.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for curated_lists
CREATE OR REPLACE FUNCTION update_curated_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER curated_lists_updated_at
  BEFORE UPDATE ON public.curated_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_curated_lists_updated_at();

-- Grant permissions
GRANT SELECT ON public.curated_lists TO anon, authenticated;
GRANT SELECT ON public.curated_list_items TO anon, authenticated;
GRANT ALL ON public.curated_lists TO authenticated;
GRANT ALL ON public.curated_list_items TO authenticated;

-- Comments
COMMENT ON TABLE public.curated_lists IS 'Admin-curated featured business lists for discovery page';
COMMENT ON TABLE public.curated_list_items IS 'Businesses included in curated lists';
COMMENT ON FUNCTION get_curated_lists_with_businesses IS 'Returns all active curated lists with their businesses for public display';
