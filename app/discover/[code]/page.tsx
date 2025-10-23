import { createServerClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Gift, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { GoogleMap } from "@/components/google-map"

interface PageProps {
  params: {
    code: string
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
  description: string | null
  latitude: number | null
  longitude: number | null
}

export default async function DiscoverBusinessPage({ params }: PageProps) {
  // Await params to fix Next.js 15 dynamic route parameter requirement
  const awaitedParams = await params
  
  let business: Business | null = null;
  let supabaseClient: any = null;
  
  try {
    supabaseClient = await createServerClient()

    // Fetch business by access link code
    const businessResult = await supabaseClient
      .from("businesses")
      .select("*")
      .or(`access_link.eq.${awaitedParams.code},access_qr_code.eq.${awaitedParams.code}`)
      .single()
      
    if (businessResult.error || !businessResult.data) {
      notFound()
    }
    
    business = businessResult.data
  } catch (error) {
    console.error("Server Components error:", error)
    notFound()
  }

  // Check if user is authenticated
  let user = null;
  let userProfile = null;
  try {
    if (supabaseClient) {
      const userResult = await supabaseClient.auth.getUser()
      user = userResult.data?.user
      
      if (user) {
        // Get user profile to check their role
        const profileResult = await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        
        if (!profileResult.error) {
          userProfile = profileResult.data
        }
      }
    }
  } catch (error) {
    console.error("Auth error:", error)
  }

  // Get Google Maps API key from environment variables
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  // If user is authenticated, redirect them appropriately
  if (user && business) {
    if (userProfile?.role === 'customer') {
      // If user is a customer, redirect them to the business page
      return redirect(`/business/${business.id}`)
    } else if (userProfile?.role === 'business') {
      // If user is a business, redirect them to their dashboard
      return redirect(`/dashboard/business`)
    } else if (userProfile?.role === 'influencer') {
      // If user is an influencer, redirect them to their dashboard
      return redirect(`/dashboard/influencer`)
    } else {
      // If user has no role or unknown role, redirect to role selection
      return redirect(`/auth/role-selection`)
    }
  }

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header with logo */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/giya-logo.png" alt="Giya" width={32} height={32} className="object-contain" />
            <span className="font-semibold">Giya</span>
          </Link>
        </div>
      </header>

      {/* Business Discovery Section */}
      <section className="bg-background">
        <div className="container-padding-x container mx-auto py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={business?.profile_pic_url || undefined} alt={business?.business_name || 'Business'} />
                    <AvatarFallback className="text-2xl">{business?.business_name?.charAt(0) || 'B'}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">{business?.business_name || 'Business'}</CardTitle>
                <CardDescription>{business?.business_category || 'Category'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Description */}
                {business?.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">
                      {business.description}
                    </p>
                  </div>
                )}

                {/* Address */}
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <span>{business?.address || 'Address not available'}</span>
                  </div>
                </div>

                {/* Points System */}
                <div>
                  <h3 className="font-semibold mb-2">Loyalty Program</h3>
                  <div className="rounded-lg bg-primary/10 p-4">
                    <p className="text-xl font-bold text-primary">1 point = ₱{business?.points_per_currency || 100}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Earn points with every purchase at {business?.business_name}
                    </p>
                  </div>
                </div>

                {/* Google Maps */}
                {business?.gmaps_link && (
                  <div>
                    <h3 className="font-semibold mb-2">Map</h3>
                    <GoogleMap 
                      url={business.gmaps_link} 
                      address={business.address} 
                      apiKey={googleMapsApiKey}
                    />
                  </div>
                )}

                {/* Call to Action */}
                <div className="pt-4">
                  <h3 className="font-semibold text-center mb-4">Join Giya to Start Earning Points</h3>
                  <div className="flex flex-col gap-3">
                    <Link href="/auth/signup/customer">
                      <Button className="w-full">
                        Sign Up as Customer
                      </Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button variant="outline" className="w-full">
                        Already have an account? Log in
                      </Button>
                    </Link>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    After signing up, visit {business?.business_name} and show your QR code to start earning points!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}