"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Html5QrScanner } from '@/components/html5-qr-scanner'
import { ReceiptUpload } from '@/components/receipt-upload'
import { QrCode, Receipt, CheckCircle, ArrowLeft } from 'lucide-react'
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
      let scannedBusinessId: string | null = null
      let scannedTableCode: string | null = null

      console.log('🔍 Scanned QR Data:', data)

      // Format 1: business:businessId:table:tableCode (old format)
      const parts = data.split(':')
      if (parts.length >= 2 && parts[0] === 'business') {
        scannedBusinessId = parts[1]
        scannedTableCode = parts.length >= 4 ? parts[3] : null
        console.log('✓ Format 1 detected: business:id:table:code')
      } 
      // Format 2: {origin}/discover/{businessId} or /discover/{businessId} (new business QR format)
      else if (data.includes('/discover/')) {
        const urlParts = data.split('/discover/')
        if (urlParts.length === 2) {
          // Extract business ID or access code from URL
          scannedBusinessId = urlParts[1].split('?')[0].split('#')[0] // Remove query params and hash
          console.log('✓ Format 2 detected: /discover/ URL')
        }
      }
      // Format 3: Direct business ID or access code
      else if (data.startsWith('BUS-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
        scannedBusinessId = data
        console.log('✓ Format 3 detected: Direct ID or access code')
      }

      if (!scannedBusinessId) {
        console.error('❌ Invalid QR format. Scanned data:', data)
        toast.error('Invalid QR code format. Please scan a valid business or table QR code.')
        return
      }

      console.log('🔎 Looking up business with identifier:', scannedBusinessId)

      // Try to find business by ID first
      let business = null
      let error = null

      // Attempt 1: Try as UUID (business ID)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scannedBusinessId)) {
        console.log('→ Attempt 1: Searching by UUID...')
        const result = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('id', scannedBusinessId)
          .maybeSingle()
        
        business = result.data
        error = result.error
        console.log('  Result:', business ? '✓ Found' : '✗ Not found', error ? `Error: ${error.message}` : '')
      }

      // Attempt 2: Try as access_link
      if (!business && !error) {
        console.log('→ Attempt 2: Searching by access_link...')
        const result = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('access_link', scannedBusinessId)
          .maybeSingle()
        
        business = result.data
        error = result.error
        console.log('  Result:', business ? '✓ Found' : '✗ Not found', error ? `Error: ${error.message}` : '')
      }

      // Attempt 3: Try as access_qr_code
      if (!business && !error) {
        console.log('→ Attempt 3: Searching by access_qr_code...')
        const result = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('access_qr_code', scannedBusinessId)
          .maybeSingle()
        
        business = result.data
        error = result.error
        console.log('  Result:', business ? '✓ Found' : '✗ Not found', error ? `Error: ${error.message}` : '')
      }

      if (error) {
        console.error('❌ Database error:', error)
        toast.error('Database error. Please try again.')
        return
      }

      if (!business) {
        console.error('❌ Business not found for identifier:', scannedBusinessId)
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Business not found</span>
            <span className="text-xs">The scanned QR code is not associated with any active business.</span>
          </div>,
          { duration: 5000 }
        )
        return
      }

      console.log('✅ Business found:', business.business_name)

      setBusinessId(business.id)
      setBusinessName(business.business_name)
      setTableQrCode(scannedTableCode)
      setMode('upload')
      
      toast.success(`Scanned: ${business.business_name}${scannedTableCode ? ` - Table ${scannedTableCode}` : ''}`)
    } catch (error) {
      console.error('❌ Error processing QR code:', error)
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
                  {tableQrCode && `Table ${tableQrCode} • `}Upload your receipt to earn points
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

            {customerId && businessId && (
              <ReceiptUpload
                businessId={businessId}
                customerId={customerId}
                tableQrCode={tableQrCode || undefined}
                onUploadComplete={handleUploadComplete}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
