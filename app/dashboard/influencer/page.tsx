"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link2, TrendingUp, Award, Copy, Check, Users, Settings } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

// Import new components
import { InfluencerStats } from "@/components/dashboard/influencer-stats"
import { GenerateLinksTab } from "@/components/dashboard/generate-links-tab"
import { MyLinksTab } from "@/components/dashboard/my-links-tab"
import { ConversionsTab } from "@/components/dashboard/conversions-tab"

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
      <DashboardLayout
        userRole="influencer"
        userName="Loading..."
        userEmail=""
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!influencerData) {
    return (
      <DashboardLayout
        userRole="influencer"
        userName="Error"
        userEmail=""
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Unable to load influencer data</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate total points earned from conversions
  const totalPointsFromConversions = conversions.reduce((sum, conversion) => sum + conversion.points_earned, 0);

  return (
    <DashboardLayout
      userRole="influencer"
      userName={influencerData.full_name}
      userEmail="Influencer"
      userAvatar={influencerData.profile_pic_url}
      breadcrumbs={[]}
    >
      {/* Stats Overview */}
      <InfluencerStats
        totalPoints={influencerData.total_points}
        affiliateLinksCount={affiliateLinks.length}
        conversionsCount={conversions.length}
        totalPointsFromConversions={totalPointsFromConversions}
      />

      {/* Tabs */}
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Links</TabsTrigger>
          <TabsTrigger value="links">My Links</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4">
          <GenerateLinksTab
            businesses={businesses}
            affiliateLinks={affiliateLinks}
            onGenerateLink={generateAffiliateLink}
          />
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <MyLinksTab
            affiliateLinks={affiliateLinks}
            copiedCode={copiedCode}
            onCopyCode={copyToClipboard}
            onCopyFullLink={copyFullLinkToClipboard}
          />
        </TabsContent>

        <TabsContent value="conversions" className="mt-4">
          <ConversionsTab conversions={conversions} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}