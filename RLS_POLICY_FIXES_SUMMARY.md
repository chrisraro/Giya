# RLS Policy Fixes Summary

## Overview

This document summarizes the fixes made to the SQL scripts to handle existing policies gracefully. The issue was that when running the scripts multiple times, they would fail because the policies already existed in the database.

## Changes Made

### 1. Storage Bucket Scripts

**File**: [scripts/004_create_storage_bucket.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/004_create_storage_bucket.sql)
- Added `DROP POLICY IF EXISTS` statements before creating new policies
- This prevents errors when running the script multiple times

**File**: [scripts/033_create_offer_image_buckets.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/033_create_offer_image_buckets.sql)
- Added `DROP POLICY IF EXISTS` statements for all policies
- This prevents errors when running the script multiple times

**File**: [scripts/037_create_user_media_table.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/037_create_user_media_table.sql)
- Added `DROP POLICY IF EXISTS` statements for all policies
- This prevents errors when running the script multiple times

### 2. RLS Policy Scripts

**File**: [scripts/002_enable_rls.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/002_enable_rls.sql)
- Added `DROP POLICY IF EXISTS` statements for all policies
- This prevents errors when running the script multiple times

**File**: [scripts/005_fix_profiles_rls.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/005_fix_profiles_rls.sql)
- Added `DROP POLICY IF EXISTS` statement for the profile insert policy
- This prevents errors when running the script multiple times

**File**: [scripts/029_enable_rls_for_discount_and_exclusive_offers.sql](file://c:/Users/User/OneDrive/Desktop/giya/scripts/029_enable_rls_for_discount_and_exclusive_offers.sql)
- Added `DROP POLICY IF EXISTS` statements for all policies
- This prevents errors when running the script multiple times

### 3. Image Upload Component Fixes

**Files Modified**:
- [app/dashboard/business/rewards/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/rewards/page.tsx)
- [app/dashboard/business/discounts/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/discounts/page.tsx)
- [app/dashboard/business/exclusive-offers/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/exclusive-offers/page.tsx)

**Changes**:
- Replaced [MediaGallery](file:///c:/Users/User/OneDrive/Desktop/giya/components/media-gallery.tsx#L24-L71) components with [OfferImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/offer-image-upload.tsx#L12-L42) components
- This ensures offer images are stored in Supabase Storage instead of Vercel Blob

**File**: [lib/profile-image-upload.ts](file://c:/Users/User/OneDrive/Desktop/giya/lib/profile-image-upload.ts)
**Changes**:
- Updated to use API routes for Vercel Blob operations instead of direct calls
- This ensures the `BLOB_READ_WRITE_TOKEN` is handled securely on the server side

## Benefits

1. **Idempotent Scripts**: The SQL scripts can now be run multiple times without errors
2. **Correct Storage Strategy**: Offer images are now properly stored in Supabase Storage
3. **Secure Token Handling**: Vercel Blob tokens are now handled securely on the server side
4. **Improved Reliability**: The system is more robust and less prone to errors

## How to Test

1. Run the updated SQL scripts in your Supabase SQL editor
2. Test the image upload functionality in your application:
   - Profile images should work with the [ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42) component
   - Offer images should work with the [OfferImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/offer-image-upload.tsx#L12-L42) component
3. Verify that no policy-related errors occur when running the scripts multiple times

## Environment Variables

Make sure you have set the `BLOB_READ_WRITE_TOKEN` environment variable in your Vercel project settings. This is required for Vercel Blob operations.