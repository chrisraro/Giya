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
import { Calendar, Tag, Users } from "lucide-react"
import { handleApiError } from "@/lib/error-handler"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

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
                    
                    {/* QR Code Section */}
                    {offer.qr_code_data && (
                      <div className="pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Show this QR code to redeem offer:</p>
                        <div className="flex justify-center">
                          <div className="border rounded p-2 bg-white">
                            <QRCodeSVG value={offer.qr_code_data} size={120} level="H" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-4">
                      <Button className="w-full" onClick={() => {
                        // Navigate to business profile to use the offer
                        router.push(`/business/${offer.business_id}`)
                      }}>
                        View Business
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}