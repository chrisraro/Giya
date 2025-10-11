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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
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
import { Plus, Edit, Trash2, Calendar, Users } from "lucide-react"
import { handleApiError } from "@/lib/error-handler"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"

interface DiscountOffer {
  id: string
  title: string
  description: string | null
  discount_type: string
  discount_value: number
  minimum_purchase: number | null
  is_active: boolean
  usage_limit: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  is_first_visit_only: boolean
  created_at: string
  qr_code_data?: string
}

export default function BusinessDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountOffer | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    minimum_purchase: "",
    is_active: true,
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_first_visit_only: false
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const fetchDiscounts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("discount_offers")
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDiscounts(data || [])
    } catch (error) {
      handleApiError(error, "Failed to load discount offers", "BusinessDiscounts.fetchDiscounts")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      minimum_purchase: "",
      is_active: true,
      usage_limit: "",
      valid_from: "",
      valid_until: "",
      is_first_visit_only: false
    })
    setEditingDiscount(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const discountData = {
        business_id: user.id,
        title: formData.title,
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        minimum_purchase: formData.minimum_purchase ? parseFloat(formData.minimum_purchase) : null,
        is_active: formData.is_active,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_first_visit_only: formData.is_first_visit_only,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      }

      if (editingDiscount) {
        // Update existing discount
        const { error } = await supabase
          .from("discount_offers")
          .update(discountData)
          .eq("id", editingDiscount.id)
        
        if (error) throw error
        toast.success("Discount offer updated successfully")
      } else {
        // Create new discount
        const { error } = await supabase
          .from("discount_offers")
          .insert(discountData)
        
        if (error) throw error
        toast.success("Discount offer created successfully")
      }

      setOpenDialog(false)
      resetForm()
      fetchDiscounts()
    } catch (error) {
      handleApiError(error, "Failed to save discount offer", "BusinessDiscounts.handleSubmit")
    }
  }

  const handleEdit = (discount: DiscountOffer) => {
    setEditingDiscount(discount)
    setFormData({
      title: discount.title,
      description: discount.description || "",
      discount_type: discount.discount_type,
      discount_value: discount.discount_value.toString(),
      minimum_purchase: discount.minimum_purchase?.toString() || "",
      is_active: discount.is_active,
      usage_limit: discount.usage_limit?.toString() || "",
      valid_from: discount.valid_from || "",
      valid_until: discount.valid_until || "",
      is_first_visit_only: discount.is_first_visit_only
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount offer?")) return
    
    try {
      const { error } = await supabase
        .from("discount_offers")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      toast.success("Discount offer deleted successfully")
      fetchDiscounts()
    } catch (error) {
      handleApiError(error, "Failed to delete discount offer", "BusinessDiscounts.handleDelete")
    }
  }

  const formatDiscountValue = (type: string, value: number) => {
    if (type === "percentage") {
      return `${value}%`
    } else if (type === "fixed_amount") {
      return `₱${value.toFixed(2)}`
    }
    return `${value}`
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
          <h1 className="text-2xl font-bold text-foreground">Discount Offers</h1>
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
                Discount Offers
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Create Discount Button */}
          <div className="flex justify-end">
            <Dialog open={openDialog} onOpenChange={(open) => {
              setOpenDialog(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Discount Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingDiscount ? "Edit Discount Offer" : "Create Discount Offer"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDiscount 
                      ? "Update the details of your discount offer" 
                      : "Create a new discount offer for your customers"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., First Visit Discount"
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
                        placeholder="Describe your discount offer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="discount_type">Discount Type</Label>
                        <Select 
                          value={formData.discount_type} 
                          onValueChange={(value) => handleSelectChange("discount_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            <SelectItem value="first_visit">First Visit Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="discount_value">
                          {formData.discount_type === "percentage" ? "Discount Percentage" : 
                           formData.discount_type === "fixed_amount" ? "Discount Amount (₱)" : 
                           "Points Value"}
                        </Label>
                        <Input
                          id="discount_value"
                          name="discount_value"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.discount_value}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="minimum_purchase">Minimum Purchase (₱)</Label>
                        <Input
                          id="minimum_purchase"
                          name="minimum_purchase"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.minimum_purchase}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                      
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
                      
                      <div className="flex items-center gap-2">
                        <input
                          id="is_first_visit_only"
                          type="checkbox"
                          checked={formData.is_first_visit_only}
                          onChange={(e) => handleSwitchChange("is_first_visit_only", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is_first_visit_only">First Visit Only</Label>
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
                      {editingDiscount ? "Update Offer" : "Create Offer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Discounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Discount Offers</CardTitle>
              <CardDescription>
                Manage your discount offers for customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : discounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No discount offers yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first discount offer to attract customers
                  </p>
                  <Button onClick={() => setOpenDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Discount Offer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {discounts.map((discount) => (
                    <Card key={discount.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{discount.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {discount.description || "No description"}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(discount)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(discount.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">
                                {formatDiscountValue(discount.discount_type, discount.discount_value)}
                              </span>
                              {discount.minimum_purchase && (
                                <div className="text-muted-foreground">
                                  Min. ₱{discount.minimum_purchase.toFixed(2)}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {discount.used_count} / {discount.usage_limit || "∞"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {discount.valid_from 
                                  ? formatDate(discount.valid_from) 
                                  : "No start date"} - {formatDate(discount.valid_until)}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                discount.is_active 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {discount.is_active ? "Active" : "Inactive"}
                              </div>
                              {discount.is_first_visit_only && (
                                <div className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                  First Visit
                                </div>
                              )}
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