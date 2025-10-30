-- Fix RLS policies for menu_items, deals, and rewards to resolve data fetching issues
-- This script drops conflicting policies and creates proper ones

-- ============================================
-- MENU ITEMS TABLE
-- ============================================

-- Drop ALL existing menu_items policies to start fresh
DROP POLICY IF EXISTS "Businesses can view their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Businesses can insert their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Businesses can update their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Businesses can delete their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Customers can view available menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can view all menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can manage all menu items" ON public.menu_items;

-- Create new consolidated policies for menu_items

-- Policy 1: Businesses can fully manage their own menu items
CREATE POLICY "business_full_access_own_menu_items"
  ON public.menu_items
  FOR ALL
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Policy 2: Customers can view available menu items
CREATE POLICY "customers_view_available_menu_items"
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

-- Policy 3: Admins can view and manage all menu items
CREATE POLICY "admins_full_access_all_menu_items"
  ON public.menu_items
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- DEALS TABLE
-- ============================================

-- Drop ALL existing deals policies to start fresh
DROP POLICY IF EXISTS "Businesses can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "Businesses can insert their own deals" ON public.deals;
DROP POLICY IF EXISTS "Businesses can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Businesses can delete their own deals" ON public.deals;
DROP POLICY IF EXISTS "Customers can view active deals" ON public.deals;
DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Admins can manage all deals" ON public.deals;

-- Create new consolidated policies for deals

-- Policy 1: Businesses can fully manage their own deals
CREATE POLICY "business_full_access_own_deals"
  ON public.deals
  FOR ALL
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Policy 2: Customers can view active and valid deals
CREATE POLICY "customers_view_active_deals"
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

-- Policy 3: Admins can view and manage all deals
CREATE POLICY "admins_full_access_all_deals"
  ON public.deals
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- REWARDS TABLE
-- ============================================

-- Drop ALL existing rewards policies to start fresh
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Businesses can view their own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Businesses can create rewards" ON public.rewards;
DROP POLICY IF EXISTS "Businesses can update their own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Businesses can delete their own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can view all rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.rewards;

-- Create new consolidated policies for rewards

-- Policy 1: Businesses can fully manage their own rewards
CREATE POLICY "business_full_access_own_rewards"
  ON public.rewards
  FOR ALL
  TO authenticated
  USING (business_id = auth.uid())
  WITH CHECK (business_id = auth.uid());

-- Policy 2: Customers can view active rewards
CREATE POLICY "customers_view_active_rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

-- Policy 3: Public can view active rewards (for browsing)
CREATE POLICY "public_view_active_rewards"
  ON public.rewards
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy 4: Admins can view and manage all rewards
CREATE POLICY "admins_full_access_all_rewards"
  ON public.rewards
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify the policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('menu_items', 'deals', 'rewards')
ORDER BY tablename, policyname;

-- Add comments for documentation
COMMENT ON POLICY "business_full_access_own_menu_items" ON public.menu_items 
IS 'Allows businesses to perform all operations on their own menu items';

COMMENT ON POLICY "customers_view_available_menu_items" ON public.menu_items 
IS 'Allows customers to view available menu items from all businesses';

COMMENT ON POLICY "admins_full_access_all_menu_items" ON public.menu_items 
IS 'Allows admins to perform all operations on all menu items';

COMMENT ON POLICY "business_full_access_own_deals" ON public.deals 
IS 'Allows businesses to perform all operations on their own deals';

COMMENT ON POLICY "customers_view_active_deals" ON public.deals 
IS 'Allows customers to view active and valid deals from all businesses';

COMMENT ON POLICY "admins_full_access_all_deals" ON public.deals 
IS 'Allows admins to perform all operations on all deals';

COMMENT ON POLICY "business_full_access_own_rewards" ON public.rewards 
IS 'Allows businesses to perform all operations on their own rewards';

COMMENT ON POLICY "customers_view_active_rewards" ON public.rewards 
IS 'Allows customers to view active rewards from all businesses';

COMMENT ON POLICY "public_view_active_rewards" ON public.rewards 
IS 'Allows any authenticated user to view active rewards for browsing';

COMMENT ON POLICY "admins_full_access_all_rewards" ON public.rewards 
IS 'Allows admins to perform all operations on all rewards';
