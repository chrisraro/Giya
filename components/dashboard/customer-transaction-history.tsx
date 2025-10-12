import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Gift } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamically import the memoized components
const TransactionItem = dynamic(() => import('@/components/dashboard/transaction-item').then(mod => mod.TransactionItem), {
  ssr: false
})

const RedemptionItem = dynamic(() => import('@/components/dashboard/redemption-item').then(mod => mod.RedemptionItem), {
  ssr: false
})

interface Transaction {
  id: string
  // Add other transaction properties as needed
  [key: string]: any
}

interface Redemption {
  id: string
  // Add other redemption properties as needed
  [key: string]: any
}

interface CustomerTransactionHistoryProps {
  transactions: Transaction[]
  redemptions: Redemption[]
}

export function CustomerTransactionHistory({ transactions, redemptions }: CustomerTransactionHistoryProps) {
  return (
    <>
      {/* Transaction History */}
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
              {transactions.map((transaction: any) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
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
          {redemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Gift className="mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No redemptions yet</p>
              <p className="text-xs text-muted-foreground">Browse rewards to redeem your points!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptions.map((redemption: any) => (
                <RedemptionItem key={redemption.id} redemption={redemption} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}