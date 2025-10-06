"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Edit, Trash2, Gift, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Reward {
  id: string
  business_id: string
  reward_name: string
  description: string
  points_required: number
  is_active: boolean
  created_at: string
}

export default function BusinessRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    reward_name: "",
    description: "",
    points_required: "",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("business_id", user.id)
        .order("points_required", { ascending: true })

      if (error) throw error
      setRewards(data || [])
    } catch (error) {
      console.error("[v0] Error fetching rewards:", error)
      toast.error("Failed to load rewards")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward)
      setFormData({
        reward_name: reward.reward_name,
        description: reward.description,
        points_required: reward.points_required.toString(),
      })
    } else {
      setEditingReward(null)
      setFormData({
        reward_name: "",
        description: "",
        points_required: "",
      })
    }
    setShowDialog(true)
  }

  const handleSaveReward = async () => {
    if (!formData.reward_name || !formData.description || !formData.points_required) {
      toast.error("Please fill in all fields")
      return
    }

    const pointsRequired = Number.parseInt(formData.points_required)
    if (isNaN(pointsRequired) || pointsRequired <= 0) {
      toast.error("Points required must be a positive number")
      return
    }

    setIsProcessing(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      if (editingReward) {
        // Update existing reward
        const { error } = await supabase
          .from("rewards")
          .update({
            reward_name: formData.reward_name,
            description: formData.description,
            points_required: pointsRequired,
          })
          .eq("id", editingReward.id)

        if (error) throw error
        toast.success("Reward updated successfully")
      } else {
        // Create new reward
        const { error } = await supabase.from("rewards").insert({
          business_id: user.id,
          reward_name: formData.reward_name,
          description: formData.description,
          points_required: pointsRequired,
          is_active: true,
        })

        if (error) throw error
        toast.success("Reward created successfully")
      }

      setShowDialog(false)
      fetchRewards()
    } catch (error) {
      console.error("[v0] Error saving reward:", error)
      toast.error("Failed to save reward")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleActive = async (reward: Reward) => {
    try {
      const { error } = await supabase.from("rewards").update({ is_active: !reward.is_active }).eq("id", reward.id)

      if (error) throw error
      toast.success(reward.is_active ? "Reward deactivated" : "Reward activated")
      fetchRewards()
    } catch (error) {
      console.error("[v0] Error toggling reward:", error)
      toast.error("Failed to update reward")
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm("Are you sure you want to delete this reward?")) return

    try {
      const { error } = await supabase.from("rewards").delete().eq("id", rewardId)

      if (error) throw error
      toast.success("Reward deleted successfully")
      fetchRewards()
    } catch (error) {
      console.error("[v0] Error deleting reward:", error)
      toast.error("Failed to delete reward")
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
        <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/business">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">Rewards Management</h1>
              <p className="text-sm text-muted-foreground">Create and manage your loyalty rewards</p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reward
          </Button>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No rewards yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">Create your first reward to start engaging customers</p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Reward
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id} className={!reward.is_active ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{reward.reward_name}</CardTitle>
                      <CardDescription className="mt-1">{reward.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(reward)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">{reward.points_required}</p>
                      <p className="text-xs text-muted-foreground">points required</p>
                    </div>
                    <Button
                      variant={reward.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleActive(reward)}
                    >
                      {reward.is_active ? "Active" : "Inactive"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
            <DialogDescription>
              {editingReward ? "Update the reward details" : "Add a new reward for your customers"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward_name">Reward Name</Label>
              <Input
                id="reward_name"
                placeholder="e.g., Free Coffee"
                value={formData.reward_name}
                onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what the customer gets..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points_required">Points Required</Label>
              <Input
                id="points_required"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={formData.points_required}
                onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveReward} disabled={isProcessing} className="flex-1">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingReward ? (
                  "Update Reward"
                ) : (
                  "Create Reward"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
