"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Tag, Percent, Loader2, Star, Clock, Calendar } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { OptimizedImage } from "@/components/optimized-image"
import { OfferImageUpload } from "@/components/offer-image-upload"
import type { Deal, MenuItem } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

export default function DealsManagementPage() {
  const supabase = useMemo(() => createClient(), [])
  const [deals, setDeals] = useState<Deal[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [businessData, setBusinessData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'discount' | 'exclusive'>('discount')
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deal_type: "discount" as 'discount' | 'exclusive',
    discount_percentage: "",
    discount_value: "",
    menu_item_id: "",
    original_price: "",
    exclusive_price: "",
    points_required: "0",
    image_url: "",
    terms_and_conditions: "",
    redemption_limit: "",
    validity_start: new Date().toISOString().slice(0, 16),
    validity_end: "",
    is_active: true,
    // Scheduling fields
    schedule_type: "always_available" as 'always_available' | 'time_based' | 'day_based' | 'time_and_day',
    start_time: "",
    end_time: "",
    active_days: [0, 1, 2, 3, 4, 5, 6] as number[]
  })

  useEffect(() => {
    fetchBusinessData()
    fetchDeals()
    fetchMenuItems()
  }, [])

  const fetchBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, profile_pic_url")
        .eq("id", user.id)
        .single()

      if (error) throw error
      setBusinessData(data)
    } catch (error) {
      console.error("Error fetching business data:", error)
    }
  }

  const fetchDeals = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("deals")
        .select(`
          *,
          menu_items (
            id,
            name,
            image_url
          )
        `)
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDeals(data || [])
    } catch (error) {
      console.error("Error fetching deals:", error)
      toast.error("Failed to load deals")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("business_id", user.id)
        .eq("is_available", true)
        .order("name")

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Generate QR code data
      const qrCodeData = `GIYA-DEAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const dealData: any = {
        business_id: user.id,
        title: formData.title,
        description: formData.description || null,
        deal_type: formData.deal_type,
        points_required: parseInt(formData.points_required) || 0,
        image_url: formData.image_url || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        redemption_limit: formData.redemption_limit ? parseInt(formData.redemption_limit) : null,
        validity_start: formData.validity_start,
        validity_end: formData.validity_end || null,
        is_active: formData.is_active,
        qr_code_data: qrCodeData,
        // Scheduling fields
        schedule_type: formData.schedule_type,
        start_time: (formData.schedule_type === 'time_based' || formData.schedule_type === 'time_and_day') 
          ? formData.start_time || null 
          : null,
        end_time: (formData.schedule_type === 'time_based' || formData.schedule_type === 'time_and_day') 
          ? formData.end_time || null 
          : null,
        active_days: (formData.schedule_type === 'day_based' || formData.schedule_type === 'time_and_day') 
          ? formData.active_days 
          : [0, 1, 2, 3, 4, 5, 6]
      }

      if (formData.deal_type === 'discount') {
        dealData.discount_percentage = formData.discount_percentage ? parseFloat(formData.discount_percentage) : null
        dealData.discount_value = formData.discount_value ? parseFloat(formData.discount_value) : null
        dealData.menu_item_id = null
        dealData.original_price = null
        dealData.exclusive_price = null
      } else {
        dealData.menu_item_id = formData.menu_item_id || null
        dealData.original_price = formData.original_price ? parseFloat(formData.original_price) : null
        dealData.exclusive_price = formData.exclusive_price ? parseFloat(formData.exclusive_price) : null
        dealData.discount_percentage = null
        dealData.discount_value = null
      }

      if (editingDeal) {
        const { error } = await supabase
          .from("deals")
          .update(dealData)
          .eq("id", editingDeal.id)

        if (error) throw error
        toast.success("Deal updated successfully")
      } else {
        const { error } = await supabase
          .from("deals")
          .insert(dealData)

        if (error) throw error
        toast.success("Deal created successfully")
      }

      setShowDialog(false)
      resetForm()
      fetchDeals()
    } catch (error) {
      console.error("Error saving deal:", error)
      toast.error("Failed to save deal")
    }
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      title: deal.title,
      description: deal.description || "",
      deal_type: deal.deal_type,
      discount_percentage: deal.discount_percentage?.toString() || "",
      discount_value: deal.discount_value?.toString() || "",
      menu_item_id: deal.menu_item_id || "",
      original_price: deal.original_price?.toString() || "",
      exclusive_price: deal.exclusive_price?.toString() || "",
      points_required: deal.points_required.toString(),
      image_url: deal.image_url || "",
      terms_and_conditions: deal.terms_and_conditions || "",
      redemption_limit: deal.redemption_limit?.toString() || "",
      validity_start: deal.validity_start.slice(0, 16),
      validity_end: deal.validity_end ? deal.validity_end.slice(0, 16) : "",
      is_active: deal.is_active,
      // Scheduling fields
      schedule_type: deal.schedule_type || 'always_available',
      start_time: deal.start_time || "",
      end_time: deal.end_time || "",
      active_days: deal.active_days || [0, 1, 2, 3, 4, 5, 6]
    })
    setActiveTab(deal.deal_type)
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Deal deleted successfully")
      fetchDeals()
    } catch (error) {
      console.error("Error deleting deal:", error)
      toast.error("Failed to delete deal")
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      deal_type: activeTab,
      discount_percentage: "",
      discount_value: "",
      menu_item_id: "",
      original_price: "",
      exclusive_price: "",
      points_required: "0",
      image_url: "",
      terms_and_conditions: "",
      redemption_limit: "",
      validity_start: new Date().toISOString().slice(0, 16),
      validity_end: "",
      is_active: true,
      // Scheduling fields
      schedule_type: "always_available",
      start_time: "",
      end_time: "",
      active_days: [0, 1, 2, 3, 4, 5, 6]
    })
    setEditingDeal(null)
  }

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image_url: url })
  }

  const handleMenuItemSelect = (itemId: string) => {
    const selectedItem = menuItems.find(item => item.id === itemId)
    if (selectedItem && selectedItem.base_price) {
      setFormData({
        ...formData,
        menu_item_id: itemId,
        original_price: selectedItem.base_price.toString(),
        image_url: selectedItem.image_url || formData.image_url
      })
    } else {
      setFormData({ ...formData, menu_item_id: itemId })
    }
  }

  const discountDeals = deals.filter(d => d.deal_type === 'discount')
  const exclusiveDeals = deals.filter(d => d.deal_type === 'exclusive')

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="business"
        userName={businessData?.business_name || "Loading..."}
        userAvatar={businessData?.profile_pic_url}
        breadcrumbs={[{ label: "Deals Management" }]}
      >
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole="business"
      userName={businessData?.business_name || "Business"}
      userAvatar={businessData?.profile_pic_url}
      breadcrumbs={[{ label: "Deals Management" }]}
    >
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold">Deals Management</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-0.5">
              Create and manage discount deals and exclusive product offers
            </p>
          </div>
          <Button 
            onClick={() => {
              setFormData({ ...formData, deal_type: activeTab })
              setShowDialog(true)
            }}
            className="w-full sm:w-auto h-11 md:h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'discount' | 'exclusive')}>
          <TabsList className="grid w-full sm:max-w-md grid-cols-2 h-11 md:h-10">
            <TabsTrigger value="discount" className="text-xs md:text-sm">
              <Percent className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Discounts</span>
              <span className="xs:hidden">%</span>
              <span className="ml-1">({discountDeals.length})</span>
            </TabsTrigger>
            <TabsTrigger value="exclusive" className="text-xs md:text-sm">
              <Star className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Exclusive</span>
              <span className="xs:hidden">★</span>
              <span className="ml-1">({exclusiveDeals.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discount" className="mt-4 md:mt-6">
            {discountDeals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12">
                  <Percent className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">No discount deals yet</h3>
                  <p className="text-sm md:text-base text-muted-foreground text-center mb-3 md:mb-4">
                    Create percentage or fixed amount discounts for your customers
                  </p>
                  <Button 
                    onClick={() => {
                      setFormData({ ...formData, deal_type: 'discount' })
                      setShowDialog(true)
                    }}
                    className="w-full sm:w-auto h-11 md:h-10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Discount Deal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {discountDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exclusive" className="mt-4 md:mt-6">
            {exclusiveDeals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12">
                  <Star className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">No exclusive offers yet</h3>
                  <p className="text-sm md:text-base text-muted-foreground text-center mb-3 md:mb-4">
                    Create special deals on your menu items with exclusive pricing
                  </p>
                  <Button 
                    onClick={() => {
                      setFormData({ ...formData, deal_type: 'exclusive' })
                      setShowDialog(true)
                    }}
                    className="w-full sm:w-auto h-11 md:h-10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Exclusive Offer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {exclusiveDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                {editingDeal ? "Edit Deal" : `Add ${formData.deal_type === 'discount' ? 'Discount' : 'Exclusive'} Deal`}
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                {editingDeal ? "Update your deal details" : 
                  formData.deal_type === 'discount' 
                    ? "Create a percentage or fixed amount discount" 
                    : "Create an exclusive offer on a menu item"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm md:text-base">Deal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 20% Off All Beverages, Buy 1 Take 1 Burger"
                  className="h-11 md:h-10 text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm md:text-base">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your deal..."
                  rows={3}
                  className="text-base min-h-[88px]"
                />
              </div>

              {formData.deal_type === 'discount' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_percentage" className="text-sm md:text-base">Discount Percentage (%)</Label>
                      <Input
                        id="discount_percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          discount_percentage: e.target.value,
                          discount_value: "" 
                        })}
                        placeholder="e.g., 15"
                        className="h-11 md:h-10 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount_value" className="text-sm md:text-base">Fixed Discount (₱)</Label>
                      <Input
                        id="discount_value"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          discount_value: e.target.value,
                          discount_percentage: "" 
                        })}
                        placeholder="e.g., 50"
                        className="h-11 md:h-10 text-base"
                      />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Enter either percentage OR fixed amount, not both
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="menu_item">Select Menu Item *</Label>
                    {menuItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No menu items available. Please add menu items first.
                      </p>
                    ) : (
                      <Select
                        value={formData.menu_item_id}
                        onValueChange={handleMenuItemSelect}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="original_price">Original Price (₱)</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exclusive_price">Exclusive Price (₱) *</Label>
                      <Input
                        id="exclusive_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.exclusive_price}
                        onChange={(e) => setFormData({ ...formData, exclusive_price: e.target.value })}
                        placeholder="0.00"
                        required={formData.deal_type === 'exclusive'}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="points_required">Points Required</Label>
                <Input
                  id="points_required"
                  type="number"
                  min="0"
                  value={formData.points_required}
                  onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 for no points requirement
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-image-upload">Deal Image</Label>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or GIF up to 5MB
                </p>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <div className="relative border rounded-lg overflow-hidden">
                      <OptimizedImage
                        src={formData.image_url}
                        alt="Deal preview"
                        width={200}
                        height={200}
                        className="object-cover w-48 h-48"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 rounded-full"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg w-48 h-48 flex flex-col items-center justify-center">
                    <Tag className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">No image uploaded</span>
                  </div>
                )}
                <Input
                  id="deal-image-upload"
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="Enter image URL or upload to Supabase storage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  placeholder="Enter any terms and conditions..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redemption_limit">Redemption Limit</Label>
                <Input
                  id="redemption_limit"
                  type="number"
                  min="0"
                  value={formData.redemption_limit}
                  onChange={(e) => setFormData({ ...formData, redemption_limit: e.target.value })}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited redemptions
                </p>
              </div>

              {/* Scheduling Options */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule_type">Deal Availability Schedule</Label>
                  <Select
                    value={formData.schedule_type}
                    onValueChange={(value: any) => setFormData({ ...formData, schedule_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always_available">Always Available</SelectItem>
                      <SelectItem value="time_based">Happy Hour (Specific Times)</SelectItem>
                      <SelectItem value="day_based">Weekly Recurring (Specific Days)</SelectItem>
                      <SelectItem value="time_and_day">Time & Day Combination</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Control when customers can redeem this deal
                  </p>
                </div>

                {/* Time-based scheduling */}
                {(formData.schedule_type === 'time_based' || formData.schedule_type === 'time_and_day') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground col-span-2">
                      e.g., 14:00 to 17:00 for 2pm-5pm Happy Hour
                    </p>
                  </div>
                )}

                {/* Day-based scheduling */}
                {(formData.schedule_type === 'day_based' || formData.schedule_type === 'time_and_day') && (
                  <div className="space-y-2">
                    <Label>Active Days *</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 0, label: 'Sun' },
                        { value: 1, label: 'Mon' },
                        { value: 2, label: 'Tue' },
                        { value: 3, label: 'Wed' },
                        { value: 4, label: 'Thu' },
                        { value: 5, label: 'Fri' },
                        { value: 6, label: 'Sat' },
                      ].map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`day-${day.value}`}
                            checked={formData.active_days.includes(day.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ 
                                  ...formData, 
                                  active_days: [...formData.active_days, day.value].sort() 
                                })
                              } else {
                                setFormData({ 
                                  ...formData, 
                                  active_days: formData.active_days.filter(d => d !== day.value) 
                                })
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`day-${day.value}`} className="cursor-pointer text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select which days this deal is available
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validity_start">Valid From *</Label>
                  <Input
                    id="validity_start"
                    type="datetime-local"
                    value={formData.validity_start}
                    onChange={(e) => setFormData({ ...formData, validity_start: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validity_end">Valid Until</Label>
                  <Input
                    id="validity_end"
                    type="datetime-local"
                    value={formData.validity_end}
                    onChange={(e) => setFormData({ ...formData, validity_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 h-5 w-5 md:h-4 md:w-4"
                />
                <Label htmlFor="is_active" className="cursor-pointer text-sm md:text-base">
                  Active (visible to customers)
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 md:pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false)
                    resetForm()
                  }}
                  className="flex-1 h-11 md:h-10 text-sm md:text-base"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-11 md:h-10 text-sm md:text-base"
                >
                  {editingDeal ? "Update Deal" : "Create Deal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

function DealCard({ deal, onEdit, onDelete }: { 
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}) {
  const isExpired = deal.validity_end && new Date(deal.validity_end) < new Date()
  const limitReached = deal.redemption_limit && deal.redemption_count >= deal.redemption_limit

  const displayImage = deal.image_url || (deal.menu_items as any)?.image_url

  // Format schedule display
  const getScheduleDisplay = () => {
    if (deal.schedule_type === 'always_available') return null
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    switch (deal.schedule_type) {
      case 'time_based':
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{deal.start_time} - {deal.end_time}</span>
          </div>
        )
      case 'day_based':
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{deal.active_days?.map(d => dayNames[d]).join(', ')}</span>
          </div>
        )
      case 'time_and_day':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{deal.active_days?.map(d => dayNames[d]).join(', ')}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{deal.start_time} - {deal.end_time}</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card className={!deal.is_active || isExpired || limitReached ? "opacity-60" : ""}>
      <CardHeader className={displayImage ? "p-0" : "p-4 md:p-6"}>
        {displayImage && (
          <div className="relative h-40 md:h-48 w-full rounded-t-lg overflow-hidden">
            <OptimizedImage
              src={displayImage}
              alt={deal.title}
              width={400}
              height={192}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <div className={displayImage ? "p-3 md:p-4" : ""}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex-1 text-base md:text-lg">{deal.title}</CardTitle>
            <div className="flex gap-1 flex-shrink-0">
              {deal.deal_type === 'discount' ? (
                <Tag className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              ) : (
                <Star className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
            {!deal.is_active && (
              <span className="text-[10px] md:text-xs bg-muted px-2 py-1 rounded">Inactive</span>
            )}
            {isExpired && (
              <span className="text-[10px] md:text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">Expired</span>
            )}
            {limitReached && (
              <span className="text-[10px] md:text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Limit Reached</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 md:space-y-3 p-3 md:p-6">
        {deal.description && (
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
        )}
        
        <div className="space-y-1.5 md:space-y-2">
          {deal.deal_type === 'discount' ? (
            <p className="text-base md:text-lg font-bold text-primary">
              {deal.discount_percentage 
                ? `${deal.discount_percentage}% OFF`
                : `₱${deal.discount_value} OFF`}
            </p>
          ) : (
            <div className="flex items-center gap-2">
              {deal.original_price && (
                <span className="text-xs md:text-sm line-through text-muted-foreground">
                  ₱{deal.original_price}
                </span>
              )}
              <span className="text-base md:text-lg font-bold text-primary">
                ₱{deal.exclusive_price}
              </span>
            </div>
          )}
          
          {deal.points_required > 0 && (
            <p className="text-xs md:text-sm text-muted-foreground">
              {deal.points_required} points required
            </p>
          )}
          
          {/* Schedule display */}
          {getScheduleDisplay()}
          
          <p className="text-[10px] md:text-xs text-muted-foreground">
            Redeemed: {deal.redemption_count}
            {deal.redemption_limit && ` / ${deal.redemption_limit}`}
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(deal)}
            className="flex-1 h-10 md:h-9 text-sm touch-target"
          >
            <Pencil className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden xs:inline">Edit</span>
            <span className="xs:hidden">✏️</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(deal.id)}
            className="h-10 md:h-9 w-10 md:w-9 text-destructive hover:text-destructive touch-target"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
