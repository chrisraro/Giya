"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { toast } from "sonner"

interface QrScannerProps {
  onScanSuccess: (data: string) => void
  onClose: () => void
}

export function QrScanner({ onScanSuccess, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsScanning(true)

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(() => {
          scanQRCode()
        }, 500)
      }
    } catch (error) {
      console.error("[v0] Camera error:", error)
      toast.error("Failed to access camera. Please check permissions.")
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

    // Simple QR code detection (in production, use a library like jsQR)
    // For now, we'll simulate detection by looking for manual input
    // In a real implementation, you would use: import jsQR from 'jsqr'
    // const code = jsQR(imageData.data, imageData.width, imageData.height)
    // if (code) { onScanSuccess(code.data) }
  }

  const handleManualInput = () => {
    const qrCode = prompt("Enter QR code manually (format: GIYA-XXXXXXXXXXXX):")
    if (qrCode && qrCode.startsWith("GIYA-")) {
      stopCamera()
      onScanSuccess(qrCode)
    } else if (qrCode) {
      toast.error("Invalid QR code format")
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 border-2 border-primary">
            <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-primary" />
            <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-primary" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleManualInput} variant="outline" className="w-full bg-transparent">
          Enter QR Code Manually
        </Button>
        <Button onClick={onClose} variant="ghost" className="w-full">
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Position the QR code within the frame or enter it manually
      </p>
    </div>
  )
}
