-- ============================================
-- Enhance Notifications System
-- ============================================
-- This migration adds automatic notifications for:
-- 1. Points transactions (receipt processing)
-- 2. New rewards added by businesses
-- 3. New deals added by businesses
-- ============================================

-- Add metadata column to notifications table for storing additional data
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index on metadata for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON public.notifications USING GIN (metadata);

-- Update comments
COMMENT ON COLUMN public.notifications.metadata IS 'Additional metadata (business_id, amount, etc.) in JSON format';

-- ============================================
-- TRIGGER 1: Points Transaction Notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_points_transaction()
RETURNS TRIGGER AS $$
DECLARE
    customer_user_id UUID;
    business_name TEXT;
BEGIN
    -- Get customer's user_id
    SELECT user_id INTO customer_user_id
    FROM public.customers
    WHERE id = NEW.customer_id;
    
    -- Get business name
    SELECT business_name INTO business_name
    FROM public.businesses
    WHERE id = NEW.business_id;
    
    -- Insert notification for customer
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
        customer_user_id,
        '🎉 Points Earned!',
        'You earned ' || NEW.points_earned || ' points from ' || COALESCE(business_name, 'a business') || ' (₱' || NEW.amount_spent || ')',
        'points_earned',
        jsonb_build_object(
            'business_id', NEW.business_id,
            'transaction_id', NEW.id,
            'points_earned', NEW.points_earned,
            'amount_spent', NEW.amount_spent
        )
    );
    
    RAISE NOTICE 'Points transaction notification created for customer %', NEW.customer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_points_transaction ON public.points_transactions;

-- Create trigger on points_transactions
CREATE TRIGGER trigger_notify_points_transaction
    AFTER INSERT ON public.points_transactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_points_transaction();

COMMENT ON TRIGGER trigger_notify_points_transaction ON public.points_transactions IS 'Automatically creates notification when customer earns points';

-- ============================================
-- TRIGGER 2: New Reward Notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_reward()
RETURNS TRIGGER AS $$
DECLARE
    business_name TEXT;
    customer_record RECORD;
BEGIN
    -- Get business name
    SELECT business_name INTO business_name
    FROM public.businesses
    WHERE id = NEW.business_id;
    
    -- Notify all customers who have points at this business
    FOR customer_record IN
        SELECT DISTINCT c.user_id, c.id as customer_id, c.total_points
        FROM public.customers c
        INNER JOIN public.points_transactions pt ON c.id = pt.customer_id
        WHERE pt.business_id = NEW.business_id
        AND c.total_points >= NEW.points_required  -- Only notify customers who can afford it
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type, metadata)
        VALUES (
            customer_record.user_id,
            '🎁 New Reward Available!',
            COALESCE(business_name, 'A business') || ' added a new reward: ' || NEW.name || ' (' || NEW.points_required || ' points)',
            'new_reward',
            jsonb_build_object(
                'business_id', NEW.business_id,
                'reward_id', NEW.id,
                'reward_name', NEW.name,
                'points_required', NEW.points_required
            )
        );
    END LOOP;
    
    RAISE NOTICE 'New reward notification created for reward %', NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_new_reward ON public.rewards;

-- Create trigger on rewards
CREATE TRIGGER trigger_notify_new_reward
    AFTER INSERT ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_reward();

COMMENT ON TRIGGER trigger_notify_new_reward ON public.rewards IS 'Automatically notifies eligible customers when new reward is added';

-- ============================================
-- TRIGGER 3: New Deal Notification
-- ============================================
CREATE OR REPLACE FUNCTION notify_new_deal()
RETURNS TRIGGER AS $$
DECLARE
    business_name TEXT;
    customer_record RECORD;
BEGIN
    -- Only notify for active deals
    IF NEW.is_active = true THEN
        -- Get business name
        SELECT business_name INTO business_name
        FROM public.businesses
        WHERE id = NEW.business_id;
        
        -- Notify all customers who have interacted with this business
        FOR customer_record IN
            SELECT DISTINCT c.user_id, c.id as customer_id
            FROM public.customers c
            INNER JOIN public.points_transactions pt ON c.id = pt.customer_id
            WHERE pt.business_id = NEW.business_id
        LOOP
            INSERT INTO public.notifications (user_id, title, message, type, metadata)
            VALUES (
                customer_record.user_id,
                '💰 New Deal Available!',
                COALESCE(business_name, 'A business') || ' has a new deal: ' || NEW.title || ' - ' || COALESCE(NEW.discount_percentage::text || '% off', NEW.discount_amount::text || ' off'),
                'new_deal',
                jsonb_build_object(
                    'business_id', NEW.business_id,
                    'deal_id', NEW.id,
                    'deal_title', NEW.title,
                    'discount_percentage', NEW.discount_percentage,
                    'discount_amount', NEW.discount_amount
                )
            );
        END LOOP;
        
        RAISE NOTICE 'New deal notification created for deal %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_new_deal ON public.deals;

-- Create trigger on deals
CREATE TRIGGER trigger_notify_new_deal
    AFTER INSERT ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_deal();

COMMENT ON TRIGGER trigger_notify_new_deal ON public.deals IS 'Automatically notifies customers when new deal is added';

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Notification enhancements completed successfully!';
    RAISE NOTICE '   - Points transaction notifications enabled';
    RAISE NOTICE '   - New reward notifications enabled';
    RAISE NOTICE '   - New deal notifications enabled';
END $$;
