"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Edit, Trash2, Gift, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { OfferImageUpload } from "@/components/offer-image-upload"
import { OptimizedImage } from "@/components/optimized-image"
import type { MenuItem } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

interface Reward {
  id: string
  business_id: string
  reward_name: string | null
  description: string
  points_required: number
  image_url: string | null
  is_active: boolean
  created_at: string
  use_menu_item: boolean
  menu_item_id: string | null
  menu_items?: MenuItem | null
}

export default function BusinessRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [businessId, setBusinessId] = useState<string>("")
  const [formData, setFormData] = useState({
    reward_name: "",
    description: "",
    points_required: "",
    image_url: "",
    use_menu_item: false,
    menu_item_id: ""
  })
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    fetchBusinessId()
  }, [])

  useEffect(() => {
    if (businessId) {
      fetchRewards()
    }
  }, [businessId])

  const fetchBusinessId = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setBusinessId(user.id)
    } catch (error) {
      console.error("[v0] Error fetching business ID:", error)
      toast.error("Failed to load business data")
    }
  }

  const fetchRewards = async () => {
    try {
      if (!businessId) {
        // Wait for businessId to be set
        return
      }

      const { data, error } = await supabase
        .from("rewards")
        .select(`
          *,
          menu_items (
            id,
            name,
            image_url,
            base_price
          )
        `)
        .eq("business_id", businessId)
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

  const fetchMenuItems = async () => {
    try {
      if (!businessId) return

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_available", true)
        .order("name")

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
    }
  }

  const handleOpenDialog = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward)
      setFormData({
        reward_name: reward.reward_name || "",
        description: reward.description,
        points_required: reward.points_required.toString(),
        image_url: reward.image_url || "",
        use_menu_item: reward.use_menu_item,
        menu_item_id: reward.menu_item_id || ""
      })
    } else {
      setEditingReward(null)
      setFormData({
        reward_name: "",
        description: "",
        points_required: "",
        image_url: "",
        use_menu_item: false,
        menu_item_id: ""
      })
    }
    setShowDialog(true)
  }

  const handleImageUpdate = (newImageUrl: string | null) => {
    setFormData(prev => ({ ...prev, image_url: newImageUrl || "" }))
  }

  const handleSaveReward = async () => {
    // Validation
    if (formData.use_menu_item) {
      if (!formData.menu_item_id || !formData.points_required) {
        toast.error("Please select a menu item and set points required")
        return
      }
    } else {
      if (!formData.reward_name || !formData.description || !formData.points_required) {
        toast.error("Please fill in all fields")
        return
      }
    }

    const pointsRequired = Number.parseInt(formData.points_required)
    if (isNaN(pointsRequired) || pointsRequired <= 0) {
      toast.error("Points required must be a positive number")
      return
    }

    setIsProcessing(true)

    try {
      if (!businessId) throw new Error("Business ID not available")

      const rewardData: any = {
        business_id: businessId,
        description: formData.description,
        points_required: pointsRequired,
        image_url: formData.image_url || null,
        is_active: true,
        use_menu_item: formData.use_menu_item
      }

      if (formData.use_menu_item) {
        rewardData.menu_item_id = formData.menu_item_id
        rewardData.reward_name = null
      } else {
        rewardData.reward_name = formData.reward_name
        rewardData.menu_item_id = null
      }

      if (editingReward) {
        // Update existing reward
        const { error } = await supabase
          .from("rewards")
          .update(rewardData)
          .eq("id", editingReward.id)

        if (error) throw error
        toast.success("Reward updated successfully")
      } else {
        // Create new reward
        const { error } = await supabase.from("rewards").insert(rewardData)

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
            {rewards.map((reward) => {
              const displayName = reward.use_menu_item && reward.menu_items
                ? reward.menu_items.name
                : reward.reward_name
              const displayImage = reward.image_url || (reward.menu_items as any)?.image_url
              
              return (
                <Card key={reward.id} className={!reward.is_active ? "opacity-60" : ""}>
                  {displayImage && (
                    <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
                      <OptimizedImage
                        src={displayImage}
                        alt={displayName || "Reward"}
                        width={400}
                        height={192}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{displayName}</CardTitle>
                        <CardDescription className="mt-1">{reward.description}</CardDescription>
                        {reward.use_menu_item && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">
                            Menu Item
                          </span>
                        )}
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
              )
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
            <DialogDescription>
              {editingReward ? "Update the reward details" : "Add a new reward for your customers"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use_menu_item"
                  checked={formData.use_menu_item}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    use_menu_item: e.target.checked,
                    reward_name: e.target.checked ? "" : formData.reward_name
                  })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="use_menu_item" className="cursor-pointer">
                  Use existing menu item
                </Label>
              </div>
            </div>

            {formData.use_menu_item ? (
              <div className="space-y-2">
                <Label htmlFor="menu_item">Select Menu Item *</Label>
                {menuItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No menu items available. Please add menu items first.
                  </p>
                ) : (
                  <Select
                    value={formData.menu_item_id}
                    onValueChange={(value) => {
                      const selectedItem = menuItems.find(item => item.id === value)
                      setFormData({ 
                        ...formData, 
                        menu_item_id: value,
                        image_url: selectedItem?.image_url || formData.image_url
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a menu item" />
                    </SelectTrigger>
                    <SelectContent>
                      {menuItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} {item.base_price && `(₱${item.base_price})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reward_name">Reward Name *</Label>
                <Input
                  id="reward_name"
                  placeholder="e.g., Free Coffee"
                  value={formData.reward_name}
                  onChange={(e) => setFormData({ ...formData, reward_name: e.target.value })}
                />
              </div>
            )}

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
              <Label htmlFor="points_required">Points Required *</Label>
              <Input
                id="points_required"
                type="number"
                min="1"
                placeholder="e.g., 100"
                value={formData.points_required}
                onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reward Image</Label>
              <OfferImageUpload
                currentImageUrl={formData.image_url || null}
                businessId={businessId}
                offerId={editingReward?.id || 'new'}
                offerType="reward"
                onImageUpdate={handleImageUpdate}
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