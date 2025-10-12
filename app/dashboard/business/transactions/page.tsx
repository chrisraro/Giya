"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ArrowLeft, Gift, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { OptimizedImage } from "@/components/optimized-image"

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
  type: 'points_earned'
}

interface RedemptionValidation {
  id: string
  customer_id: string
  reward_id: string
  points_redeemed: number
  validated_at: string
  status: string
  customers: {
    full_name: string
    profile_pic_url: string | null
  }
  rewards: {
    reward_name: string
  }
  type: 'redemption_validated'
}

type BusinessTransaction = Transaction | RedemptionValidation

interface GroupedTransactions {
  [monthYear: string]: BusinessTransaction[]
}

export default function BusinessTransactionsPage() {
  const [transactions, setTransactions] = useState<BusinessTransaction[]>([])
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions>({})
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'points_earned' | 'redemption_validated'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch points transactions
      const { data: pointsTransactions, error: pointsError } = await supabase
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

      if (pointsError) throw pointsError

      // Fetch redemption validations
      const { data: redemptionValidations, error: redemptionsError } = await supabase
        .from("redemptions")
        .select(
          `
          id,
          customer_id,
          reward_id,
          points_redeemed,
          validated_at,
          status,
          customers (
            full_name,
            profile_pic_url
          ),
          rewards (
            reward_name
          )
        `,
        )
        .eq("business_id", user.id)
        .eq("status", "validated")
        .order("validated_at", { ascending: false })

      if (redemptionsError) throw redemptionsError

      // Combine and tag all transactions
      let allTransactions: BusinessTransaction[] = []

      // Add points transactions with type identifier
      if (pointsTransactions) {
        allTransactions = pointsTransactions.map((transaction: any) => ({
          ...transaction,
          type: 'points_earned'
        }))
      }

      // Add redemption validations with type identifier
      if (redemptionValidations) {
        const validationTransactions = redemptionValidations.map((redemption: any) => ({
          id: `redemption-${redemption.id}`,
          customer_id: redemption.customer_id,
          reward_id: redemption.reward_id,
          points_redeemed: redemption.points_redeemed,
          validated_at: redemption.validated_at,
          status: redemption.status,
          customers: redemption.customers,
          rewards: redemption.rewards,
          type: 'redemption_validated'
        }))
        allTransactions = [...allTransactions, ...validationTransactions]
      }

      // Sort all transactions by date (most recent first)
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.type === 'points_earned' ? a.transaction_date : a.validated_at).getTime()
        const dateB = new Date(b.type === 'points_earned' ? b.transaction_date : b.validated_at).getTime()
        return dateB - dateA
      })

      setTransactions(allTransactions)
      groupTransactionsByMonth(allTransactions)
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const groupTransactionsByMonth = (transactions: BusinessTransaction[]) => {
    const grouped: GroupedTransactions = {}
    
    transactions.forEach(transaction => {
      // Get the date based on transaction type
      const date = transaction.type === 'points_earned' 
        ? transaction.transaction_date 
        : transaction.validated_at
      
      // Create month-year key
      const dateObj = new Date(date)
      const monthYear = dateObj.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      })
      
      // Initialize array if not exists
      if (!grouped[monthYear]) {
        grouped[monthYear] = []
      }
      
      // Add transaction to the appropriate month
      grouped[monthYear].push(transaction)
    })
    
    setGroupedTransactions(grouped)
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true
    return transaction.type === filter
  })

  const filteredGroupedTransactions = (() => {
    const filtered: GroupedTransactions = {}
    Object.keys(groupedTransactions).forEach(month => {
      const monthTransactions = groupedTransactions[month].filter(transaction => {
        if (filter === 'all') return true
        return transaction.type === filter
      })
      if (monthTransactions.length > 0) {
        filtered[month] = monthTransactions
      }
    })
    return filtered
  })()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-secondary">
      <header className="border-b bg-background">
        <div className="container-padding-x container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/business">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">Transaction History</h1>
              <p className="text-sm text-muted-foreground">View all your business transactions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-padding-x container mx-auto py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Transactions
          </Button>
          <Button
            variant={filter === 'points_earned' ? 'default' : 'outline'}
            onClick={() => setFilter('points_earned')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Points Earned
          </Button>
          <Button
            variant={filter === 'redemption_validated' ? 'default' : 'outline'}
            onClick={() => setFilter('redemption_validated')}
          >
            <Gift className="mr-2 h-4 w-4" />
            Redemptions
          </Button>
        </div>

        {/* Transaction Summary */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTransactions
                  .filter(t => t.type === 'points_earned')
                  .reduce((sum, t) => sum + (t as Transaction).points_earned, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTransactions
                  .filter(t => t.type === 'redemption_validated')
                  .reduce((sum, t) => sum + (t as RedemptionValidation).points_redeemed, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped Transactions by Month */}
        {Object.keys(filteredGroupedTransactions).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No transactions found</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' 
                  ? "You don't have any transactions yet." 
                  : filter === 'points_earned'
                  ? "No points earned transactions found."
                  : "No redemption validations found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredGroupedTransactions)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([monthYear, monthTransactions]) => (
                <div key={monthYear}>
                  <h2 className="mb-4 text-xl font-bold">{monthYear}</h2>
                  <div className="grid gap-4">
                    {monthTransactions.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-4">
                          {transaction.type === 'points_earned' ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {transaction.customers.profile_pic_url ? (
                                    <OptimizedImage 
                                      src={transaction.customers.profile_pic_url} 
                                      alt={transaction.customers.full_name} 
                                      width={40} 
                                      height={40}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      {transaction.customers.full_name.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-medium">{transaction.customers.full_name}</p>
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
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {transaction.customers.profile_pic_url ? (
                                    <OptimizedImage 
                                      src={transaction.customers.profile_pic_url} 
                                      alt={transaction.customers.full_name} 
                                      width={40} 
                                      height={40}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      <Gift className="h-5 w-5" />
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-medium">{transaction.rewards.reward_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.customers.full_name} •{" "}
                                    {new Date(transaction.validated_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-red-500">-{transaction.points_redeemed} pts</p>
                                <p className="text-sm text-muted-foreground">Redemption</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}