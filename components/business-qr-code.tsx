"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { useRef, useEffect } from "react"

interface BusinessQRCodeProps {
  businessId: string
  businessName: string
  accessLink: string | null
  accessQRCode: string | null
}

export function BusinessQRCode({ businessId, businessName, accessLink, accessQRCode }: BusinessQRCodeProps) {
  const fullAccessLink = accessLink ? `${window.location.origin}/discover/${accessLink}` : null
  const qrCodeData = accessQRCode || accessLink || businessId
  const isComponentMounted = useRef(true)
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    isComponentMounted.current = true;
    
    // Cleanup function
    return () => {
      isComponentMounted.current = false;
      // Clean up any pending downloads
      if (downloadLinkRef.current) {
        try {
          if (downloadLinkRef.current.parentNode) {
            downloadLinkRef.current.parentNode.removeChild(downloadLinkRef.current)
          }
        } catch (error) {
          console.warn("Error cleaning up download link:", error)
        }
        downloadLinkRef.current = null
      }
    };
  }, []);

  const copyToClipboard = () => {
    if (fullAccessLink) {
      navigator.clipboard.writeText(fullAccessLink)
      toast.success("Access link copied to clipboard")
    }
  }

  const downloadQRCode = () => {
    try {
      const canvas = document.getElementById(`qr-code-${businessId}`) as HTMLCanvasElement
      if (canvas && isComponentMounted.current) {
        const url = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `${businessName.replace(/\s+/g, "-")}-access-qr.png`
        link.href = url
        
        // Store reference for cleanup
        downloadLinkRef.current = link
        
        // Use a timeout to ensure the link is clicked after it's added to the DOM
        setTimeout(() => {
          if (isComponentMounted.current) {
            try {
              document.body.appendChild(link)
              link.click()
              // Use a timeout to ensure the link is removed after it's clicked
              setTimeout(() => {
                if (isComponentMounted.current && link.parentNode) {
                  try {
                    link.parentNode.removeChild(link)
                  } catch (error) {
                    console.warn("Error removing download link:", error)
                  }
                }
                downloadLinkRef.current = null
              }, 100)
              toast.success("QR code downloaded")
            } catch (error) {
              console.error("Error during QR code download:", error)
              toast.error("Failed to download QR code")
            }
          }
        }, 0)
      }
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast.error("Failed to download QR code")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Access QR Code</CardTitle>
        <CardDescription>Share this QR code for customers to discover your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG 
              id={`qr-code-${businessId}`}
              value={`${window.location.origin}/discover/${qrCodeData}`}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          
          {fullAccessLink && (
            <div className="w-full space-y-2">
              <div className="text-sm font-medium">Access Link</div>
              <div className="flex gap-2">
                <div className="flex-1 p-2 bg-muted rounded text-sm truncate">
                  {fullAccessLink}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={downloadQRCode}
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </Button>
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Customers scan this QR code or visit the link</li>
            <li>They sign up as customers if they don't have an account</li>
            <li>After their first visit to your business, they'll appear in your customer list</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}