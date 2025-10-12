"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Calendar, Users, Tag } from "lucide-react"
import { handleApiError } from "@/lib/error-handler"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { OfferImageUpload } from "@/components/offer-image-upload"

interface ExclusiveOffer {
  id: string
  title: string
  description: string | null
  product_name: string
  original_price: number | null
  discounted_price: number | null
  discount_percentage: number | null
  image_url: string | null
  is_active: boolean
  usage_limit: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  created_at: string
  qr_code_data?: string
}

export default function BusinessExclusiveOffersPage() {
  const [offers, setOffers] = useState<ExclusiveOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingOffer, setEditingOffer] = useState<ExclusiveOffer | null>(null)
  const [businessId, setBusinessId] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_name: "",
    original_price: "",
    discounted_price: "",
    image_url: "",
    is_active: true,
    usage_limit: "",
    valid_from: "",
    valid_until: ""
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchBusinessId()
  }, [])

  useEffect(() => {
    if (businessId) {
      fetchOffers()
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
      handleApiError(error, "Failed to load business data", "BusinessExclusiveOffers.fetchBusinessId")
    }
  }

  const fetchOffers = async () => {
    try {
      if (!businessId) {
        // Wait for businessId to be set
        return
      }

      const { data, error } = await supabase
        .from("exclusive_offers")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOffers(data || [])
    } catch (error) {
      handleApiError(error, "Failed to load exclusive offers", "BusinessExclusiveOffers.fetchOffers")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      product_name: "",
      original_price: "",
      discounted_price: "",
      image_url: "",
      is_active: true,
      usage_limit: "",
      valid_from: "",
      valid_until: ""
    })
    setEditingOffer(null)
  }

  const calculateDiscountPercentage = () => {
    const original = parseFloat(formData.original_price)
    const discounted = parseFloat(formData.discounted_price)
    
    if (isNaN(original) || isNaN(discounted) || original <= 0) return ""
    
    const percentage = ((original - discounted) / original) * 100
    return percentage.toFixed(2)
  }

  const handleImageUpdate = (newImageUrl: string | null) => {
    setFormData(prev => ({ ...prev, image_url: newImageUrl || "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!businessId) throw new Error("Business ID not available")

      const offerData = {
        business_id: businessId,
        title: formData.title,
        description: formData.description || null,
        product_name: formData.product_name,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        discount_percentage: formData.original_price && formData.discounted_price 
          ? parseFloat(calculateDiscountPercentage()) 
          : null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      }

      if (editingOffer) {
        // Update existing offer
        const { error } = await supabase
          .from("exclusive_offers")
          .update(offerData)
          .eq("id", editingOffer.id)
        
        if (error) throw error
        toast.success("Exclusive offer updated successfully")
      } else {
        // Create new offer
        const { error } = await supabase
          .from("exclusive_offers")
          .insert(offerData)
        
        if (error) throw error
        toast.success("Exclusive offer created successfully")
      }

      setOpenDialog(false)
      resetForm()
      fetchOffers()
    } catch (error) {
      handleApiError(error, "Failed to save exclusive offer", "BusinessExclusiveOffers.handleSubmit")
    }
  }

  const handleEdit = (offer: ExclusiveOffer) => {
    setEditingOffer(offer)
    setFormData({
      title: offer.title,
      description: offer.description || "",
      product_name: offer.product_name,
      original_price: offer.original_price?.toString() || "",
      discounted_price: offer.discounted_price?.toString() || "",
      image_url: offer.image_url || "",
      is_active: offer.is_active,
      usage_limit: offer.usage_limit?.toString() || "",
      valid_from: offer.valid_from || "",
      valid_until: offer.valid_until || ""
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exclusive offer?")) return
    
    try {
      const { error } = await supabase
        .from("exclusive_offers")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      toast.success("Exclusive offer deleted successfully")
      fetchOffers()
    } catch (error) {
      handleApiError(error, "Failed to delete exclusive offer", "BusinessExclusiveOffers.handleDelete")
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "₱0.00"
    return `₱${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto py-4">
          <h1 className="text-2xl font-bold text-foreground">Exclusive Offers</h1>
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
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/business">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem isCurrent>
                Exclusive Offers
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Create Offer Button */}
          <div className="flex justify-end">
            <Dialog open={openDialog} onOpenChange={(open) => {
              setOpenDialog(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exclusive Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingOffer ? "Edit Exclusive Offer" : "Create Exclusive Offer"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOffer 
                      ? "Update the details of your exclusive offer" 
                      : "Create a new exclusive offer for your customers"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Offer Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Summer Sale Special"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="product_name">Product/Item Name</Label>
                      <Input
                        id="product_name"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Premium Coffee Blend"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your exclusive offer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="original_price">Original Price (₱)</Label>
                        <Input
                          id="original_price"
                          name="original_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.original_price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="discounted_price">Discounted Price (₱)</Label>
                        <Input
                          id="discounted_price"
                          name="discounted_price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discounted_price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {formData.original_price && formData.discounted_price && (
                      <div className="rounded-lg bg-primary/10 p-3">
                        <p className="text-sm font-medium text-primary">
                          Discount: {calculateDiscountPercentage()}% off
                        </p>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Product Image</Label>
                      <OfferImageUpload
                        currentImageUrl={formData.image_url || null}
                        businessId={businessId}
                        offerId={editingOffer?.id || "new"}
                        offerType="exclusive"
                        onImageUpdate={handleImageUpdate}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usage_limit">Usage Limit</Label>
                        <Input
                          id="usage_limit"
                          name="usage_limit"
                          type="number"
                          min="0"
                          value={formData.usage_limit}
                          onChange={handleInputChange}
                          placeholder="Unlimited"
                        />
                        <p className="text-xs text-muted-foreground">Leave blank for unlimited usage</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="valid_from">Valid From</Label>
                        <Input
                          id="valid_from"
                          name="valid_from"
                          type="date"
                          value={formData.valid_from}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="valid_until">Valid Until</Label>
                        <Input
                          id="valid_until"
                          name="valid_until"
                          type="date"
                          value={formData.valid_until}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          id="is_active"
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => handleSwitchChange("is_active", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpenDialog(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingOffer ? "Update Offer" : "Create Offer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Offers List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Exclusive Offers</CardTitle>
              <CardDescription>
                Manage your exclusive offers for customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Tag className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No exclusive offers yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first exclusive offer to attract customers
                  </p>
                  <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Exclusive Offer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <Card key={offer.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{offer.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {offer.product_name}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {offer.description || "No description"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(offer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(offer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium line-through text-muted-foreground">
                                {formatCurrency(offer.original_price)}
                              </span>
                              <div className="font-medium text-primary">
                                {formatCurrency(offer.discounted_price)}
                              </div>
                              {offer.discount_percentage && (
                                <div className="text-xs text-green-600 font-medium">
                                  {offer.discount_percentage.toFixed(0)}% OFF
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {offer.used_count} / {offer.usage_limit || "∞"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {offer.valid_from 
                                  ? formatDate(offer.valid_from) 
                                  : "No start date"} - {formatDate(offer.valid_until)}
                              </span>
                            </div>
                            
                            <div>
                              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                offer.is_active 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {offer.is_active ? "Active" : "Inactive"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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