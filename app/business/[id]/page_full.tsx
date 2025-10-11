import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Clock, Gift, Star, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { GoogleMap } from "@/components/google-map"
import dynamic from 'next/dynamic'
import { toast } from "sonner"

// Dynamically import the client component
const RewardCard = dynamic(
  () => import('@/app/business/[id]/reward-card').then(mod => mod.RewardCard)
)

interface PageProps {
  params: {
    id: string
  }
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

interface Reward {
  id: string
  business_id: string
  name: string
  description: string
  points_required: number
  is_active: boolean
}

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
}

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

export default async function BusinessProfilePage({ params }: PageProps) {
  // Await params to fix Next.js 15 dynamic route parameter requirement
  const awaitedParams = await params
  
  let business: any = null;
  let rewards: any[] = [];
  let discountOffers: any[] = [];
  let exclusiveOffers: any[] = [];
  let supabaseClient: any = null;
  
  try {
    supabaseClient = await createServerClient()

    // Fetch business details
    const businessResult = await supabaseClient.from("businesses").select("*").eq("id", awaitedParams.id).single()
    if (businessResult.error || !businessResult.data) {
      notFound()
    }
    business = businessResult.data

    // Fetch business rewards
    const rewardsResult = await supabaseClient
      .from("rewards")
      .select("*")
      .eq("business_id", awaitedParams.id)
      .eq("is_active", true)
      .order("points_required", { ascending: true })
    rewards = rewardsResult.data || []

    // Fetch discount offers
    const discountOffersResult = await supabaseClient
      .from("discount_offers")
      .select("*")
      .eq("business_id", awaitedParams.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    discountOffers = discountOffersResult.data || []

    // Fetch exclusive offers
    const exclusiveOffersResult = await supabaseClient
      .from("exclusive_offers")
      .select("*")
      .eq("business_id", awaitedParams.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
    exclusiveOffers = exclusiveOffersResult.data || []

  } catch (error) {
    console.error("Server Components error:", error)
    notFound()
  }

  const businessHours = business?.business_hours

  // Check if user is authenticated
  let user = null;
  try {
    if (supabaseClient) {
      const userResult = await supabaseClient.auth.getUser()
      user = userResult.data?.user
    }
  } catch (error) {
    console.error("Auth error:", error)
  }

  // Get Google Maps API key from environment variables
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header with back button and logo */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container-padding-x container mx-auto py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Discovery
            </Button>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/giya-logo.png" alt="Giya" width={32} height={32} className="object-contain" />
            <span className="font-semibold hidden sm:inline">Giya</span>
          </Link>
        </div>
      </header>

      {/* Business Hero Section */}
      <section className="bg-background">
        <div className="container-padding-x container mx-auto py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Business Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={business?.profile_pic_url || undefined} />
                  <AvatarFallback className="text-2xl">{business?.business_name?.charAt(0) || 'B'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="heading-lg mb-2">{business?.business_name || 'Business'}</h1>
                      <Badge variant="secondary" className="mb-3">
                        {business?.business_category || 'Category'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{business?.address || 'Address not available'}</span>
                    </div>
                    {businessHours && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">Business Hours</p>
                          <p className="text-sm">{businessHours.hours || JSON.stringify(businessHours)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Points System Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Points System
                  </CardTitle>
                  <CardDescription>Earn points with every purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-primary/10 p-4">
                    <p className="text-2xl font-bold text-primary">1 point = ₱{business?.points_per_currency || 100}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Spend ₱{business?.points_per_currency || 100} to earn 1 loyalty point
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Google Maps */}
              {business?.gmaps_link && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GoogleMap 
                      url={business.gmaps_link} 
                      address={business.address} 
                      apiKey={googleMapsApiKey}
                    />
                    <a href={business.gmaps_link} target="_blank" rel="noopener noreferrer">
                      <Button className="mt-3 w-full sm:w-auto gap-2">
                        <MapPin className="h-4 w-4" />
                        Visit Location
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Quick Actions */}
            <div className="space-y-4">
              {user ? (
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-2">Visit & Earn Points</h3>
                    <p className="text-sm opacity-90 mb-4">
                      Show your QR code at checkout to earn points with every purchase
                    </p>
                    <Link href="/dashboard/customer">
                      <Button variant="secondary" className="w-full">
                        View My QR Code
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-2">Start Earning Points</h3>
                    <p className="text-sm opacity-90 mb-4">
                      Create an account to earn points and redeem exclusive rewards
                    </p>
                    <Link href="/auth/signup">
                      <Button variant="secondary" className="w-full">
                        Sign Up Now
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Gift className="h-12 w-12 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-1">{rewards?.length || 0} Rewards Available</h3>
                    <p className="text-sm text-muted-foreground">Redeem your points for exclusive perks</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="section-padding-y">
        <div className="container-padding-x container mx-auto">
          <div className="mb-8">
            <h2 className="heading-lg mb-2">Available Rewards</h2>
            <p className="text-muted-foreground">Redeem your points for these exclusive rewards</p>
          </div>

          {!rewards || rewards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gift className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No rewards yet</h3>
                <p className="text-sm text-muted-foreground">
                  This business hasn't added any rewards yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <div key={reward.id}>
                  <RewardCard 
                    reward={reward} 
                    business={business} 
                    user={user} 
                    businessId={awaitedParams.id} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Discount Offers Section */}
      <section className="section-padding-y bg-background">
        <div className="container-padding-x container mx-auto">
          <div className="mb-8">
            <h2 className="heading-lg mb-2">Special Discounts</h2>
            <p className="text-muted-foreground">Take advantage of these exclusive discount offers</p>
          </div>

          {!discountOffers || discountOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gift className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No discount offers yet</h3>
                <p className="text-sm text-muted-foreground">
                  This business hasn't added any discount offers yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {discountOffers.map((offer: any) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <CardDescription>{offer.description || "Special discount offer"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-primary">
                        {offer.discount_type === "percentage" 
                          ? `${offer.discount_value}% OFF` 
                          : offer.discount_type === "fixed_amount" 
                            ? `₱${offer.discount_value?.toFixed(2)} OFF` 
                            : `${offer.discount_value} POINTS`}
                      </p>
                      {offer.minimum_purchase && (
                        <p className="text-sm text-muted-foreground">
                          Min. purchase: ₱{offer.minimum_purchase?.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button className="w-full" onClick={() => {
                      toast.info("Customers can access this offer by visiting their Discounts page and clicking 'Redeem Now'")
                    }}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Exclusive Offers Section */}
      <section className="section-padding-y">
        <div className="container-padding-x container mx-auto">
          <div className="mb-8">
            <h2 className="heading-lg mb-2">Exclusive Offers</h2>
            <p className="text-muted-foreground">Special deals on specific products and services</p>
          </div>

          {!exclusiveOffers || exclusiveOffers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gift className="mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No exclusive offers yet</h3>
                <p className="text-sm text-muted-foreground">
                  This business hasn't added any exclusive offers yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {exclusiveOffers.map((offer: any) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{offer.title}</CardTitle>
                    <CardDescription>{offer.product_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                        <p className="text-sm text-green-600 font-medium">
                          Save {offer.discount_percentage?.toFixed(0)}%
                        </p>
                      )}
                    </div>
                    <Button className="w-full" onClick={() => {
                      toast.info("Customers can access this offer by visiting their Exclusive Offers page and clicking 'Redeem Now'")
                    }}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}