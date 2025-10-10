# Row Level Security Policies for Discount and Exclusive Offers Tables

## Overview
This document outlines the Row Level Security (RLS) policies implemented for the newly added discount and exclusive offers tables. These policies ensure that data access is properly controlled based on user roles and relationships.

## Tables with RLS Policies

### 1. discount_offers
Stores discount offers created by businesses for their customers.

### 2. discount_usage
Tracks when customers use discount offers.

### 3. exclusive_offers
Stores exclusive product offers created by businesses.

### 4. exclusive_offer_usage
Tracks when customers view exclusive offers.

## RLS Policies

### discount_offers Table Policies

1. **Businesses can view their own discount offers**
   - Allows businesses to see only their own discount offers
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

2. **Businesses can create their own discount offers**
   - Allows businesses to create discount offers for themselves
   - Check clause: `business_id in (select id from public.businesses where id = auth.uid())`

3. **Businesses can update their own discount offers**
   - Allows businesses to modify their own discount offers
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

4. **Businesses can delete their own discount offers**
   - Allows businesses to remove their own discount offers
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

5. **Customers can view active discount offers from businesses they've interacted with**
   - Allows customers to see active discount offers from businesses they've made transactions with
   - Using clause: 
     ```
     is_active = true 
     and valid_from <= now() 
     and (valid_until is null or valid_until >= now())
     and business_id in (
       select distinct business_id 
       from public.points_transactions 
       where customer_id = auth.uid()
     )
     ```

6. **Anyone can view active discount offers**
   - Allows anyone to see active discount offers (public visibility)
   - Using clause:
     ```
     is_active = true 
     and valid_from <= now() 
     and (valid_until is null or valid_until >= now())
     ```

### discount_usage Table Policies

1. **Customers can view their own discount usage**
   - Allows customers to see their own discount usage history
   - Using clause: `customer_id = auth.uid()`

2. **Businesses can view discount usage for their offers**
   - Allows businesses to see how their discount offers are being used
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

3. **System can insert discount usage**
   - Allows the system to record discount usage
   - Check clause: `true` (no restrictions)

### exclusive_offers Table Policies

1. **Businesses can view their own exclusive offers**
   - Allows businesses to see only their own exclusive offers
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

2. **Businesses can create their own exclusive offers**
   - Allows businesses to create exclusive offers for themselves
   - Check clause: `business_id in (select id from public.businesses where id = auth.uid())`

3. **Businesses can update their own exclusive offers**
   - Allows businesses to modify their own exclusive offers
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

4. **Businesses can delete their own exclusive offers**
   - Allows businesses to remove their own exclusive offers
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

5. **Customers can view active exclusive offers from businesses they've interacted with**
   - Allows customers to see active exclusive offers from businesses they've made transactions with
   - Using clause:
     ```
     is_active = true 
     and valid_from <= now() 
     and (valid_until is null or valid_until >= now())
     and business_id in (
       select distinct business_id 
       from public.points_transactions 
       where customer_id = auth.uid()
     )
     ```

6. **Anyone can view active exclusive offers**
   - Allows anyone to see active exclusive offers (public visibility)
   - Using clause:
     ```
     is_active = true 
     and valid_from <= now() 
     and (valid_until is null or valid_until >= now())
     ```

### exclusive_offer_usage Table Policies

1. **Customers can view their own exclusive offer usage**
   - Allows customers to see their own exclusive offer usage history
   - Using clause: `customer_id = auth.uid()`

2. **Businesses can view exclusive offer usage for their offers**
   - Allows businesses to see how their exclusive offers are being viewed
   - Using clause: `business_id in (select id from public.businesses where id = auth.uid())`

3. **System can insert exclusive offer usage**
   - Allows the system to record exclusive offer usage
   - Check clause: `true` (no restrictions)

## Implementation

To implement these RLS policies:

1. Run the SQL script: `scripts/029_enable_rls_for_discount_and_exclusive_offers.sql`
2. Optionally run the verification functions script: `scripts/030_create_rls_verification_functions.sql`
3. Use the verification script: `check_rls_policies_extended.js` to confirm policies are correctly applied

## Verification

You can verify that RLS is working correctly by:

1. Running the `check_rls_policies_extended.js` script
2. Checking that each table has RLS enabled
3. Confirming that all policies are present for each table
4. Testing access controls manually through the application

## Security Notes

1. All tables have RLS enabled
2. Businesses can only access their own data
3. Customers can only access their own usage data
4. Public access is limited to active offers only
5. System-level inserts are allowed for usage tracking
6. Data isolation is maintained between different user roles