"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Check, Tag } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import Image from "next/image"

interface DiscountOffer {
  id: string
  business_id: string
  title: string
  description: string | null
  discount_type: string
  discount_value: number
  minimum_purchase: number | null
  is_active: boolean
  usage_limit: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  is_first_visit_only: boolean
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

export function DiscountOfferCard({ 
  offer, 
  business, 
  user, 
  businessId 
}: { 
  offer: DiscountOffer, 
  business: Business, 
  user: any, 
  businessId: string 
}) {
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRedemptionQR, setShowRedemptionQR] = useState(false)
  const [redemptionQRCode, setRedemptionQRCode] = useState<string>("")
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null)

  const handleRedeemClick = () => {
    setShowRedeemDialog(true)
  }

  const handleConfirmRedeem = async () => {
    setIsProcessing(true)

    try {
      // For discount offers, we generate a QR code that the business can scan
      // The discount will be automatically applied when the business processes the transaction
      const redemptionCode = `GIYA-DISCOUNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${offer.id}`

      toast.success("Discount ready! Show the QR code to the business when making a purchase.")

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        offer: offer,
        business: business
      })
      setShowRedeemDialog(false)
      setShowRedemptionQR(true)
    } catch (error) {
      console.error("Failed to process discount:", error)
      toast.error("Failed to process discount")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card className={`overflow-hidden ${offer.image_url ? 'p-0' : 'p-6'}`}>
        {offer.image_url ? (
          <>
            <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
              <Image
                src={offer.image_url}
                alt={offer.title || "Discount Offer"}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader className="p-4 bg-transparent">
              <CardTitle className="text-xl font-bold">{offer.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{offer.description || "Special discount offer"}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mb-4">
                <p className="text-2xl font-bold text-primary">
                  {offer.discount_type === "percentage" 
                    ? `${offer.discount_value}% OFF` 
                    : offer.discount_type === "fixed_amount" 
                      ? `₱${offer.discount_value?.toFixed(2)} OFF` 
                      : `${offer.discount_value} POINTS`}
                </p>
                {offer.minimum_purchase && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Min. purchase: ₱{offer.minimum_purchase?.toFixed(2)}
                  </p>
                )}
              </div>
              {user ? (
                <Button 
                  className="w-full" 
                  onClick={handleRedeemClick}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Redeem Now
                </Button>
              ) : (
                <Link href="/auth/signup">
                  <Button className="w-full">
                    <Tag className="mr-2 h-4 w-4" />
                    Sign Up to Redeem
                  </Button>
                </Link>
              )}
            </CardContent>
          </>
        ) : (
          <div className="p-0">
            <CardHeader className="p-4 bg-transparent">
              <CardTitle className="text-xl font-bold">{offer.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{offer.description || "Special discount offer"}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mb-4">
                <p className="text-2xl font-bold text-primary">
                  {offer.discount_type === "percentage" 
                    ? `${offer.discount_value}% OFF` 
                    : offer.discount_type === "fixed_amount" 
                      ? `₱${offer.discount_value?.toFixed(2)} OFF` 
                      : `${offer.discount_value} POINTS`}
                </p>
                {offer.minimum_purchase && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Min. purchase: ₱{offer.minimum_purchase?.toFixed(2)}
                  </p>
                )}
              </div>
              {user ? (
                <Button 
                  className="w-full" 
                  onClick={handleRedeemClick}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Redeem Now
                </Button>
              ) : (
                <Link href="/auth/signup">
                  <Button className="w-full">
                    <Tag className="mr-2 h-4 w-4" />
                    Sign Up to Redeem
                  </Button>
                </Link>
              )}
            </CardContent>
          </div>
        )}
      </Card>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Discount</DialogTitle>
            <DialogDescription>Confirm your discount redemption</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg">{offer.title}</h3>
                <p className="text-sm text-muted-foreground">{business.business_name}</p>
              </div>
              <p className="text-sm text-muted-foreground">{offer.description || "Special discount offer"}</p>
              
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium">Discount Value:</p>
                <p className="text-lg font-bold text-primary">
                  {offer.discount_type === "percentage" 
                    ? `${offer.discount_value}% OFF` 
                    : offer.discount_type === "fixed_amount" 
                      ? `₱${offer.discount_value?.toFixed(2)} OFF` 
                      : `${offer.discount_value} POINTS`}
                </p>
                {offer.minimum_purchase && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Min. purchase: ₱{offer.minimum_purchase?.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              When you redeem this discount, you'll receive a QR code to show to the business during checkout. 
              The discount will be automatically applied to your purchase.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRedeemDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleConfirmRedeem} disabled={isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
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
            <DialogTitle>Discount QR Code</DialogTitle>
            <DialogDescription>Show this QR code to the business during checkout</DialogDescription>
          </DialogHeader>
          {redemptionDetails && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg border bg-white p-6">
                <QRCodeSVG value={redemptionQRCode} size={200} level="H" />
              </div>

              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold mb-2">{redemptionDetails.offer.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {redemptionDetails.business.business_name}
                </p>
                <div className="text-sm">
                  <p className="font-medium">Discount Value:</p>
                  <p className="text-primary font-bold">
                    {redemptionDetails.offer.discount_type === "percentage" 
                      ? `${redemptionDetails.offer.discount_value}% OFF` 
                      : redemptionDetails.offer.discount_type === "fixed_amount" 
                        ? `₱${redemptionDetails.offer.discount_value?.toFixed(2)} OFF` 
                        : `${redemptionDetails.offer.discount_value} POINTS`}
                  </p>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Show this QR code to the business during checkout. The discount will be automatically applied to your purchase.
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