"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle, Scan } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleQrScanError } from "@/lib/error-handler";
import jsQR from "jsqr";

interface QrScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

export function NewQrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to decode QR code from canvas
  const decodeQrCode = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    
    if (!context) return;
    
    // Draw current video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data from canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try to decode QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      // QR code detected
      onScanSuccess(code.data);
      return true;
    }
    return false;
  }, [onScanSuccess]);

  // Scan function that runs in animation loop
  const scan = useCallback(() => {
    // Only scan if video is loaded and playing
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (decodeQrCode()) {
        // Stop scanning when QR code is found
        return;
      }
    }
    
    // Continue scanning
    requestRef.current = requestAnimationFrame(scan);
  }, [decodeQrCode]);

  // Request camera access and start scanning
  const startCamera = useCallback(async () => {
    if (isInitialized) return;

    try {
      setCameraError(null);

      // Get available video devices to potentially select the rear camera by ID
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      let constraints: MediaStreamConstraints = {
        video: { facingMode: "environment" } // Prefer back camera on mobile
      };

      // On some mobile devices, facingMode constraint might not work, so we try to identify rear camera by other means
      if (videoDevices.length > 1) {
        // If we have multiple cameras, try using the rear camera by ID if facingMode doesn't work
        const rearCamera = videoDevices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        if (rearCamera) {
          constraints = {
            video: { deviceId: { exact: rearCamera.deviceId } }
          };
        }
      }

      // Try to get the camera stream
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (facingModeError) {
        console.warn("Failed to access environment camera, trying with different constraints:", facingModeError);
        // Fallback to any camera if environment camera fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Ensure video plays inline on mobile
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('muted', '');

        // Wait for video to load metadata
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            // Set up the onloadedmetadata callback before trying to play
            videoRef.current.onloadedmetadata = () => {
              console.log("Video metadata loaded, attempting to play");
              resolve();
            };

            // Try to play the video - this is needed for proper mobile rendering
            const playPromise = videoRef.current!.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => console.log("Video play started successfully"))
                .catch(error => console.error("Video play failed:", error));
            }
          }
        });

        // Start the scan loop
        setIsScanning(true);
        setIsInitialized(true);

        // Start scanning loop
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
        requestRef.current = requestAnimationFrame(scan);
      }
    } catch (error) {
      console.error("Camera error:", error);
      const errorMessage = handleQrScanError(error);
      setCameraError(errorMessage);
    }
  }, [isInitialized, scan]);

  // Stop camera and scanning
  const stopCamera = useCallback(() => {
    // Cancel animation frame
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  }, []);

  // Handle manual submission
  const handleManualSubmit = () => {
    if (manualCode.trim() !== "") {
      onScanSuccess(manualCode.trim());
      setShowManualInput(false);
    } else {
      toast.error("Please enter a valid code");
    }
  };

  // Handle retry camera access
  const handleRetryCamera = () => {
    setCameraError(null);
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-destructive mb-3">{cameraError}</p>
            <Button onClick={handleRetryCamera} variant="secondary" size="sm">
              Retry Camera Access
            </Button>
          </div>
        ) : null}

        {/* Video element for camera preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraError ? "hidden" : ""}`}
        />
        
        {/* Hidden canvas for QR detection */}
        <canvas 
          ref={canvasRef} 
          className="hidden"
        />

        {/* Camera indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-white">
          <Camera className={`h-4 w-4 ${isScanning ? "animate-pulse" : ""}`} />
          <span className="text-sm">
            {isScanning ? "Scanning..." : "Initializing..."}
          </span>
        </div>

        {/* QR Box overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-green-500 rounded-lg">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500 rounded-br-lg"></div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button 
          onClick={() => setShowManualInput(true)} 
          variant="outline" 
          className="w-full bg-transparent"
        >
          Enter Code Manually
        </Button>
        <Button onClick={onClose} variant="ghost" className="w-full">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Position the QR code within the frame to scan automatically
      </p>

      {/* Manual Input Dialog */}
      <Dialog open={showManualInput} onOpenChange={setShowManualInput}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Code Manually</DialogTitle>
            <DialogDescription>
              Enter the code from the QR code to proceed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Code</Label>
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter code here"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleManualSubmit();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowManualInput(false);
                  setManualCode("");
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleManualSubmit} className="flex-1">
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}