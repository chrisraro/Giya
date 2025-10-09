# Giya App - Reward Redemption Troubleshooting Guide

This guide documents the issues identified and resolved in the Giya app's reward redemption system.

## Issues Identified

1. **Database Schema Inconsistencies**: Two separate tables (`redemptions` and `reward_redemptions`) were being used for similar purposes
2. **Point Deduction Not Working**: Customer points were not being properly deducted when rewards were redeemed
3. **QR Code Scanning Issues**: Businesses couldn't properly scan customer redemption QR codes
4. **Incorrect Redemption History Display**: Customer dashboard wasn't showing redemption history correctly
5. **Data Synchronization Problems**: Frontend and backend were not properly synchronized

## Fixes Implemented

### 1. Database Schema Unification

Created a new SQL script [008_fix_redemptions_schema.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/008_fix_redemptions_schema.sql) that:
- Drops the separate `reward_redemptions` table
- Updates the existing `redemptions` table with all necessary columns
- Fixes Row Level Security (RLS) policies
- Updates the point deduction function to work with the unified schema

### 2. Point Deduction Mechanism

Updated the `deduct_points_on_redemption` function in the database:
- Properly retrieves reward points from the rewards table
- Deducts points from the customer's total_points field
- Ensures the deduction happens when a redemption record is created

### 3. QR Code Scanning Functionality

Updated the business validation flow in [app/dashboard/business/validate-redemption/page.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard/business/validate-redemption/page.tsx):
- Fixed database queries to use the unified `redemptions` table
- Ensured proper validation of QR codes
- Updated status updates to work with the correct table

### 4. Redemption History Display

Fixed the customer dashboard in [app/dashboard/customer/page.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/page.tsx):
- Updated queries to fetch redemption data from the correct table
- Changed filter from `user_id` to `customer_id` for proper data retrieval

### 5. Frontend-Backend Synchronization

Updated all frontend components to use the unified `redemptions` table:
- Customer rewards page ([app/dashboard/customer/rewards/page.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/rewards/page.tsx))
- Business validation page ([app/dashboard/business/validate-redemption/page.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard/business/validate-redemption/page.tsx))
- Customer dashboard ([app/dashboard/customer/page.tsx](file:///c%3A/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/page.tsx))

## How to Apply Fixes

1. Run the SQL script [008_fix_redemptions_schema.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/008_fix_redemptions_schema.sql) in your Supabase SQL editor
2. Deploy the updated frontend code
3. Test the reward redemption flow:
   - Customer selects a reward and confirms redemption
   - Customer points should be deducted immediately
   - Customer receives a QR code for the redemption
   - Business scans the QR code
   - Business validates the redemption
   - Status updates correctly in both dashboards

## Testing the Fix

1. **Customer Side**:
   - Log in as a customer
   - Navigate to Rewards page
   - Select a reward you have enough points for
   - Confirm redemption
   - Verify points are deducted from your total
   - Verify QR code is generated
   - Check redemption history in dashboard

2. **Business Side**:
   - Log in as a business
   - Navigate to Validate Redemption page
   - Scan the customer's redemption QR code
   - Validate the redemption
   - Verify the redemption status updates
   - Check that the redemption appears in transaction history

## Common Issues and Troubleshooting

### Points Not Deducting

1. Check that the `deduct_points_on_redemption` function exists in Supabase
2. Verify that the trigger is active on the `redemptions` table
3. Check the function logic to ensure it's properly retrieving reward points

### QR Code Not Scanning

1. Verify that the QR code contains the correct redemption ID
2. Check that the redemption record exists in the database
3. Ensure the business is associated with the correct business_id
4. Make sure the business is using the "Validate Redemptions" page (newly added button in dashboard)

### Redemption History Not Showing

1. Check that queries are using `customer_id` rather than `user_id`
2. Verify that the redemption status is properly set
3. Confirm RLS policies allow customers to view their own redemptions
4. Ensure the database includes business information with redemptions (apply script [017_update_customer_redemption_query.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/017_update_customer_redemption_query.sql))

### Database Errors

1. Ensure all SQL scripts have been run in the correct order
2. Check that foreign key relationships are properly established
3. Verify that all required columns exist in the tables

### Missing Navigation to Validate Redemptions

1. Verify the business dashboard has the "Validate Redemptions" button
2. Check that the button correctly links to `/dashboard/business/validate-redemption`
3. Ensure the validation page loads the QR scanner component properly

### Missing or Poor Feedback Notifications

1. Check that toast notifications are implemented in both customer rewards and business validation flows
2. Verify that notifications include meaningful information about the action performed
3. Ensure notifications remain visible for an appropriate duration

## Additional Notes

- All fixes maintain backward compatibility with existing data
- The unified schema approach simplifies future development
- Point deductions now happen automatically through database triggers
- QR code validation is more robust with better error handling

This troubleshooting guide should resolve all issues with the reward redemption system in the Giya app.