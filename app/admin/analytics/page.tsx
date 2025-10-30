"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Building2, Activity, DollarSign, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Admin, PlatformStats, BusinessAnalytics, CustomerAnalytics } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

export default function AdminAnalyticsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [topBusinesses, setTopBusinesses] = useState<BusinessAnalytics[]>([])
  const [activeCustomers, setActiveCustomers] = useState<CustomerAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchAnalytics()
  }, [])

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/admin/login")
      return
    }

    const { data: isAdminResult } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdminResult) {
      router.push("/admin/login")
      return
    }

    const { data: adminData } = await supabase.rpc('get_admin_profile', { user_id: user.id })
    if (adminData && adminData.length > 0) {
      setAdmin(adminData[0])
    }
    setIsLoading(false)
  }

  const fetchAnalytics = async () => {
    try {
      // Fetch platform stats
      const { data: statsData, error: statsError } = await supabase
        .from("admin_platform_stats")
        .select("*")
        .single()

      if (statsError) {
        console.error("Stats error:", statsError)
      } else {
        setStats(statsData)
      }

      // Fetch top businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from("admin_business_analytics")
        .select("*")
        .eq("approval_status", "approved")
        .order("transaction_count", { ascending: false })
        .limit(10)

      if (businessesError) {
        console.error("Businesses error:", businessesError)
      } else {
        setTopBusinesses(businessesData || [])
      }

      // Fetch active customers
      const { data: customersData, error: customersError } = await supabase
        .from("admin_customer_analytics")
        .select("*")
        .order("lifetime_points_earned", { ascending: false })
        .limit(10)

      if (customersError) {
        console.error("Customers error:", customersError)
      } else {
        setActiveCustomers(customersData || [])
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics")
    }
  }

  if (isLoading || !admin) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <DashboardLayout
      userRole="admin"
      userName={admin.full_name}
      userAvatar={admin.profile_pic_url}
      breadcrumbs={[{ label: "Admin" }, { label: "Analytics" }]}
    >
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Platform performance and insights
          </p>
        </div>

        {/* Platform Stats Overview */}
        {stats && (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="text-xl md:text-2xl font-bold">
                  {(stats.total_points_issued / 10).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {stats.total_transactions} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Active Businesses</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="text-xl md:text-2xl font-bold">{stats.total_approved_businesses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pending_businesses} pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="text-xl md:text-2xl font-bold">{stats.total_customers}</div>
                <p className="text-xs text-muted-foreground">
                  Platform users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">Active Deals</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="text-xl md:text-2xl font-bold">{stats.total_deals}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total_deal_redemptions} redemptions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="businesses" className="w-full">
          <TabsList className="grid w-full sm:max-w-md grid-cols-2 h-11 md:h-10">
            <TabsTrigger value="businesses" className="text-xs md:text-sm">
              <Building2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Top Businesses
            </TabsTrigger>
            <TabsTrigger value="customers" className="text-xs md:text-sm">
              <Users className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Top Customers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="mt-4 md:mt-6">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Top Performing Businesses</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Ranked by transaction volume
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="space-y-3 md:space-y-4">
                  {topBusinesses.map((business, index) => (
                    <div key={business.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-muted font-semibold text-xs md:text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{business.business_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{business.business_category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm md:text-base">{business.transaction_count}</p>
                        <p className="text-xs text-muted-foreground">transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="mt-4 md:mt-6">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Most Active Customers</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Ranked by lifetime points earned
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="space-y-3 md:space-y-4">
                  {activeCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-muted font-semibold text-xs md:text-sm">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{customer.full_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {customer.businesses_visited} businesses visited
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm md:text-base">{customer.lifetime_points_earned}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {stats && (
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  Catalog
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Menu Items</span>
                  <span className="font-semibold">{stats.total_menu_items}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Deals</span>
                  <span className="font-semibold">{stats.total_deals}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Rewards</span>
                  <span className="font-semibold">{stats.total_rewards}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Transactions</span>
                  <span className="font-semibold">{stats.total_transactions}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Redemptions</span>
                  <span className="font-semibold">{stats.total_validated_redemptions}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Deal Usage</span>
                  <span className="font-semibold">{stats.total_deal_redemptions}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                  Points Economy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-semibold">{stats.total_points_issued.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">Redeemed</span>
                  <span className="font-semibold">{stats.total_points_redeemed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-muted-foreground">In Circulation</span>
                  <span className="font-semibold">
                    {(stats.total_points_issued - stats.total_points_redeemed).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
