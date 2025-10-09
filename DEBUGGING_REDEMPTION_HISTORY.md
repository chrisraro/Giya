# Debugging Redemption History Issues

This document outlines the steps to debug and fix issues with the redemption history display in the Giya loyalty app.

## Current Status

The redemption history is not displaying properly in the customer dashboard. The database script to fix missing business_id data ran successfully (showed 0 missing records), but the application is still encountering errors.

## Debugging Steps

### 1. Database Schema Verification

Run the following scripts in Supabase to verify the database structure:

1. `check_redemption_relationships.sql` - Check foreign key relationships
2. `check_redemptions_columns.sql` - Check table columns
3. `check_foreign_key_constraints.sql` - Check constraint details

### 2. Data Integrity Verification

Run these scripts to verify data integrity:

1. `check_businesses_data.sql` - Check businesses table
2. `check_rewards_data.sql` - Check rewards table
3. `test_simple_redemption_query.sql` - Test basic queries

### 3. Query Testing

Run these scripts to test different query approaches:

1. `test_redemption_query_detailed.sql` - Detailed query testing
2. `test_redemption_query.sql` - Basic redemption query

### 4. Application Debugging

The customer dashboard now includes enhanced logging to help identify issues:

1. Added console.log statements to track query execution
2. Added fallback queries with manual business data fetching
3. Added proper error handling and logging

### 5. Test Page

A test page has been created at `/test-redemption-query` to isolate and debug the issue:

1. Tests simple redemption queries
2. Tests joins with rewards table
3. Tests joins with businesses table
4. Tests the full query used in the dashboard

## Common Issues and Solutions

### Foreign Key Relationship Issues

If the businesses join is failing, it might be due to:
1. Missing foreign key constraints
2. Incorrect constraint names
3. Data integrity issues

### Query Syntax Issues

Supabase's nested select syntax can be tricky:
1. Ensure proper indentation
2. Use `!inner` modifier when inner joins are needed
3. Check for typos in column names

### Data Issues

Missing or null data can cause joins to fail:
1. Verify all redemptions have valid business_id values
2. Verify all businesses have required fields
3. Check for data consistency issues

## Next Steps

1. Run all verification scripts in Supabase
2. Access the test page at `/test-redemption-query` to see detailed results
3. Check browser console for error messages
4. Review the enhanced logging in the customer dashboard
5. Apply fixes based on the test results

## Verification

After implementing fixes, verify that:

1. Redemption history displays correctly in the customer dashboard
2. Business names appear for each redemption
3. Reward names and points are displayed properly
4. Status badges show correctly
5. No errors appear in the browser console