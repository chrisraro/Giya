"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, QrCode, TrendingUp, Gift, LogOut, Award, Settings, Building2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"
// Add new imports for our UI components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

interface CustomerData {
  id: string
  full_name: string
  nickname: string | null
  profile_pic_url: string | null
  qr_code_data: string
  total_points: number
}

interface Transaction {
  id: string
  business_id: string
  amount_spent: number
  points_earned: number
  transaction_date: string
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
}

interface Redemption {
  id: string
  redeemed_at: string
  status: string
  rewards: {
    reward_name: string
    points_required: number
    image_url: string | null
  }
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
}

interface FallbackRedemption {
  id: string
  redeemed_at: string
  status: string
  business_id: string | null
  reward_id: string
  rewards: {
    reward_name: string
    points_required: number
    image_url: string | null
  }
  businesses?: {
    business_name: string
    profile_pic_url: string | null
  }
}

interface BusinessPoints {
  business_id: string
  business_name: string
  profile_pic_url: string | null
  total_points: number
  available_rewards: number
}

interface BusinessDiscovery {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
  points_per_currency: number
}

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [businessPoints, setBusinessPoints] = useState<BusinessPoints[]>([])
  const [businessDiscovery, setBusinessDiscovery] = useState<BusinessDiscovery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showQRDialog, setShowQRDialog] = useState(false)
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

        // Fetch customer data - only select necessary fields
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id, full_name, nickname, profile_pic_url, qr_code_data, total_points")
          .eq("id", user.id)
          .single()

        if (customerError) throw customerError
        setCustomerData(customer)

        // Fetch transactions - optimized query with covering index
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("points_transactions")
          .select(
            `
            id,
            business_id,
            amount_spent,
            points_earned,
            transaction_date,
            businesses (
              business_name,
              profile_pic_url
            )
          `,
          )
          .eq("customer_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(10)

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])

        // Fetch redemptions - optimized query with covering index
        console.log("Fetching redemptions for customer:", user.id)
        const redemptionsQuery = supabase
          .from("redemptions")
          .select(
            `
            id,
            redeemed_at,
            status,
            business_id,
            reward_id,
            rewards (
              reward_name,
              points_required,
              image_url
            ),
            businesses!inner (
              business_name,
              profile_pic_url
            )
          `,
          )
          .eq("customer_id", user.id)
          .order("redeemed_at", { ascending: false })
          .limit(10)

        console.log("Redemptions query:", redemptionsQuery)
        const { data: redemptionsData, error: redemptionsError } = await redemptionsQuery

        if (redemptionsError) {
          console.error("Redemptions query error:", redemptionsError)
          // Try a simpler query as fallback
          const fallbackQuery = supabase
            .from("redemptions")
            .select(
              `
              id,
              redeemed_at,
              status,
              business_id,
              reward_id,
              rewards (
                reward_name,
                points_required,
                image_url
              )
            `,
            )
            .eq("customer_id", user.id)
            .order("redeemed_at", { ascending: false })
            .limit(10)
            
          console.log("Fallback redemptions query:", fallbackQuery)
          const { data: fallbackData, error: fallbackError } = await fallbackQuery
          
          if (fallbackError) {
            console.error("Fallback redemptions query error:", fallbackError)
            throw fallbackError
          }
          
          // Manually fetch business information for each redemption
          const redemptionsWithBusiness = await Promise.all(
            (fallbackData || []).map(async (redemption: FallbackRedemption) => {
              if (redemption.business_id) {
                const businessQuery = supabase
                  .from("businesses")
                  .select("business_name, profile_pic_url")
                  .eq("id", redemption.business_id)
                  .single()
                  
                console.log("Business query for redemption:", redemption.id, businessQuery)
                const { data: businessData, error: businessError } = await businessQuery
                  
                if (!businessError && businessData) {
                  return {
                    ...redemption,
                    businesses: businessData
                  }
                } else {
                  console.error("Business query error for redemption:", redemption.id, businessError)
                }
              }
              return redemption
            })
          )
          
          console.log("Redemptions data with manual business fetch:", redemptionsWithBusiness)
          setRedemptions(redemptionsWithBusiness as unknown as Redemption[] || [])
        } else {
          console.log("Redemptions data:", redemptionsData)
          setRedemptions(redemptionsData || [])
        }

        // Fetch business points data
        // First get all businesses the customer has transacted with
        const { data: businessTransactions, error: businessTransactionsError } = await supabase
          .from("points_transactions")
          .select(`
            business_id,
            businesses (
              business_name,
              profile_pic_url
            )
          `)
          .eq("customer_id", user.id)
          .order("transaction_date", { ascending: false })

        if (businessTransactionsError) {
          console.error("Business transactions query error:", businessTransactionsError)
        } else {
          // Get unique businesses
          const uniqueBusinesses = Array.from(
            new Map(
              businessTransactions.map((transaction: any) => [
                transaction.business_id,
                {
                  business_id: transaction.business_id,
                  business_name: transaction.businesses?.business_name || 'Business',
                  profile_pic_url: transaction.businesses?.profile_pic_url || null
                }
              ])
            ).values()
          )

          // Also get businesses where customer has redemptions but no transactions
          const { data: redemptionBusinesses, error: redemptionBusinessesError } = await supabase
            .from("redemptions")
            .select(`
              business_id,
              businesses (
                business_name,
                profile_pic_url
              )
            `)
            .eq("customer_id", user.id)
            .order("redeemed_at", { ascending: false })

          if (!redemptionBusinessesError && redemptionBusinesses) {
            redemptionBusinesses.forEach((redemption: any) => {
              if (redemption.business_id && !uniqueBusinesses.some((biz: any) => biz.business_id === redemption.business_id)) {
                uniqueBusinesses.push({
                  business_id: redemption.business_id,
                  business_name: redemption.businesses?.business_name || 'Business',
                  profile_pic_url: redemption.businesses?.profile_pic_url || null
                })
              }
            })
          }

          // Calculate points per business
          const businessPointsMap = new Map()
          
          // Get all transactions
          const { data: allTransactions, error: transactionsError } = await supabase
            .from("points_transactions")
            .select("business_id, points_earned")
            .eq("customer_id", user.id)
            
          if (!transactionsError && allTransactions) {
            console.log("Transactions data:", allTransactions)
            allTransactions.forEach((transaction: any) => {
              const currentPoints = businessPointsMap.get(transaction.business_id) || 0
              businessPointsMap.set(transaction.business_id, currentPoints + transaction.points_earned)
            })
          }
          
          // Subtract redemptions
          const { data: allRedemptions, error: redemptionsError } = await supabase
            .from("redemptions")
            .select(`
              business_id,
              points_redeemed
            `)
            .eq("customer_id", user.id)
            
          if (!redemptionsError && allRedemptions) {
            console.log("Redemptions data:", allRedemptions)
            allRedemptions.forEach((redemption: any) => {
              if (redemption.business_id && redemption.points_redeemed) {
                const currentPoints = businessPointsMap.get(redemption.business_id) || 0
                businessPointsMap.set(redemption.business_id, currentPoints - redemption.points_redeemed)
              }
            })
          }
          
          console.log("Business points map:", businessPointsMap)
          
          // Get available rewards count per business
          const { data: allRewards, error: rewardsError } = await supabase
            .from("rewards")
            .select(`
              business_id,
              id,
              is_active
            `)
            
          const rewardsCountMap = new Map()
          if (!rewardsError && allRewards) {
            allRewards
              .filter((reward: any) => reward.is_active)
              .forEach((reward: any) => {
                const currentCount = rewardsCountMap.get(reward.business_id) || 0
                rewardsCountMap.set(reward.business_id, currentCount + 1)
              })
          }
          
          // Combine all data
          const businessPointsResult: BusinessPoints[] = uniqueBusinesses.map((business: any) => {
            const businessId = business.business_id
            const points = businessPointsMap.get(businessId) || 0
            const availableRewardsCount = rewardsCountMap.get(businessId) || 0
            
            return {
              ...business,
              total_points: points,
              available_rewards: availableRewardsCount
            }
          })
          
          // Verify that sum of business points equals customer total points
          const sumOfBusinessPoints = businessPointsResult.reduce((sum, business) => sum + business.total_points, 0)
          console.log("Sum of business points:", sumOfBusinessPoints)
          console.log("Customer total points:", customer?.total_points)
          
          if (customer && sumOfBusinessPoints !== customer.total_points) {
            console.warn("Points discrepancy detected: sum of business points does not match customer total points")
          }
          
          setBusinessPoints(businessPointsResult)
        }

        // Fetch businesses for discovery section
        const { data: discoveryBusinesses, error: discoveryError } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url, points_per_currency")
          .limit(10)

        if (discoveryError) {
          console.error("Business discovery query error:", discoveryError)
        } else {
          setBusinessDiscovery(discoveryBusinesses || [])
        }
      } catch (error) {
        console.error("CustomerDashboard.fetchData error:", error)
        handleApiError(error, "Failed to load dashboard data", "CustomerDashboard.fetchData")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-svh bg-secondary">
        {/* Header with skeleton loading */}
        <header className="border-b bg-background">
          <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        </header>

        {/* Main Content with skeleton loading */}
        <main className="container-padding-x container mx-auto py-8">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb skeleton */}
            <Skeleton className="h-4 w-48" />
            
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

            {/* Transaction History skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1 h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="mt-1 h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Redemption History skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1 h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="mt-1 h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!customerData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load customer data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={customerData.profile_pic_url || undefined} />
              <AvatarFallback>{customerData.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{customerData.full_name}</h2>
              {customerData.nickname && <p className="text-sm text-muted-foreground">@{customerData.nickname}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/customer/settings">
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
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent>
                Dashboard
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Points Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{customerData.total_points}</div>
                <p className="text-xs text-muted-foreground">Available to redeem</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">Lifetime purchases</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{redemptions.length}</div>
                <p className="text-xs text-muted-foreground">Total redemptions</p>
              </CardContent>
            </Card>
          </div>

          {/* Discover Businesses */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Discover Businesses</h2>
              <Button variant="link" onClick={() => router.push("/business")} className="text-primary">
                View All
              </Button>
            </div>
            {businessDiscovery.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No businesses found</p>
                  <p className="text-xs text-muted-foreground">Check back later for new businesses!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {businessDiscovery.map((business) => (
                  <Card 
                    key={business.id} 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/business/${business.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={business.profile_pic_url || undefined} />
                          <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{business.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{business.business_category}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Points per ₱</span>
                        <span className="text-2xl font-bold text-primary">{business.points_per_currency || 100}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Your QR Code
              </CardTitle>
              <CardDescription>Show this QR code at participating businesses to earn points</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-6">
                <QRCodeSVG value={customerData.qr_code_data} size={200} level="H" />
              </div>
              <div className="text-center">
                <p className="font-mono text-sm font-medium text-muted-foreground">{customerData.qr_code_data}</p>
              </div>
            </CardContent>
          </Card>

          {/* Business Points Section */}
          <div className="w-full">
            <h2 className="text-xl font-bold mb-4">Your Business Points</h2>
            {businessPoints.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Award className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No business points yet</p>
                  <p className="text-xs text-muted-foreground">Start shopping to earn points at businesses!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {businessPoints.map((business) => (
                  <Card 
                    key={business.business_id} 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/business/${business.business_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={business.profile_pic_url || undefined} />
                          <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">{business.business_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {business.available_rewards} reward{business.available_rewards !== 1 ? 's' : ''} available
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium">Your Points</span>
                        <span className="text-2xl font-bold text-primary">{business.total_points}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button onClick={() => setShowQRDialog(true)} size="lg" className="h-auto flex-col gap-2 py-6">
                <QrCode className="h-8 w-8" />
                <span>Show My QR Code</span>
              </Button>
              <Link href="/dashboard/customer/rewards">
                <Button variant="outline" size="lg" className="h-auto w-full flex-col gap-2 py-6 bg-transparent">
                  <Gift className="h-8 w-8" />
                  <span>View Rewards</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest points earning activities</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground">Start shopping to earn points!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={transaction.businesses?.profile_pic_url || undefined} />
                          <AvatarFallback>{transaction.businesses?.business_name?.charAt(0) || 'B'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{transaction.businesses?.business_name || 'Business'}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.transaction_date
                              ? new Date(transaction.transaction_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">+{transaction.points_earned} pts</p>
                        <p className="text-sm text-muted-foreground">₱{transaction.amount_spent.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redemption History */}
          <Card>
            <CardHeader>
              <CardTitle>Redemption History</CardTitle>
              <CardDescription>Your redeemed rewards</CardDescription>
            </CardHeader>
            <CardContent>
              {redemptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Gift className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No redemptions yet</p>
                  <p className="text-xs text-muted-foreground">Browse rewards to redeem your points!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {redemptions.map((redemption) => (
                    <div
                      key={redemption.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={redemption.rewards?.image_url || undefined} />
                          <AvatarFallback>
                            <Gift className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{redemption.rewards?.reward_name || 'Reward'}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {redemption.redeemed_at 
                                ? new Date(redemption.redeemed_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : 'Unknown date'}
                            </p>
                            {redemption.businesses?.business_name && (
                              <span className="text-xs text-muted-foreground">
                                at {redemption.businesses.business_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            redemption.status === "validated"
                              ? "default"
                              : redemption.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {redemption.status === "validated" 
                            ? "Completed" 
                            : redemption.status === "pending"
                              ? "Pending"
                              : redemption.status || "Unknown"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {redemption.rewards?.points_required || 0} pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
