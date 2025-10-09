"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Loader2, QrCode, CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { QrScanner } from "@/components/qr-scanner"
import { handleApiError } from "@/lib/error-handler"

export default function ValidateRedemptionPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [redemptionData, setRedemptionData] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleScanSuccess = async (qrCode: string) => {
    console.log("[v0] Scanned QR code:", qrCode)
    setShowScanner(false)
    setIsValidating(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch redemption details - optimized query with only necessary fields
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
        .eq("redemption_qr_code", qrCode)
        .single()

      if (redemptionError || !redemption) {
        toast.error("Invalid or expired redemption code")
        setIsValidating(false)
        return
      }

      if (redemption.status === "validated") {
        toast.error("This redemption has already been validated")
        setIsValidating(false)
        return
      }

      if (redemption.business_id !== user.id) {
        toast.error("This redemption is not for your business")
        setIsValidating(false)
        return
      }

      setRedemptionData(redemption)
    } catch (error) {
      handleApiError(error, "Failed to validate redemption", "ValidateRedemption.handleScanSuccess")
    } finally {
      setIsValidating(false)
    }
  }

  const handleValidateRedemption = async () => {
    if (!redemptionData) return

    setIsValidating(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Update redemption status
      const { error: updateError } = await supabase
        .from("redemptions")
        .update({
          status: "validated",
          validated_at: new Date().toISOString(),
          validated_by: user.id,
        })
        .eq("id", redemptionData.id)

      if (updateError) throw updateError

      toast.success("Redemption validated successfully!")
      setRedemptionData(null)
      router.push("/dashboard/business")
    } catch (error) {
      handleApiError(error, "Failed to validate redemption", "ValidateRedemption.handleValidateRedemption")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto flex items-center gap-3 py-4">
          <Link href="/dashboard/business">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">Validate Redemption</h1>
            <p className="text-sm text-muted-foreground">Scan customer redemption QR code</p>
          </div>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        {!redemptionData ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan Redemption QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask the customer to show their redemption QR code, then scan it to validate their reward.
              </p>
              <Button onClick={() => setShowScanner(true)} className="w-full" size="lg">
                <QrCode className="mr-2 h-5 w-5" />
                Open Scanner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Valid Redemption
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 rounded-lg border bg-secondary p-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={redemptionData.customers.profile_pic_url || undefined} />
                  <AvatarFallback>{redemptionData.customers.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{redemptionData.customers.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Customer</p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-primary/5 p-4">
                <div>
                  <h4 className="font-semibold text-lg">{redemptionData.rewards.reward_name}</h4>
                  <p className="text-sm text-muted-foreground">{redemptionData.rewards.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Points Redeemed:</span>
                  <span className="text-xl font-bold text-primary">{redemptionData.points_redeemed}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRedemptionData(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleValidateRedemption} disabled={isValidating} className="flex-1">
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Validate Redemption
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isValidating && !redemptionData && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
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
