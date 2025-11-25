"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { handleQrScanError } from "@/lib/error-handler";
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QrScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

export function Html5QrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const isComponentMounted = useRef(true);

  // Function to check if camera permission is granted
  const checkCameraPermission = useCallback(async () => {
    try {
      if ('permissions' in navigator) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permissionStatus.state;
      }
      return 'unknown';
    } catch (error) {
      console.warn('Could not check camera permission:', error);
      return 'unknown';
    }
  }, []);

  // Function to request camera access
  const startCamera = useCallback(async () => {
    if (!scannerRef.current || !isComponentMounted.current) return;

    try {
      setCameraError(null);
      setShowPermissionHelp(false); // Hide help if starting camera

      // Check current camera permission
      const permissionState = await checkCameraPermission();
      if (permissionState === 'denied') {
        setCameraError("Camera permission has been denied. Please allow camera access in your browser settings.");
        setShowPermissionHelp(true);
        return;
      }

      // Clear previous scanner if exists
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
            await html5QrCodeRef.current.stop();
          }
        } catch (error) {
          console.warn("Warning stopping previous scanner:", error);
        }
      }

      // Create new scanner instance
      html5QrCodeRef.current = new Html5Qrcode("qr-scanner-container", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false, // Only valid property in Html5QrcodeFullConfig
      });

      // Configure scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      // Start scanning
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Check if component is still mounted
          if (!isComponentMounted.current) return;

          // QR code detected
          console.log("QR Code detected:", decodedText);
          stopCamera();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Log scan errors but don't show to user during scanning
          if (process.env.NODE_ENV === 'development') {
            console.log("QR Code error:", errorMessage);
          }
        }
      );

      if (isComponentMounted.current) {
        setIsScanning(true);
      }
    } catch (error) {
      if (!isComponentMounted.current) return;

      console.error("Camera start error:", error);
      const errorMessage = handleQrScanError(error);
      setCameraError(errorMessage);
    }
  }, [checkCameraPermission, onScanSuccess]);

  // Function to stop camera
  const stopCamera = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        const currentState = html5QrCodeRef.current.getState();
        if (currentState === Html5QrcodeScannerState.SCANNING || currentState === Html5QrcodeScannerState.PAUSED) {
          await html5QrCodeRef.current.stop();
        }
        // Clear the reference after stopping
        html5QrCodeRef.current = null;
      }
    } catch (error) {
      console.warn("Error stopping camera:", error);
      // Force clear the reference even if stop fails
      html5QrCodeRef.current = null;
    } finally {
      if (isComponentMounted.current) {
        setIsScanning(false);
      }
    }
  }, []);

  // Function to handle camera permission issues
  const handlePermissions = useCallback(() => {
    // Open browser settings page for camera permissions
    if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // If successful, stop the stream and try to start the camera
          stream.getTracks().forEach(track => track.stop());
          startCamera();
        })
        .catch(err => {
          console.error("Camera permission error:", err);
          setCameraError("Camera access denied. Please allow camera permissions in your browser.");
          setShowPermissionHelp(true);
        });
    } else {
      setShowPermissionHelp(true);
    }
  }, [startCamera]);

  // Handle manual submission
  const handleManualSubmit = () => {
    if (manualCode.trim() !== "") {
      stopCamera();
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

  // Initialize component
  useEffect(() => {
    isComponentMounted.current = true;
    startCamera();

    return () => {
      isComponentMounted.current = false;
      // Cleanup: stop camera if running
      if (html5QrCodeRef.current) {
        const currentState = html5QrCodeRef.current.getState();
        if (currentState === Html5QrcodeScannerState.SCANNING || currentState === Html5QrcodeScannerState.PAUSED) {
          html5QrCodeRef.current.stop().catch(err => {
            console.warn('Cleanup: Error stopping camera:', err);
          });
        }
        html5QrCodeRef.current = null;
      }
    };
  }, [startCamera]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-destructive mb-3">{cameraError}</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button onClick={handleRetryCamera} variant="secondary" size="sm" className="w-full">
                Retry Camera Access
              </Button>
              {showPermissionHelp && (
                <Button 
                  onClick={handlePermissions} 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage Camera Permissions
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Scanner container */}
        <div
          id="qr-scanner-container"
          ref={scannerRef}
          className={`w-full h-full ${cameraError ? "opacity-0" : ""}`}
        />

        {/* Camera indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-white">
          <Camera className={`h-4 w-4 ${isScanning ? "animate-pulse" : ""}`} />
          <span className="text-sm">
            {isScanning ? "Scanning..." : "Initializing..."}
          </span>
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

      {/* Permission Help Dialog */}
      <Dialog open={showPermissionHelp} onOpenChange={setShowPermissionHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Camera Access Required</DialogTitle>
            <DialogDescription>
              To scan QR codes, we need access to your camera. Please follow these steps to enable camera access:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click the lock icon or settings icon in your browser's address bar</li>
              <li>Find &quot;Camera&quot; or &quot;Camera and Microphone&quot; permissions</li>
              <li>Select &quot;Allow&quot; for this website</li>
              <li>Refresh this page</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              If you still have issues, check your browser's settings or operating system privacy settings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPermissionHelp(false)} 
              className="flex-1"
            >
              Close
            </Button>
            <Button 
              onClick={handleRetryCamera} 
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}