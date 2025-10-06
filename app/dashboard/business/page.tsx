"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, QrCode, TrendingUp, Users, LogOut, DollarSign, Scan, Gift } from "lucide-react"
import { toast } from "sonner"
import { QrScanner } from "@/components/qr-scanner"
import Link from "next/link"

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

        // Fetch business data
        const { data: business, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", user.id)
          .single()

        if (businessError) throw businessError
        setBusinessData(business)

        // Fetch transactions
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

        // Calculate stats
        const { data: allTransactions } = await supabase
          .from("points_transactions")
          .select("amount_spent, customer_id")
          .eq("business_id", user.id)

        if (allTransactions) {
          const totalRevenue = allTransactions.reduce((sum, t) => sum + Number(t.amount_spent), 0)
          const uniqueCustomers = new Set(allTransactions.map((t) => t.customer_id)).size

          setStats({
            totalTransactions: allTransactions.length,
            totalRevenue,
            uniqueCustomers,
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        toast.error("Failed to load dashboard data")
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
      // Fetch customer by QR code
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("qr_code_data", qrData)
        .single()

      if (customerError) {
        toast.error("Customer not found")
        return
      }

      setScannedCustomer(customer)
      setShowTransactionDialog(true)
    } catch (error) {
      console.error("[v0] Error scanning QR:", error)
      toast.error("Failed to scan QR code")
    } finally {
      setIsProcessing(false)
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
      console.error("[v0] Error creating transaction:", error)
      toast.error("Failed to create transaction")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-padding-x container mx-auto py-8">
        <div className="flex flex-col gap-6">
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

          {/* Scan QR Button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan Customer QR Code
              </CardTitle>
              <CardDescription>Scan a customer's QR code to award points for their purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setShowScanner(true)} size="lg" className="w-full md:w-auto">
                <Scan className="mr-2 h-5 w-5" />
                Open QR Scanner
              </Button>
              <p className="text-sm text-muted-foreground">
                Points configuration: 1 point per ₱{businessData.points_per_currency}
              </p>
              <Link href="/dashboard/business/rewards">
                <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
                  <Gift className="mr-2 h-5 w-5" />
                  Manage Rewards
                </Button>
              </Link>
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
    </div>
  )
}
