import { useState, useRef, useEffect } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Check for successful receipt processing after page reload
  useEffect(() => {
    const successData = sessionStorage.getItem('receiptProcessSuccess');
    if (successData) {
      try {
        const data = JSON.parse(successData);
        const timeElapsed = Date.now() - data.timestamp;
        
        // Only show if reload happened within last 10 seconds
        if (timeElapsed < 10000) {
          console.log('🎉 Showing receipt success notification after reload');
          
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">✅ Receipt Processed!</span>
              <span className="text-sm">You earned {data.pointsEarned} points</span>
              {data.totalAmount && (
                <span className="text-xs opacity-75">Amount: ₱{data.totalAmount.toFixed(2)}</span>
              )}
              <span className="text-xs opacity-75 mt-1">Your points have been updated!</span>
            </div>,
            { duration: 6000 }
          );
        }
        
        // Clear the stored data
        sessionStorage.removeItem('receiptProcessSuccess');
      } catch (error) {
        console.error('Error parsing receipt success data:', error);
        sessionStorage.removeItem('receiptProcessSuccess');
      }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous states
    setUploadError(null);
    setProcessingError(null);
    setIsUploaded(false);
    setProcessingStatus('idle');
    setPointsEarned(null);

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

      console.log('📄 Uploading receipt:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        businessId,
        customerId,
        tableQrCode
      });

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `receipts/${businessId}/${customerId}/${fileName}`;

      console.log('📂 Uploading to storage path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded successfully');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipt-images')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);

      // Save receipt record to database
      console.log('💾 Saving receipt to database...');
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

      if (receiptError) {
        console.error('❌ Database insert error:', receiptError);
        throw receiptError;
      }

      console.log('✅ Receipt record saved:', receiptData.id);

      setIsUploaded(true);
      toast.success('Receipt uploaded successfully');
      
      // Show processing indicator
      setProcessingStatus('processing');
      setIsProcessing(true);
      toast.info('🔍 Scanning receipt...', { duration: 2000 });
      
      // Automatically trigger OCR processing
      try {
        console.log('[Receipt Upload] 🔍 Triggering OCR for receipt:', receiptData.id);
        
        const response = await fetch('/api/receipts/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptId: receiptData.id })
        });
        
        console.log('[Receipt Upload] API Response status:', response.status, response.statusText);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('❌ Non-JSON response:', textResponse);
          throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
        }
        
        let result;
        try {
          result = await response.json();
          console.log('[Receipt Upload] API Response data:', result);
        } catch (jsonError) {
          console.error('❌ Failed to parse JSON response:', jsonError);
          throw new Error('Invalid response from server. Please check server logs.');
        }
        
        if (response.ok) {
          setProcessingStatus('success');
          setPointsEarned(result.pointsEarned || 0);
          console.log('✅ Receipt processed successfully! Points:', result.pointsEarned);
          
          // Store success data in sessionStorage for showing after reload
          sessionStorage.setItem('receiptProcessSuccess', JSON.stringify({
            pointsEarned: result.pointsEarned,
            totalAmount: result.ocrData?.totalAmount,
            timestamp: Date.now()
          }));
          
          // Show brief success message before reload
          toast.success('✅ Receipt Processed Successfully!', { duration: 1500 });
          
          // Reload page after 1.5 seconds to refresh points and cleanup camera
          setTimeout(() => {
            console.log('🔄 Reloading page to update points...');
            window.location.reload();
          }, 1500);
        } else {
          // API returned error response
          const errorMsg = result?.error || 'Processing failed';
          const errorDetail = result?.details || result?.error || 'Could not read receipt';
          
          setProcessingStatus('failed');
          setProcessingError(errorMsg);
          
          console.error('❌ OCR processing failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMsg,
            details: errorDetail,
            fullResponse: result
          });
          
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">❌ Processing Failed</span>
              <span className="text-sm">{errorMsg}</span>
              {errorDetail !== errorMsg && (
                <span className="text-xs opacity-75">{errorDetail}</span>
              )}
            </div>,
            { duration: 8000 }
          );
        }
      } catch (ocrError) {
        // Network error or exception
        setProcessingStatus('failed');
        
        let errorMessage = 'Network error during processing';
        let errorDetails = 'Check your internet connection';
        
        if (ocrError instanceof Error) {
          errorMessage = ocrError.message;
          errorDetails = ocrError.stack || errorMessage;
        } else if (typeof ocrError === 'object' && ocrError !== null) {
          errorMessage = JSON.stringify(ocrError);
        }
        
        setProcessingError(errorMessage);
        
        console.error('❌ Error triggering OCR:', {
          error: ocrError,
          errorType: typeof ocrError,
          message: errorMessage,
          details: errorDetails
        });
        
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">⚠️ Connection Error</span>
            <span className="text-sm">{errorMessage}</span>
            <span className="text-xs opacity-75">Check console for details</span>
          </div>,
          { duration: 8000 }
        );
      } finally {
        setIsProcessing(false);
      }
      
      onUploadComplete(receiptData.id);
    } catch (error) {
      console.error('❌ Error uploading receipt:', error);
      
      let errorMessage = 'Failed to upload receipt. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Check for specific Supabase errors
      if (typeof error === 'object' && error !== null) {
        const err = error as any;
        if (err.error) {
          console.error('Supabase error object:', err.error);
          errorMessage = err.error;
        }
        if (err.message) {
          console.error('Error message:', err.message);
          errorMessage = err.message;
        }
        if (err.statusCode) {
          console.error('Status code:', err.statusCode);
        }
      }
      
      setUploadError(errorMessage);
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">❌ Upload Failed</span>
          <span className="text-sm">{errorMessage}</span>
          <span className="text-xs opacity-75">Check console for details</span>
        </div>,
        { duration: 8000 }
      );
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
    setProcessingError(null);
    setProcessingStatus('idle');
    setPointsEarned(null);
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
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                <span className="text-white text-sm">Uploading...</span>
              </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                <span className="text-white text-sm">Scanning receipt...</span>
              </div>
            )}
            {processingStatus === 'success' && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-2">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            )}
            {processingStatus === 'failed' && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-2">
                <AlertCircle className="h-6 w-6 text-white" />
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
        <div className="text-sm text-red-500 flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Upload Failed</p>
            <p className="text-xs">{uploadError}</p>
          </div>
        </div>
      )}
      
      {processingError && (
        <div className="text-sm text-red-500 flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Processing Failed</p>
            <p className="text-xs">{processingError}</p>
            <p className="text-xs mt-1 opacity-75">Try uploading a clearer image of the receipt</p>
          </div>
        </div>
      )}
      
      {processingStatus === 'success' && pointsEarned !== null && (
        <div className="text-sm text-green-600 flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Receipt Processed Successfully!</p>
            <p className="text-xs">You earned <span className="font-bold">{pointsEarned} points</span></p>
          </div>
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
        disabled={isUploading || isProcessing}
      />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={isUploading || isProcessing}
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
          disabled={isUploading || isProcessing}
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
            disabled={isUploading || isProcessing}
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