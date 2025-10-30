"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Ban, PlayCircle, Building2, Loader2, Eye } from "lucide-react"
import { toast } from "sonner"
import type { Admin, BusinessAnalytics } from "@/lib/types/database"

export const dynamic = 'force-dynamic'

export default function AdminBusinessesPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [businesses, setBusinesses] = useState<BusinessAnalytics[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all')
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessAnalytics | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'reactivate'>('approve')
  const [actionReason, setActionReason] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAuth()
    fetchBusinesses()
  }, [])

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: isAdminResult } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdminResult) return

    const { data: adminData } = await supabase.rpc('get_admin_profile', { user_id: user.id })
    if (adminData && adminData.length > 0) {
      setAdmin(adminData[0])
    }
    setIsLoading(false)
  }

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_business_analytics")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to load businesses")
    }
  }

  const handleAction = async () => {
    if (!selectedBusiness || !admin) return
    setIsProcessing(true)

    try {
      let result
      if (actionType === 'approve') {
        result = await supabase.rpc('approve_business', {
          p_business_id: selectedBusiness.id,
          p_admin_id: admin.id
        })
      } else if (actionType === 'reject') {
        result = await supabase.rpc('reject_business', {
          p_business_id: selectedBusiness.id,
          p_reason: actionReason,
          p_admin_id: admin.id
        })
      } else if (actionType === 'suspend') {
        result = await supabase.rpc('suspend_business', {
          p_business_id: selectedBusiness.id,
          p_reason: actionReason,
          p_admin_id: admin.id
        })
      } else if (actionType === 'reactivate') {
        result = await supabase.rpc('reactivate_business', {
          p_business_id: selectedBusiness.id,
          p_admin_id: admin.id
        })
      }

      if (result?.data?.success) {
        toast.success(result.data.message)
        setShowActionDialog(false)
        setActionReason("")
        fetchBusinesses()
      } else {
        toast.error(result?.data?.message || "Action failed")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to perform action")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredBusinesses = businesses.filter(b => {
    if (activeTab === 'all') return true
    return b.approval_status === activeTab
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      suspended: { variant: "outline", label: "Suspended" }
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (isLoading || !admin) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <DashboardLayout
      userRole="business"
      userName={admin.full_name}
      userAvatar={admin.profile_pic_url}
      breadcrumbs={[{ label: "Admin" }, { label: "Businesses" }]}
    >
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Business Management</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Approve, manage, and monitor all businesses
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full sm:max-w-md grid-cols-4 h-11 md:h-10">
            <TabsTrigger value="all" className="text-xs md:text-sm">All ({businesses.length})</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pending ({businesses.filter(b => b.approval_status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs md:text-sm">Approved ({businesses.filter(b => b.approval_status === 'approved').length})</TabsTrigger>
            <TabsTrigger value="suspended" className="text-xs md:text-sm">Suspended ({businesses.filter(b => b.approval_status === 'suspended').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 md:mt-6">
            <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredBusinesses.map((business) => (
                <Card key={business.id}>
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                          <Building2 className="h-4 w-4 md:h-5 md:w-5" />
                          {business.business_name}
                        </CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1">{business.business_category}</p>
                      </div>
                      {getStatusBadge(business.approval_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-semibold">{business.transaction_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rewards</p>
                        <p className="font-semibold">{business.rewards_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Deals</p>
                        <p className="font-semibold">{business.deals_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Menu Items</p>
                        <p className="font-semibold">{business.menu_items_count}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-9 text-xs md:text-sm" onClick={() => router.push(`/admin/businesses/${business.id}`)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        <span className="hidden xs:inline">View & Manage</span>
                        <span className="xs:hidden">Manage</span>
                      </Button>
                      {business.approval_status === 'pending' && (
                        <>
                          <Button size="sm" className="flex-1 h-9 text-xs md:text-sm" onClick={() => { setSelectedBusiness(business); setActionType('approve'); setShowActionDialog(true) }}>
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1 h-9 text-xs md:text-sm" onClick={() => { setSelectedBusiness(business); setActionType('reject'); setShowActionDialog(true) }}>
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      {business.approval_status === 'approved' && business.is_active && (
                        <Button size="sm" variant="outline" className="w-full h-9 text-xs md:text-sm" onClick={() => { setSelectedBusiness(business); setActionType('suspend'); setShowActionDialog(true) }}>
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      )}
                      {(business.approval_status === 'suspended' || business.approval_status === 'rejected') && (
                        <Button size="sm" className="w-full h-9 text-xs md:text-sm" onClick={() => { setSelectedBusiness(business); setActionType('reactivate'); setShowActionDialog(true) }}>
                          <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-md p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                {actionType === 'approve' && 'Approve Business'}
                {actionType === 'reject' && 'Reject Business'}
                {actionType === 'suspend' && 'Suspend Business'}
                {actionType === 'reactivate' && 'Reactivate Business'}
              </DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                {actionType === 'approve' && `Approve ${selectedBusiness?.business_name}?`}
                {actionType === 'reject' && `Reject ${selectedBusiness?.business_name}? Please provide a reason.`}
                {actionType === 'suspend' && `Suspend ${selectedBusiness?.business_name}? Please provide a reason.`}
                {actionType === 'reactivate' && `Reactivate ${selectedBusiness?.business_name}?`}
              </DialogDescription>
            </DialogHeader>
            {(actionType === 'reject' || actionType === 'suspend') && (
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm md:text-base">Reason *</Label>
                <Textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={3}
                  className="text-base min-h-[88px]"
                  required
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowActionDialog(false)} className="flex-1 h-11 md:h-10">Cancel</Button>
              <Button onClick={handleAction} disabled={isProcessing || ((actionType === 'reject' || actionType === 'suspend') && !actionReason)} className="flex-1 h-11 md:h-10">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
