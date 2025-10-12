"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Check, Gift } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import Image from "next/image"

interface Reward {
  id: string
  business_id: string
  name: string
  description: string
  points_required: number
  is_active: boolean
  image_url: string | null
}

interface Business {
  id: string
  business_name: string
  business_category: string
  address: string
  gmaps_link: string
  profile_pic_url: string
  points_per_currency: number
  business_hours: any
}

export function RewardCard({ reward, business, user, businessId }: { 
  reward: Reward, 
  business: Business, 
  user: any, 
  businessId: string 
}) {
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRedemptionQR, setShowRedemptionQR] = useState(false)
  const [redemptionQRCode, setRedemptionQRCode] = useState<string>("")
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null)
  const [customerPoints, setCustomerPoints] = useState<number>(0)
  const supabase = createClient()

  // Fetch customer points when component mounts
  useEffect(() => {
    if (user) {
      fetchCustomerPoints()
    }
  }, [user])

  const fetchCustomerPoints = async () => {
    try {
      // Get points transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("points_transactions")
        .select("points_earned")
        .eq("customer_id", user.id)
        .eq("business_id", businessId)

      if (transactionsError) throw transactionsError

      // Get redemptions
      const { data: redemptions, error: redemptionsError } = await supabase
        .from("redemptions")
        .select("points_redeemed")
        .eq("customer_id", user.id)
        .eq("business_id", businessId)

      if (redemptionsError) throw redemptionsError

      // Calculate total points
      const totalEarned = transactions?.reduce((sum, t) => sum + t.points_earned, 0) || 0
      const totalRedeemed = redemptions?.reduce((sum, r) => sum + r.points_redeemed, 0) || 0
      setCustomerPoints(totalEarned - totalRedeemed)
    } catch (error) {
      console.error("Failed to fetch customer points:", error)
      toast.error("Failed to load points information")
    }
  }

  const handleRedeemClick = () => {
    if (customerPoints < reward.points_required) {
      toast.error("Not enough points to redeem this reward")
      return
    }
    setShowRedeemDialog(true)
  }

  const handleConfirmRedeem = async () => {
    setIsProcessing(true)

    try {
      const redemptionCode = `GIYA-REDEEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const { data: redemption, error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          customer_id: user.id,
          reward_id: reward.id,
          business_id: businessId,
          points_redeemed: reward.points_required,
          redemption_qr_code: redemptionCode,
          status: "pending",
        })
        .select()
        .single()

      if (redemptionError) throw redemptionError

      toast.success("Reward redeemed! Show the QR code to the business.")

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        reward: reward,
        redemption: redemption,
      })
      setShowRedeemDialog(false)
      setShowRedemptionQR(true)

      // Refresh points
      fetchCustomerPoints()
    } catch (error) {
      console.error("Failed to redeem reward:", error)
      toast.error("Failed to redeem reward")
    } finally {
      setIsProcessing(false)
    }
  }

  const canRedeem = customerPoints >= reward.points_required

  return (
    <>
      <Card className="overflow-hidden">
        {reward.image_url && (
          <div className="relative h-48 w-full">
            <Image
              src={reward.image_url}
              alt={reward.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardTitle className="text-lg">{reward.name}</CardTitle>
          <CardDescription>{reward.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-4">
            <p className="text-3xl font-bold text-primary">{reward.points_required}</p>
            <p className="text-sm text-muted-foreground">points required</p>
          </div>
          {user ? (
            <Button 
              className="w-full" 
              onClick={handleRedeemClick}
              disabled={!canRedeem}
              variant={canRedeem ? "default" : "outline"}
            >
              <Gift className="mr-2 h-4 w-4" />
              {canRedeem ? "Claim Reward" : `Need ${reward.points_required - customerPoints} more points`}
            </Button>
          ) : (
            <Link href="/auth/signup">
              <Button className="w-full">
                <Gift className="mr-2 h-4 w-4" />
                Sign Up to Claim
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>Confirm your reward redemption</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary p-4">
              <div className="mb-3 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={business.profile_pic_url || undefined} />
                  <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{reward.name}</h3>
                  <p className="text-sm text-muted-foreground">{business.business_name}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{reward.description}</p>
            </div>

            <div className="rounded-lg border bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Points to redeem:</span>
                <span className="text-lg font-bold text-primary">{reward.points_required}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Remaining points:</span>
                <span className="font-semibold">
                  {customerPoints - reward.points_required}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRedeemDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConfirmRedeem} disabled={isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Redemption
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redemption QR Code Dialog */}
      <Dialog open={showRedemptionQR} onOpenChange={setShowRedemptionQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redemption QR Code</DialogTitle>
            <DialogDescription>Show this QR code to the business to validate your reward</DialogDescription>
          </DialogHeader>
          {redemptionDetails && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg border bg-white p-6">
                <QRCodeSVG value={redemptionQRCode} size={200} level="H" />
              </div>

              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold mb-2">{redemptionDetails.reward.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {business.business_name}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Points redeemed:</span>
                  <span className="font-bold text-primary">{redemptionDetails.reward.points_required}</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This QR code is valid for one-time use. The business will scan it to validate your redemption.
              </p>

              <Button onClick={() => setShowRedemptionQR(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}