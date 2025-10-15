import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Gift } from "lucide-react"
import { TransactionItem } from '@/components/dashboard/transaction-item'
import { RedemptionItem } from '@/components/dashboard/redemption-item'

interface Transaction {
  id: string
  // Add other transaction properties as needed
  [key: string]: any
}

interface Redemption {
  id: string;
  redeemed_at: string;
  status: string;
  business_id: string | null;
  reward_id?: string;
  rewards?: {
    reward_name: string;
    points_required: number;
    image_url: string | null;
  }
  // For discount redemptions
  discount_offer_id?: string;
  discount_offers?: {
    title: string;
  }
  // For exclusive offer redemptions
  exclusive_offer_id?: string;
  exclusive_offers?: {
    title: string;
    image_url: string | null;
  }
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  }
  // Type field to distinguish between redemption types
  redemption_type?: 'reward' | 'discount' | 'exclusive'
  // Allow any other properties
  [key: string]: any
}

interface CustomerTransactionHistoryProps {
  transactions: Transaction[]
  redemptions: Redemption[]
}

export function CustomerTransactionHistory({ transactions, redemptions }: CustomerTransactionHistoryProps) {
  // Debug logging
  console.log("[v0] CustomerTransactionHistory - Transactions:", transactions);
  console.log("[v0] CustomerTransactionHistory - Redemptions:", redemptions);
  console.log("[v0] CustomerTransactionHistory - Redemptions length:", redemptions.length);

  // Ensure redemptions is an array
  const safeRedemptions = Array.isArray(redemptions) ? redemptions : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <>
      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest points earning activities</CardDescription>
        </CardHeader>
        <CardContent>
          {safeTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground">Start shopping to earn points!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeTransactions.map((transaction: any, index: number) => (
                <TransactionItem key={transaction.id || `transaction-${index}-${transaction.transaction_date || Date.now()}`} transaction={transaction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemption History */}
      <Card>
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
          <CardDescription>Your redeemed rewards</CardDescription>
        </CardHeader>
        <CardContent>
          {safeRedemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Gift className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No redemptions yet</p>
              <p className="text-xs text-muted-foreground">Browse rewards to redeem your points!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeRedemptions.map((redemption: any, index: number) => (
                <RedemptionItem key={redemption.id || `redemption-${index}-${redemption.redeemed_at || Date.now()}`} redemption={redemption} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}