"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, QrCode, TrendingUp, Gift, Award, Settings, Building2, Tag } from "lucide-react"
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

// Dynamically import the memoized components
import dynamic from 'next/dynamic'

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
}

export default function CustomerDashboard() {
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [businessDiscovery, setBusinessDiscovery] = useState<BusinessDiscovery[]>([])
  const router = useRouter()
  const supabase = createClient()
  
  const { data, isLoading, error, refetch } = useDashboardData({ userType: 'customer' })

  // Fetch business discovery data separately since it's not user-specific
  useEffect(() => {
    const fetchBusinessDiscovery = async () => {
      const { data: discoveryBusinesses, error: discoveryError } = await supabase
        .from("businesses")
        .select("id, business_name, business_category, profile_pic_url, points_per_currency")
        .limit(10)

      if (!discoveryError) {
        setBusinessDiscovery(discoveryBusinesses || [])
      }
    }

    fetchBusinessDiscovery()
  }, [supabase])

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
  }, [supabase, data?.customer?.id, refetch])

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
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!data || !data.customer) {
    return (
      <DashboardLayout
        userRole="customer"
        userName="Error"
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Unable to load customer data</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const customer: CustomerData = data.customer;
  const transactions: Transaction[] = data.transactions || [];
  const redemptions: Redemption[] = data.redemptions || [];
  const businessPoints: BusinessPoints[] = data.businessPoints || [];

  // Debug logging
  console.log("[v0] Customer data:", customer);
  console.log("[v0] Transactions:", transactions);
  console.log("[v0] Redemptions:", redemptions);
  console.log("[v0] Business points:", businessPoints);

  return (
    <DashboardLayout
      userRole="customer"
      userName={customer.full_name}
      userEmail={customer.nickname ? `@${customer.nickname}` : undefined}
      userAvatar={customer.profile_pic_url}
      breadcrumbs={[]}
    >
      {/* Points Overview */}
      <CustomerStats 
        totalPoints={customer.total_points}
        totalTransactions={transactions.length}
        totalRedemptions={redemptions.length}
      />

      {/* Discover Businesses */}
      <DiscoverBusinesses businessDiscovery={businessDiscovery} />

      {/* QR Code Card */}
      <QrCodeCard qrCodeData={customer.qr_code_data} />

      {/* Business Points Section */}
      <BusinessPointsSection businessPoints={businessPoints} />

      {/* Quick Actions */}
      <QuickActions onShowQRDialog={() => setShowQRDialog(true)} />

      {/* Transaction History */}
      <CustomerTransactionHistory transactions={transactions} redemptions={redemptions} />
    </DashboardLayout>
  )
}