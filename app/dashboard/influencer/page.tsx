"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link2, TrendingUp, LogOut, Award, Copy, Check, Users, Settings } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"

interface InfluencerData {
  id: string
  full_name: string
  profile_pic_url: string | null
  total_points: number
  social_media_links: any
}

interface Business {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
}

interface AffiliateLink {
  id: string
  business_id: string
  unique_code: string
  created_at: string
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
}

interface Conversion {
  id: string
  converted_at: string
  customers: {
    full_name: string
  }
  points_earned: number
}

export default function InfluencerDashboard() {
  const [influencerData, setInfluencerData] = useState<InfluencerData | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch influencer data - only select necessary fields
        const { data: influencer, error: influencerError } = await supabase
          .from("influencers")
          .select("id, full_name, profile_pic_url, total_points")
          .eq("id", user.id)
          .single()

        if (influencerError) {
          handleApiError(influencerError, "Failed to fetch influencer data", "InfluencerDashboard.fetchInfluencerData")
          return
        }
        setInfluencerData(influencer)

        // Fetch all businesses - optimized query with only necessary fields
        const { data: businessesData, error: businessesError } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url")
          .order("business_name")

        if (businessesError) {
          handleApiError(businessesError, "Failed to fetch businesses", "InfluencerDashboard.fetchBusinesses")
          return
        }
        setBusinesses(businessesData || [])

        // Fetch affiliate links - optimized query with covering index
        const { data: linksData, error: linksError } = await supabase
          .from("affiliate_links")
          .select(
            `
            id,
            business_id,
            unique_code,
            created_at,
            businesses (
              business_name,
              profile_pic_url
            )
          `,
          )
          .eq("influencer_id", user.id)
          .order("created_at", { ascending: false })

        if (linksError) {
          handleApiError(linksError, "Failed to fetch affiliate links", "InfluencerDashboard.fetchAffiliateLinks")
          return
        }
        setAffiliateLinks(linksData || [])

        // Fetch conversions with points earned - optimized query with covering index
        const { data: conversionsData, error: conversionsError } = await supabase
          .from("affiliate_conversions")
          .select(
            `
            id,
            converted_at,
            points_earned,
            customers (
              full_name
            )
          `,
          )
          .in(
            "affiliate_link_id",
            (linksData || []).map((link: AffiliateLink) => link.id),
          )
          .order("converted_at", { ascending: false })
          .limit(10)

        if (conversionsError) {
          handleApiError(conversionsError, "Failed to fetch conversions", "InfluencerDashboard.fetchConversions")
          return
        }
        setConversions(conversionsData || [])
      } catch (error) {
        handleApiError(error, "Failed to load dashboard data. Please try again.", "InfluencerDashboard.fetchData")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const generateAffiliateLink = async (businessId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const uniqueCode = `${user.id.slice(0, 8)}-${businessId.slice(0, 8)}-${Date.now()}`

      const { data, error } = await supabase
        .from("affiliate_links")
        .insert({
          influencer_id: user.id,
          business_id: businessId,
          unique_code: uniqueCode,
        })
        .select(
          `
          id,
          business_id,
          unique_code,
          created_at,
          businesses (
            business_name,
            profile_pic_url
          )
        `,
        )
        .single()

      if (error) throw error

      setAffiliateLinks([data, ...affiliateLinks])
      toast.success("Affiliate link generated successfully!")
    } catch (error) {
      handleApiError(error, "Failed to generate affiliate link", "InfluencerDashboard.generateAffiliateLink")
    }
  }

  const copyToClipboard = (code: string) => {
    const fullUrl = `${window.location.origin}/signup?ref=${code}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedCode(code)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const copyFullLinkToClipboard = (code: string) => {
    const fullUrl = `${window.location.origin}/signup?ref=${code}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedCode(code)
    toast.success("Full link copied to clipboard!")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!influencerData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load influencer data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Calculate total points earned from conversions
  const totalPointsFromConversions = conversions.reduce((sum, conversion) => sum + conversion.points_earned, 0);

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={influencerData.profile_pic_url || undefined} />
              <AvatarFallback>{influencerData.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{influencerData.full_name}</h2>
              <p className="text-sm text-muted-foreground">Influencer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/influencer/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-padding-x container mx-auto py-8">
        <div className="flex flex-col gap-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{influencerData.total_points}</div>
                <p className="text-xs text-muted-foreground">Available to redeem</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Affiliate Links</CardTitle>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{affiliateLinks.length}</div>
                <p className="text-xs text-muted-foreground">Active links</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversions.length}</div>
                <p className="text-xs text-muted-foreground">Total referrals</p>
                {totalPointsFromConversions > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalPointsFromConversions} pts earned
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate Links</TabsTrigger>
              <TabsTrigger value="links">My Links</TabsTrigger>
              <TabsTrigger value="conversions">Conversions</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Affiliate Links</CardTitle>
                  <CardDescription>Create affiliate links for businesses to promote</CardDescription>
                </CardHeader>
                <CardContent>
                  {businesses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No businesses available yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {businesses.map((business) => (
                        <Card key={business.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={business.profile_pic_url || undefined} />
                                <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold">{business.business_name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {business.business_category}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              onClick={() => generateAffiliateLink(business.id)}
                              className="w-full"
                              size="sm"
                              disabled={affiliateLinks.some((link) => link.business_id === business.id)}
                            >
                              {affiliateLinks.some((link) => link.business_id === business.id) ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Link Created
                                </>
                              ) : (
                                <>
                                  <Link2 className="h-4 w-4" />
                                  Generate Link
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Affiliate Links</CardTitle>
                  <CardDescription>Your generated affiliate links</CardDescription>
                </CardHeader>
                <CardContent>
                  {affiliateLinks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Link2 className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No affiliate links yet</p>
                      <p className="text-xs text-muted-foreground">Generate links to start earning!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {affiliateLinks.map((link) => (
                        <Card key={link.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={link.businesses.profile_pic_url || undefined} />
                                <AvatarFallback>{link.businesses.business_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">{link.businesses.business_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Created: {new Date(link.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-muted rounded-md p-3 mb-3">
                              <p className="text-sm font-mono break-all">
                                {window.location.origin}/signup?ref={link.unique_code}
                              </p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(link.unique_code)}
                                className="flex-1"
                              >
                                {copiedCode === link.unique_code ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied Code
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Code
                                  </>
                                )}
                              </Button>
                              
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => copyFullLinkToClipboard(link.unique_code)}
                                className="flex-1"
                              >
                                {copiedCode === `full-${link.unique_code}` ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied Link
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Copy Link
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion History</CardTitle>
                  <CardDescription>Users who signed up through your links</CardDescription>
                </CardHeader>
                <CardContent>
                  {conversions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No conversions yet</p>
                      <p className="text-xs text-muted-foreground">Share your links to start earning!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversions.map((conversion) => (
                        <div
                          key={conversion.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                <Users className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{conversion.customers.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(conversion.converted_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default">{conversion.points_earned} pts</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}