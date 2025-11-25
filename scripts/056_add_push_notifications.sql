-- Add FCM token field to customers table for push notifications
-- Run this migration after setting up Firebase Cloud Messaging

-- Add fcm_token column to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_fcm_token 
ON customers(fcm_token) 
WHERE fcm_token IS NOT NULL;

-- Add notification preferences column (JSONB for flexibility)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "receipt_processed": true,
  "points_awarded": true,
  "reward_available": true,
  "deals_nearby": true,
  "weekly_digest": false
}'::jsonb;

-- Create notifications log table
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications log
CREATE INDEX IF NOT EXISTS idx_notifications_log_user_id 
ON notifications_log(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_log_type 
ON notifications_log(notification_type, sent_at DESC);

-- Enable RLS on notifications_log
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications_log
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy: System can insert notifications
CREATE POLICY "System can insert notifications"
ON notifications_log
FOR INSERT
WITH CHECK (true);

-- RLS policy: Users can update their own notification read status
CREATE POLICY "Users can update own notifications"
ON notifications_log
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Comment on columns
COMMENT ON COLUMN customers.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN customers.notification_preferences IS 'User notification preferences for different notification types';
COMMENT ON TABLE notifications_log IS 'Log of all notifications sent to users';
