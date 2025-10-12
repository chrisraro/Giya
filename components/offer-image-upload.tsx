import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadOfferImage, deleteOfferImage, updateOfferImageInDatabase } from '@/lib/offer-image-upload';
import { OptimizedImage } from '@/components/optimized-image';

interface OfferImageUploadProps {
  currentImageUrl: string | null | undefined;
  businessId: string;
  offerId: string;
  offerType: 'reward' | 'discount' | 'exclusive';
  onImageUpdate: (newImageUrl: string | null) => void;
}

export function OfferImageUpload({
  currentImageUrl,
  businessId,
  offerId,
  offerType,
  onImageUpdate
}: OfferImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Supabase storage
      const imageUrl = await uploadOfferImage(file, businessId, offerType, offerId);
      
      // Update database
      await updateOfferImageInDatabase(offerId, offerType, imageUrl);
      
      // Notify parent component
      onImageUpdate(imageUrl);
      
      toast.success('Offer image updated successfully');
    } catch (error) {
      console.error('Error uploading offer image:', error);
      toast.error('Failed to upload offer image');
      // Revert preview
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!previewUrl) return;

    setIsUploading(true);

    try {
      // Delete from Supabase storage
      await deleteOfferImage(previewUrl, businessId, offerType);

      // Update database
      await updateOfferImageInDatabase(offerId, offerType, null);
      
      // Update state
      setPreviewUrl(null);
      onImageUpdate(null);
      
      toast.success('Offer image removed successfully');
    } catch (error) {
      console.error('Error removing offer image:', error);
      toast.error('Failed to remove offer image');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="offer-image-upload" className="text-sm font-medium">
          Offer Image
        </Label>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or GIF up to 5MB
        </p>
      </div>
      
      {previewUrl ? (
        <div className="relative inline-block">
          <div className="relative border rounded-lg overflow-hidden">
            <OptimizedImage 
              src={previewUrl} 
              alt="Offer preview" 
              width={200} 
              height={200}
              className="object-cover w-48 h-48"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 rounded-full"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed rounded-lg w-48 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={triggerFileInput}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Click to upload</span>
          {isUploading && (
            <Loader2 className="h-4 w-4 animate-spin mt-2" />
          )}
        </div>
      )}
      
      <Input
        id="offer-image-upload"
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </>
          )}
        </Button>
        
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}