import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift } from "lucide-react";
import { OptimizedImage } from "@/components/optimized-image";

interface Redemption {
  id: string;
  redeemed_at: string;
  status: string;
  business_id: string | null;
  reward_id: string;
  rewards: {
    reward_name: string;
    points_required: number;
    image_url: string | null;
  };
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
}

interface RedemptionItemProps {
  redemption: Redemption;
}

export const RedemptionItem = memo(function RedemptionItem({ redemption }: RedemptionItemProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {redemption.rewards?.image_url ? (
            <OptimizedImage 
              src={redemption.rewards.image_url} 
              alt={redemption.rewards.reward_name || 'Reward'} 
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
          <p className="font-medium text-foreground">{redemption.rewards?.reward_name || 'Reward'}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {redemption.redeemed_at 
                ? new Date(redemption.redeemed_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : 'Unknown date'}
            </p>
            {redemption.businesses?.business_name && (
              <span className="text-xs text-muted-foreground">
                at {redemption.businesses.business_name}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-primary">
          {redemption.rewards?.points_required || 0} pts
        </div>
      </div>
    </div>
  );
});