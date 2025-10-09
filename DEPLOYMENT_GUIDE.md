# Giya App - Deployment Guide

This guide explains how to deploy the updated Giya app to production with all the recent fixes.

## Prerequisites

1. Supabase project with database access
2. GitHub repository connected to Vercel
3. Vercel account with project configured
4. Environment variables configured in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Updates

Before deploying the frontend code, you need to update your Supabase database schema.

### Run Database Scripts in Order

1. Make sure you've already run scripts 001-007 during initial setup
2. Run the new script [008_fix_redemptions_schema.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/008_fix_redemptions_schema.sql) in your Supabase SQL editor:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of [008_fix_redemptions_schema.sql](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/008_fix_redemptions_schema.sql)
   - Run the script

This script will:
- Drop the separate `reward_redemptions` table
- Update the existing `redemptions` table with all necessary columns
- Fix Row Level Security (RLS) policies
- Update the point deduction function to work with the unified schema

## Code Deployment

### 1. Commit and Push Changes

```bash
git add .
git commit -m "Fix reward redemption issues and update database schema"
git push origin main
```

### 2. Vercel Deployment

If you have continuous deployment set up:
- The push to GitHub will automatically trigger a Vercel deployment

If you need to manually deploy:
1. Go to your Vercel dashboard
2. Select your Giya project
3. Click "Deployments"
4. Click "Create Deployment"
5. Select the latest commit or upload the code manually

### 3. Environment Variables

Ensure these environment variables are set in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

## Post-Deployment Verification

After deployment, verify that the fixes work correctly:

1. **Test Reward Redemption**:
   - Log in as a customer
   - Navigate to Rewards page
   - Select a reward and confirm redemption
   - Verify points are deducted from your total
   - Verify QR code is generated

2. **Test QR Code Scanning**:
   - Log in as a business
   - Navigate to Validate Redemption page (now accessible via the new button in dashboard)
   - Scan the customer's redemption QR code
   - Validate the redemption
   - Verify the redemption status updates

3. **Check Redemption History**:
   - As a customer, check that redemptions appear in your history with business information
   - As a business, check that validated redemptions appear in your records

## Troubleshooting

If you encounter issues after deployment:

1. **Check Vercel Logs**:
   - Go to your Vercel project dashboard
   - Check the deployment logs for any errors

2. **Verify Database Schema**:
   - Check that script 008 was executed successfully
   - Verify that script 018 was executed to fix existing data
   - Verify that the `redemptions` table has all the required columns

3. **Check Environment Variables**:
   - Ensure all required environment variables are set in Vercel

4. **Clear Cache**:
   - Clear your browser cache
   - Restart your application if running locally

## Additional Fixes Applied

The following additional fixes have been implemented to resolve production issues:

1. **RLS Policy Fix**: Updated the "Users can view their own redemptions" policy to include the `auth.uid() = user_id` condition for backward compatibility with existing records

2. **Data Migration**: Script 018 has been added to fix existing redemption records that had [user_id](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/001_create_tables.sql#L97-L97) populated but [customer_id](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/007_update_redemptions_table.sql#L3-L3) as null

3. **Query Fix**: Business validation page now correctly selects the [business_id](file:///c%3A/Users/User/OneDrive/Desktop/giya/scripts/007_update_redemptions_table.sql#L4-L4) field needed for validation

For detailed information about these fixes, see [PRODUCTION_ISSUE_FIXES.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/PRODUCTION_ISSUE_FIXES.md).

## Rollback Plan

If you need to rollback the changes:

1. Restore the database from a backup (if available)
2. Revert the frontend code to the previous version:
   ```bash
   git revert HEAD
   git push origin main
   ```

This will create a new commit that undoes the previous changes and trigger a new deployment.

## Support

For additional support, refer to:
- [PROJECT_DOCUMENTATION.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/PROJECT_DOCUMENTATION.md)
- [TROUBLESHOOTING_GUIDE.md](file:///c%3A/Users/User/OneDrive/Desktop/giya/TROUBLESHOOTING_GUIDE.md)