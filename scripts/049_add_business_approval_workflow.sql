-- Add business approval workflow and admin management fields
-- This enables admin oversight and approval process for new businesses

-- Add approval and management columns to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_access_dashboard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_documents JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.admins(id) ON DELETE SET NULL;

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_businesses_approval_status ON public.businesses(approval_status);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON public.businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_approved_by ON public.businesses(approved_by);

-- Update existing businesses to approved status (migration)
UPDATE public.businesses 
SET approval_status = 'approved', 
    is_active = true,
    can_access_dashboard = true,
    approved_at = created_at
WHERE approval_status = 'pending';

-- Function to approve a business
CREATE OR REPLACE FUNCTION approve_business(
  p_business_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin(p_admin_id) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only admins can approve businesses'
    );
  END IF;
  
  -- Update business status
  UPDATE public.businesses
  SET 
    approval_status = 'approved',
    is_active = true,
    can_access_dashboard = true,
    approved_by = p_admin_id,
    approved_at = NOW(),
    last_reviewed_at = NOW(),
    reviewed_by = p_admin_id
  WHERE id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Business not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Business approved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a business
CREATE OR REPLACE FUNCTION reject_business(
  p_business_id UUID,
  p_reason TEXT,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin(p_admin_id) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only admins can reject businesses'
    );
  END IF;
  
  -- Update business status
  UPDATE public.businesses
  SET 
    approval_status = 'rejected',
    is_active = false,
    can_access_dashboard = false,
    rejection_reason = p_reason,
    last_reviewed_at = NOW(),
    reviewed_by = p_admin_id
  WHERE id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Business not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Business rejected'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend a business
CREATE OR REPLACE FUNCTION suspend_business(
  p_business_id UUID,
  p_reason TEXT,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin(p_admin_id) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only admins can suspend businesses'
    );
  END IF;
  
  -- Update business status
  UPDATE public.businesses
  SET 
    approval_status = 'suspended',
    is_active = false,
    can_access_dashboard = false,
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 
                  'SUSPENDED: ' || p_reason || ' (Admin ID: ' || p_admin_id::text || ', Date: ' || NOW()::text || ')',
    last_reviewed_at = NOW(),
    reviewed_by = p_admin_id
  WHERE id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Business not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Business suspended'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate a business
CREATE OR REPLACE FUNCTION reactivate_business(
  p_business_id UUID,
  p_admin_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin(p_admin_id) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only admins can reactivate businesses'
    );
  END IF;
  
  -- Update business status
  UPDATE public.businesses
  SET 
    approval_status = 'approved',
    is_active = true,
    can_access_dashboard = true,
    last_reviewed_at = NOW(),
    reviewed_by = p_admin_id
  WHERE id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Business not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Business reactivated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for businesses to check approval status
-- Businesses can only access their dashboard if approved and active
CREATE POLICY "Businesses must be approved to access dashboard"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() 
    AND approval_status = 'approved' 
    AND is_active = true 
    AND can_access_dashboard = true
  );

-- Add comments
COMMENT ON COLUMN public.businesses.approval_status IS 'Business approval status: pending, approved, rejected, or suspended';
COMMENT ON COLUMN public.businesses.is_active IS 'Whether the business account is currently active';
COMMENT ON COLUMN public.businesses.can_access_dashboard IS 'Whether the business can access their dashboard';
COMMENT ON FUNCTION approve_business IS 'Approve a business account (admin only)';
COMMENT ON FUNCTION reject_business IS 'Reject a business account with reason (admin only)';
COMMENT ON FUNCTION suspend_business IS 'Suspend an active business account (admin only)';
COMMENT ON FUNCTION reactivate_business IS 'Reactivate a suspended business account (admin only)';
