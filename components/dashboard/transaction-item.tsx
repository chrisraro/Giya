import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/optimized-image";

interface Transaction {
  id: string;
  business_id: string;
  amount_spent: number;
  points_earned: number;
  transaction_date: string;
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
}

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = memo(function TransactionItem({ transaction }: TransactionItemProps) {
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
            {transaction.transaction_date
              ? new Date(transaction.transaction_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : 'Unknown date'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-primary">+{transaction.points_earned} pts</p>
        <p className="text-sm text-muted-foreground">₱{transaction.amount_spent.toFixed(2)}</p>
      </div>
    </div>
  );
});