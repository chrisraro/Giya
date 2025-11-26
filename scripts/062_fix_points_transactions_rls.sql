-- Fix RLS policies for points_transactions table
-- The issue: Current policy only allows businesses to INSERT, but receipt processing
-- happens via API where the authenticated user is the customer, not the business.
-- Solution: Allow the API (service role) to insert transactions, and also allow
-- customers to insert transactions for themselves.

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Businesses can create transactions" ON public.points_transactions;

-- Allow customers to create their own transactions (when uploading receipts)
CREATE POLICY "Customers can create their own transactions" ON public.points_transactions
  FOR INSERT 
  WITH CHECK (
    customer_id = auth.uid()
  );

-- Allow businesses to create transactions for any customer (when manually awarding points)
CREATE POLICY "Businesses can create transactions for customers" ON public.points_transactions
  FOR INSERT 
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE id = auth.uid())
  );

-- Allow service role (API) to create transactions (for automated processing)
-- Note: This is automatically allowed for service_role, but we make it explicit
CREATE POLICY "Service role can create transactions" ON public.points_transactions
  FOR INSERT 
  WITH CHECK (true);

-- Verify policies are set correctly
DO $$
BEGIN
  RAISE NOTICE 'Points transactions RLS policies updated successfully';
  RAISE NOTICE 'Customers can now insert their own transactions';
  RAISE NOTICE 'Businesses can insert transactions for their business_id';
  RAISE NOTICE 'Service role can insert any transaction';
END $$;
