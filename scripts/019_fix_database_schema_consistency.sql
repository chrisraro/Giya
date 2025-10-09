-- Fix database schema consistency issues
-- This script ensures that the rewards and redemptions tables have the correct schema

-- 1. Ensure rewards table has the correct column name
DO $$ 
BEGIN
  -- Check if the 'name' column exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'rewards' 
    AND column_name = 'name'
  ) THEN
    -- Check if 'reward_name' column exists
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'rewards' 
      AND column_name = 'reward_name'
    ) THEN
      -- Rename 'name' to 'reward_name'
      ALTER TABLE public.rewards RENAME COLUMN name TO reward_name;
    ELSE
      -- Both columns exist, which is unexpected
      -- We'll keep reward_name and drop name
      ALTER TABLE public.rewards DROP COLUMN name;
    END IF;
  END IF;
END $$;

-- 2. Ensure redemptions table has all required columns
ALTER TABLE public.redemptions 
  ADD COLUMN IF NOT EXISTS reward_id uuid REFERENCES public.rewards(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS points_redeemed integer,
  ADD COLUMN IF NOT EXISTS redemption_qr_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.businesses(id),
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- 3. Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_redemptions_customer ON public.redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_business ON public.redemptions(business_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward ON public.redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_qr ON public.redemptions(redemption_qr_code);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redemptions(status);

-- 4. Update RLS policies for redemptions table
DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Customers can create redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Businesses can update redemptions" ON public.redemptions;

CREATE POLICY "Users can view their own redemptions"
  ON public.redemptions FOR SELECT
  USING (
    auth.uid() = customer_id OR 
    auth.uid() = business_id OR
    auth.uid() = validated_by OR
    auth.uid() = user_id
  );

CREATE POLICY "Customers can create redemptions"
  ON public.redemptions FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = user_id);

CREATE POLICY "Businesses can update redemptions"
  ON public.redemptions FOR UPDATE
  USING (auth.uid() = business_id OR auth.uid() = validated_by);

-- 5. Update the deduct_points_on_redemption function
CREATE OR REPLACE FUNCTION deduct_points_on_redemption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reward_points INTEGER;
BEGIN
  -- Get the points required for the reward
  SELECT points_required INTO reward_points
  FROM public.rewards
  WHERE id = NEW.reward_id;

  -- Set points_redeemed if not already set
  IF NEW.points_redeemed IS NULL THEN
    NEW.points_redeemed := reward_points;
  END IF;

  -- Deduct points from customer
  UPDATE public.customers
  SET total_points = total_points - reward_points
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$;

-- 6. Update trigger to use the redemptions table
DROP TRIGGER IF EXISTS deduct_points_trigger ON public.redemptions;
CREATE TRIGGER deduct_points_trigger
  AFTER INSERT ON public.redemptions
  FOR EACH ROW
  EXECUTE FUNCTION deduct_points_on_redemption();

-- 7. Add a function to update redemption timestamp
CREATE OR REPLACE FUNCTION update_redeemed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.redeemed_at = NOW();
  RETURN NEW;
END;
$$;

-- 8. Create trigger for setting redeemed_at timestamp
DROP TRIGGER IF EXISTS update_redeemed_at_trigger ON public.redemptions;
CREATE TRIGGER update_redeemed_at_trigger
  BEFORE INSERT ON public.redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_redeemed_at();

-- 9. Update existing redemptions to have business_id from the associated reward
UPDATE public.redemptions r
SET business_id = rew.business_id
FROM public.rewards rew
WHERE r.reward_id = rew.id AND r.business_id IS NULL;