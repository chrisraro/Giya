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

## Common Issues and Solutions

### Points Not Deducting
- Ensure the `deduct_points_on_redemption` function is properly created
- Check that the trigger is active on the `redemptions` table
- Verify the customer has sufficient points before redemption

### QR Code Not Scanning
- Ensure the business is scanning the correct QR code
- Check that the redemption record exists in the database
- Verify the business is associated with the correct business_id

### Redemption History Not Showing
- Ensure queries are using `customer_id` rather than `user_id`
- Check that the redemption status is properly set
- Verify RLS policies allow customers to view their own redemptions

## Additional Notes

- All fixes maintain backward compatibility with existing data
- The unified schema approach simplifies future development
- Point deductions now happen automatically through database triggers
- QR code validation is more robust with better error handling

This troubleshooting guide should resolve all issues with the reward redemption system in the Giya app.