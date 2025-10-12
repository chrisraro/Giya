# Image Storage Implementation Guide

## Overview

This document describes the implementation of improved image storage for the Giya application, using Vercel Blob for profile images and Supabase Storage for offer/reward images.

## Architecture

### Profile Images (Customers, Businesses, Influencers)
- **Storage Solution**: Vercel Blob
- **Storage Location**: `profile-images/{userType}/{userId}/{timestamp}-{filename}`
- **Access Control**: Controlled via API routes and authentication
- **Database Storage**: URLs stored in respective profile tables

### Offer/Reward Images
- **Storage Solution**: Supabase Storage
- **Buckets**:
  - `reward-images` - For reward images
  - `exclusive-offer-images` - For exclusive offer images
- **Storage Location**: `{businessId}/{offerId}-{timestamp}-{filename}`
- **Access Control**: RLS policies for business-specific access
- **Database Storage**: URLs stored in respective offer tables

## Implementation Details

### 1. Profile Image Handling

#### Components
- `components/profile-image-upload.tsx` - Reusable component for profile image uploads
- `lib/profile-image-upload.ts` - Utility functions for Vercel Blob operations

#### Features
- Image upload with preview
- File validation (type and size)
- Automatic upload to Vercel Blob
- Database update with new image URL
- Image removal functionality
- Loading states and error handling

#### Usage
```typescript
<ProfileImageUpload
  currentImageUrl={user.profile_pic_url}
  userId={user.id}
  userType="customer" // or "business" or "influencer"
  onImageUpdate={(newImageUrl) => {
    // Update local state or refetch user data
  }}
/>
```

### 2. Offer Image Handling

#### Components
- `components/offer-image-upload.tsx` - Reusable component for offer image uploads
- `lib/offer-image-upload.ts` - Utility functions for Supabase Storage operations

#### Features
- Image upload with preview
- File validation (type and size)
- Automatic upload to Supabase Storage
- Database update with new image URL
- Image removal functionality
- Loading states and error handling

#### Usage
```typescript
<OfferImageUpload
  currentImageUrl={offer.image_url}
  businessId={business.id}
  offerId={offer.id}
  offerType="reward" // or "discount" or "exclusive"
  onImageUpdate={(newImageUrl) => {
    // Update form state or refetch offer data
  }}
/>
```

### 3. Database Schema Updates

#### New Columns
- `discount_offers.image_url` - Added to store discount offer images

#### Storage Buckets
- `profile-pics` - Existing bucket for profile images (now used with Vercel Blob URLs)
- `reward-images` - New bucket for reward images
- `exclusive-offer-images` - New bucket for exclusive offer images

### 4. Storage Policies

#### Profile Images (Vercel Blob)
- Images are stored with public access
- Access control is managed through API routes
- Users can only manage their own images

#### Offer Images (Supabase Storage)
- Images are stored with public access for viewing
- Businesses can only upload/update/delete their own images
- Folder structure ensures proper organization

## Migration Process

### 1. Environment Setup
1. Add Vercel Blob environment variables:
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob read/write token

2. Ensure Supabase storage is configured with proper RLS policies

### 2. Database Updates
1. Run `scripts/033_create_offer_image_buckets.sql` to create new storage buckets
2. Run `scripts/034_add_image_url_to_discount_offers.sql` to add image_url column

### 3. Component Updates
1. Replace manual image URL inputs with image upload components
2. Update forms to use the new image handling workflow

## API Endpoints

### Vercel Blob Management
- `DELETE /api/blob/delete?path={blobPath}` - Delete a blob by path

## Error Handling

All image operations include proper error handling:
- File validation (type, size)
- Network error handling
- Database error handling
- User-friendly error messages via toast notifications

## Security Considerations

### Vercel Blob
- Access tokens are stored as environment variables
- Users can only manage their own images
- File type validation prevents malicious uploads

### Supabase Storage
- RLS policies ensure businesses can only access their own images
- File type validation prevents malicious uploads
- Public URLs are used for image display

## Performance Optimization

### Image Optimization
- Next.js Image component for automatic optimization
- Proper sizing and caching
- Lazy loading for better performance

### Upload Optimization
- Client-side validation to prevent unnecessary uploads
- Progress indicators for better UX
- Concurrent operations where possible

## Testing

### Unit Tests
- Image upload functionality
- File validation
- Error handling
- Database updates

### Integration Tests
- End-to-end image upload workflow
- Image display in components
- Image deletion workflow

## Future Improvements

### Image Processing
- Automatic image resizing and compression
- Format conversion for optimal web delivery
- Image optimization based on display context

### Advanced Features
- Image cropping tools
- Multiple image uploads
- Image galleries for offers