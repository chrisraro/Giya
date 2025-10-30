"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { OptimizedImage } from "@/components/optimized-image"
import type { MenuItem } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

export default function MenuManagementPage() {
  const supabase = useMemo(() => createClient(), [])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [businessData, setBusinessData] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    base_price: "",
    image_url: "",
    is_available: true
  })

  useEffect(() => {
    fetchBusinessData()
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

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error("Error fetching menu items:", error)
      toast.error("Failed to load menu items")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const itemData = {
        business_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        image_url: formData.image_url || null,
        is_available: formData.is_available
      }

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id)

        if (error) throw error
        toast.success("Menu item updated successfully")
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert(itemData)

        if (error) throw error
        toast.success("Menu item created successfully")
      }

      setShowDialog(false)
      resetForm()
      fetchMenuItems()
    } catch (error) {
      console.error("Error saving menu item:", error)
      toast.error("Failed to save menu item")
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category || "",
      base_price: item.base_price?.toString() || "",
      image_url: item.image_url || "",
      is_available: item.is_available
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item? This will affect any rewards or deals using this item.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Menu item deleted successfully")
      fetchMenuItems()
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast.error("Failed to delete menu item")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      base_price: "",
      image_url: "",
      is_available: true
    })
    setEditingItem(null)
  }

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsUploadingImage(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `menu-items/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('offer-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('offer-images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: "" })
  }

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="business"
        userName={businessData?.business_name || "Loading..."}
        userAvatar={businessData?.profile_pic_url}
        breadcrumbs={[{ label: "Menu Management" }]}
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
      breadcrumbs={[{ label: "Menu Management" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Menu Management</h2>
            <p className="text-muted-foreground">
              Manage your products and menu items. Use these in rewards and deals.
            </p>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>

        {menuItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start by adding your first menu item or product
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <Card key={item.id}>
                <CardHeader className={item.image_url ? "p-0" : ""}>
                  {item.image_url && (
                    <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.name}
                        width={400}
                        height={192}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className={item.image_url ? "p-4" : ""}>
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{item.name}</span>
                      {!item.is_available && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">Unavailable</span>
                      )}
                    </CardTitle>
                    {item.category && (
                      <CardDescription>{item.category}</CardDescription>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  {item.base_price && (
                    <p className="text-lg font-semibold text-primary">₱{item.base_price.toFixed(2)}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update your menu item details" : "Add a new product or menu item"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cappuccino, Burger, Massage Service"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Beverage">Beverage</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your menu item..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price (₱)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-item-image">Item Image</Label>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or GIF up to 5MB
                </p>
                
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <div className="relative border rounded-lg overflow-hidden">
                      <OptimizedImage 
                        src={formData.image_url} 
                        alt="Menu item preview" 
                        width={200} 
                        height={200}
                        className="object-cover w-48 h-48"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 rounded-full"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-lg w-48 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Package className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    {isUploadingImage && (
                      <Loader2 className="h-4 w-4 animate-spin mt-2" />
                    )}
                  </div>
                )}
                
                <Input
                  id="menu-item-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                />
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  
                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_available" className="cursor-pointer">
                  Available for customers
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false)
                    resetForm()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingItem ? "Update Item" : "Create Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
