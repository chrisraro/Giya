-- Add scheduling features to deals table
-- This enables Happy Hour deals, weekly recurring deals, and combined time/day restrictions

-- Add scheduling columns to deals table
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS schedule_type TEXT DEFAULT 'always_available' 
  CHECK (schedule_type IN ('always_available', 'time_based', 'day_based', 'time_and_day'));

-- Time-of-day restrictions (for Happy Hour deals)
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Day-of-week restrictions (0 = Sunday, 6 = Saturday)
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS active_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}';

-- Add comments for clarity
COMMENT ON COLUMN public.deals.schedule_type IS 'Scheduling type: always_available, time_based, day_based, or time_and_day';
COMMENT ON COLUMN public.deals.start_time IS 'Start time for time-based deals (e.g., 14:00 for 2pm)';
COMMENT ON COLUMN public.deals.end_time IS 'End time for time-based deals (e.g., 17:00 for 5pm)';
COMMENT ON COLUMN public.deals.active_days IS 'Array of active days (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)';

-- Add constraint to ensure time-based deals have valid times
ALTER TABLE public.deals
ADD CONSTRAINT valid_time_based_schedule CHECK (
  schedule_type NOT IN ('time_based', 'time_and_day') OR 
  (start_time IS NOT NULL AND end_time IS NOT NULL)
);

-- Add constraint to ensure day-based deals have valid days
ALTER TABLE public.deals
ADD CONSTRAINT valid_day_based_schedule CHECK (
  schedule_type NOT IN ('day_based', 'time_and_day') OR 
  (active_days IS NOT NULL AND array_length(active_days, 1) > 0)
);

-- Create index for schedule queries
CREATE INDEX IF NOT EXISTS idx_deals_schedule_type ON public.deals(schedule_type);

-- Function to check if a deal is currently active based on schedule
CREATE OR REPLACE FUNCTION is_deal_currently_active(
  p_deal_id UUID,
  p_check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deal RECORD;
  v_current_time TIME;
  v_current_day INTEGER;
  v_is_active BOOLEAN;
BEGIN
  -- Get deal details
  SELECT 
    schedule_type,
    start_time,
    end_time,
    active_days,
    is_active,
    validity_start,
    validity_end
  INTO v_deal
  FROM public.deals
  WHERE id = p_deal_id;
  
  -- Deal doesn't exist
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if deal is marked as active
  IF NOT v_deal.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check validity period
  IF v_deal.validity_start IS NOT NULL AND p_check_timestamp < v_deal.validity_start THEN
    RETURN FALSE;
  END IF;
  
  IF v_deal.validity_end IS NOT NULL AND p_check_timestamp > v_deal.validity_end THEN
    RETURN FALSE;
  END IF;
  
  -- Get current time and day at the check timestamp
  v_current_time := p_check_timestamp::TIME;
  v_current_day := EXTRACT(DOW FROM p_check_timestamp)::INTEGER; -- 0=Sunday, 6=Saturday
  
  -- Check schedule type
  CASE v_deal.schedule_type
    WHEN 'always_available' THEN
      v_is_active := TRUE;
      
    WHEN 'time_based' THEN
      -- Check if current time is within the specified time range
      IF v_deal.start_time <= v_deal.end_time THEN
        -- Normal case: e.g., 14:00 to 17:00
        v_is_active := v_current_time >= v_deal.start_time AND v_current_time <= v_deal.end_time;
      ELSE
        -- Overnight case: e.g., 22:00 to 02:00
        v_is_active := v_current_time >= v_deal.start_time OR v_current_time <= v_deal.end_time;
      END IF;
      
    WHEN 'day_based' THEN
      -- Check if current day is in the active days array
      v_is_active := v_current_day = ANY(v_deal.active_days);
      
    WHEN 'time_and_day' THEN
      -- Check both time and day restrictions
      -- First check day
      IF v_current_day = ANY(v_deal.active_days) THEN
        -- Then check time
        IF v_deal.start_time <= v_deal.end_time THEN
          v_is_active := v_current_time >= v_deal.start_time AND v_current_time <= v_deal.end_time;
        ELSE
          v_is_active := v_current_time >= v_deal.start_time OR v_current_time <= v_deal.end_time;
        END IF;
      ELSE
        v_is_active := FALSE;
      END IF;
      
    ELSE
      v_is_active := FALSE;
  END CASE;
  
  RETURN v_is_active;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a view for currently active deals
CREATE OR REPLACE VIEW public.active_deals_now AS
SELECT 
  d.*,
  is_deal_currently_active(d.id) AS is_currently_active
FROM public.deals d
WHERE d.is_active = true;

-- Comment on function
COMMENT ON FUNCTION is_deal_currently_active IS 'Checks if a deal is currently active based on schedule type, time, and day restrictions';
