-- sync_improvements.sql
-- Database triggers and functions for improved synchronization

-- Create a trigger function that runs when a punch card is completed
CREATE OR REPLACE FUNCTION handle_punch_card_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the punch card was just completed (is_completed changed from false to true)
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    -- Optional: Add points to customer when punch card is completed
    -- This is an example - you can customize the reward based on your business logic
    -- UPDATE customers 
    -- SET total_points = total_points + 10  -- Add 10 points for completion
    -- WHERE id = NEW.customer_id;
    
    -- Optional: Update business stats or add any other business logic
    -- For example, track completion in a separate analytics table
    
    -- You can add a notification or reward here
    RAISE NOTICE 'Punch card completed for customer %', NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger on punch_card_customers table
CREATE TRIGGER trigger_punch_card_completion
  AFTER UPDATE OF is_completed ON punch_card_customers
  FOR EACH ROW
  EXECUTE FUNCTION handle_punch_card_completion();

-- Create a function to sync punch card punches with points transactions
CREATE OR REPLACE FUNCTION sync_punch_with_transaction()
RETURNS TRIGGER AS $$
DECLARE
  business_id_result UUID;
  customer_id_result UUID;
  punches_count_result INTEGER;
  punches_required_result INTEGER;
  current_is_completed BOOLEAN;
BEGIN
  -- Get the associated transaction data if available
  IF NEW.transaction_id IS NOT NULL THEN
    SELECT business_id, customer_id 
    INTO business_id_result, customer_id_result
    FROM points_transactions 
    WHERE id = NEW.transaction_id;
  END IF;

  -- If this punch is associated with a transaction, get the punch card info
  IF business_id_result IS NOT NULL AND customer_id_result IS NOT NULL THEN
    -- Get punch card details and customer's current status
    SELECT pcc.punches_count, pc.punches_required, pcc.is_completed
    INTO punches_count_result, punches_required_result, current_is_completed
    FROM punch_card_customers pcc
    JOIN punch_cards pc ON pc.id = pcc.punch_card_id
    WHERE pcc.id = NEW.punch_card_customer_id;

    -- Check if this made the card complete
    IF punches_count_result >= punches_required_result AND current_is_completed = false THEN
      -- Update the punch card customer as completed
      UPDATE punch_card_customers 
      SET is_completed = true, completed_at = NOW()
      WHERE id = NEW.punch_card_customer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger on punch_card_punches table
CREATE TRIGGER trigger_sync_punch_with_transaction
  AFTER INSERT ON punch_card_punches
  FOR EACH ROW
  EXECUTE FUNCTION sync_punch_with_transaction();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_punch_card_customers_completion ON punch_card_customers(is_completed, punch_card_id);
CREATE INDEX IF NOT EXISTS idx_punch_card_punches_customer_id ON punch_card_punches(customer_id);
CREATE INDEX IF NOT EXISTS idx_punch_cards_business_id ON punch_cards(business_id);

-- Function to update customer's total punch cards completed (for analytics)
CREATE OR REPLACE FUNCTION update_customer_punch_card_stats()
RETURNS TRIGGER AS $$
DECLARE
  completed_count INTEGER;
BEGIN
  -- Count completed punch cards for the customer
  SELECT COUNT(*) INTO completed_count
  FROM punch_card_customers
  WHERE customer_id = NEW.customer_id AND is_completed = true;

  -- Optionally update a statistic in the customers table
  -- UPDATE customers 
  -- SET punch_cards_completed = completed_count
  -- WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update customer stats when punch card status changes
CREATE TRIGGER trigger_update_customer_punch_card_stats
  AFTER UPDATE OF is_completed ON punch_card_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_punch_card_stats();

-- Function to ensure data consistency between punches and customer status
CREATE OR REPLACE FUNCTION verify_punch_card_consistency()
RETURNS TRIGGER AS $$
DECLARE
  expected_punches INTEGER;
  required_punches INTEGER;
BEGIN
  -- Get the required punches for this card
  SELECT punches_required INTO required_punches
  FROM punch_cards pc
  JOIN punch_card_customers pcc ON pc.id = pcc.punch_card_id
  WHERE pcc.id = NEW.punch_card_customer_id;

  -- Check if the customer has enough punches to be considered completed
  IF NEW.punches_count >= required_punches AND NEW.is_completed = false THEN
    -- Automatically mark as completed
    UPDATE punch_card_customers
    SET is_completed = true, completed_at = NOW()
    WHERE id = NEW.punch_card_customer_id;
  ELSIF NEW.punches_count < required_punches AND NEW.is_completed = true THEN
    -- If they don't have enough punches but are marked as completed, mark as not completed
    UPDATE punch_card_customers
    SET is_completed = false, completed_at = NULL
    WHERE id = NEW.punch_card_customer_id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to verify consistency when punch card customer record is updated
CREATE TRIGGER trigger_verify_punch_card_consistency
  AFTER UPDATE ON punch_card_customers
  FOR EACH ROW
  EXECUTE FUNCTION verify_punch_card_consistency();