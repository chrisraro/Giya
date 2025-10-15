import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Gift, Star, Percent } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Business {
  id: string
  business_name: string
  business_category: string
  address: string
  profile_pic_url: string | null
  business_hours: any
  points_per_currency: number
  rewards_count?: number
  exclusive_offers_count?: number
  max_discount?: number
}

export async function BusinessDiscovery() {
  const supabase = await createServerClient()

  try {
    // First, fetch all businesses with basic data
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, business_name, business_category, address, profile_pic_url, business_hours, points_per_currency")
      .order("created_at", { ascending: false })

    if (businessesError) {
      console.error("Error fetching businesses:", businessesError)
      return <EmptyState />
    }

    // For now, let's fetch all related data and process it manually
    // This avoids complex SQL queries that might not work in all environments
    const businessIds = businesses?.map((business: any) => business.id) || []
    
    // Initialize arrays for related data
    let allRewards: any[] = []
    let allExclusiveOffers: any[] = []
    let allDiscountOffers: any[] = []
    
    // Only fetch related data if we have business IDs
    if (businessIds.length > 0) {
      // Fetch all rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("business_id")
        .in("business_id", businessIds)
      
      if (!rewardsError && rewardsData) {
        allRewards = rewardsData
      }
      
      // Fetch all exclusive offers
      const { data: exclusiveOffersData, error: exclusiveOffersError } = await supabase
        .from("exclusive_offers")
        .select("business_id")
      
      if (!exclusiveOffersError && exclusiveOffersData) {
        allExclusiveOffers = exclusiveOffersData
      }
      
      // Fetch all discount offers
      const { data: discountOffersData, error: discountOffersError } = await supabase
        .from("discount_offers")
        .select("business_id, discount_value")

      if (!discountOffersError && discountOffersData) {
        allDiscountOffers = discountOffersData
      }
    }

    // Process the data to combine all information
    const processedBusinesses = businesses?.map((business: any) => {
      // Count rewards for this business
      const rewardsCount = allRewards?.filter((r: any) => r.business_id === business.id).length || 0
      
      // Count exclusive offers for this business
      const exclusiveOffersCount = allExclusiveOffers?.filter((e: any) => e.business_id === business.id).length || 0
      
      // Find max discount for this business
      const businessDiscounts = allDiscountOffers?.filter((d: any) => d.business_id === business.id) || []
      const maxDiscount = businessDiscounts.length > 0 
        ? Math.max(...businessDiscounts.map((d: any) => d.discount_value || 0)) 
        : 0

      return {
        ...business,
        rewards_count: rewardsCount,
        exclusive_offers_count: exclusiveOffersCount,
        max_discount: maxDiscount
      }
    }) || []

    return (
      <section id="businesses" className="section-padding-y bg-background">
        <div className="container-padding-x container mx-auto">
          <div className="mb-8 md:mb-12">
            <h2 className="heading-lg mb-2">Discover Local Businesses in <span className="text-primary">Naga City</span></h2>
            <p className="text-muted-foreground">Explore amazing local spots and earn rewards with every visit</p>
          </div>

          {!processedBusinesses || processedBusinesses.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {processedBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          )}
        </div>
      </section>
    )
  } catch (error) {
    console.error("Error in BusinessDiscovery:", error)
    return <EmptyState />
  }
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.id}`}>
      <Card className={`group transition-all hover:shadow-lg ${business.profile_pic_url ? 'p-0' : 'p-4'}`}>
        {business.profile_pic_url ? (
          <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
              <Image
                src={business.profile_pic_url || "/placeholder.svg"}
                alt={business.business_name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <div className="mb-2">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">{business.business_name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {business.business_category}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{business.address}</span>
                </div>
                {business.business_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">Open today</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-sm">
                <span className="font-medium text-primary">
                  1 point per ₱{business.points_per_currency || 100}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  <Gift className="h-3 w-3 mr-1" />
                  {business.rewards_count || 0} rewards
                </div>
                <div className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                  <Star className="h-3 w-3 mr-1" />
                  {business.exclusive_offers_count || 0} offers
                </div>
                {business.max_discount && business.max_discount > 0 && (
                  <div className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    <Percent className="h-3 w-3 mr-1" />
                    Up to {business.max_discount}% off
                  </div>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-0">
            <div className="p-4">
              <div className="mb-2">
                <h3 className="font-semibold text-lg line-clamp-1 mb-1">{business.business_name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {business.business_category}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{business.address}</span>
                </div>
                {business.business_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs">Open today</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-sm">
                <span className="font-medium text-primary">
                  1 point per ₱{business.points_per_currency || 100}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  <Gift className="h-3 w-3 mr-1" />
                  {business.rewards_count || 0} rewards
                </div>
                <div className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                  <Star className="h-3 w-3 mr-1" />
                  {business.exclusive_offers_count || 0} offers
                </div>
                {business.max_discount && business.max_discount > 0 && (
                  <div className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    <Percent className="h-3 w-3 mr-1" />
                    Up to {business.max_discount}% off
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-semibold">No businesses yet</h3>
      <p className="text-center text-muted-foreground max-w-md">
        Be the first to discover amazing local businesses. Check back soon as new spots join Giya!
      </p>
    </div>
  )
}