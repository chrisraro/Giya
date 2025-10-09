"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, QrCode, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { QrScanner } from "@/components/qr-scanner"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function TestQRScannerPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [testResult, setTestResult] = useState<any>(null)
  const supabase = createClient()

  const handleScanSuccess = async (qrCode: string) => {
    console.log("Scanned QR code:", qrCode)
    setShowScanner(false)
    validateCode(qrCode)
  }

  const handleManualValidate = async () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a code")
      return
    }
    validateCode(manualCode)
  }

  const validateCode = async (qrCode: string) => {
    setIsValidating(true)
    setTestResult(null)

    try {
      console.log("Validating code:", qrCode.trim())
      
      // Fetch redemption details
      const { data: redemption, error: redemptionError } = await supabase
        .from("redemptions")
        .select(
          `
          id,
          customer_id,
          reward_id,
          points_redeemed,
          status,
          validated_at,
          business_id,
          customers (
            full_name,
            profile_pic_url
          ),
          rewards (
            name as reward_name,
            description,
            points_required
          )
        `,
        )
        .eq("redemption_qr_code", qrCode.trim())
        .single()

      if (redemptionError || !redemption) {
        console.error("Redemption query error:", redemptionError)
        console.log("QR Code searched:", qrCode.trim())
        
        setTestResult({
          success: false,
          code: qrCode.trim(),
          error: redemptionError?.message || "No redemption found with this code"
        })
        
        toast.error("Invalid or expired redemption code. Please check the code and try again.")
        return
      }

      setTestResult({
        success: true,
        code: qrCode.trim(),
        redemption: redemption
      })
      
      toast.success("Code validated successfully!")
      
    } catch (error) {
      console.error("Validation error:", error)
      setTestResult({
        success: false,
        code: qrCode.trim(),
        error: (error as Error).message
      })
      toast.error("Failed to validate code")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <h1 className="font-semibold text-foreground">QR Scanner Test</h1>
          <p className="text-sm text-muted-foreground">Test QR scanning and manual code entry</p>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>Test the QR scanner functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
                <QrCode className="mr-2 h-5 w-5" />
                Open Scanner
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Position the QR code within the frame to scan automatically
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Code Entry</CardTitle>
              <CardDescription>Test manual code validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-code">Redemption Code</Label>
                <Input
                  id="manual-code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter redemption code"
                />
              </div>
              
              <Button 
                onClick={handleManualValidate} 
                disabled={isValidating}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Code"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {testResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResult.success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Code Validated Successfully</span>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Code: {testResult.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {testResult.redemption.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reward: {testResult.redemption.rewards.reward_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Points: {testResult.redemption.points_redeemed}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>Validation Failed</span>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Code: {testResult.code}</h3>
                    <p className="text-sm text-muted-foreground">
                      Error: {testResult.error}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}