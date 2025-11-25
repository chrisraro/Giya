-- Fix RLS policies for admins table to allow initial admin login
-- The issue is that RLS policies require an existing admin to query admins table
-- This creates a chicken-and-egg problem for the first admin login

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all admin accounts" ON public.admins;
DROP POLICY IF EXISTS "Super admins can create new admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.admins;
DROP POLICY IF EXISTS "Super admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Users can view their own admin record" ON public.admins;
DROP POLICY IF EXISTS "Active admins can view all admin accounts" ON public.admins;

-- Create new permissive policy for SELECT
-- Allow authenticated users to read their own admin record
CREATE POLICY "Users can view their own admin record"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() AND is_active = true
  );

-- Allow admins to view all admin accounts
CREATE POLICY "Active admins can view all admin accounts"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Super admins can create new admins
CREATE POLICY "Super admins can create new admins"
  ON public.admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Users can update their own profile, super admins can update anyone
CREATE POLICY "Admins can update profiles"
  ON public.admins
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  )
  WITH CHECK (
    id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Only super admins can delete admins
CREATE POLICY "Super admins can delete admins"
  ON public.admins
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Update the helper functions to be more permissive
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = user_id AND is_active = true
  ) INTO admin_exists;
  
  RETURN admin_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON public.admins TO authenticated;
GRANT INSERT ON public.admins TO authenticated;
GRANT UPDATE ON public.admins TO authenticated;
GRANT DELETE ON public.admins TO authenticated;

-- Function to get admin profile (bypasses RLS)
CREATE OR REPLACE FUNCTION get_admin_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  profile_pic_url TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.full_name,
    a.role,
    a.is_active,
    a.profile_pic_url,
    a.last_login_at,
    a.permissions
  FROM public.admins a
  WHERE a.id = user_id AND a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION get_admin_profile IS 'Securely retrieves admin profile, bypassing RLS';

-- Function to update admin last login
CREATE OR REPLACE FUNCTION update_admin_last_login(admin_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.admins
  SET last_login_at = NOW()
  WHERE id = admin_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_admin_last_login IS 'Updates admin last login timestamp, bypassing RLS';
