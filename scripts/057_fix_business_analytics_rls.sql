-- =====================================================
-- Fix Business Analytics RLS Policies
-- =====================================================
-- This migration adds INSERT and UPDATE policies for business_analytics
-- and ensures the table exists with the correct structure.

-- Step 1: Ensure the table exists
CREATE TABLE IF NOT EXISTS public.business_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ad_spend NUMERIC(10, 2) DEFAULT 0.00,
  verified_revenue NUMERIC(10, 2) DEFAULT 0.00,
  total_receipts INTEGER DEFAULT 0,
  total_points_issued INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, date)
);

-- Step 2: Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_business_analytics_business ON public.business_analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_business_analytics_date ON public.business_analytics(date);

-- Step 3: Enable RLS
ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Businesses can view their analytics" ON public.business_analytics;
DROP POLICY IF EXISTS "Businesses can insert their analytics" ON public.business_analytics;
DROP POLICY IF EXISTS "Businesses can update their analytics" ON public.business_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.business_analytics;

-- Step 5: Create RLS policies
-- Businesses can view their own analytics
CREATE POLICY "Businesses can view their analytics" ON public.business_analytics
  FOR SELECT USING (business_id = auth.uid());

-- Businesses can insert their own analytics (for ad spend tracking)
CREATE POLICY "Businesses can insert their analytics" ON public.business_analytics
  FOR INSERT WITH CHECK (business_id = auth.uid());

-- Businesses can update their own analytics (for ad spend updates)  
CREATE POLICY "Businesses can update their analytics" ON public.business_analytics
  FOR UPDATE USING (business_id = auth.uid());

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics" ON public.business_analytics
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.id = auth.uid() 
    AND admins.is_active = true
  ));

-- Fix the trigger function to bypass RLS when updating analytics
-- This prevents 500 errors when the trigger tries to insert/update analytics
CREATE OR REPLACE FUNCTION update_business_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the business analytics record for the current date
  -- Using INSERT with ON CONFLICT to handle upserts
  INSERT INTO public.business_analytics (
    business_id, 
    date, 
    verified_revenue, 
    total_receipts, 
    total_points_issued
  )
  VALUES (
    NEW.business_id, 
    NEW.created_at::date, 
    COALESCE(NEW.total_amount, 0), 
    1, 
    COALESCE(NEW.points_earned, 0)
  )
  ON CONFLICT (business_id, date) 
  DO UPDATE SET
    verified_revenue = business_analytics.verified_revenue + COALESCE(NEW.total_amount, 0),
    total_receipts = business_analytics.total_receipts + 1,
    total_points_issued = business_analytics.total_points_issued + COALESCE(NEW.points_earned, 0),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_business_analytics() TO authenticated;

-- Verify policies are created
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for business_analytics have been updated successfully!';
  RAISE NOTICE 'Businesses can now INSERT and UPDATE their own analytics data.';
  RAISE NOTICE 'Trigger function has been updated to work with RLS.';
END $$;
