import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Image as ImageIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import { OptimizedImage } from '@/components/optimized-image';
import { put } from '@vercel/blob';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MediaItem {
  id: string;
  url: string;
  created_at: string;
  name: string;
}

interface MediaGalleryProps {
  userId: string;
  userType: 'customer' | 'business' | 'influencer';
  currentImageUrl: string | null | undefined;
  onImageSelect: (imageUrl: string | null) => void;
  maxFileSize?: number; // in bytes, default 5MB
  triggerButton?: React.ReactNode;
}

export function MediaGallery({
  userId,
  userType,
  currentImageUrl,
  onImageSelect,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  triggerButton
}: MediaGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fetch user's media items when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUserMedia();
    }
  }, [isOpen, userId, userType]);

  const fetchUserMedia = async () => {
    setIsLoading(true);
    try {
      // Fetch media items from the database
      const { data, error } = await supabase
        .from('user_media')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert to MediaItem format
      const mediaItems: MediaItem[] = data.map((item: any) => ({
        id: item.id,
        url: item.media_url,
        created_at: item.created_at,
        name: item.media_name || 'Unnamed'
      }));
      
      setMediaItems(mediaItems);
    } catch (error) {
      console.error('Error fetching user media:', error);
      toast.error('Failed to load media gallery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      toast.error(`File size must be less than ${maxFileSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      
      // Upload to Vercel Blob
      const folderPath = `media-gallery/${userType}/${userId}`;
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${folderPath}/${fileName}`;
      
      // Upload directly using put
      const blob = await put(filePath, file, {
        access: 'public',
        contentType: file.type,
      });
      
      const imageUrl = blob.url;
      
      // Save reference to database
      const { data: mediaData, error: mediaError } = await supabase
        .from('user_media')
        .insert({
          user_id: userId,
          user_type: userType,
          media_url: imageUrl,
          media_name: file.name
        })
        .select()
        .single();
      
      if (mediaError) throw mediaError;
      
      // Add to media items
      const newMediaItem: MediaItem = {
        id: mediaData.id,
        url: imageUrl,
        created_at: mediaData.created_at,
        name: file.name
      };
      
      setMediaItems(prev => [newMediaItem, ...prev]);
      onImageSelect(imageUrl);
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onImageSelect(imageUrl);
    setIsOpen(false);
  };

  const handleDeleteImage = async (imageUrl: string, id: string) => {
    try {
      // Delete from database first
      const { error: deleteError } = await supabase
        .from('user_media')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      // Delete from Vercel Blob
      const url = new URL(imageUrl);
      const pathname = url.pathname;
      const blobPath = pathname.substring(1);
      
      // Use the existing delete API
      const response = await fetch(`/api/blob/delete?path=${encodeURIComponent(blobPath)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      // Remove from media items
      setMediaItems(prev => prev.filter(item => item.id !== id));
      
      // If this was the selected image, clear the selection
      if (currentImageUrl === imageUrl) {
        onImageSelect(null);
      }
      
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button type="button" variant="outline" size="sm">
            <ImageIcon className="mr-2 h-4 w-4" />
            Choose Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Media Gallery</DialogTitle>
          <DialogDescription>
            Upload new images or select from your gallery
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Image Preview */}
          {currentImageUrl && (
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="relative inline-block">
                <div className="relative border rounded-lg overflow-hidden w-48 h-48">
                  <OptimizedImage 
                    src={currentImageUrl} 
                    alt="Current" 
                    width={200} 
                    height={200}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Upload Button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              disabled={isUploading || isLoading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </>
              )}
            </Button>
          </div>
          
          {/* Media Grid */}
          <div>
            <Label>Media Gallery</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {isLoading ? (
                <div className="col-span-3 flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No media items found</p>
                </div>
              ) : (
                mediaItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <div 
                      className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        currentImageUrl === item.url 
                          ? 'ring-2 ring-primary' 
                          : 'hover:ring-2 hover:ring-primary/50'
                      }`}
                      onClick={() => handleSelectImage(item.url)}
                    >
                      <div className="aspect-square w-full">
                        <OptimizedImage 
                          src={item.url} 
                          alt={item.name} 
                          width={200} 
                          height={200}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      {currentImageUrl === item.url && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(item.url, item.id);
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading || isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}