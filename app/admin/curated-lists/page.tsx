"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, List, GripVertical } from "lucide-react"
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
  created_at: string
}

interface Business {
  id: string
  business_name: string
  business_category: string
}

export default function AdminCuratedListsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [lists, setLists] = useState<CuratedList[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("trending")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchData()
  }, [])

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
    setIsLoading(false)
  }

  const fetchData = async () => {
    try {
      // Fetch curated lists
      const { data: listsData } = await supabase
        .from("curated_lists")
        .select("*")
        .order("display_order", { ascending: true })

      setLists(listsData || [])

      // Fetch approved businesses
      const { data: businessesData } = await supabase
        .from("businesses")
        .select("id, business_name, business_category")
        .eq("approval_status", "approved")
        .eq("is_active", true)
        .order("business_name", { ascending: true })

      setBusinesses(businessesData || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to load data")
    }
  }

  const handleCreateList = async () => {
    if (!title || !admin) return

    try {
      const { error } = await supabase
        .from("curated_lists")
        .insert({
          title,
          description,
          category,
          created_by: admin.id,
          display_order: lists.length
        })

      if (error) throw error

      toast.success("Curated list created")
      setShowCreateDialog(false)
      setTitle("")
      setDescription("")
      setCategory("trending")
      fetchData()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to create list")
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm("Delete this curated list?")) return

    const { error } = await supabase
      .from("curated_lists")
      .delete()
      .eq("id", listId)

    if (error) {
      toast.error("Failed to delete list")
    } else {
      toast.success("Curated list deleted")
      fetchData()
    }
  }

  const handleToggleActive = async (list: CuratedList) => {
    const { error } = await supabase
      .from("curated_lists")
      .update({ is_active: !list.is_active })
      .eq("id", list.id)

    if (error) {
      toast.error("Failed to update list")
    } else {
      toast.success(list.is_active ? "List deactivated" : "List activated")
      fetchData()
    }
  }

  if (isLoading || !admin) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardLayout
      userRole="admin"
      userName={admin.full_name}
      userAvatar={admin.profile_pic_url}
      breadcrumbs={[{ label: "Admin" }, { label: "Curated Lists" }]}
    >
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Curated Lists</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage featured business lists for the discover page
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto h-11 md:h-10">
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        </div>

        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <List className="h-4 w-4 md:h-5 md:w-5" />
                      {list.title}
                    </CardTitle>
                    {list.description && (
                      <CardDescription className="text-xs md:text-sm mt-1">{list.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant={list.is_active ? 'default' : 'secondary'}>
                    {list.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  {list.category && <Badge variant="outline">{list.category}</Badge>}
                  <Badge variant="outline">Order: {list.display_order}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-9 text-xs md:text-sm" onClick={() => router.push(`/admin/curated-lists/${list.id}`)}>
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Manage
                  </Button>
                  <Button size="sm" variant={list.is_active ? 'secondary' : 'default'} className="h-9 text-xs md:text-sm" onClick={() => handleToggleActive(list)}>
                    {list.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="destructive" className="h-9 w-9" onClick={() => handleDeleteList(list.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Create Curated List</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Create a new featured business list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm md:text-base">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Trending Restaurants"
                  className="h-11 md:h-10 text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm md:text-base">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="The hottest spots in town..."
                  rows={3}
                  className="text-base min-h-[88px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm md:text-base">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 md:h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1 h-11 md:h-10">Cancel</Button>
              <Button onClick={handleCreateList} disabled={!title} className="flex-1 h-11 md:h-10">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
