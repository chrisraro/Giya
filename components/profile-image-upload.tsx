import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadProfileImage, deleteProfileImage, updateProfileImageInDatabase } from '@/lib/profile-image-upload';

interface ProfileImageUploadProps {
  currentImageUrl: string | null | undefined;
  userId: string;
  userType: 'customer' | 'business' | 'influencer';
  onImageUpdate: (newImageUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfileImageUpload({
  currentImageUrl,
  userId,
  userType,
  onImageUpdate,
  size = 'md'
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: { avatar: 'h-16 w-16', button: 'h-6 w-6' },
    md: { avatar: 'h-24 w-24', button: 'h-8 w-8' },
    lg: { avatar: 'h-32 w-32', button: 'h-10 w-10' }
  };

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

      // Upload to Vercel Blob
      const imageUrl = await uploadProfileImage(file, userId, userType);
      
      // Update database
      await updateProfileImageInDatabase(userId, userType, imageUrl);
      
      // Notify parent component
      onImageUpdate(imageUrl);
      
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to upload profile image');
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
      // Delete from Vercel Blob if it's not the default image
      if (previewUrl !== currentImageUrl) {
        await deleteProfileImage(previewUrl);
      }

      // Update database
      await updateProfileImageInDatabase(userId, userType, null);
      
      // Update state
      setPreviewUrl(null);
      onImageUpdate(null);
      
      toast.success('Profile image removed successfully');
    } catch (error) {
      console.error('Error removing profile image:', error);
      toast.error('Failed to remove profile image');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size].avatar}>
          {previewUrl ? (
            <AvatarImage src={previewUrl} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-muted">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            </AvatarFallback>
          )}
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={`absolute -bottom-2 -right-2 rounded-full ${sizeClasses[size].button}`}
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Upload className="h-3 w-3" />
        </Button>
        
        {previewUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className={`absolute -top-2 -right-2 rounded-full ${sizeClasses[size].button}`}
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div>
          <Label htmlFor="profile-image-upload" className="text-sm font-medium">
            Profile Image
          </Label>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or GIF up to 5MB
          </p>
        </div>
        
        <Input
          id="profile-image-upload"
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
              'Upload New'
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
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}