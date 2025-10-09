"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Camera, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import jsQR from "jsqr"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface QrScannerProps {
  onScanSuccess: (data: string) => void
  onClose: () => void
}

export function QrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanAttempts, setScanAttempts] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setCameraError(null)
      // Try environment camera first (rear camera on mobile)
      let mediaStream: MediaStream;
      
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (environmentError) {
        // If environment camera fails, try user camera (front camera)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch (userError) {
          // If both fail, try any available camera
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
        setScanAttempts(0);

        scanIntervalRef.current = window.setInterval(() => {
          scanQRCode();
        }, 150); // Scan every 150ms for better responsiveness
      }
    } catch (error) {
      setCameraError("Failed to access camera. Please check permissions.");
      toast.error("Failed to access camera. Please check permissions or try manual input.");
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsScanning(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code && code.data) {
      stopCamera()
      onScanSuccess(code.data)
    } else {
      // Increment scan attempts to show user feedback
      setScanAttempts(prev => prev + 1)
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.trim() !== "") {
      stopCamera();
      onScanSuccess(manualCode.trim());
    } else {
      toast.error("Please enter a valid code");
    }
  }

  const handleRetryCamera = () => {
    setCameraError(null)
    startCamera()
  }

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
        
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-64 w-64">
            <div className="absolute inset-0 border-2 border-primary/50" />
            <div className="absolute left-0 top-0 h-12 w-12 border-l-4 border-t-4 border-primary" />
            <div className="absolute right-0 top-0 h-12 w-12 border-r-4 border-t-4 border-primary" />
            <div className="absolute bottom-0 left-0 h-12 w-12 border-b-4 border-l-4 border-primary" />
            <div className="absolute bottom-0 right-0 h-12 w-12 border-b-4 border-r-4 border-primary" />
          </div>
        </div>

        {/* Camera indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-white">
          <Camera className={`h-4 w-4 ${isScanning ? "animate-pulse" : ""}`} />
          <span className="text-sm">
            {isScanning ? "Scanning..." : "Initializing..."}
          </span>
        </div>
        
        {/* Scan attempts indicator */}
        {isScanning && scanAttempts > 0 && (
          <div className="absolute bottom-4 left-4 text-xs text-white/70">
            Scans: {scanAttempts}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={() => setShowManualInput(true)} variant="outline" className="w-full bg-transparent">
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
                    handleManualSubmit()
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowManualInput(false)} className="flex-1">
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
  )
}