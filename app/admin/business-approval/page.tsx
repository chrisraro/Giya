"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Check, 
  X, 
  Eye, 
  Clock, 
  User, 
  Building2, 
  MapPin,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  fetchPendingBusinessesAction, 
  approveBusinessAction, 
  rejectBusinessAction 
} from "@/lib/admin/business-approval-actions";

interface BusinessProfile {
  id: string
  business_name: string
  business_category: string
  address: string
  profile_pic_url: string | null
  approval_status: string
  created_at: string
  gmaps_link: string | null
}

export default function BusinessApprovalPage() {
  const [pendingBusinesses, setPendingBusinesses] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // Track which business is being processed

  useEffect(() => {
    fetchPendingBusinesses()
  }, [])

  const fetchPendingBusinesses = async () => {
    try {
      setLoading(true)
      
      const data = await fetchPendingBusinessesAction();
      setPendingBusinesses(data || []);
    } catch (error: any) {
      console.error("Error fetching pending businesses:", error)
      toast.error("Failed to load pending businesses")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (businessId: string) => {
    try {
      setActionLoading(businessId);
      
      const result = await approveBusinessAction(businessId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Business approved successfully!")
      fetchPendingBusinesses(); // Refresh the list
    } catch (error: any) {
      console.error("Error approving business:", error)
      toast.error(error.message || "Failed to approve business")
    } finally {
      setActionLoading(null);
    }
  }

  const handleReject = async (businessId: string) => {
    try {
      setActionLoading(businessId);
      
      const result = await rejectBusinessAction(businessId);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Business rejected successfully!")
      fetchPendingBusinesses(); // Refresh the list
    } catch (error: any) {
      console.error("Error rejecting business:", error)
      toast.error(error.message || "Failed to reject business")
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <DashboardLayout 
        userRole="admin" 
        userName="Admin Dashboard" 
        breadcrumbs={[{ title: "Business Approval", href: "#" }]}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      userRole="admin" 
      userName="Admin Dashboard" 
      breadcrumbs={[{ title: "Business Approval", href: "#" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Business Approval</h1>
          <p className="text-sm text-muted-foreground">
            {pendingBusinesses.length} pending business{pendingBusinesses.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {pendingBusinesses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Check className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">No pending businesses</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All businesses have been reviewed and approved or rejected.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingBusinesses.map((business) => (
              <Card key={business.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{business.business_name}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      <Clock className="mr-1 h-3 w-3" />
                      {business.approval_status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {business.business_category}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={business.profile_pic_url || undefined} alt={business.business_name} />
                        <AvatarFallback>
                          {business.business_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{business.business_name}</p>
                        <p className="text-sm text-muted-foreground">Business</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <p className="text-muted-foreground">{business.address}</p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Submitted: {new Date(business.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleReject(business.id)}
                        disabled={actionLoading === business.id}
                      >
                        {actionLoading === business.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleApprove(business.id)}
                        disabled={actionLoading === business.id}
                      >
                        {actionLoading === business.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}