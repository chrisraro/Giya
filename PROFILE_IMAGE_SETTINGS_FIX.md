# Profile Image Settings Fix

## Overview

This document describes the fix for the missing profile image upload functionality in the settings pages. Users were unable to find the profile picture upload feature in the settings pages, which caused confusion.

## Issue

The profile image upload component ([ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42)) was only available on the dedicated profile pages:
- [app/dashboard/customer/profile/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/profile/page.tsx)
- [app/dashboard/business/profile/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/profile/page.tsx)

However, users were looking for this functionality in the settings pages:
- [app/dashboard/customer/settings/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/settings/page.tsx)
- [app/dashboard/business/settings/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/settings/page.tsx)

## Solution

Added the [ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42) component to both settings pages with the following changes:

### Customer Settings Page
**File**: [app/dashboard/customer/settings/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/settings/page.tsx)

1. Imported the [ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42) component
2. Added a `handleImageUpdate` function to update the customer data state when the image is changed
3. Added the [ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42) component to the Personal Information card with proper props:
   - `currentImageUrl`: Current profile picture URL
   - `userId`: Customer's user ID
   - `userType`: "customer"
   - `onImageUpdate`: Callback function to update state
   - `size`: "lg" for a larger display

### Business Settings Page
**File**: [app/dashboard/business/settings/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/settings/page.tsx)

1. Imported the [ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42) component
2. Added a `handleImageUpdate` function to update the business data state when the image is changed
3. Added the [ProfileImageUpload](file:///c:/Users/User/OneDrive/Desktop/giya/components/profile-image-upload.tsx#L13-L42) component to the Business Information card with proper props:
   - `currentImageUrl`: Current profile picture URL
   - `userId`: Business's user ID
   - `userType`: "business"
   - `onImageUpdate`: Callback function to update state
   - `size`: "lg" for a larger display

## Benefits

1. **Improved User Experience**: Users can now find and update their profile pictures in the settings pages where they expect this functionality
2. **Consistency**: Both profile and settings pages now offer the same profile image management capabilities
3. **Accessibility**: The profile image upload feature is available in multiple locations, making it easier to find

## Testing

To test the changes:

1. Navigate to the customer settings page: `/dashboard/customer/settings`
2. Verify that the profile image upload component is visible and functional
3. Upload a new profile image and confirm it updates correctly
4. Navigate to the business settings page: `/dashboard/business/settings`
5. Verify that the profile image upload component is visible and functional
6. Upload a new profile image and confirm it updates correctly

## Files Modified

1. [app/dashboard/customer/settings/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/customer/settings/page.tsx)
2. [app/dashboard/business/settings/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/dashboard/business/settings/page.tsx)