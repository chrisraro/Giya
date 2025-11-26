-- ============================================
-- Fix Notification Triggers
-- ============================================
-- This fixes the notification trigger to handle null user_id cases

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_notify_points_transaction ON public.points_transactions;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION notify_points_transaction()
RETURNS TRIGGER AS $$
DECLARE
    customer_user_id UUID;
    business_name TEXT;
BEGIN
    -- Get customer's user_id (with null check)
    SELECT user_id INTO customer_user_id
    FROM public.customers
    WHERE id = NEW.customer_id;
    
    -- Only proceed if customer_user_id exists
    IF customer_user_id IS NULL THEN
        RAISE WARNING 'Customer user_id not found for customer_id: %', NEW.customer_id;
        RETURN NEW;
    END IF;
    
    -- Get business name
    SELECT business_name INTO business_name
    FROM public.businesses
    WHERE id = NEW.business_id;
    
    -- Insert notification for customer
    BEGIN
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
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to create notification: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_notify_points_transaction
    AFTER INSERT ON public.points_transactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_points_transaction();

COMMENT ON TRIGGER trigger_notify_points_transaction ON public.points_transactions IS 'Automatically creates notification when customer earns points (with error handling)';

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Notification trigger fixed!';
    RAISE NOTICE '   - Added null checks for customer user_id';
    RAISE NOTICE '   - Added exception handling';
END $$;
