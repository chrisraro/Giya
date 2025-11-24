-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'punch_card_completion', 'reward_earned', 'redemption_validated', etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true); -- Allow system to insert notifications for any user

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.notifications IS 'User notifications for various platform events';
COMMENT ON COLUMN public.notifications.user_id IS 'The user this notification is for';
COMMENT ON COLUMN public.notifications.title IS 'Notification title';
COMMENT ON COLUMN public.notifications.message IS 'Notification message content';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification for categorization';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the notification has been read';
COMMENT ON COLUMN public.notifications.read_at IS 'When the notification was marked as read';

-- Update the punch card completion trigger to insert notifications
CREATE OR REPLACE FUNCTION handle_punch_card_completion()
RETURNS TRIGGER AS $$
DECLARE
    customer_name TEXT;
    business_name TEXT;
    punch_card_title TEXT;
BEGIN
  -- Check if the punch card was just completed (is_completed changed from false to true)
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    -- Get customer name
    SELECT full_name INTO customer_name
    FROM public.customers
    WHERE id = NEW.customer_id;
    
    -- Get punch card details
    SELECT pc.title, b.business_name 
    INTO punch_card_title, business_name
    FROM public.punch_cards pc
    JOIN public.businesses b ON pc.business_id = b.id
    WHERE pc.id = NEW.punch_card_id;
    
    -- Insert notification for customer
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.customer_id,
      'Punch Card Completed!',
      'Congratulations ' || COALESCE(customer_name, 'Customer') || '! You completed the "' || COALESCE(punch_card_title, 'punch card') || '" program at ' || COALESCE(business_name, 'Business') || '. Claim your reward now!',
      'punch_card_completion'
    );
    
    -- Optional: Add points to customer when punch card is completed
    -- This is an example - you can customize the reward based on your business logic
    -- UPDATE customers 
    -- SET total_points = total_points + 10  -- Add 10 points for completion
    -- WHERE id = NEW.customer_id;
    
    -- Optional: Update business stats or add any other business logic
    -- For example, track completion in a separate analytics table
    
    RAISE NOTICE 'Punch card completed for customer %', NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';