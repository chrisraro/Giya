"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, GripVertical, Building2, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Admin } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

interface CuratedList {
  id: string
  title: string
  description: string | null
  category: string | null
  display_order: number
  is_active: boolean
}

interface Business {
  id: string
  business_name: string
  business_category: string
  profile_pic_url: string | null
  address: string
}

interface CuratedListItem {
  id: string
  business_id: string
  display_order: number
  businesses: Business
}

export default function CuratedListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string
  
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [list, setList] = useState<CuratedList | null>(null)
  const [listItems, setListItems] = useState<CuratedListItem[]>([])
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchListData()
  }, [listId])

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/admin/login")
      return
    }

    const { data: isAdminResult } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdminResult) {
      router.push("/admin/login")
      return
    }

    const { data: adminData } = await supabase.rpc('get_admin_profile', { user_id: user.id })
    if (adminData && adminData.length > 0) {
      setAdmin(adminData[0])
    }
  }

  const fetchListData = async () => {
    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from("curated_lists")
        .select("*")
        .eq("id", listId)
        .single()

      if (listError) throw listError
      setList(listData)

      // Fetch list items with business details
      const { data: itemsData, error: itemsError } = await supabase
        .from("curated_list_items")
        .select(`
          *,
          businesses (
            id,
            business_name,
            business_category,
            profile_pic_url,
            address
          )
        `)
        .eq("curated_list_id", listId)
        .order("display_order", { ascending: true })

      if (itemsError) throw itemsError
      setListItems(itemsData || [])

      // Fetch available businesses (approved and not in list)
      const currentBusinessIds = itemsData?.map(item => item.business_id) || []
      const { data: businessesData, error: businessesError } = await supabase
        .from("businesses")
        .select("id, business_name, business_category, profile_pic_url, address")
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .not("id", "in", `(${currentBusinessIds.join(",") || 'null'})`)
        .order("business_name", { ascending: true })

      if (businessesError) throw businessesError
      setAvailableBusinesses(businessesData || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to load list data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBusiness = async () => {
    if (!selectedBusinessId) return

    try {
      const { error } = await supabase
        .from("curated_list_items")
        .insert({
          curated_list_id: listId,
          business_id: selectedBusinessId,
          display_order: listItems.length,
          added_by: admin?.id
        })

      if (error) throw error

      toast.success("Business added to list")
      setShowAddDialog(false)
      setSelectedBusinessId("")
      fetchListData()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to add business")
    }
  }

  const handleRemoveBusiness = async (itemId: string) => {
    if (!confirm("Remove this business from the list?")) return

    const { error } = await supabase
      .from("curated_list_items")
      .delete()
      .eq("id", itemId)

    if (error) {
      toast.error("Failed to remove business")
    } else {
      toast.success("Business removed")
      fetchListData()
    }
  }

  const handleReorder = async (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = listItems.findIndex(item => item.id === itemId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= listItems.length) return

    // Swap display orders
    const updates = [
      { id: listItems[currentIndex].id, display_order: newIndex },
      { id: listItems[newIndex].id, display_order: currentIndex }
    ]

    for (const update of updates) {
      await supabase
        .from("curated_list_items")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
    }

    toast.success("Order updated")
    fetchListData()
  }

  const filteredBusinesses = availableBusinesses.filter(business =>
    business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.business_category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading || !list || !admin) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <DashboardLayout
      userRole="admin"
      userName={admin.full_name}
      userAvatar={admin.profile_pic_url}
      breadcrumbs={[
        { label: "Admin" },
        { label: "Curated Lists", href: "/admin/curated-lists" },
        { label: list.title }
      ]}
    >
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold">{list.title}</h2>
            {list.description && (
              <p className="text-sm md:text-base text-muted-foreground">{list.description}</p>
            )}
          </div>
          <Badge variant={list.is_active ? 'default' : 'secondary'}>
            {list.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base md:text-lg">Businesses in this List</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {listItems.length} businesses • Drag to reorder
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto h-11 md:h-10">
                <Plus className="mr-2 h-4 w-4" />
                Add Business
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3">
              {listItems.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleReorder(item.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleReorder(item.id, 'down')}
                          disabled={index === listItems.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-muted font-semibold text-xs md:text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{item.businesses.business_name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{item.businesses.business_category} • {item.businesses.address}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-9 w-9"
                        onClick={() => handleRemoveBusiness(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {listItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm md:text-base">No businesses in this list yet</p>
                  <p className="text-xs md:text-sm">Click "Add Business" to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Add Business to List</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Search and select a business to add
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search businesses..."
                  className="pl-10 h-11 md:h-10 text-base"
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredBusinesses.map((business) => (
                  <Card
                    key={business.id}
                    className={`cursor-pointer transition-colors ${selectedBusinessId === business.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setSelectedBusinessId(business.id)}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{business.business_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">{business.business_category}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredBusinesses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm md:text-base">No businesses found</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1 h-11 md:h-10">
                Cancel
              </Button>
              <Button onClick={handleAddBusiness} disabled={!selectedBusinessId} className="flex-1 h-11 md:h-10">
                Add to List
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
