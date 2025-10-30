"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Package, Percent, Gift, ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import type { Admin } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

interface Business {
  id: string
  business_name: string
  business_category: string
  address: string
  profile_pic_url: string | null
  description: string | null
  phone_number: string | null
  approval_status: string
  is_active: boolean
  created_at: string
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  category: string
  base_price: number
  image_url: string | null
}

interface Deal {
  id: string
  title: string
  deal_type: string
  discount_type?: string | null
  discount_value: number | null
  is_active: boolean
  menu_items?: {
    id: string
    name: string
    base_price: number
  } | null
}

interface Reward {
  id: string
  title: string
  points_required: number
  is_active: boolean
}

export default function BusinessManagementPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string
  
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchBusinessData()
  }, [businessId])

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
  }

  const fetchBusinessData = async () => {
    try {

      // Fetch business details
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single()

      if (businessError) throw businessError
      setBusiness(businessData)

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("business_id", businessId)
        .order("category", { ascending: true })

      if (menuError) {
        console.error("Menu items error:", menuError)
      }
      console.log("Menu items fetched:", menuData?.length || 0, menuData)
      setMenuItems(menuData || [])

      // Fetch deals (both discount and exclusive types)
      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select(`
          *,
          menu_items (
            id,
            name,
            base_price
          )
        `)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })

      if (dealsError) {
        console.error("Deals error:", dealsError)
      }
      console.log("Deals fetched:", dealsData?.length || 0, dealsData)
      setDeals(dealsData || [])

      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("*")
        .eq("business_id", businessId)
        .order("points_required", { ascending: true })

      if (rewardsError) {
        console.error("Rewards error:", rewardsError)
      }
      console.log("Rewards fetched:", rewardsData?.length || 0, rewardsData)
      setRewards(rewardsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load business data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Delete this menu item?")) return

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId)

    if (error) {
      toast.error("Failed to delete menu item")
    } else {
      toast.success("Menu item deleted")
      fetchBusinessData()
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Delete this deal?")) return

    const { error } = await supabase
      .from("deals")
      .delete()
      .eq("id", dealId)

    if (error) {
      toast.error("Failed to delete deal")
    } else {
      toast.success("Deal deleted")
      fetchBusinessData()
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("Delete this reward?")) return

    const { error } = await supabase
      .from("rewards")
      .delete()
      .eq("id", rewardId)

    if (error) {
      toast.error("Failed to delete reward")
    } else {
      toast.success("Reward deleted")
      fetchBusinessData()
    }
  }

  if (isLoading || !business || !admin) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardLayout
      userRole="admin"
      userName={admin.full_name}
      userAvatar={admin.profile_pic_url}
      breadcrumbs={[
        { label: "Admin" },
        { label: "Businesses", href: "/admin/businesses" },
        { label: business.business_name }
      ]}
    >
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 md:h-6 md:w-6" />
              {business.business_name}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {business.business_category} • {business.address}
            </p>
          </div>
          <Badge variant={business.approval_status === 'approved' ? 'default' : 'secondary'}>
            {business.approval_status}
          </Badge>
        </div>

        {business.description && (
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <p className="text-sm md:text-base text-muted-foreground">{business.description}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full sm:max-w-2xl grid-cols-3 h-11 md:h-10">
            <TabsTrigger value="menu" className="text-xs md:text-sm">
              <Package className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Menu ({menuItems.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="text-xs md:text-sm">
              <Percent className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Deals ({deals.length})
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs md:text-sm">
              <Gift className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              Rewards ({rewards.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-4 md:mt-6">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base md:text-lg">{item.name}</CardTitle>
                        <CardDescription className="text-xs md:text-sm mt-1">{item.category}</CardDescription>
                      </div>
                      <Badge variant="outline">${item.base_price}</Badge>
                    </div>
                  </CardHeader>
                  {item.description && (
                    <CardContent className="p-4 md:p-6 pt-0">
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 h-9 text-xs md:text-sm">
                          <Edit className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="h-9 w-9" onClick={() => handleDeleteMenuItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deals" className="mt-4 md:mt-6">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => (
                <Card key={deal.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base md:text-lg flex-1">{deal.title}</CardTitle>
                      <Badge variant={deal.is_active ? 'default' : 'secondary'}>
                        {deal.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{deal.deal_type}</Badge>
                      {deal.deal_type === 'discount' && deal.discount_value && (
                        <Badge variant="outline">
                          {deal.discount_type === 'percentage' ? `${deal.discount_value}% off` : `$${deal.discount_value} off`}
                        </Badge>
                      )}
                      {deal.deal_type === 'exclusive' && deal.menu_items && (
                        <Badge variant="outline">{deal.menu_items.name}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    {deal.menu_items && (
                      <p className="text-xs md:text-sm text-muted-foreground mb-3">
                        Exclusive offer: {deal.menu_items.name} (${deal.menu_items.base_price})
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-9 text-xs md:text-sm">
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="h-9 w-9" onClick={() => handleDeleteDeal(deal.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="mt-4 md:mt-6">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <Card key={reward.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base md:text-lg flex-1">{reward.title}</CardTitle>
                      <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                        {reward.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit mt-2">{reward.points_required} pts</Badge>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-9 text-xs md:text-sm">
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="h-9 w-9" onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
