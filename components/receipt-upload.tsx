import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Camera, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import { OptimizedImage } from '@/components/optimized-image';
import { validateImageFile } from '@/lib/security-utils';

interface ReceiptUploadProps {
  businessId: string;
  customerId: string;
  tableQrCode?: string;
  onUploadComplete: (receiptId: string) => void;
}

export function ReceiptUpload({
  businessId,
  customerId,
  tableQrCode,
  onUploadComplete
}: ReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous states
    setUploadError(null);
    setIsUploaded(false);

    // Validate file using security utility
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `receipts/${businessId}/${customerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(filePath);

      // Save receipt record to database
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          customer_id: customerId,
          business_id: businessId,
          image_url: publicUrl,
          original_filename: file.name,
          table_qr_code: tableQrCode,
          status: 'uploaded'
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      setIsUploaded(true);
      toast.success('Receipt uploaded successfully');
      
      // Automatically trigger OCR processing
      try {
        const response = await fetch('/api/receipts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptId: receiptData.id })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          toast.success(result.message || 'Receipt processed successfully!');
        } else {
          console.error('OCR processing failed:', result.error);
          toast.warning('Receipt uploaded but processing failed. Will retry automatically.');
        }
      } catch (ocrError) {
        console.error('Error triggering OCR:', ocrError);
        toast.warning('Receipt uploaded. Processing will complete shortly.');
      }
      
      onUploadComplete(receiptData.id);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload receipt. Please try again.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      // Revert preview
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setIsUploaded(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        {previewUrl ? (
          <div className="relative inline-block">
            <OptimizedImage
              src={previewUrl}
              alt="Receipt preview"
              width={300}
              height={400}
              className="object-contain rounded-lg border"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {isUploaded && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            )}
            {uploadError && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        ) : (
          <div 
            className="border-2 border-dashed rounded-lg w-full h-64 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/50"
            onClick={triggerFileInput}
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <span className="text-lg font-medium text-muted-foreground">Upload Receipt</span>
            <span className="text-sm text-muted-foreground mt-1">Click to select or drag & drop</span>
            {isUploading && (
              <Loader2 className="h-6 w-6 animate-spin mt-4" />
            )}
          </div>
        )}
      </div>
      
      {uploadError && (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {uploadError}
        </div>
      )}
      
      <Input
        id="receipt-upload"
        type="file"
        accept="image/*"
        capture="environment" // Use device camera when available
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Select Image
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.setAttribute('capture', 'environment');
              fileInputRef.current.click();
            }
          }}
          disabled={isUploading}
          className="flex-1"
        >
          <Camera className="mr-2 h-4 w-4" />
          Take Photo
        </Button>
        
        {previewUrl && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="flex-1"
          >
            Remove
          </Button>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Supported formats: JPEG, PNG, WebP</p>
        <p>Maximum file size: 10MB</p>
      </div>
    </div>
  );
}