"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, QrCode, TrendingUp, Gift, LogOut, Award } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"

interface CustomerData {
  id: string
  full_name: string
  nickname: string | null
  profile_pic_url: string | null
  qr_code_data: string
  total_points: number
}

interface Transaction {
  id: string
  business_id: string
  amount_spent: number
  points_earned: number
  transaction_date: string
  businesses: {
    business_name: string
    profile_pic_url: string | null
  }
}

interface Redemption {
  id: string
  redeemed_at: string
  status: string
  rewards: {
    name: string
    points_required: number
    image_url: string | null
  }
}

export default function CustomerDashboard() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showQRDialog, setShowQRDialog] = useState(false)
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

        // Fetch customer data
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", user.id)
          .single()

        if (customerError) throw customerError
        setCustomerData(customer)

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("points_transactions")
          .select(
            `
            id,
            business_id,
            amount_spent,
            points_earned,
            transaction_date,
            businesses (
              business_name,
              profile_pic_url
            )
          `,
          )
          .eq("customer_id", user.id)
          .order("transaction_date", { ascending: false })
          .limit(10)

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])

        // Fetch redemptions
        const { data: redemptionsData, error: redemptionsError } = await supabase
          .from("redemptions")
          .select(
            `
            id,
            redeemed_at,
            status,
            rewards (
              name,
              points_required,
              image_url
            )
          `,
          )
          .eq("user_id", user.id)
          .order("redeemed_at", { ascending: false })
          .limit(10)

        if (redemptionsError) throw redemptionsError
        setRedemptions(redemptionsData || [])
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

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

  if (!customerData) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load customer data</CardDescription>
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
              <AvatarImage src={customerData.profile_pic_url || undefined} />
              <AvatarFallback>{customerData.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-foreground">{customerData.full_name}</h2>
              {customerData.nickname && <p className="text-sm text-muted-foreground">@{customerData.nickname}</p>}
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
          {/* Points Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{customerData.total_points}</div>
                <p className="text-xs text-muted-foreground">Available to redeem</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">Lifetime purchases</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{redemptions.length}</div>
                <p className="text-xs text-muted-foreground">Total redemptions</p>
              </CardContent>
            </Card>
          </div>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Your QR Code
              </CardTitle>
              <CardDescription>Show this QR code at participating businesses to earn points</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-6">
                <QRCodeSVG value={customerData.qr_code_data} size={200} level="H" />
              </div>
              <div className="text-center">
                <p className="font-mono text-sm font-medium text-muted-foreground">{customerData.qr_code_data}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button onClick={() => setShowQRDialog(true)} size="lg" className="h-auto flex-col gap-2 py-6">
                <QrCode className="h-8 w-8" />
                <span>Show My QR Code</span>
              </Button>
              <Link href="/dashboard/customer/rewards">
                <Button variant="outline" size="lg" className="h-auto w-full flex-col gap-2 py-6 bg-transparent">
                  <Gift className="h-8 w-8" />
                  <span>View Rewards</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tabs for Transactions and Redemptions */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="redemptions">Redemption History</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest points earning activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                      <p className="text-xs text-muted-foreground">Start shopping to earn points!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={transaction.businesses.profile_pic_url || undefined} />
                              <AvatarFallback>{transaction.businesses.business_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{transaction.businesses.business_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(transaction.transaction_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">+{transaction.points_earned} pts</p>
                            <p className="text-sm text-muted-foreground">₱{transaction.amount_spent.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="redemptions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Redemption History</CardTitle>
                  <CardDescription>Your redeemed rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  {redemptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Gift className="mb-2 h-12 w-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No redemptions yet</p>
                      <p className="text-xs text-muted-foreground">Browse rewards to redeem your points!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {redemptions.map((redemption) => (
                        <div
                          key={redemption.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={redemption.rewards.image_url || undefined} />
                              <AvatarFallback>
                                <Gift className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{redemption.rewards.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(redemption.redeemed_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                redemption.status === "completed"
                                  ? "default"
                                  : redemption.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {redemption.status}
                            </Badge>
                            <p className="text-sm text-muted-foreground">{redemption.rewards.points_required} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
