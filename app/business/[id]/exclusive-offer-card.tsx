"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Check, Star } from "lucide-react"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import Image from "next/image"

interface ExclusiveOffer {
  id: string
  business_id: string
  title: string
  description: string | null
  product_name: string
  original_price: number | null
  discounted_price: number | null
  discount_percentage: number | null
  image_url: string | null
  is_active: boolean
  usage_limit: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
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

export function ExclusiveOfferCard({ 
  offer, 
  business, 
  user, 
  businessId 
}: { 
  offer: ExclusiveOffer, 
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
      // For exclusive offers, we generate a QR code that the business can scan
      const redemptionCode = `GIYA-EXCLUSIVE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${offer.id}`

      toast.success("Exclusive offer ready! Show the QR code to the business to claim your offer.")

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        offer: offer,
        business: business
      })
      setShowRedeemDialog(false)
      setShowRedemptionQR(true)
    } catch (error) {
      console.error("Failed to process exclusive offer:", error)
      toast.error("Failed to process exclusive offer")
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
                alt={offer.title || "Exclusive Offer"}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader className="p-4 bg-transparent">
              <CardTitle className="text-xl font-bold">{offer.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{offer.product_name}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mb-4">
                {offer.original_price && (
                  <p className="text-sm text-muted-foreground line-through">
                    ₱{offer.original_price?.toFixed(2)}
                  </p>
                )}
                <p className="text-2xl font-bold text-primary">
                  {offer.discounted_price ? `₱${offer.discounted_price?.toFixed(2)}` : "Special Offer"}
                </p>
                {offer.discount_percentage && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {offer.discount_percentage?.toFixed(0)}%
                  </p>
                )}
              </div>
              {user ? (
                <Button 
                  className="w-full" 
                  onClick={handleRedeemClick}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Redeem Now
                </Button>
              ) : (
                <Link href="/auth/signup">
                  <Button className="w-full">
                    <Star className="mr-2 h-4 w-4" />
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
              <CardDescription className="text-sm text-muted-foreground">{offer.product_name}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="mb-4">
                {offer.original_price && (
                  <p className="text-sm text-muted-foreground line-through">
                    ₱{offer.original_price?.toFixed(2)}
                  </p>
                )}
                <p className="text-2xl font-bold text-primary">
                  {offer.discounted_price ? `₱${offer.discounted_price?.toFixed(2)}` : "Special Offer"}
                </p>
                {offer.discount_percentage && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {offer.discount_percentage?.toFixed(0)}%
                  </p>
                )}
              </div>
              {user ? (
                <Button 
                  className="w-full" 
                  onClick={handleRedeemClick}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Redeem Now
                </Button>
              ) : (
                <Link href="/auth/signup">
                  <Button className="w-full">
                    <Star className="mr-2 h-4 w-4" />
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
            <DialogTitle>Redeem Exclusive Offer</DialogTitle>
            <DialogDescription>Confirm your exclusive offer redemption</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg">{offer.title}</h3>
                <p className="text-sm text-muted-foreground">{offer.product_name}</p>
                <p className="text-sm text-muted-foreground">{business.business_name}</p>
              </div>
              <p className="text-sm text-muted-foreground">{offer.description}</p>
              
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium">Offer Details:</p>
                {offer.original_price && (
                  <p className="text-xs text-muted-foreground line-through">
                    Original Price: ₱{offer.original_price?.toFixed(2)}
                  </p>
                )}
                <p className="text-lg font-bold text-primary">
                  {offer.discounted_price ? `₱${offer.discounted_price?.toFixed(2)}` : "Special Offer"}
                </p>
                {offer.discount_percentage && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Save {offer.discount_percentage?.toFixed(0)}%
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              When you redeem this exclusive offer, you'll receive a QR code to show to the business. 
              Present this QR code to claim your exclusive offer.
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
            <DialogTitle>Exclusive Offer QR Code</DialogTitle>
            <DialogDescription>Show this QR code to the business to claim your offer</DialogDescription>
          </DialogHeader>
          {redemptionDetails && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg border bg-white p-6">
                <QRCodeSVG value={redemptionQRCode} size={200} level="H" />
              </div>

              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold mb-2">{redemptionDetails.offer.title}</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {redemptionDetails.offer.product_name}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {redemptionDetails.business.business_name}
                </p>
                <div className="text-sm">
                  <p className="font-medium">Offer Value:</p>
                  <p className="text-primary font-bold">
                    {redemptionDetails.offer.discounted_price ? `₱${redemptionDetails.offer.discounted_price?.toFixed(2)}` : "Special Offer"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Show this QR code to the business to claim your exclusive offer. This QR code is valid for one-time use.
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