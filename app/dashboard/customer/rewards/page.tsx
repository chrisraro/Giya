"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Gift, ArrowLeft, Check } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
// Add new imports for our UI components
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Snackbar } from "@/components/ui/snackbar"
import { Chip } from "@/components/ui/chip"
import { Skeleton } from "@/components/ui/skeleton"

interface Business {
  id: string
  business_name: string
  profile_pic_url: string | null
  business_category: string
}

interface Reward {
  id: string
  business_id: string
  name: string
  description: string
  points_required: number
  is_active: boolean
  businesses: Business
  reward_name?: string // Add this for backward compatibility
}

export default function CustomerRewardsPage({ searchParams }: { searchParams: { businessId?: string, rewardId?: string } }) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([])
  const [customerPoints, setCustomerPoints] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRedemptionQR, setShowRedemptionQR] = useState(false)
  const [redemptionQRCode, setRedemptionQRCode] = useState<string>("")
  const [redemptionDetails, setRedemptionDetails] = useState<any>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarAction, setSnackbarAction] = useState<React.ReactNode>(null)
  const [snackbarOnAction, setSnackbarOnAction] = useState<(() => void) | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Get unique categories from rewards
  const categories = Array.from(new Set(rewards.map(reward => reward.businesses.business_category)))

  useEffect(() => {
    // Check if there's a businessId in the query parameters
    const businessId = searchParams?.businessId
    const rewardId = searchParams?.rewardId
    
    if (businessId) {
      setSelectedBusinessId(businessId)
    }
    
    fetchData().then(() => {
      // If a specific rewardId is provided, auto-open that reward
      if (rewardId && rewards.length > 0) {
        const reward = rewards.find(r => r.id === rewardId)
        if (reward) {
          // Small delay to allow UI to render first
          setTimeout(() => {
            handleRedeemClick(reward)
          }, 500)
        }
      }
    })
  }, [searchParams?.businessId, searchParams?.rewardId])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Optimized query for transactions with only necessary fields
      const { data: transactions, error: transactionsError } = await supabase
        .from("points_transactions")
        .select("business_id, points_earned")
        .eq("customer_id", user.id)

      if (transactionsError) throw transactionsError

      // Aggregate points by business
      const pointsMap: Record<string, number> = {}
      transactions?.forEach((t: { business_id: string; points_earned: number }) => {
        pointsMap[t.business_id] = (pointsMap[t.business_id] || 0) + t.points_earned
      })

      // Optimized query for redemptions with only necessary fields
      const { data: redemptions, error: redemptionsError } = await supabase
        .from("redemptions")
        .select("business_id, points_redeemed")
        .eq("customer_id", user.id)

      if (redemptionsError) throw redemptionsError

      redemptions?.forEach((r: { business_id: string; points_redeemed: number }) => {
        pointsMap[r.business_id] = (pointsMap[r.business_id] || 0) - r.points_redeemed
      })

      setCustomerPoints(pointsMap)

      // Fetch all active rewards from all businesses - optimized query
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select("id,business_id,name,description,points_required,image_url,businesses(id,business_name,profile_pic_url,business_category)")
        .eq("is_active", true)
        .order("points_required", { ascending: true })

      if (rewardsError) throw rewardsError
      
      setRewards(rewardsData || [])
      
      // Filter rewards if a businessId is specified
      if (selectedBusinessId) {
        const businessRewards = (rewardsData || []).filter((reward: Reward) => reward.business_id === selectedBusinessId)
        setFilteredRewards(businessRewards)
        
        // If there's only one reward from this business and no specific rewardId, show the redeem dialog directly
        if (businessRewards.length === 1 && !searchParams?.rewardId) {
          const userPoints = pointsMap[selectedBusinessId] || 0
          if (userPoints >= businessRewards[0].points_required) {
            // Small delay to allow UI to render first
            setTimeout(() => {
              handleRedeemClick(businessRewards[0])
            }, 500)
          }
        }
      } else {
        setFilteredRewards(rewardsData || [])
      }
    } catch (error) {
      console.error("CustomerRewards.fetchData:", error)
      toast.error("Failed to load rewards")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeemClick = (reward: Reward) => {
    const userPoints = customerPoints[reward.business_id] || 0
    if (userPoints < reward.points_required) {
      toast.error("Not enough points to redeem this reward")
      return
    }
    setSelectedReward(reward)
    setShowRedeemDialog(true)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return

    setIsProcessing(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const redemptionCode = "GIYA-REDEEM-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)

      const { data: redemption, error: redemptionError } = await supabase
        .from("redemptions")
        .insert({
          customer_id: user.id,
          reward_id: selectedReward.id,
          business_id: selectedReward.business_id,
          points_redeemed: selectedReward.points_required,
          redemption_qr_code: redemptionCode,
          status: "pending",
        })
        .select()
        .single()

      if (redemptionError) throw redemptionError

      toast.success("Reward redeemed! Show the QR code to the business.")

      // Add this line to show a more prominent success message
      toast.success(`Successfully redeemed ${selectedReward.name}! Points have been deducted from your account.`, {
        duration: 5000
      })

      setRedemptionQRCode(redemptionCode)
      setRedemptionDetails({
        reward: selectedReward,
        redemption: redemption,
      })
      setShowRedeemDialog(false)
      setShowRedemptionQR(true)
      setSelectedReward(null)

      // Show snackbar with undo option
      setSnackbarMessage(`Successfully redeemed ${selectedReward.name}!`)
      setSnackbarAction("Undo")
      setSnackbarOnAction(() => async () => {
        try {
          // Delete the redemption record
          const { error } = await supabase
            .from("redemptions")
            .delete()
            .eq("id", redemption.id)
          
          if (error) throw error
          
          // Refresh data
          fetchData()
          toast.success("Redemption undone successfully!")
        } catch (error) {
          console.error("CustomerRewards.undoRedemption:", error)
          toast.error("Failed to undo redemption")
        }
      })
      setSnackbarOpen(true)

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("CustomerRewards.handleConfirmRedeem:", error)
      toast.error("Failed to redeem reward")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleViewAllRewards = () => {
    // Remove the businessId parameter from the URL
    router.push('/dashboard/customer/rewards')
    setSelectedBusinessId(null)
    setSelectedCategory(null)
    setFilteredRewards(rewards)
  }

  // Filter rewards by category
  const filterByCategory = (category: string | null) => {
    setSelectedCategory(category)
    
    if (!category) {
      // If no category selected, show all rewards or filtered by business
      if (selectedBusinessId) {
        setFilteredRewards(rewards.filter(reward => reward.business_id === selectedBusinessId))
      } else {
        setFilteredRewards(rewards)
      }
      return
    }
    
    // Filter by category
    const categoryRewards = rewards.filter(reward => reward.businesses.business_category === category)
    
    if (selectedBusinessId) {
      // Further filter by business if selected
      setFilteredRewards(categoryRewards.filter(reward => reward.business_id === selectedBusinessId))
    } else {
      setFilteredRewards(categoryRewards)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-svh bg-secondary">
        <header className="border-b bg-background">
          <div className="container-padding-x container mx-auto flex items-center gap-3 py-4">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </header>

        <main className="container-padding-x container mx-auto py-8">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb skeleton */}
            <Skeleton className="h-4 w-48" />
            
            {/* Category filters skeleton */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>

            {/* Rewards grid skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-1 h-4 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto flex items-center gap-3 py-4">
          <Link href="/dashboard/customer">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-foreground">Available Rewards</h1>
            <p className="text-sm text-muted-foreground">Redeem your points for rewards</p>
          </div>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/customer">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem isCurrent>
              Rewards
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Show business filter info if applicable */}
        {selectedBusinessId && (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
            <div>
              <h3 className="font-medium">Showing rewards for a specific business</h3>
              <p className="text-sm text-muted-foreground">
                {filteredRewards.length} reward{filteredRewards.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleViewAllRewards}>
              View All Rewards
            </Button>
          </div>
        )}

        {/* Category Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip 
            variant={!selectedCategory ? "default" : "outline"} 
            onClick={() => filterByCategory(null)}
          >
            All Rewards
          </Chip>
          {categories.map((category) => (
            <Chip 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => filterByCategory(category)}
            >
              {category}
            </Chip>
          ))}
        </div>

        {filteredRewards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No rewards available</h3>
              <p className="text-sm text-muted-foreground">
                {selectedBusinessId 
                  ? "This business doesn't have any available rewards." 
                  : "Start earning points at your favorite businesses to unlock rewards"}
              </p>
              {selectedBusinessId && (
                <Button onClick={handleViewAllRewards} className="mt-4">
                  View All Rewards
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRewards.map((reward) => {
              const userPoints = customerPoints[reward.business_id] || 0
              const canRedeem = userPoints >= reward.points_required

              return (
                <Card key={reward.id} className={!canRedeem ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={reward.businesses.profile_pic_url || undefined} />
                        <AvatarFallback>{reward.businesses.business_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{reward.businesses.business_name}</p>
                        <p className="text-xs font-medium">{reward.businesses.business_category}</p>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <CardDescription className="text-sm">{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Your points:</span>
                        <span className="font-semibold">{userPoints}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Required:</span>
                        <span className="font-semibold text-primary">{reward.points_required}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleRedeemClick(reward)}
                      disabled={!canRedeem}
                      className="w-full"
                      variant={canRedeem ? "default" : "outline"}
                    >
                      {canRedeem ? (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          Redeem Now
                        </>
                      ) : (
                        "Need " + (reward.points_required - userPoints) + " more points"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>Confirm your reward redemption</DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-secondary p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedReward.businesses.profile_pic_url || undefined} />
                    <AvatarFallback>{selectedReward.businesses.business_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedReward.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedReward.businesses.business_name}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
              </div>

              <div className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points to redeem:</span>
                  <span className="text-lg font-bold text-primary">{selectedReward.points_required}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Remaining points:</span>
                  <span className="font-semibold">
                    {customerPoints[selectedReward.business_id] - selectedReward.points_required}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRedeemDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmRedeem} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRedemptionQR} onOpenChange={setShowRedemptionQR}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redemption QR Code</DialogTitle>
            <DialogDescription>Show this QR code to the business to validate your reward</DialogDescription>
          </DialogHeader>
          {redemptionDetails && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-lg border bg-white p-6">
                <QRCodeSVG value={redemptionQRCode} size={200} level="H" />
              </div>

              <div className="rounded-lg border bg-secondary p-4">
                <h3 className="font-semibold mb-2">{redemptionDetails.reward.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {redemptionDetails.reward.businesses.business_name}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Points redeemed:</span>
                  <span className="font-bold text-primary">{redemptionDetails.reward.points_required}</span>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                This QR code is valid for one-time use. The business will scan it to validate your redemption.
              </p>

              <Button onClick={() => setShowRedemptionQR(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for undo functionality */}
      <Snackbar
        open={snackbarOpen}
        onOpenChange={setSnackbarOpen}
        action={snackbarAction}
        onAction={snackbarOnAction || undefined}
        duration={5000}
        variant="success"
        position="bottom-right"
      >
        {snackbarMessage}
      </Snackbar>
    </div>
  )
}