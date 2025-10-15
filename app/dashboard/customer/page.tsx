"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, QrCode, TrendingUp, Gift, Award, Settings, Building2, Tag, RefreshCw } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { OptimizedImage } from "@/components/optimized-image"
import { toast } from "sonner"

// Import types from the hook
import type { CustomerData, BusinessPoints, Transaction, Redemption } from "@/hooks/use-dashboard-data"

// Import new components
import { CustomerStats } from "@/components/dashboard/customer-stats"
import { DiscoverBusinesses } from "@/components/dashboard/discover-businesses"
import { QrCodeCard } from "@/components/dashboard/qr-code-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { BusinessPointsSection } from "@/components/dashboard/business-points-section"
import { CustomerTransactionHistory } from "@/components/dashboard/customer-transaction-history"

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

export default function CustomerDashboard() {
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [businessDiscovery, setBusinessDiscovery] = useState<BusinessDiscovery[]>([])
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const { data, isLoading, error, refetch } = useDashboardData({ userType: 'customer' })

  // Fetch business discovery data separately since it's not user-specific
  useEffect(() => {
    const fetchBusinessDiscovery = async () => {
      try {
        // First, fetch all businesses with basic data
        const { data: businessesData, error: businessesError } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url, points_per_currency")
          .limit(10)

        if (businessesError) throw businessesError

        // For now, let's fetch all related data and process it manually
        // This avoids complex SQL queries that might not work in all environments
        const businessIds = businessesData?.map((business: { id: string }) => business.id) || []
        
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
        const processedBusinesses = businessesData?.map((business: any) => {
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

        setBusinessDiscovery(processedBusinesses)
      } catch (error) {
        console.error("Error fetching business discovery data:", error)
        // Don't show error to user for discovery data, just show empty state
        setBusinessDiscovery([])
      }
    }

    fetchBusinessDiscovery()
  }, [])

  // Add real-time subscription for redemption validations
  useEffect(() => {
    // Only subscribe if we have customer data
    if (!data?.customer?.id) {
      return;
    }

    console.log("[v0] Setting up redemption validation subscription for customer:", data.customer.id);
    
    const channel = supabase
      .channel('redemption-validation')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemptions',
          filter: 'status=eq.validated'
        },
        (payload: any) => {
          console.log("[v0] Received redemption validation update:", payload);
          // Check if this redemption belongs to the current customer
          if (payload.new.customer_id === data?.customer?.id) {
            // Show toast notification
            toast.success('Redemption Validated!', {
              description: `Your redemption has been validated by the business.`,
              duration: 5000
            })
            
            // Refetch data to update the UI
            refetch()
          }
        }
      )
      .subscribe((status: any) => {
        console.log("[v0] Redemption validation subscription status:", status);
      })

    // Cleanup function
    return () => {
      console.log("[v0] Cleaning up redemption validation subscription");
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn("[v0] Error cleaning up redemption validation subscription:", error);
      }
    }
  }, [data?.customer?.id, refetch])

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Loading..."
        breadcrumbs={[]}
      >
        {/* Main Content with skeleton loading */}
        <div className="flex flex-col gap-6">
          {/* Stats Overview skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </CardContent>
          </Card>

          {/* Discover Businesses skeleton */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* QR Code Card skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-1 h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Skeleton className="h-48 w-48 rounded-lg" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Error"
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Error Loading Dashboard</CardTitle>
              <CardDescription className="text-center">
                There was an error loading your dashboard. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-destructive text-center">
                {(error as any) instanceof Error ? (error as any).message : "An unknown error occurred"}
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole="customer"
      userName={data?.customer?.full_name || "Customer"}
      breadcrumbs={[]}
    >
      <div className="flex flex-col gap-6">
        {/* Stats Overview */}
        <CustomerStats 
          totalPoints={data?.customer?.total_points || 0}
          totalTransactions={data?.transactions?.length || 0}
          totalRedemptions={data?.redemptions?.length || 0}
        />

        {/* Quick Actions */}
        <QuickActions 
          onShowQRDialog={() => setShowQRDialog(true)}
        />

        {/* Discover Businesses */}
        <DiscoverBusinesses businessDiscovery={businessDiscovery} />

        {/* QR Code Card */}
        {data?.customer?.qr_code_data && (
          <QrCodeCard 
            qrCodeData={data?.customer?.qr_code_data || ""}
          />
        )}

        {/* Business Points Section */}
        <BusinessPointsSection businessPoints={data?.businessPoints || []} />

        {/* Transaction History */}
        <CustomerTransactionHistory 
          transactions={data?.transactions || []}
          redemptions={data?.redemptions || []}
        />
      </div>
    </DashboardLayout>
  )
}