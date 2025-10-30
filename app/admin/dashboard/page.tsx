"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, ShieldCheck, Activity, TrendingUp, Package, Percent, Gift } from "lucide-react"
import { toast } from "sonner"
import type { Admin, PlatformStats } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchPlatformStats()
  }, [])

  const checkAdminAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/admin/login")
        return
      }

      // Use RPC function to check admin status
      const { data: isAdminResult } = await supabase.rpc('is_admin', { user_id: user.id })
      
      if (!isAdminResult) {
        await supabase.auth.signOut()
        router.push("/admin/login")
        toast.error("Access denied")
        return
      }

      // Get admin profile
      const { data: adminData } = await supabase.rpc('get_admin_profile', { user_id: user.id })
      
      if (adminData && adminData.length > 0) {
        setAdmin(adminData[0])
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlatformStats = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_platform_stats")
        .select("*")
        .single()

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Failed to load platform statistics")
    }
  }

  if (isLoading || !admin) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const statCards = [
    { title: "Total Customers", value: stats?.total_customers || 0, icon: Users, color: "text-blue-600" },
    { title: "Approved Businesses", value: stats?.total_approved_businesses || 0, icon: Building2, color: "text-green-600" },
    { title: "Pending Approval", value: stats?.pending_businesses || 0, icon: ShieldCheck, color: "text-yellow-600" },
    { title: "Total Transactions", value: stats?.total_transactions || 0, icon: Activity, color: "text-purple-600" },
    { title: "Total Rewards", value: stats?.total_rewards || 0, icon: Gift, color: "text-pink-600" },
    { title: "Total Deals", value: stats?.total_deals || 0, icon: Percent, color: "text-orange-600" },
    { title: "Menu Items", value: stats?.total_menu_items || 0, icon: Package, color: "text-indigo-600" },
    { title: "Points Issued", value: stats?.total_points_issued || 0, icon: TrendingUp, color: "text-emerald-600" },
  ]

  return (
    <DashboardLayout
      userRole="business"
      userName={admin.full_name}
      userEmail={admin.email}
      userAvatar={admin.profile_pic_url}
      breadcrumbs={[{ label: "Admin Dashboard" }]}
    >
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Platform Overview</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Monitor and manage your platform metrics
          </p>
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="text-xl md:text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats && stats.pending_businesses > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-yellow-600" />
                Pending Business Approvals
              </CardTitle>
              <CardDescription>
                {stats.pending_businesses} business{stats.pending_businesses !== 1 ? 'es' : ''} waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="/admin/businesses"
                className="text-sm text-primary hover:underline"
              >
                Review pending businesses →
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
