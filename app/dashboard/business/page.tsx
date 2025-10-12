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
import { Loader2, Settings, Check } from "lucide-react"
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

// Dynamically import the QR scanner component
const QrScanner = dynamic(() => import('@/components/qr-scanner').then(mod => mod.QrScanner), {
  ssr: false,
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

interface Transaction {
  id: string
  customer_id: string
  amount_spent: number
  points_earned: number
  transaction_date: string
  customers: {
    full_name: string
    profile_pic_url: string | null
  }
}

interface CustomerInfo {
  id: string
  full_name: string
  nickname: string | null
  profile_pic_url: string | null
  qr_code_data: string
  total_points: number
}

export default function BusinessDashboard() {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    uniqueCustomers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [scannedCustomer, setScannedCustomer] = useState<CustomerInfo | null>(null)
  const [transactionAmount, setTransactionAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [redemptionData, setRedemptionData] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch business data with retry
        const { data: business, error: businessError } = await retryWithBackoff(
          async () => {
            const result = await supabase
              .from("businesses")
              .select("id, business_name, business_category, profile_pic_url, points_per_currency, address")
              .eq("id", user.id)
              .single()
            if (result.error) throw result.error
            return result
          },
          { maxRetries: 3, delay: 1000 }
        )

        if (businessError) throw businessError
        setBusinessData(business.data)

        // Fetch transactions with retry
        const { data: transactionsData, error: transactionsError } = await retryWithBackoff(
          async () => {
            const result = await supabase
              .from("points_transactions")
              .select(
                `
                id,
                customer_id,
                amount_spent,
                points_earned,
                transaction_date,
                customers (
                  full_name,
                  profile_pic_url
                )
              `,
              )
              .eq("business_id", user.id)
              .order("transaction_date", { ascending: false })
              .limit(20)
            if (result.error) throw result.error
            return result
          },
          { maxRetries: 3, delay: 1000 }
        )

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData.data || [])

        // Calculate stats with retry
        const { data: allTransactions } = await retryWithBackoff(
          async () => {
            const result = await supabase
              .from("points_transactions")
              .select("amount_spent, customer_id")
              .eq("business_id", user.id)
            if (result.error) throw result.error
            return result
          },
          { maxRetries: 3, delay: 1000 }
        )

        if (allTransactions.data) {
          const totalRevenue = (allTransactions.data as { amount_spent: number }[]).reduce((sum: number, t: { amount_spent: number }) => sum + Number(t.amount_spent), 0)
          const uniqueCustomers = new Set((allTransactions.data as { customer_id: string }[]).map((t: { customer_id: string }) => t.customer_id)).size

          setStats({
            totalTransactions: allTransactions.data.length,
            totalRevenue,
            uniqueCustomers,
          })
        }
      } catch (error) {
        handleApiError(error, "Failed to load dashboard data", "BusinessDashboard.fetchData")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

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

        setRedemptionData(redemption)
        return
      }

      // Try to find a discount offer redemption
      const discountResult = await supabase.rpc('redeem_discount_offer', {
        p_qr_code: qrData,
        p_customer_id: redemption?.customer_id || null,
        p_business_id: user.id
      })

      if (discountResult.data?.success) {
        toast.success(discountResult.data.message)
        // Refresh data to update usage counts
        fetchDiscounts()
        return
      }

      // Try to find an exclusive offer redemption
      const exclusiveResult = await supabase.rpc('redeem_exclusive_offer', {
        p_qr_code: qrData,
        p_customer_id: redemption?.customer_id || null,
        p_business_id: user.id
      })

      if (exclusiveResult.data?.success) {
        toast.success(exclusiveResult.data.message)
        // Refresh data to update usage counts
        fetchExclusiveOffers()
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

  // Add new functions to fetch discounts and exclusive offers for usage count updates
  const fetchDiscounts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("discount_offers")
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      // We don't need to set state here since this is just for refreshing data
    } catch (error) {
      handleDatabaseError(error, "fetch discounts")
    }
  }

  const fetchExclusiveOffers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("exclusive_offers")
        .select("*")
        .eq("business_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      // We don't need to set state here since this is just for refreshing data
    } catch (error) {
      handleDatabaseError(error, "fetch exclusive offers")
    }
  }

  const handleCreateTransaction = async () => {
    if (!scannedCustomer || !businessData || !transactionAmount) return

    setIsProcessing(true)

    try {
      const amount = Number.parseFloat(transactionAmount)
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount")
        return
      }

      // Calculate points based on business configuration
      const pointsEarned = Math.floor(amount / businessData.points_per_currency)

      // Create transaction
      const { error: transactionError } = await supabase.from("points_transactions").insert({
        customer_id: scannedCustomer.id,
        business_id: businessData.id,
        amount_spent: amount,
        points_earned: pointsEarned,
      })

      if (transactionError) throw transactionError

      toast.success(`Transaction successful! Customer earned ${pointsEarned} points`)

      // Refresh data
      const { data: updatedTransactions } = await supabase
        .from("points_transactions")
        .select(
          `
          id,
          customer_id,
          amount_spent,
          points_earned,
          transaction_date,
          customers (
            full_name,
            profile_pic_url
          )
        `,
        )
        .eq("business_id", businessData.id)
        .order("transaction_date", { ascending: false })
        .limit(20)

      if (updatedTransactions) {
        setTransactions(updatedTransactions)
      }

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        totalRevenue: prev.totalRevenue + amount,
      }))

      // Reset form
      setShowTransactionDialog(false)
      setScannedCustomer(null)
      setTransactionAmount("")
    } catch (error) {
      handleDatabaseError(error, "create transaction")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
        breadcrumbs={[{ label: "Dashboard" }]}
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

          {/* Scan QR Card skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full rounded" />
            </CardContent>
          </Card>

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
      </DashboardLayout>
    )
  }

  if (!businessData) {
    return (
      <DashboardLayout
        userRole="business"
        userName="Error"
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <div className="flex min-h-svh items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Unable to load business data</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      userRole="business"
      userName={businessData.business_name}
      userEmail={businessData.business_category}
      userAvatar={businessData.profile_pic_url}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {/* Stats Overview */}
      <BusinessStats 
        totalRevenue={stats.totalRevenue}
        totalTransactions={stats.totalTransactions}
        uniqueCustomers={stats.uniqueCustomers}
      />

      {/* Scan QR Section */}
      <QrScannerSection 
        pointsPerCurrency={businessData.points_per_currency}
        onOpenScanner={() => setShowScanner(true)}
      />

      {/* Transaction History */}
      <TransactionHistory transactions={transactions} />

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
                  <AvatarImage src={scannedCustomer.profile_pic_url || undefined} />
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
                    {Math.floor(Number.parseFloat(transactionAmount) / businessData.points_per_currency)}
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
                  <AvatarImage src={redemptionData.customers.profile_pic_url || undefined} />
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
    </DashboardLayout>
  )
}