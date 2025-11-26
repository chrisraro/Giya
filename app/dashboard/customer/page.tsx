"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Receipt, TrendingUp, Gift, Award, Settings, Building2, Tag, RefreshCw, Check, Star, Upload, Store } from "lucide-react"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { OptimizedImage } from "@/components/optimized-image"
import { toast } from "sonner"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"

// Import components
import { MobileCustomerBottomNav } from "@/components/mobile-customer-bottom-nav"
import { UnifiedScanner } from "@/components/unified-scanner"

// Import types
import type { CustomerData, BusinessPoints, Transaction, Redemption } from "@/hooks/use-dashboard-data"

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

interface Reward {
  id: string
  reward_name: string
  points_required: number
  business_id: string
  business_name: string
  business_profile_pic?: string | null
  image_url?: string | null
  customer_points?: number
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<CustomerDashboardLoading />}>
      <CustomerDashboardContent />
    </Suspense>
  )
}

function CustomerDashboardLoading() {
  return (
    <DashboardLayout userRole="customer" userName="Loading..." breadcrumbs={[]}>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <MobileCustomerBottomNav />
    </DashboardLayout>
  )
}

function CustomerDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  
  const { data, isLoading, error, refetch } = useDashboardData({ userType: 'customer' })

  // State
  const [discoveredBusinesses, setDiscoveredBusinesses] = useState<any[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [scannerOpen, setScannerOpen] = useState(false)
  const [showRedemptionQR, setShowRedemptionQR] = useState(false)
  const [redemptionQRCode, setRedemptionQRCode] = useState<string>("")
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null)
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

  // Open scanner if scanner=open in URL
  useEffect(() => {
    if (searchParams.get('scanner') === 'open') {
      setScannerOpen(true)
    }
  }, [searchParams])

  // Fetch businesses where customer has transactions
  useEffect(() => {
    const fetchBusinessesAndRewards = async () => {
      if (!data?.customer?.id) return

      try {
        // Get businesses from transactions
        const { data: transactionData } = await supabase
          .from("points_transactions")
          .select("business_id")
          .eq("customer_id", data.customer.id)

        const businessIds = [...new Set(transactionData?.map((item: any) => item.business_id) || [])]
        
        if (businessIds.length === 0) {
          setDiscoveredBusinesses([])
          setRewards([])
          return
        }

        // Fetch business details
        const { data: businessesData } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url, points_per_currency")
          .in("id", businessIds)

        setDiscoveredBusinesses(businessesData || [])

        // Fetch rewards
        const { data: rewardsData } = await supabase
          .from("rewards")
          .select(`
            id, 
            reward_name, 
            points_required,
            image_url,
            business_id,
            businesses!inner (business_name, profile_pic_url)
          `)
          .in("business_id", businessIds)
          .eq("is_active", true)
          .limit(10)

        if (rewardsData && data.customer) {
          const rewardsWithPoints = await Promise.all(rewardsData.map(async (reward: any) => {
            const { data: pointsData } = await supabase
              .from("points_transactions")
              .select("points_earned")
              .eq("customer_id", data.customer!.id)
              .eq("business_id", reward.business_id)

            let totalPoints = pointsData?.reduce((sum: number, t: any) => sum + t.points_earned, 0) || 0

            // Subtract redeemed points
            const { data: redemptionsData } = await supabase
              .from("redemptions")
              .select("points_redeemed")
              .eq("customer_id", data.customer!.id)
              .eq("business_id", reward.business_id)
              
            if (redemptionsData) {
              totalPoints -= redemptionsData.reduce((sum: number, r: any) => sum + r.points_redeemed, 0)
            }

            return {
              id: reward.id,
              reward_name: reward.reward_name,
              points_required: reward.points_required,
              image_url: reward.image_url,
              business_id: reward.business_id,
              business_name: reward.businesses?.business_name || 'Unknown',
              business_profile_pic: reward.businesses?.profile_pic_url || null,
              customer_points: totalPoints
            }
          }))

          setRewards(rewardsWithPoints)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchBusinessesAndRewards()
  }, [data?.customer?.id, supabase])

  // Real-time subscription for transactions
  useEffect(() => {
    if (!data?.customer?.id) return

    const channel = supabase
      .channel('customer-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions'
        },
        (payload: any) => {
          if (payload.new.customer_id === data?.customer?.id) {
            toast.success(`You've earned ${payload.new.points_earned} points!`)
            refetch()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [data?.customer?.id, refetch, supabase])

  const handleClaimReward = (reward: Reward) => {
    if (!reward.customer_points || reward.customer_points < reward.points_required) {
      toast.error("Not enough points to claim this reward")
      return
    }
    setSelectedReward(reward)
    setShowRedeemDialog(true)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !data?.customer?.id) return

    setIsRedeeming(true)

    try {
      const redemptionCode = `GIYA-REDEEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const { data: redemption, error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          customer_id: data.customer.id,
          reward_id: selectedReward.id,
          business_id: selectedReward.business_id,
          points_redeemed: selectedReward.points_required,
          redemption_qr_code: redemptionCode,
          status: "pending",
        })
        .select()
        .single()

      if (redemptionError) throw redemptionError

      setRewards(prevRewards => 
        prevRewards.map(r => 
          r.id === selectedReward.id 
            ? { ...r, customer_points: (r.customer_points || 0) - selectedReward.points_required }
            : r
        )
      )

      toast.success("Reward claimed! Show the QR code to the business.")

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({ reward: selectedReward, redemption })
      
      setShowRedeemDialog(false)
      setIsRedeeming(false)
      
      setTimeout(() => setShowRedemptionQR(true), 300)
    } catch (error) {
      console.error("Failed to claim reward:", error)
      toast.error("Failed to claim reward")
      setIsRedeeming(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="customer" userName="Loading..." breadcrumbs={[]}>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <MobileCustomerBottomNav />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole="customer" userName="Error" breadcrumbs={[]}>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </CardContent>
        </Card>
        <MobileCustomerBottomNav />
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
        {/* Upload Receipt CTA */}
        <Card className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">Earn Points with Every Purchase!</h3>
                <p className="text-sm opacity-90">
                  Upload your receipts to automatically earn points. Fast, easy, and secure.
                </p>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setScannerOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload Receipt
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{data?.customer?.total_points || 0}</div>
                <div className="text-xs opacity-90">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data?.transactions?.length || 0}</div>
                <div className="text-xs opacity-90">Receipts</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{discoveredBusinesses.length}</div>
                <div className="text-xs opacity-90">Businesses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovered Businesses */}
        {discoveredBusinesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Your Businesses
              </CardTitle>
              <CardDescription>Businesses where you've earned points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {discoveredBusinesses.map((business) => (
                  <Card 
                    key={business.id} 
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => router.push(`/business/${business.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {business.profile_pic_url ? (
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={business.profile_pic_url} />
                            <AvatarFallback>{business.business_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{business.business_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{business.business_category}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Rewards */}
        {rewards.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Available Rewards
                </CardTitle>
                <Link href="/dashboard/customer/rewards">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.slice(0, 6).map((reward) => (
                  <Card key={reward.id} className="overflow-hidden">
                    {reward.image_url && (
                      <div className="relative h-32 w-full">
                        <OptimizedImage
                          src={reward.image_url}
                          alt={reward.reward_name}
                          width={400}
                          height={128}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="font-medium truncate">{reward.reward_name}</p>
                      <p className="text-sm text-muted-foreground truncate mb-2">{reward.business_name}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Required:</span>
                        <span className="font-medium">{reward.points_required} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your points:</span>
                        <span className="font-medium text-primary">{reward.customer_points || 0} pts</span>
                      </div>
                      <Button 
                        className="w-full mt-3" 
                        size="sm"
                        onClick={() => handleClaimReward(reward)}
                        disabled={!reward.customer_points || reward.customer_points < reward.points_required}
                      >
                        {reward.customer_points && reward.customer_points >= reward.points_required 
                          ? "Claim Reward" 
                          : `Need ${reward.points_required - (reward.customer_points || 0)} more`}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        {data?.transactions && data.transactions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <Link href="/dashboard/customer/transactions">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.transactions.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full p-2">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.business_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{transaction.points_earned}</p>
                      <p className="text-xs text-muted-foreground">₱{transaction.amount_spent}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Unified Scanner Dialog */}
      <UnifiedScanner 
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        userRole="customer"
      />

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this reward?
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedReward.reward_name}</p>
                <p className="text-sm text-muted-foreground">{selectedReward.business_name}</p>
                <div className="mt-2 flex justify-between">
                  <span className="text-sm">Points required:</span>
                  <span className="font-bold">{selectedReward.points_required}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRedeemDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmRedeem} disabled={isRedeeming} className="flex-1">
                  {isRedeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Redemption QR Code Dialog */}
      <Dialog open={showRedemptionQR} onOpenChange={setShowRedemptionQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Redemption QR Code</DialogTitle>
            <DialogDescription className="text-center">
              Show this QR code to the business to validate your reward
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg border bg-white p-6">
              <QRCodeSVG value={redemptionQRCode} size={200} level="H" />
            </div>
            {redemptionDetails && (
              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold mb-2">{redemptionDetails.reward?.reward_name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Points redeemed:</span>
                  <span className="font-bold text-primary">{redemptionDetails.reward?.points_required}</span>
                </div>
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground">
              This QR code is valid for one-time use
            </p>
            <Button onClick={() => setShowRedemptionQR(false)} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MobileCustomerBottomNav />
    </DashboardLayout>
  )
}
