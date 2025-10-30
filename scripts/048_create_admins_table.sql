-- Create admins table for platform administrators
-- This table stores admin user information separate from customers and businesses

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  profile_pic_url TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB DEFAULT '{"can_approve_businesses": true, "can_manage_users": true, "can_view_analytics": true}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins(is_active);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins table
-- Only admins can read admin data
CREATE POLICY "Admins can view all admin accounts"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Only super admins can insert new admins
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

-- Admins can update their own profile, super admins can update anyone
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admins_updated_at();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = user_id AND role = 'super_admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role
  FROM public.admins
  WHERE id = user_id AND is_active = true;
  
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.admins IS 'Platform administrators with various permission levels';
COMMENT ON COLUMN public.admins.role IS 'Admin role: super_admin (full access), admin (standard access), moderator (limited access)';
COMMENT ON COLUMN public.admins.permissions IS 'JSON object containing granular permissions for the admin';
COMMENT ON FUNCTION is_admin IS 'Returns true if the given user ID is an active admin';
COMMENT ON FUNCTION is_super_admin IS 'Returns true if the given user ID is an active super admin';
COMMENT ON FUNCTION get_admin_role IS 'Returns the role of the admin user';
