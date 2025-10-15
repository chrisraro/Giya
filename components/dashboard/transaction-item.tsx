import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/optimized-image";
import { Gift } from "lucide-react";

interface Transaction {
  id: string;
  business_id?: string;
  customer_id?: string;
  amount_spent?: number;
  points_earned?: number;
  transaction_date?: string;
  display_date?: string;
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
  customers?: {
    full_name: string;
    profile_pic_url: string | null;
  };
  redemption_info?: {
    reward_name?: string;
  };
  type?: 'points_earned' | 'redemption_validated';
  // Allow any other properties
  [key: string]: any;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = memo(function TransactionItem({ transaction }: TransactionItemProps) {
  // Safety check for transaction object
  if (!transaction) {
    return null;
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle different transaction types
  if (transaction.type === 'redemption_validated') {
    return (
      <div className="flex items-center justify-between border-b pb-4 last:border-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {transaction.customers?.profile_pic_url ? (
              <OptimizedImage 
                src={transaction.customers.profile_pic_url} 
                alt={transaction.customers.full_name || 'Customer'} 
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
            <p className="font-medium text-foreground">
              {transaction.redemption_info?.reward_name || 'Reward Redemption'}
            </p>
            <p className="text-sm text-muted-foreground">
              {transaction.customers?.full_name || 'Customer'} • {formatDate(transaction.display_date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-red-500">
            {transaction.points_earned ? `${transaction.points_earned} pts` : 'Redeemed'}
          </p>
          <p className="text-sm text-muted-foreground">Redemption</p>
        </div>
      </div>
    );
  }

  // Default points transaction
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {transaction.businesses?.profile_pic_url ? (
            <OptimizedImage 
              src={transaction.businesses.profile_pic_url} 
              alt={transaction.businesses.business_name || 'Business'} 
              width={40} 
              height={40}
              className="rounded-full"
            />
          ) : (
            <AvatarFallback>{transaction.businesses?.business_name?.charAt(0) || 'B'}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{transaction.businesses?.business_name || 'Business'}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(transaction.display_date || transaction.transaction_date)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-primary">{transaction.points_earned !== undefined ? `+${transaction.points_earned} pts` : 'N/A pts'}</p>
        <p className="text-sm text-muted-foreground">₱{transaction.amount_spent !== undefined ? transaction.amount_spent.toFixed(2) : '0.00'}</p>
      </div>
    </div>
  );
});