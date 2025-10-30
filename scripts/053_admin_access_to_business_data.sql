-- Add RLS policies to allow admins to view and manage all data
-- This fixes the issue where admins cannot see menu_items, deals, and rewards

-- Menu Items - Allow admins to view all menu items
CREATE POLICY "Admins can view all menu items"
  ON public.menu_items
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR business_id IN (
      SELECT id FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all menu items"
  ON public.menu_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Deals - Allow admins to view all deals
CREATE POLICY "Admins can view all deals"
  ON public.deals
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR business_id IN (
      SELECT id FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deals"
  ON public.deals
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Rewards - Allow admins to view all rewards
CREATE POLICY "Admins can view all rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR business_id IN (
      SELECT id FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all rewards"
  ON public.rewards
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Deal Usage - Allow admins to view all deal usage
CREATE POLICY "Admins can view all deal usage"
  ON public.deal_usage
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Comment
COMMENT ON POLICY "Admins can view all menu items" ON public.menu_items IS 'Allows admins to view menu items from all businesses';
COMMENT ON POLICY "Admins can view all deals" ON public.deals IS 'Allows admins to view deals from all businesses';
COMMENT ON POLICY "Admins can view all rewards" ON public.rewards IS 'Allows admins to view rewards from all businesses';
