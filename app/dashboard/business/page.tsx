"use client"

// Business Dashboard Page
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, QrCode, TrendingUp, Users, LogOut, DollarSign, Scan, Gift, Settings, Tag, Check } from "lucide-react"
import { toast } from "sonner"
import { QrScanner } from "@/components/qr-scanner"
import Link from "next/link"
import { handleApiError } from "@/lib/error-handler"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

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

        // Fetch business data - only select necessary fields
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("id, business_name, business_category, profile_pic_url, points_per_currency, address")
          .eq("id", user.id)
          .single()

        if (businessError) throw businessError
        setBusinessData(business)

        // Fetch transactions - optimized query with covering index
        const { data: transactionsData, error: transactionsError } = await supabase
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

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])

        // Calculate stats - optimized query with only necessary fields
        const { data: allTransactions } = await supabase
          .from("points_transactions")
          .select("amount_spent, customer_id")
          .eq("business_id", user.id)

        if (allTransactions) {
          const totalRevenue = (allTransactions as { amount_spent: number }[]).reduce((sum: number, t: { amount_spent: number }) => sum + Number(t.amount_spent), 0)
          const uniqueCustomers = new Set((allTransactions as { customer_id: string }[]).map((t: { customer_id: string }) => t.customer_id)).size

          setStats({
            totalTransactions: allTransactions.length,
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
      console.error("Error fetching discounts:", error)
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
      console.error("Error fetching exclusive offers:", error)
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
      handleApiError(error, "Failed to create transaction", "BusinessDashboard.handleCreateTransaction")
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
      handleApiError(error, "Failed to validate redemption", "BusinessDashboard.handleValidateRedemption")
    } finally {
      setIsValidating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-svh bg-secondary">
        {/* Header with skeleton loading */}
        <header className="border-b bg-background">
          <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        </header>

        {/* Main Content with skeleton loading */}
        <main className="container-padding-x container mx-auto py-8">
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
        </main>
      </div>
    )
  }

  if (!businessData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load business data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={businessData.profile_pic_url || undefined} />
              <AvatarFallback>{businessData.business_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{businessData.business_name}</h2>
              <p className="text-sm text-muted-foreground">{businessData.business_category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/business/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
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
              <BreadcrumbItem isCurrent>
                Dashboard
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₱{stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Lifetime earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueCustomers}</div>
                <p className="text-xs text-muted-foreground">Active users</p>
              </CardContent>
            </Card>
          </div>

          {/* Scan QR Button - Updated to remove Validate Redemptions button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan Customer QR Code
              </CardTitle>
              <CardDescription>Scan a customer's QR code to award points or validate redemptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setShowScanner(true)} size="lg" className="w-full md:w-auto">
                <Scan className="mr-2 h-5 w-5" />
                Open QR Scanner
              </Button>
              <p className="text-sm text-muted-foreground">
                Points configuration: 1 point per ₱{businessData.points_per_currency}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/dashboard/business/rewards">
                  <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
                    <Gift className="mr-2 h-5 w-5" />
                    Manage Rewards
                  </Button>
                </Link>
                <Link href="/dashboard/business/discounts">
                  <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
                    <Tag className="mr-2 h-5 w-5" />
                    Manage Discounts
                  </Button>
                </Link>
                <Link href="/dashboard/business/exclusive-offers">
                  <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
                    <Gift className="mr-2 h-5 w-5" />
                    Manage Exclusive Offers
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest customer purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground">Start scanning customer QR codes!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={transaction.customers.profile_pic_url || undefined} />
                          <AvatarFallback>{transaction.customers.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{transaction.customers.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₱{transaction.amount_spent.toFixed(2)}</p>
                        <p className="text-sm text-primary">{transaction.points_earned} pts awarded</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Customer QR Code</DialogTitle>
            <DialogDescription>Position the QR code within the camera frame</DialogDescription>
          </DialogHeader>
          <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
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
    </div>
  )
}
