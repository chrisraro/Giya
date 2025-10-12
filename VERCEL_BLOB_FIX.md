# Vercel Blob Profile Image Upload Fix

## Overview

This document describes the fix for the Vercel Blob profile image upload issue. The problem was that the API routes were not properly configured for client uploads, causing a 500 error when trying to upload profile images.

## Issue

The error messages indicated:
```
Failed to load resource: the server responded with a status of 500 ()
Error uploading profile image: Error: Failed to get upload URL
Error uploading profile image: Error: Failed to upload profile image
```

## Root Cause

The issue was with the implementation of the Vercel Blob upload API route. The previous implementation was using the server-side [put](file:///c:/Users/User/OneDrive/Desktop/giya/components/media-gallery.tsx#L7-L7) function directly, which required the `BLOB_READ_WRITE_TOKEN` to be available on the server. However, the proper approach for client uploads is to use the [handleUpload](file:///c:/Users/User/OneDrive/Desktop/giya/node_modules/@vercel/blob/client/index.d.ts#L177-L227) function which generates temporary client tokens for secure uploads.

## Solution

### 1. Updated API Route ([app/api/blob/upload/route.ts](file://c:/Users/User/OneDrive/Desktop/giya/app/api/blob/upload/route.ts))

Changed from using the [put](file:///c:/Users/User/OneDrive/Desktop/giya/components/media-gallery.tsx#L7-L7) function directly to using the [handleUpload](file:///c:/Users/User/OneDrive/Desktop/giya/node_modules/@vercel/blob/client/index.d.ts#L177-L227) function which is the proper approach for client uploads:

```typescript
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Generate a client token for the browser to upload the file
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
          ],
          addRandomSuffix: true,
          cacheControlMaxAge: 3600,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called by Vercel API on client upload completion
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Error handling blob upload:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
```

### 2. Updated Profile Image Upload Utility ([lib/profile-image-upload.ts](file://c:/Users/User/OneDrive/Desktop/giya/lib/profile-image-upload.ts))

Changed from making API calls to generate URLs to using the client upload approach:

```typescript
import { upload } from '@vercel/blob/client';
import { createClient } from '@/lib/supabase/client';

export async function uploadProfileImage(file: File, userId: string, userType: 'customer' | 'business' | 'influencer'): Promise<string> {
  try {
    // Create a folder structure: profile-images/{userType}/{userId}/{filename}
    const folderPath = `profile-images/${userType}/${userId}`;
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folderPath}/${fileName}`;
    
    // Upload directly from the client to Vercel Blob
    const blob = await upload(filePath, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
    });
    
    return blob.url;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
}
```

### 3. Test Pages

Created test pages to help diagnose and verify the fix:
- [app/test/blob-config-test/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/test/blob-config-test/page.tsx) - For testing environment variable configuration
- [app/api/blob/config/route.ts](file://c:/Users/User/OneDrive/Desktop/giya/app/api/blob/config/route.ts) - API route to check if environment variables are set

## Benefits

1. **Proper Client Upload Implementation**: Uses the recommended Vercel Blob client upload approach
2. **Better Security**: Temporary client tokens are generated for each upload instead of exposing the read/write token
3. **Improved Reliability**: Follows Vercel's best practices for blob uploads
4. **Direct Uploads**: Files are uploaded directly from the browser to Vercel Blob without going through your server

## Environment Variables

Make sure the following environment variable is set in your Vercel project:
- `BLOB_READ_WRITE_TOKEN` - Obtain this from your Vercel Blob storage settings

## Testing

To test the fix:

1. Navigate to the profile pages or settings pages where the profile image upload component is used
2. Try uploading a new profile image
3. Verify that the upload completes successfully without errors
4. Check that the image is properly displayed after upload

## Files Modified

1. [app/api/blob/upload/route.ts](file://c:/Users/User/OneDrive/Desktop/giya/app/api/blob/upload/route.ts) - Updated to use handleUpload
2. [lib/profile-image-upload.ts](file://c:/Users/User/OneDrive/Desktop/giya/lib/profile-image-upload.ts) - Updated to use client upload approach
3. [app/test/blob-config-test/page.tsx](file://c:/Users/User/OneDrive/Desktop/giya/app/test/blob-config-test/page.tsx) - Created for testing
4. [app/api/blob/config/route.ts](file://c:/Users/User/OneDrive/Desktop/giya/app/api/blob/config/route.ts) - Created for testing

## Future Improvements

1. Add authentication checks in the `onBeforeGenerateToken` function to ensure only authorized users can upload files
2. Implement database updates in the `onUploadCompleted` callback to automatically update user profiles with new image URLs
3. Add error handling and retry logic for failed uploads