# Data Reset Guide

This guide explains how to reset your Giya loyalty app database for fresh testing.

## Available Reset Scripts

### 1. Pre-Reset Database Check (`pre_reset_database_check.sql`)
- Shows current state of database before resetting
- Displays customer points, transaction counts, and discrepancies
- Safe to run - doesn't modify any data

### 2. Reset Customer Data (`reset_customer_data.sql`)
- Deletes all points transactions and redemptions
- Resets customer total_points to 0
- Preserves customer accounts and business data
- Deletes affiliate conversions

### 3. Reset Points Data Only (`reset_points_data_only.sql`)
- Clears only points-related data (transactions and redemptions)
- Resets customer total_points to 0
- More conservative reset option

### 4. Reset and Seed Test Data (`reset_and_seed_test_data.sql`)
- Clears all points data
- Includes commented template for adding sample data
- Good for consistent testing environment

## How to Use

### Step 1: Check Current State
Before resetting, run the pre-reset check to see the current state:
```sql
\i scripts/pre_reset_database_check.sql
```

### Step 2: Choose and Run Reset Script
Choose the appropriate reset script for your needs:

For a complete reset of points data:
```sql
\i scripts/reset_customer_data.sql
```

For a more conservative reset:
```sql
\i scripts/reset_points_data_only.sql
```

### Step 3: Verify Reset
Run the pre-reset check again to verify the reset:
```sql
\i scripts/pre_reset_database_check.sql
```

You should see:
- 0 points transactions
- 0 redemptions
- 0 customers with points
- 0 affiliate conversions

## Adding Sample Data (Optional)

To add sample data for testing, uncomment and modify the INSERT statements in `reset_and_seed_test_data.sql` with actual UUIDs from your database.

## Important Notes

1. **Backup First**: Always backup your database before running reset scripts
2. **Test Environment**: Only run these scripts in a test/development environment
3. **UUIDs**: Replace placeholder UUIDs with actual IDs from your database
4. **Verification**: Always verify the reset worked by checking the database state
5. **Triggers**: Database triggers will automatically update total_points when you add new transactions

## After Reset

After resetting, you can:
1. Create new transactions through the business dashboard
2. Test point accumulation
3. Test reward redemptions
4. Verify points calculations are working correctly