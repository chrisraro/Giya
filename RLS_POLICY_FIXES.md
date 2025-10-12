# RLS Policy Issues and Fixes

## Overview

This document describes the RLS (Row Level Security) policy issues identified and the fixes implemented to resolve the 403 Forbidden errors when accessing customer data.

## Issues Identified

### 1. 403 Forbidden Error
- Customers were receiving 403 errors when trying to access their redemption data
- The error was occurring when fetching data from the `redemptions` table
- Similar issues could affect `discount_usage` and `exclusive_offer_usage` tables

### 2. RLS Policy Inconsistencies
- The `redemptions` table had policies that only checked `user_id` initially
- Newer tables (`discount_usage`, `exclusive_offer_usage`) were created with `customer_id` checks
- Migration scripts didn't properly update all RLS policies

### 3. Data Access Patterns
- Customer dashboard was querying using `customer_id` but RLS policies were checking `user_id`
- This mismatch caused the 403 Forbidden errors

## Root Causes

### 1. Schema Evolution
- Original `redemptions` table was created with `user_id` field
- Newer tables were created with `customer_id` field for consistency
- RLS policies weren't updated to reflect both field types

### 2. Migration Incompleteness
- While data was migrated from `user_id` to `customer_id`, RLS policies weren't fully updated
- Some policies still only checked `user_id`

### 3. Query-RLS Mismatch
- Frontend queries were using `customer_id` consistently
- Backend RLS policies weren't aligned with this approach

## Solutions Implemented

### 1. Updated RLS Policies ([scripts/018_fix_redemption_user_data.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/018_fix_redemption_user_data.sql))

#### Redemptions Table
Updated the RLS policy to check all relevant ID fields:
```sql
create policy "Users can view their own redemptions"
  on public.redemptions for select
  using (
    auth.uid() = customer_id or 
    auth.uid() = business_id or
    auth.uid() = validated_by or
    auth.uid() = user_id
  );
```

#### Discount Usage Table
Ensured customers can view their own discount usage:
```sql
create policy "Customers can view their own discount usage"
  on public.discount_usage for select
  using (customer_id = auth.uid());
```

#### Exclusive Offer Usage Table
Ensured customers can view their own exclusive offer usage:
```sql
create policy "Customers can view their own exclusive offer usage"
  on public.exclusive_offer_usage for select
  using (customer_id = auth.uid());
```

### 2. Data Migration ([scripts/018_fix_redemption_user_data.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/018_fix_redemption_user_data.sql))

#### Customer ID Population
Updated redemptions where `customer_id` is null but `user_id` is set:
```sql
update public.redemptions 
set customer_id = user_id
where customer_id is null and user_id is not null;
```

### 3. Dashboard Data Hook ([hooks/use-dashboard-data.ts](file://c:/Users/User/OneDrive/Desktop/giya/hooks/use-dashboard-data.ts))

#### Improved Query Logic
Updated queries to handle both `customer_id` and `user_id` fields:
```typescript
// Query redemptions using both fields
.or(`customer_id.eq.${userId},user_id.eq.${userId}`)
```

## Files Modified

1. [scripts/018_fix_redemption_user_data.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/018_fix_redemption_user_data.sql) - Updated RLS policies and data migration
2. [scripts/002_enable_rls.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/002_enable_rls.sql) - Base RLS policies
3. [scripts/029_enable_rls_for_discount_and_exclusive_offers.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/029_enable_rls_for_discount_and_exclusive_offers.sql) - RLS policies for new tables
4. [hooks/use-dashboard-data.ts](file://c:/Users/User/OneDrive/Desktop/giya/hooks/use-dashboard-data.ts) - Updated query logic

## Testing

To verify the fixes:

1. Run the test script to check RLS policies:
   ```sql
   -- Replace CUSTOMER_ID with actual customer ID
   \set customer_id 'YOUR_CUSTOMER_ID_HERE'
   \i scripts/test_rls_policies.sql
   ```

2. Check that customers can now access their data without 403 errors
3. Verify that all redemption types are properly displayed in the dashboard

## Future Improvements

1. Add automated RLS policy verification tests
2. Implement more granular error handling for RLS-related issues
3. Create admin tools for RLS policy management

## Prevention

To prevent similar issues in the future:

1. Ensure all schema changes include RLS policy updates
2. Maintain consistency in field naming across related tables
3. Implement comprehensive testing for data access patterns
4. Document RLS policy evolution and migration processes