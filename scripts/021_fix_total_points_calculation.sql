-- Fix total points calculation for all customers
-- This script ensures that the total_points field is correctly calculated for all customers

-- 1. First, let's identify customers with discrepancies
CREATE OR REPLACE FUNCTION find_points_discrepancies()
RETURNS TABLE(
    customer_id uuid,
    current_points integer,
    calculated_points integer,
    discrepancy integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as customer_id,
        c.total_points as current_points,
        (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points,
        (c.total_points - (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))) as discrepancy
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    GROUP BY c.id, c.total_points
    HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0));
END;
$$ LANGUAGE plpgsql;

-- 2. Function to recalculate and update total_points for a specific customer
CREATE OR REPLACE FUNCTION recalculate_customer_points(customer_uuid uuid)
RETURNS integer AS $$
DECLARE
    calculated_points integer;
BEGIN
    SELECT (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))
    INTO calculated_points
    FROM customers c
    LEFT JOIN points_transactions pt ON c.id = pt.customer_id
    LEFT JOIN redemptions r ON c.id = r.customer_id
    WHERE c.id = customer_uuid
    GROUP BY c.id;
    
    -- Update the customer's total_points
    UPDATE customers
    SET total_points = calculated_points
    WHERE id = customer_uuid;
    
    RETURN calculated_points;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to recalculate total_points for all customers with discrepancies
CREATE OR REPLACE FUNCTION fix_all_points_discrepancies()
RETURNS integer AS $$
DECLARE
    fixed_count integer := 0;
    customer_record record;
BEGIN
    -- Loop through all customers with discrepancies
    FOR customer_record IN 
        SELECT 
            c.id as customer_id,
            (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0)) as calculated_points
        FROM customers c
        LEFT JOIN points_transactions pt ON c.id = pt.customer_id
        LEFT JOIN redemptions r ON c.id = r.customer_id
        GROUP BY c.id
        HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0))
    LOOP
        -- Update the customer's total_points
        UPDATE customers
        SET total_points = customer_record.calculated_points
        WHERE id = customer_record.customer_id;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Run the fix for all customers
SELECT fix_all_points_discrepancies() as customers_fixed;

-- 5. Verify that there are no more discrepancies
SELECT COUNT(*) as remaining_discrepancies
FROM customers c
LEFT JOIN points_transactions pt ON c.id = pt.customer_id
LEFT JOIN redemptions r ON c.id = r.customer_id
GROUP BY c.id, c.total_points
HAVING c.total_points != (COALESCE(SUM(pt.points_earned), 0) - COALESCE(SUM(r.points_redeemed), 0));

-- 6. Drop the temporary functions (optional)
-- DROP FUNCTION find_points_discrepancies();
-- DROP FUNCTION recalculate_customer_points(uuid);
-- DROP FUNCTION fix_all_points_discrepancies();