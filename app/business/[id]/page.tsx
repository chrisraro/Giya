import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Clock, Gift, Star, ExternalLink } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: {
    id: string
  }
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const supabase = await createServerClient()

  // Fetch business details
  const { data: business, error } = await supabase.from("businesses").select("*").eq("id", params.id).single()

  if (error || !business) {
    notFound()
  }

  // Fetch business rewards
  const { data: rewards } = await supabase
    .from("rewards")
    .select("*")
    .eq("business_id", params.id)
    .eq("is_active", true)
    .order("points_required", { ascending: true })

  // Parse business hours if it exists
  const businessHours = business.business_hours ? JSON.parse(business.business_hours) : null

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header with back button */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Discovery
            </Button>
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
                  <AvatarImage src={business.profile_pic_url || undefined} />
                  <AvatarFallback className="text-2xl">{business.business_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="heading-lg mb-2">{business.business_name}</h1>
                      <Badge variant="secondary" className="mb-3">
                        {business.business_category}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{business.address}</span>
                    </div>
                    {businessHours && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">Business Hours</p>
                          <p className="text-sm">{businessHours}</p>
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
                    <p className="text-2xl font-bold text-primary">1 point = ₱{business.points_per_currency || 100}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Spend ₱{business.points_per_currency || 100} to earn 1 loyalty point
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Google Maps */}
              {business.gmaps_link && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video w-full overflow-hidden rounded-lg">
                      <iframe
                        src={business.gmaps_link.replace("/maps/", "/maps/embed/")}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <a
                      href={business.gmaps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center text-sm text-primary hover:underline"
                    >
                      Open in Google Maps
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Quick Actions */}
            <div className="space-y-4">
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
                <Card key={reward.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardTitle className="text-lg">{reward.reward_name}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-primary">{reward.points_required}</p>
                      <p className="text-sm text-muted-foreground">points required</p>
                    </div>
                    <Link href="/dashboard/customer/rewards">
                      <Button className="w-full">
                        <Gift className="mr-2 h-4 w-4" />
                        Claim Reward
                      </Button>
                    </Link>
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
