import { put } from '@vercel/blob';
import { createClient } from '@/lib/supabase/client';

/**
 * Uploads a profile image to Vercel Blob storage
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
    
    // Upload to Vercel Blob
    const blob = await put(filePath, file, {
      access: 'public',
      contentType: file.type,
    });
    
    return blob.url;
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
    
    // Delete from Vercel Blob
    await fetch(`/api/blob/delete?path=${encodeURIComponent(blobPath)}`, {
      method: 'DELETE',
    });
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