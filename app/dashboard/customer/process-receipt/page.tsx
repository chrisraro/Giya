"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode, Camera, Receipt, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { TableQRScanner } from "@/components/table-qr-scanner"
import { ReceiptUpload } from "@/components/receipt-upload"
import { FacebookAuthFlow } from "@/components/facebook-auth-flow"
import { triggerOCRProcessing } from "@/lib/ocr-service"
import { trackAffiliateAttribution } from "@/lib/affiliate-tracking"
import { awardPointsFromReceipt } from "@/lib/points-awarding"
import { RateLimiter } from "@/lib/security-utils"

export default function NewReceiptProcessingPage() {
  const [step, setStep] = useState<'scan' | 'auth' | 'upload' | 'processing' | 'complete'>('scan')
  const [tableQrCode, setTableQrCode] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCustomerId(session.user.id)
      }
    }
    
    checkAuth()
  }, [])
  
  const handleTableScan = (qrCode: string, businessId: string) => {
    setTableQrCode(qrCode)
    setBusinessId(businessId)
    setStep('auth')
  }
  
  const handleAuthComplete = (authMethod: 'facebook' | 'phone') => {
    // Store auth method for tracking
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('receipt_auth_method', authMethod)
    }
    setStep('upload')
  }
  
  const handleUploadComplete = (id: string) => {
    setReceiptId(id)
  }
  
  const handleProcessReceipt = async () => {
    if (!receiptId || !customerId || !businessId) return
    
    // Rate limiting
    const rateLimiter = RateLimiter.getInstance(`process_receipt_${customerId}`)
    if (!rateLimiter.isAllowed()) {
      toast.error(`Rate limit exceeded. Please wait ${Math.ceil(rateLimiter.getWindowMs() / 1000)} seconds before trying again.`)
      return
    }
    
    setIsProcessing(true)
    setStep('processing')
    
    try {
      // Process receipt with OCR
      await triggerOCRProcessing(receiptId)
      
      // Track affiliate attribution
      await trackAffiliateAttribution(customerId, businessId, receiptId)
      
      // Award points
      const result = await awardPointsFromReceipt(receiptId)
      if (result.success && result.pointsAwarded) {
        setPointsAwarded(result.pointsAwarded)
      }
      
      toast.success('Receipt processed successfully!')
      setStep('complete')
    } catch (error) {
      console.error('Error processing receipt:', error)
      toast.error('Failed to process receipt. Please try again.')
      setStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleReset = () => {
    setStep('scan')
    setTableQrCode(null)
    setReceiptId(null)
    setBusinessId(null)
    setPointsAwarded(0)
  }
  
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Earn Points with Receipts</h1>
        <p className="text-muted-foreground mt-2">
          Scan your table, upload your receipt, and earn points automatically
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10"></div>
        {(['scan', 'auth', 'upload', 'processing', 'complete'] as const).map((stepName, index) => (
          <div key={stepName} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === stepName 
                ? 'bg-primary text-primary-foreground' 
                : index < ['scan', 'auth', 'upload', 'processing', 'complete'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-muted'
            }`}>
              {index + 1}
            </div>
            <span className="text-xs mt-2 text-center w-16">
              {stepName === 'scan' && 'Scan'}
              {stepName === 'auth' && 'Auth'}
              {stepName === 'upload' && 'Upload'}
              {stepName === 'processing' && 'Process'}
              {stepName === 'complete' && 'Done'}
            </span>
          </div>
        ))}
      </div>
      
      {/* Step Content */}
      {step === 'scan' && (
        <TableQRScanner 
          onTableScan={handleTableScan} 
          onClose={() => router.back()} 
        />
      )}
      
      {step === 'auth' && (
        <Card>
          <CardHeader>
            <CardTitle>Authenticate to Continue</CardTitle>
            <CardDescription>
              Please authenticate to verify your receipt and earn points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacebookAuthFlow onAuthComplete={handleAuthComplete} />
          </CardContent>
        </Card>
      )}
      
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Your Receipt
            </CardTitle>
            <CardDescription>
              Take a photo or upload an image of your receipt
            </CardDescription>
          </CardHeader>
          <CardContent>
            {businessId && customerId ? (
              <ReceiptUpload 
                businessId={businessId} 
                customerId={customerId} 
                tableQrCode={tableQrCode || undefined}
                onUploadComplete={handleUploadComplete}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            )}
            
            {receiptId && (
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleProcessReceipt} 
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Process Receipt
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('scan')}
                  className="flex-1"
                >
                  Rescan Table
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {step === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Your Receipt
            </CardTitle>
            <CardDescription>
              We're extracting data from your receipt and calculating your points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-center text-muted-foreground">
                This usually takes 10-30 seconds. Please don't close this page.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {step === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Points Awarded Successfully!
            </CardTitle>
            <CardDescription>
              Your receipt has been processed and points have been added to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="bg-green-50 rounded-full p-4">
                <TrendingUp className="h-12 w-12 text-green-600" />
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold">+{pointsAwarded} Points</p>
                <p className="text-muted-foreground">Added to your account</p>
              </div>
              
              <div className="bg-muted rounded-lg p-4 w-full">
                <h3 className="font-medium mb-2">Receipt Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table:</span>
                    <span>{tableQrCode?.substring(0, 8) || 'N/A'}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600">Processed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points:</span>
                    <span>+{pointsAwarded}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button onClick={() => router.push('/dashboard/customer')} className="flex-1">
                  View Dashboard
                </Button>
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Process Another Receipt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}