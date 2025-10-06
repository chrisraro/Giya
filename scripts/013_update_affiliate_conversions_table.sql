-- Add points_earned column to affiliate_conversions table if it doesn't exist
ALTER TABLE public.affiliate_conversions
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Ensure the column has the correct default value
ALTER TABLE public.affiliate_conversions
ALTER COLUMN points_earned SET DEFAULT 0;