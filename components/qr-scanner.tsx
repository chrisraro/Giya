"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Camera, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { handleQrScanError } from "@/lib/error-handler"
import { retryWithBackoff } from "@/lib/retry-utils"

interface QrScannerProps {
  onScanSuccess: (data: string) => void
  onClose: () => void
}

export function QrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    if (!scannerRef.current) return

    try {
      setCameraError(null)
      
      // Clear previous scanner if exists
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
          await html5QrCodeRef.current.stop()
        }
      }

      // Create new scanner instance with retry mechanism
      html5QrCodeRef.current = new Html5Qrcode("qr-scanner-container")
      
      // Configure camera
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      }

      // Start scanning with retry
      await retryWithBackoff(
        async () => {
          await html5QrCodeRef.current!.start(
            { facingMode: "environment" },
            config,
            (decodedText, decodedResult) => {
              // QR code detected
              console.log("QR Code detected:", decodedText)
              stopCamera()
              onScanSuccess(decodedText)
            },
            (errorMessage) => {
              // QR code parsing error - this is normal during scanning
              // console.log("QR Code parse error:", errorMessage)
            }
          )
        },
        { maxRetries: 3, delay: 1000, exponentialBackoff: true }
      )

      setIsScanning(true)
    } catch (error) {
      console.error("Camera start error:", error)
      const errorMessage = handleQrScanError(error)
      setCameraError(errorMessage)
    }
  }

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
          await html5QrCodeRef.current.stop()
        }
      }
    } catch (error) {
      console.error("Error stopping camera:", error)
      // We don't show this error to the user as it's not critical
    } finally {
      setIsScanning(false)
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.trim() !== "") {
      stopCamera()
      onScanSuccess(manualCode.trim())
    } else {
      toast.error("Please enter a valid code")
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
        
        {/* Scanner container */}
        <div 
          id="qr-scanner-container" 
          ref={scannerRef}
          className="w-full h-full"
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