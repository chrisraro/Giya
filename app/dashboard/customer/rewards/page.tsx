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

interface Business {
  id: string
  business_name: string
  profile_pic_url: string | null
}

interface Reward {
  id: string
  business_id: string
  reward_name: string
  description: string
  points_required: number
  is_active: boolean
  businesses: Business
}

interface CustomerPoints {
  business_id: string
  total_points: number
}

export default function CustomerRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [customerPoints, setCustomerPoints] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch customer's points per business
      const { data: pointsData, error: pointsError } = await supabase
        .from("customers")
        .select("business_id, total_points")
        .eq("id", user.id)

      if (pointsError) throw pointsError

      const pointsMap: Record<string, number> = {}
      pointsData?.forEach((p: CustomerPoints) => {
        pointsMap[p.business_id] = p.total_points
      })
      setCustomerPoints(pointsMap)

      // Fetch all active rewards from businesses the customer has interacted with
      const businessIds = Object.keys(pointsMap)
      if (businessIds.length === 0) {
        setRewards([])
        return
      }

      const { data: rewardsData, error: rewardsError } = await supabase
        .from("rewards")
        .select(
          `
          *,
          businesses (
            id,
            business_name,
            profile_pic_url
          )
        `,
        )
        .in("business_id", businessIds)
        .eq("is_active", true)
        .order("points_required", { ascending: true })

      if (rewardsError) throw rewardsError
      setRewards(rewardsData || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
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

      // Create redemption record
      const { error: redemptionError } = await supabase.from("reward_redemptions").insert({
        customer_id: user.id,
        reward_id: selectedReward.id,
        business_id: selectedReward.business_id,
        points_redeemed: selectedReward.points_required,
      })

      if (redemptionError) throw redemptionError

      toast.success("Reward redeemed successfully! Show this to the business.")

      // Refresh data
      setShowRedeemDialog(false)
      setSelectedReward(null)
      fetchData()
    } catch (error) {
      console.error("[v0] Error redeeming reward:", error)
      toast.error("Failed to redeem reward")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No rewards available</h3>
              <p className="text-sm text-muted-foreground">
                Start earning points at your favorite businesses to unlock rewards
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const userPoints = customerPoints[reward.business_id] || 0
              const canRedeem = userPoints >= reward.points_required

              return (
                <Card key={reward.id} className={!canRedeem ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={reward.businesses.profile_pic_url || undefined} />
                        <AvatarFallback>{reward.businesses.business_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base">{reward.reward_name}</CardTitle>
                        <CardDescription className="text-xs">{reward.businesses.business_name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{reward.description}</p>

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
                        `Need ${reward.points_required - userPoints} more points`
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
                    <h3 className="font-semibold">{selectedReward.reward_name}</h3>
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
    </div>
  )
}
