import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Gift, Star, Percent } from "lucide-react"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/optimized-image"

interface BusinessDiscovery {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
  points_per_currency: number
  rewards_count?: number
  exclusive_offers_count?: number
  max_discount?: number
}

interface DiscoverBusinessesProps {
  businessDiscovery: BusinessDiscovery[]
}

export function DiscoverBusinesses({ businessDiscovery }: DiscoverBusinessesProps) {
  const router = useRouter()

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Discover Businesses</h2>
        <Button variant="link" onClick={() => router.push("/business")} className="text-primary">
          View All
        </Button>
      </div>
      {businessDiscovery.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No businesses found</p>
            <p className="text-xs text-muted-foreground">Check back later for new businesses!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businessDiscovery.map((business, index) => (
            <Card 
              key={business.id || `business-${index}`} 
              className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${business.profile_pic_url ? 'p-0' : 'p-4'}`}
              onClick={() => router.push(`/business/${business.id}`)}
            >
              {business.profile_pic_url ? (
                <>
                  <div className="relative h-32 w-full overflow-hidden rounded-t-lg">
                    <div className="relative h-full w-full">
                      <OptimizedImage 
                        src={business.profile_pic_url} 
                        alt={business.business_name} 
                        width={200} 
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {business.profile_pic_url ? (
                          <OptimizedImage 
                            src={business.profile_pic_url} 
                            alt={business.business_name} 
                            width={48} 
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{business.business_name}</h3>
                        <p className="text-sm text-muted-foreground">{business.business_category}</p>
                      </div>
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
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{business.business_name}</h3>
                    <p className="text-sm text-muted-foreground">{business.business_category}</p>
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-primary">
                        1 point per ₱{business.points_per_currency || 100}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
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
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
