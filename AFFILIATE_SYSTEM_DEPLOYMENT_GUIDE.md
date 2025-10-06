# Affiliate System Deployment Guide

## Overview
This guide explains how to deploy the affiliate system changes to your Supabase database. The system enables influencers to earn points through referrals and customer transactions.

## Prerequisites
- Access to your Supabase project dashboard
- Supabase SQL Editor access

## Deployment Steps

### Step 1: Add Referral Code Column
1. Open the Supabase SQL Editor
2. Run the script from `scripts/011_add_referral_code_to_customers.sql`:
```sql
-- Add referral_code column to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_referral_code ON public.customers(referral_code);
```

### Step 2: Create Affiliate Tracking Functions
1. In the Supabase SQL Editor, run the script from `scripts/012_affiliate_tracking_functions.sql`
2. This script creates:
   - `track_affiliate_conversion()` function and trigger
   - `award_influencer_points_for_transaction()` function and trigger

## What Each Script Does

### 011_add_referral_code_to_customers.sql
- Adds a `referral_code` column to the `customers` table to store the affiliate link used during signup
- Creates an index on the referral_code column for better query performance

### 012_affiliate_tracking_functions.sql
- Creates a function to track when customers sign up through affiliate links
- Awards 10 points to influencers for each successful referral
- Creates a function to award 1 point to influencers for each transaction made by referred customers
- Sets up triggers to automatically execute these functions

## Verification
After running the scripts, you can verify the changes by:

1. Checking that the `referral_code` column exists in the `customers` table:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'referral_code';
```

2. Verifying that the functions were created:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%affiliate%';
```

3. Confirming that the triggers exist:
```sql
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%affiliate%';
```

## Testing the System
1. Generate an affiliate link from an influencer account
2. Use the link to sign up a new customer
3. Verify that the customer record has the referral_code populated
4. Check that a record was created in the affiliate_conversions table
5. Confirm that the influencer received 10 points
6. Complete a transaction as the referred customer
7. Verify that the influencer received an additional point

## Troubleshooting
If you encounter any issues:

1. Make sure all previous database migrations have been applied
2. Check that the table and column names match your current schema
3. Verify that the Supabase project has the necessary permissions for function creation
4. Ensure that Row Level Security policies don't interfere with the functions