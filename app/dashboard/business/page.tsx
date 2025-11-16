"use client"

// Business Dashboard Page
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Settings, Check, QrCode, Gift, Tag, Star, Package, Percent } from "lucide-react"
import { toast } from "sonner"
import { handleApiError, handleDatabaseError } from "@/lib/error-handler"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { retryWithBackoff } from "@/lib/retry-utils"
import dynamic from 'next/dynamic'
import { BusinessStats } from "@/components/dashboard/business-stats"
import { QrScannerSection } from "@/components/dashboard/qr-scanner-section"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

// Dynamically import the QR scanner component to avoid SSR issues
const QrScanner = dynamic(() => import('@/components/qr-scanner').then(mod => mod.QrScanner), {
  ssr: false, // Disable server-side rendering for QR scanner
  loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
})

interface BusinessData {
  id: string
  business_name: string
  business_category: string
  address: string
  profile_pic_url: string | null
  points_per_currency: number
}

interface CustomerInfo {
  id: string
  full_name: string
  nickname: string | null
  profile_pic_url: string | null
  qr_code_data: string
  total_points: number
}

interface RedemptionData {
  id: string
  customer_id: string
  reward_id: string
  points_redeemed: number
  status: string
  validated_at: string
  business_id: string
  customers: {
    full_name: string
    profile_pic_url: string | null
  }
  rewards: {
    reward_name: string
    description: string
    points_required: number
  }
}

