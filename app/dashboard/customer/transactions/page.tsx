"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Filter, Gift, Tag, Star } from "lucide-react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { toast } from "sonner"
import { MobileCustomerBottomNav } from "@/components/mobile-customer-bottom-nav"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Transaction {
  id: string
  created_at: string
  points_earned: number | null
  amount_spent: number | null
  business_id: string
  business_name: string
  business_profile_pic: string | null
}

interface Redemption {
  id: string
  created_at: string
  points_redeemed: number
  status: string
  reward_id: string | null
  discount_offer_id: string | null
  exclusive_offer_id: string | null
  reward_name: string | null
  discount_value: number | null
  offer_name: string | null
  business_name: string
  business_profile_pic: string | null
}

export default function CustomerTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [filter, setFilter] = useState<"all" | "points" | "rewards" | "discounts" | "offers">("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  
  const { data, isLoading: isDashboardLoading, error, refetch } = useDashboardData({ userType: 'customer' })

  // Fetch transactions and redemptions
  const fetchTransactionsAndRedemptions = async () => {
    if (!data?.customer?.id) return
    
    setIsLoading(true)
    
    try {
      // Fetch all points transactions
      const { data: pointsTransactions, error: pointsTransactionsError } = await supabase
        .from("points_transactions")
        .select(`
          id, 
          transaction_date, 
          points_earned,
          amount_spent,
          business_id,
          businesses!business_id (business_name, profile_pic_url)
        `)
        .eq("customer_id", data.customer.id)
        .order("transaction_date", { ascending: false })
        .limit(100) // Increase limit to show more transactions

      if (pointsTransactionsError) {
        console.error("Error fetching points transactions:", pointsTransactionsError)
        throw pointsTransactionsError
      }

      // Fetch all reward redemptions
      const { data: rewardRedemptions, error: rewardRedemptionsError } = await supabase
        .from("redemptions")
        .select(`
          id, 
          redeemed_at,
          points_redeemed,
          status,
          reward_id,
          rewards (reward_name, points_required),
          businesses!business_id (business_name, profile_pic_url)
        `)
        .eq("customer_id", data.customer.id)
        .order("redeemed_at", { ascending: false })
        .limit(100) // Increase limit

      if (rewardRedemptionsError) {
        console.error("Error fetching reward redemptions:", rewardRedemptionsError)
        throw rewardRedemptionsError
      }

      // Fetch all discount redemptions
      const { data: discountRedemptions, error: discountRedemptionsError } = await supabase
        .from("discount_usage")
        .select(`
          id, 
          used_at,
          business_id,
          discount_offer_id,
          discount_offers (title, discount_value, points_required),
          businesses!business_id (business_name, profile_pic_url)
        `)
        .eq("customer_id", data.customer.id)
        .order("used_at", { ascending: false })
        .limit(100) // Increase limit

      if (discountRedemptionsError) {
        console.error("Error fetching discount redemptions:", discountRedemptionsError)
        throw discountRedemptionsError
      }

      // Fetch all exclusive offer redemptions
      const { data: exclusiveOfferRedemptions, error: exclusiveOfferRedemptionsError } = await supabase
        .from("exclusive_offer_usage")
        .select(`
          id, 
          used_at,
          business_id,
          exclusive_offer_id,
          exclusive_offers (title, points_required),
          businesses!business_id (business_name, profile_pic_url)
        `)
        .eq("customer_id", data.customer.id)
        .order("used_at", { ascending: false })
        .limit(100) // Increase limit

      if (exclusiveOfferRedemptionsError) {
        console.error("Error fetching exclusive offer redemptions:", exclusiveOfferRedemptionsError)
        throw exclusiveOfferRedemptionsError
      }

      // Format points transactions
      const formattedPointsTransactions = pointsTransactions?.map((transaction: any) => ({
        id: transaction.id,
        created_at: transaction.transaction_date,
        points_earned: transaction.points_earned,
        amount_spent: transaction.amount_spent,
        business_id: transaction.business_id,
        business_name: transaction.businesses?.business_name || 'Unknown Business',
        business_profile_pic: transaction.businesses?.profile_pic_url || null
      })) || []

      // Format reward redemptions
      const formattedRewardRedemptions = rewardRedemptions?.map((redemption: any) => ({
        id: redemption.id,
        created_at: redemption.redeemed_at,
        points_redeemed: redemption.points_redeemed,
        status: redemption.status,
        reward_id: redemption.reward_id,
        discount_offer_id: null,
        exclusive_offer_id: null,
        reward_name: redemption.rewards?.reward_name || null,
        discount_value: null,
        offer_name: null,
        business_name: redemption.businesses?.business_name || 'Unknown Business',
        business_profile_pic: redemption.businesses?.profile_pic_url || null
      })) || []

      // Format discount redemptions
      const formattedDiscountRedemptions = discountRedemptions?.map((redemption: any) => ({
        id: redemption.id,
        created_at: redemption.used_at,
        points_redeemed: redemption.discount_offers?.points_required || redemption.discount_offers?.discount_value || 0,
        status: 'completed',
        reward_id: null,
        discount_offer_id: redemption.discount_offer_id,
        exclusive_offer_id: null,
        reward_name: null,
        discount_value: redemption.discount_offers?.discount_value || null,
        offer_name: null,
        business_name: redemption.businesses?.business_name || 'Unknown Business',
        business_profile_pic: redemption.businesses?.profile_pic_url || null
      })) || []

      // Format exclusive offer redemptions
      const formattedExclusiveOfferRedemptions = exclusiveOfferRedemptions?.map((redemption: any) => ({
        id: redemption.id,
        created_at: redemption.used_at,
        points_redeemed: redemption.exclusive_offers?.points_required || 0,
        status: 'completed',
        reward_id: null,
        discount_offer_id: null,
        exclusive_offer_id: redemption.exclusive_offer_id,
        reward_name: null,
        discount_value: null,
        offer_name: redemption.exclusive_offers?.title || null,
        business_name: redemption.businesses?.business_name || 'Unknown Business',
        business_profile_pic: redemption.businesses?.profile_pic_url || null
      })) || []

      // Combine all transactions and redemptions
      const allTransactions = [
        ...formattedPointsTransactions,
        ...formattedRewardRedemptions,
        ...formattedDiscountRedemptions,
        ...formattedExclusiveOfferRedemptions
      ]

      // Sort all by date (most recent first)
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Separate points transactions and redemptions for filtering
      setTransactions(formattedPointsTransactions)
      setRedemptions([
        ...formattedRewardRedemptions,
        ...formattedDiscountRedemptions,
        ...formattedExclusiveOfferRedemptions
      ])
    } catch (error) {
      console.error("Error fetching transactions and redemptions:", error)
      toast.error("Failed to load transactions and redemptions")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch transactions and redemptions on component mount
  useEffect(() => {
    if (data?.customer?.id) {
      fetchTransactionsAndRedemptions()
    }
  }, [data?.customer?.id, supabase])

  // Add real-time subscription for new transactions
  useEffect(() => {
    // Only subscribe if we have customer data
    if (!data?.customer?.id) {
      return;
    }

    console.log("[v0] Setting up transaction subscription for customer:", data.customer.id);
    
    const channel = supabase
      .channel('customer-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_transactions'
        },
        (payload: any) => {
          console.log("[v0] Received new transaction:", payload);
          // Check if this transaction belongs to the current customer
          if (payload.new.customer_id === data?.customer?.id) {
            // Show toast notification
            toast.success('New Transaction!', {
              description: `You've earned ${payload.new.points_earned} points!`,
              duration: 5000
            })
            
            // Refetch data to update the UI
            fetchTransactionsAndRedemptions()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'redemptions'
        },
        (payload: any) => {
          console.log("[v0] Received new redemption:", payload);
          // Check if this redemption belongs to the current customer
          if (payload.new.customer_id === data?.customer?.id) {
            // Show toast notification
            toast.success('Redemption Processed!', {
              description: `Your redemption is being processed.`,
              duration: 5000
            })
            
            // Refetch data to update the UI
            fetchTransactionsAndRedemptions()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemptions',
          filter: 'status=eq.validated'
        },
        (payload: any) => {
          console.log("[v0] Received redemption validation update:", payload);
          // Check if this redemption belongs to the current customer
          if (payload.new.customer_id === data?.customer?.id) {
            // Show toast notification
            toast.success('Redemption Validated!', {
              description: `Your redemption has been validated by the business.`,
              duration: 5000
            })
            
            // Refetch data to update the UI
            fetchTransactionsAndRedemptions()
          }
        }
      )
      .subscribe((status: any) => {
        console.log("[v0] Transaction subscription status:", status);
      })

    // Cleanup function
    return () => {
      console.log("[v0] Cleaning up transaction subscription");
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        console.warn("[v0] Error cleaning up transaction subscription:", error);
      }
    }
  }, [data?.customer?.id, fetchTransactionsAndRedemptions])

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return [...transactions, ...redemptions].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    if (filter === "points") return transactions
    
    // For redemptions, we need to filter by type
    return redemptions.filter(redemption => {
      if (filter === "rewards" && redemption.reward_id) return true
      if (filter === "discounts" && redemption.discount_offer_id) return true
      if (filter === "offers" && redemption.exclusive_offer_id) return true
      return false
    })
  }, [transactions, redemptions, filter])

  const handleQrScan = () => {
    // For now, we'll just navigate to the discover page
    // In a real implementation, this would open the QR scanner
    router.push("/dashboard/customer/discover")
  }

  const handleRefresh = async () => {
    try {
      await fetchTransactionsAndRedemptions()
      toast.success("Data refreshed successfully!")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    }
  }

  return (
    <DashboardLayout
      userRole="customer"
      userName={data?.customer?.full_name || "Customer"}
      breadcrumbs={[
        { label: "Transactions" }
      ]}
    >
      <div className="flex flex-col gap-6">
        {/* Filter Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="h-10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="points">Points Earned</SelectItem>
                <SelectItem value="rewards">Rewards Redeemed</SelectItem>
                <SelectItem value="discounts">Discounts Redeemed</SelectItem>
                <SelectItem value="offers">Exclusive Offers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((item: any) => {
              // Check if it's a transaction (points earned) or redemption
              const isTransaction = 'points_earned' in item
              
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Business Avatar */}
                        {item.business_profile_pic ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden">
                            <img 
                              src={item.business_profile_pic} 
                              alt={item.business_name} 
                              className="object-cover"
                              width={48}
                              height={48}
                            />
                          </div>
                        ) : (
                          <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                            <div className="h-6 w-6 bg-gray-300 rounded-full" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {isTransaction ? (
                            <>
                              <p className="font-medium truncate">Points Earned</p>
                              <p className="text-sm text-muted-foreground truncate">{item.business_name}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium truncate">
                                {item.reward_name || item.offer_name || 'Discount Offer'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">{item.business_name}</p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {isTransaction ? (
                          <p className="font-medium text-green-600">+{item.points_earned} pts</p>
                        ) : (
                          <div className="flex flex-col items-end">
                            <p className="font-medium text-red-600">-{item.points_redeemed} pts</p>
                            <Badge variant="secondary" className="mt-1">
                              {item.reward_id ? (
                                <span className="flex items-center gap-1">
                                  <Gift className="h-3 w-3" />
                                  Reward
                                </span>
                              ) : item.discount_offer_id ? (
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Discount
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  Offer
                                </span>
                              )}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "No transactions found." 
                  : `No ${filter} transactions found.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileCustomerBottomNav onQrScan={handleQrScan} />
    </DashboardLayout>
  )
}