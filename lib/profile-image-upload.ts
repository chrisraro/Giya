import { createClient } from '@/lib/supabase/client';

/**
 * Uploads a profile image to Vercel Blob storage via API routes
 * @param file - The image file to upload
 * @param userId - The user ID for folder organization
 * @param userType - The type of user (customer, business, influencer)
 * @returns The URL of the uploaded image
 */
export async function uploadProfileImage(file: File, userId: string, userType: 'customer' | 'business' | 'influencer'): Promise<string> {
  try {
    // Create a folder structure: profile-images/{userType}/{userId}
    const folderPath = `profile-images/${userType}/${userId}`;
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folderPath}/${fileName}`;
    
    // First, get a signed URL from our API
    const response = await fetch('/api/blob/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: filePath,
        contentType: file.type,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }
    
    const { url } = await response.json();
    
    // Upload the file content
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }
    
    // Return the public URL (remove query parameters)
    return url.split('?')[0];
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
}

/**
 * Deletes a profile image from Vercel Blob storage
 * @param imageUrl - The URL of the image to delete
 */
export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    // Extract the blob path from the URL
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    // Remove the leading slash
    const blobPath = pathname.substring(1);
    
    // Delete from Vercel Blob via our API
    const response = await fetch(`/api/blob/delete?path=${encodeURIComponent(blobPath)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw new Error('Failed to delete profile image');
  }
}

/**
 * Updates profile image in the database
 * @param userId - The user ID
 * @param userType - The type of user
 * @param imageUrl - The new image URL (can be null to remove the image)
 */
export async function updateProfileImageInDatabase(userId: string, userType: 'customer' | 'business' | 'influencer', imageUrl: string | null): Promise<void> {
  const supabase = createClient();
  
  try {
    let tableName: string;
    switch (userType) {
      case 'customer':
        tableName = 'customers';
        break;
      case 'business':
        tableName = 'businesses';
        break;
      case 'influencer':
        tableName = 'influencers';
        break;
      default:
        throw new Error('Invalid user type');
    }
    
    const { error } = await supabase
      .from(tableName)
      .update({ profile_pic_url: imageUrl })
      .eq('id', userId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error updating profile image in database:', error);
    throw new Error('Failed to update profile image in database');
  }
}