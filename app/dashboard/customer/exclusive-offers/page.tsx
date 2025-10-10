"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { Calendar, Tag, Users, QrCode } from "lucide-react"
import { handleApiError } from "@/lib/error-handler"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
  qr_code_data?: string
}

export default function CustomerExclusiveOffersPage() {
  const [offers, setOffers] = useState<ExclusiveOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<ExclusiveOffer | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAvailableOffers()
  }, [])

  const fetchAvailableOffers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get all active exclusive offers that are valid
      const { data, error } = await supabase
        .from("exclusive_offers")
        .select(`
          *,
          businesses (
            business_name,
            profile_pic_url
          )
        `)
        .eq("is_active", true)
        .gte("valid_until", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error
      
      setOffers(data || [])
    } catch (error) {
      handleApiError(error, "Failed to load exclusive offers", "CustomerExclusiveOffers.fetchAvailableOffers")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₱0.00"
    return `₱${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry"
    return new Date(dateString).toLocaleDateString()
  }

  const handleRedeemClick = (offer: ExclusiveOffer) => {
    if (!offer.qr_code_data) {
      toast.error("QR code data not available for this offer")
      return
    }
    setSelectedOffer(offer)
    setShowQRDialog(true)
  }

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <h1 className="text-2xl font-bold text-foreground">Exclusive Offers</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-padding-x container mx-auto py-8">
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/customer">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent>
                Exclusive Offers
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Offers Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : offers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No exclusive offers available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for new exclusive offers from businesses
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <Card key={offer.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{offer.title}</CardTitle>
                        <CardDescription>{offer.businesses.business_name}</CardDescription>
                      </div>
                      {offer.discount_percentage && (
                        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          <Tag className="h-3 w-3" />
                          <span>{offer.discount_percentage.toFixed(0)}% OFF</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{offer.product_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {offer.description || "No description available"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {offer.original_price && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">
                            {formatCurrency(offer.original_price)}
                          </span>
                        </div>
                      )}
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(offer.discounted_price)}
                      </div>
                      {offer.discount_percentage && (
                        <div className="text-sm text-green-600 font-medium">
                          You save {offer.discount_percentage.toFixed(0)}%!
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Valid until:</span>
                        <span className="font-medium">{formatDate(offer.valid_until)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Usage:</span>
                        <span className="font-medium">
                          {offer.used_count} / {offer.usage_limit || "∞"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4">
                      <Button className="w-full" onClick={() => handleRedeemClick(offer)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Redeem Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Exclusive Offer</DialogTitle>
            <DialogDescription>
              Show this QR code to the business to redeem your exclusive offer
            </DialogDescription>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <QRCodeSVG value={selectedOffer.qr_code_data || ""} size={200} level="H" />
              </div>
              
              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold">{selectedOffer.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedOffer.businesses.business_name}</p>
                <p className="text-sm font-medium">{selectedOffer.product_name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">
                    {formatCurrency(selectedOffer.discounted_price)}
                  </span>
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Present this QR code to the business staff to redeem your exclusive offer
              </p>
              
              <Button onClick={() => setShowQRDialog(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}