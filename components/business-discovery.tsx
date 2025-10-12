import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Business {
  id: string
  business_name: string
  business_category: string
  address: string
  profile_pic_url: string | null
  business_hours: any
}

export async function BusinessDiscovery() {
  const supabase = await createServerClient()

  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, business_name, business_category, address, profile_pic_url, business_hours")
    .order("created_at", { ascending: false })

  return (
    <section id="businesses" className="section-padding-y bg-background">
      <div className="container-padding-x container mx-auto">
        <div className="mb-8 md:mb-12">
          <h2 className="heading-lg mb-2">Discover Local Businesses</h2>
          <p className="text-muted-foreground">Explore amazing local spots and earn rewards with every visit</p>
        </div>

        {!businesses || businesses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
          {business.profile_pic_url ? (
            <Image
              src={business.profile_pic_url || "/placeholder.svg"}
              alt={business.business_name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">{business.business_name.charAt(0)}</span>
                </div>
              </div>
            </div>
          )}
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
        </CardContent>
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
