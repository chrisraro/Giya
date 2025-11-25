"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Html5QrScanner } from '@/components/html5-qr-scanner'
import { ReceiptUpload } from '@/components/receipt-upload'
import { Camera, Upload, QrCode, Receipt, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface UnifiedScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: 'customer' | 'business'
  onBusinessScan?: (data: string) => void // For business QR scanning
}

export function UnifiedScanner({ 
  open, 
  onOpenChange,
  userRole,
  onBusinessScan 
}: UnifiedScannerProps) {
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [tableQrCode, setTableQrCode] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [mode, setMode] = useState<'scan' | 'upload'>('scan')
  const supabase = createClient()

  useEffect(() => {
    if (open && userRole === 'customer') {
      loadCustomer()
    }
  }, [open, userRole])

  async function loadCustomer() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (customer) {
      setCustomerId(customer.id)
    }
  }

  const handleQrScanComplete = async (data: string) => {
    if (userRole === 'business' && onBusinessScan) {
      // Business users: pass QR data to business handler
      onBusinessScan(data)
      onOpenChange(false)
      return
    }

    // Customer users: process for receipt upload
    try {
      const parts = data.split(':')
      if (parts.length >= 2 && parts[0] === 'business') {
        const scannedBusinessId = parts[1]
        const scannedTableCode = parts.length >= 4 ? parts[3] : null

        const { data: business, error } = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('id', scannedBusinessId)
          .single()

        if (error || !business) {
          toast.error('Invalid QR code. Please scan a valid table QR code.')
          return
        }

        setBusinessId(business.id)
        setBusinessName(business.business_name)
        setTableQrCode(scannedTableCode)
        setMode('upload')
        
        toast.success(`Scanned: ${business.business_name}${scannedTableCode ? ` - Table ${scannedTableCode}` : ''}`)
      } else {
        toast.error('Invalid QR code format.')
      }
    } catch (error) {
      console.error('Error processing QR code:', error)
      toast.error('Failed to process QR code')
    }
  }

  const handleUploadComplete = (receiptId: string) => {
    toast.success('Receipt processed successfully!', {
      description: 'Your points will be credited shortly.',
    })
    
    // Reset and close
    setTimeout(() => {
      handleReset()
      onOpenChange(false)
    }, 1500)
  }

  const handleReset = () => {
    setMode('scan')
    setBusinessId(null)
    setTableQrCode(null)
    setBusinessName('')
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {userRole === 'business' ? (
              <>
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </>
            ) : mode === 'scan' ? (
              <>
                <QrCode className="h-5 w-5" />
                Scan Table QR Code
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5" />
                Upload Receipt
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {userRole === 'business' 
              ? 'Scan customer QR codes or redemption codes'
              : mode === 'scan' 
                ? 'Scan the QR code on your table to start earning points' 
                : 'Upload or capture your receipt to earn points'}
          </DialogDescription>
        </DialogHeader>

        {userRole === 'business' ? (
          // Business mode: Just QR scanner
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Html5QrScanner onScanSuccess={handleQrScanComplete} onClose={() => onOpenChange(false)} />
              </CardContent>
            </Card>
          </div>
        ) : mode === 'scan' ? (
          // Customer mode: Scan step
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>
                  Point your camera at the QR code on your table to begin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Html5QrScanner onScanSuccess={handleQrScanComplete} onClose={() => onOpenChange(false)} />
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2 text-sm">How it works:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                    <li>Scan the QR code on your table</li>
                    <li>Take a photo or upload your receipt</li>
                    <li>We'll automatically calculate your points</li>
                    <li>Points are added instantly</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Customer mode: Upload step
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {businessName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {tableQrCode && `Table ${tableQrCode} • `}Upload your receipt
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Rescan
              </Button>
            </div>

            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="camera" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Take Photo
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="mt-4">
                {customerId && businessId && (
                  <ReceiptUpload
                    businessId={businessId}
                    customerId={customerId}
                    tableQrCode={tableQrCode || undefined}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4">
                {customerId && businessId && (
                  <ReceiptUpload
                    businessId={businessId}
                    customerId={customerId}
                    tableQrCode={tableQrCode || undefined}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
