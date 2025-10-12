import { createClient } from '@/lib/supabase/client';

/**
 * Uploads an offer image to Supabase storage
 * @param file - The image file to upload
 * @param businessId - The business ID for folder organization
 * @param offerType - The type of offer (reward, discount, exclusive)
 * @param offerId - The offer ID for file naming
 * @returns The URL of the uploaded image
 */
export async function uploadOfferImage(
  file: File, 
  businessId: string, 
  offerType: 'reward' | 'discount' | 'exclusive',
  offerId: string
): Promise<string> {
  try {
    const supabase = createClient();
    
    // Determine the bucket based on offer type
    let bucketName: string;
    switch (offerType) {
      case 'reward':
        bucketName = 'reward-images';
        break;
      case 'exclusive':
        bucketName = 'exclusive-offer-images';
        break;
      case 'discount':
        bucketName = 'exclusive-offer-images'; // Using the same bucket for simplicity
        break;
      default:
        throw new Error('Invalid offer type');
    }
    
    // Create a folder structure: {businessId}/{offerId}-{timestamp}-{filename}
    const fileName = `${offerId}-${Date.now()}-${file.name}`;
    const filePath = `${businessId}/${fileName}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading offer image:', error);
    throw new Error('Failed to upload offer image');
  }
}

/**
 * Deletes an offer image from Supabase storage
 * @param imageUrl - The URL of the image to delete
 * @param businessId - The business ID
 * @param offerType - The type of offer
 */
export async function deleteOfferImage(
  imageUrl: string,
  businessId: string,
  offerType: 'reward' | 'discount' | 'exclusive'
): Promise<void> {
  try {
    const supabase = createClient();
    
    // Determine the bucket based on offer type
    let bucketName: string;
    switch (offerType) {
      case 'reward':
        bucketName = 'reward-images';
        break;
      case 'exclusive':
        bucketName = 'exclusive-offer-images';
        break;
      case 'discount':
        bucketName = 'exclusive-offer-images'; // Using the same bucket for simplicity
        break;
      default:
        throw new Error('Invalid offer type');
    }
    
    // Extract the file path from the URL
    const url = new URL(imageUrl);
    const pathnameParts = url.pathname.split('/');
    // Find the index of the bucket name in the path
    const bucketIndex = pathnameParts.indexOf(bucketName);
    if (bucketIndex === -1) {
      throw new Error('Invalid image URL');
    }
    // Get the path after the bucket name
    const filePath = pathnameParts.slice(bucketIndex + 1).join('/');
    
    // Delete from Supabase storage
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting offer image:', error);
    throw new Error('Failed to delete offer image');
  }
}

/**
 * Updates offer image URL in the database
 * @param offerId - The offer ID
 * @param offerType - The type of offer
 * @param imageUrl - The new image URL
 */
export async function updateOfferImageInDatabase(
  offerId: string,
  offerType: 'reward' | 'discount' | 'exclusive',
  imageUrl: string | null
): Promise<void> {
  const supabase = createClient();
  
  try {
    let tableName: string;
    switch (offerType) {
      case 'reward':
        tableName = 'rewards';
        break;
      case 'exclusive':
        tableName = 'exclusive_offers';
        break;
      case 'discount':
        tableName = 'discount_offers';
        break;
      default:
        throw new Error('Invalid offer type');
    }
    
    const { error } = await supabase
      .from(tableName)
      .update({ image_url: imageUrl })
      .eq('id', offerId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error updating offer image in database:', error);
    throw new Error('Failed to update offer image in database');
  }
}