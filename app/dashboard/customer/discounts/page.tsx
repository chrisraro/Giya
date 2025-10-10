"use client"

// Customer Discounts Page
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
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
  qr_code_data?: string
}

export default function CustomerDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOffer | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAvailableDiscounts()
  }, [])

  const fetchAvailableDiscounts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get all active discount offers that are valid for this customer
      const { data, error } = await supabase
        .from("discount_offers")
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
      
      // Filter for first visit only offers if needed
      const filteredDiscounts = data?.filter((discount: DiscountOffer) => {
        // If it's a first visit only offer, check if customer has visited this business before
        if (discount.is_first_visit_only) {
          return checkFirstVisit(user.id, discount.business_id)
        }
        return true
      }) || []

      setDiscounts(filteredDiscounts)
    } catch (error) {
      handleApiError(error, "Failed to load discount offers", "CustomerDiscounts.fetchAvailableDiscounts")
    } finally {
      setLoading(false)
    }
  }

  const checkFirstVisit = async (customerId: string, businessId: string) => {
    try {
      // Check if customer has any transactions with this business
      const { data, error } = await supabase
        .from("points_transactions")
        .select("id")
        .eq("customer_id", customerId)
        .eq("business_id", businessId)
        .limit(1)

      if (error) throw error
      return data?.length === 0 // Return true if no transactions found (first visit)
    } catch (error) {
      console.error("Error checking first visit:", error)
      return false
    }
  }

  const formatDiscountValue = (type: string, value: number) => {
    if (type === "percentage") {
      return `${value}% OFF`
    } else if (type === "fixed_amount") {
      return `₱${value.toFixed(2)} OFF`
    }
    return `${value} POINTS`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry"
    return new Date(dateString).toLocaleDateString()
  }

  const handleRedeemClick = (discount: DiscountOffer) => {
    if (!discount.qr_code_data) {
      toast.error("QR code data not available for this offer")
      return
    }
    setSelectedDiscount(discount)
    setShowQRDialog(true)
  }

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <h1 className="text-2xl font-bold text-foreground">Available Discounts</h1>
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
                Discounts
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Discounts Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : discounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No discount offers available</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for new discount offers from businesses
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {discounts.map((discount) => (
                <Card key={discount.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{discount.title}</CardTitle>
                        <CardDescription>{discount.businesses.business_name}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Tag className="h-3 w-3" />
                        <span>{formatDiscountValue(discount.discount_type, discount.discount_value)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      {discount.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      {discount.minimum_purchase && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Min. purchase:</span>
                          <span className="font-medium">₱{discount.minimum_purchase.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Valid until:</span>
                        <span className="font-medium">{formatDate(discount.valid_until)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Usage:</span>
                        <span className="font-medium">
                          {discount.used_count} / {discount.usage_limit || "∞"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4">
                      <Button className="w-full" onClick={() => handleRedeemClick(discount)}>
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
            <DialogTitle>Redeem Discount</DialogTitle>
            <DialogDescription>
              Show this QR code to the business to redeem your discount
            </DialogDescription>
          </DialogHeader>
          {selectedDiscount && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <QRCodeSVG value={selectedDiscount.qr_code_data || ""} size={200} level="H" />
              </div>
              
              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold">{selectedDiscount.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedDiscount.businesses.business_name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">
                    {formatDiscountValue(selectedDiscount.discount_type, selectedDiscount.discount_value)}
                  </span>
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground">
                Present this QR code to the business staff to redeem your discount offer
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