export default function BusinessDashboard() {
  const [showScanner, setShowScanner] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [scannedCustomer, setScannedCustomer] = useState<CustomerInfo | null>(null)
  const [transactionAmount, setTransactionAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [redemptionData, setRedemptionData] = useState<RedemptionData | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  
  const { data, isLoading, error } = useDashboardData({ userType: 'business' })

  const handleScanSuccess = async (qrData: string) => {
    setShowScanner(false)
    setIsProcessing(true)

    try {
      // First, try to process as a customer QR code for points
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("qr_code_data", qrData)
        .single()

      if (customer && !customerError) {
        // This is a customer QR code, proceed with points transaction
        setScannedCustomer(customer)
        setShowTransactionDialog(true)
        return
      }

      // If not a customer QR code, try to process as a redemption QR code
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Try to find a reward redemption
      const { data: redemption, error: redemptionError } = await supabase
        .from("redemptions")
        .select(
          `
          id,
          customer_id,
          reward_id,
          points_redeemed,
          status,
          validated_at,
          business_id,
          customers (
            full_name,
            profile_pic_url
          ),
          rewards (
            reward_name,
            description,
            points_required
          )
        `,
        )
        .eq("redemption_qr_code", qrData.trim())
        .single()

      if (redemption && !redemptionError) {
        // This is a reward redemption QR code
        if (redemption.status === "validated") {
          toast.error("This redemption has already been validated")
          return
        }

        if (redemption.business_id !== user.id) {
          toast.error("This redemption is not for your business")
          return
        }

        // Cast the redemption data to the correct type
        setRedemptionData(redemption as unknown as RedemptionData)
        return
      }

      // If we have a scanned customer, use their ID for deal redemptions
      let customerIdToUse: string | null = null;
      if (scannedCustomer?.id) {
        customerIdToUse = scannedCustomer.id;
      } else if (redemption && 'customer_id' in redemption) {
        customerIdToUse = (redemption as any).customer_id;
      }

      // Try to redeem a deal (replaces separate discount/exclusive offer redemptions)
      const dealResult = await supabase.rpc('redeem_deal', {
        p_qr_code: qrData,
        p_customer_id: customerIdToUse,
        p_business_id: user.id
      })

      if (dealResult.data?.success) {
        toast.success(dealResult.data.message)
        return
      }

      // If we get here, it's an unknown QR code
      toast.error("Unknown QR code. Please scan a valid customer or redemption QR code.")
    } catch (error) {
      handleApiError(error, "Failed to process QR code", "BusinessDashboard.handleScanSuccess")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateTransaction = async () => {
    if (!scannedCustomer || !data?.business || !transactionAmount) return

    setIsProcessing(true)

    try {
      const amount = Number.parseFloat(transactionAmount)
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      // Calculate points based on business configuration
      const pointsEarned = Math.floor(amount / data.business.points_per_currency)

      // Create transaction
      const { error: transactionError } = await supabase.from("points_transactions").insert({
        customer_id: scannedCustomer.id,
        business_id: data.business.id,
        amount_spent: amount,
        points_earned: pointsEarned,
      })

      if (transactionError) throw transactionError

      toast.success(`Transaction successful! Customer earned ${pointsEarned} points`)

      // Refresh data using the hook
      // The hook will automatically refresh the data
    } catch (error) {
      handleDatabaseError(error, "create transaction")
    } finally {
      setIsProcessing(false)
      setShowTransactionDialog(false)
      setScannedCustomer(null) // Clear the scanned customer after transaction
      setTransactionAmount("")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    router.push("/")
  }

  const handleValidateRedemption = async () => {
    if (!redemptionData) return

    setIsValidating(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Update redemption status
      const { error: updateError } = await supabase
        .from("redemptions")
        .update({
          status: "validated",
          validated_at: new Date().toISOString(),
          validated_by: user.id,
        })
        .eq("id", redemptionData.id)

      if (updateError) throw updateError

      toast.success("Redemption validated successfully!")
      
      // Add this line to show a more detailed success message
      toast.success(`Successfully validated redemption for ${redemptionData.rewards?.reward_name || 'reward'}!`, {
        duration: 5000
      })
      
      setRedemptionData(null)
    } catch (error) {
      handleDatabaseError(error, "validate redemption")
    } finally {
      setIsValidating(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="business"
        userName="Loading..."
        breadcrumbs={[]}
      >
        {/* Main Content with skeleton loading */}
        <div className="flex flex-col gap-6">
          {/* Breadcrumb skeleton */}
          <Skeleton className="h-4 w-48" />
          
          {/* Stats Overview skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions - Hidden on mobile since we have bottom nav */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks you can perform</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode className="h-6 w-6" />
                  <span>Scan QR</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => router.push("/dashboard/business/rewards")}
                >
                  <Gift className="h-6 w-6" />
                  <span>Manage Rewards</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => router.push("/dashboard/business/discounts")}
                >
                  <Tag className="h-6 w-6" />
                  <span>Manage Discounts</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => router.push("/dashboard/business/exclusive-offers")}
                >
                  <Star className="h-6 w-6" />
                  <span>Manage Exclusive</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="mt-1 h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onQrScan={() => setShowScanner(true)} />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout
        userRole="business"
        userName="Error"
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onQrScan={() => setShowScanner(true)} />
      </DashboardLayout>
    )
  }

  if (!data || !data.business) {
    return (
      <DashboardLayout
        userRole="business"
        userName="Error"
        breadcrumbs={[]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Unable to load business data</CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onQrScan={() => setShowScanner(true)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole="business"
      userName={data.business.business_name}
      userEmail={data.business.business_category}
      userAvatar={data.business.profile_pic_url}
      breadcrumbs={[]}
    >
      {/* Stats Overview - Always visible on all devices */}
      <BusinessStats 
        totalRevenue={data.stats?.totalRevenue || 0}
        totalTransactions={data.stats?.totalTransactions || 0}
        uniqueCustomers={data.stats?.uniqueCustomers || 0}
      />

      {/* Quick Actions - Hidden on mobile since we have bottom nav */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setShowScanner(true)}
            >
              <QrCode className="h-6 w-6" />
              <span>Scan QR</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/dashboard/business/menu")}
            >
              <Package className="h-6 w-6" />
              <span>Manage Menu</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/dashboard/business/deals")}
            >
              <Percent className="h-6 w-6" />
              <span>Manage Deals</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/dashboard/business/rewards")}
            >
              <Gift className="h-6 w-6" />
              <span>Manage Rewards</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Always visible on all devices */}
      <TransactionHistory transactions={data.transactions || []} />

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Customer QR Code</DialogTitle>
            <DialogDescription>Position the QR code within the camera frame</DialogDescription>
          </DialogHeader>
          {showScanner && (
            <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
            <DialogDescription>Enter the purchase amount to award points</DialogDescription>
          </DialogHeader>
          {scannedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={scannedCustomer.profile_pic_url || undefined} alt={scannedCustomer.full_name} />
                  <AvatarFallback>{scannedCustomer.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{scannedCustomer.full_name}</p>
                  <p className="text-sm text-muted-foreground">Current points: {scannedCustomer.total_points}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Purchase Amount (₱)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={transactionAmount}
                  onChange={(e) => setTransactionAmount(e.target.value)}
                />
                {transactionAmount && (
                  <p className="text-sm text-muted-foreground">
                    Points to be awarded:{" "}
                    {Math.floor(Number.parseFloat(transactionAmount) / data.business.points_per_currency)}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTransactionDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTransaction}
                  disabled={isProcessing || !transactionAmount}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Create Transaction"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validation Dialog for Reward Redemptions */}
      <Dialog open={!!redemptionData} onOpenChange={() => setRedemptionData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Valid Redemption
            </DialogTitle>
            <DialogDescription>Validate this customer's reward redemption</DialogDescription>
          </DialogHeader>
          {redemptionData && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-lg border bg-secondary p-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={redemptionData.customers.profile_pic_url || undefined} alt={redemptionData.customers.full_name} />
                  <AvatarFallback>{redemptionData.customers.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{redemptionData.customers.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Customer</p>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-primary/5 p-4">
                <div>
                  <h4 className="font-semibold text-lg">{redemptionData.rewards.reward_name}</h4>
                  <p className="text-sm text-muted-foreground">{redemptionData.rewards.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Points Redeemed:</span>
                  <span className="text-xl font-bold text-primary">{redemptionData.points_redeemed}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRedemptionData(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleValidateRedemption} disabled={isValidating} className="flex-1">
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Validate Redemption
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onQrScan={() => setShowScanner(true)} />
    </DashboardLayout>
  )
}