import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Tag, Star } from "lucide-react";
import { OptimizedImage } from "@/components/optimized-image";

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
  };
  // For discount redemptions
  discount_offer_id?: string;
  discount_offers?: {
    offer_title: string;
    points_required: number;
    image_url: string | null;
  };
  // For exclusive offer redemptions
  exclusive_offer_id?: string;
  exclusive_offers?: {
    offer_title: string;
    points_required: number;
    image_url: string | null;
  };
  businesses?: {
    business_name: string;
    profile_pic_url: string | null;
  };
  // Type field to distinguish between redemption types
  redemption_type?: 'reward' | 'discount' | 'exclusive';
}

interface RedemptionItemProps {
  redemption: Redemption;
}

export const RedemptionItem = memo(function RedemptionItem({ redemption }: RedemptionItemProps) {
  // Determine the display information based on redemption type
  const getDisplayInfo = () => {
    switch (redemption.redemption_type) {
      case 'discount':
        return {
          name: redemption.discount_offers?.offer_title || 'Discount Offer',
          points: redemption.discount_offers?.points_required || 0,
          icon: Tag,
          image_url: redemption.discount_offers?.image_url
        };
      case 'exclusive':
        return {
          name: redemption.exclusive_offers?.offer_title || 'Exclusive Offer',
          points: redemption.exclusive_offers?.points_required || 0,
          icon: Star,
          image_url: redemption.exclusive_offers?.image_url
        };
      case 'reward':
      default:
        return {
          name: redemption.rewards?.reward_name || 'Reward',
          points: redemption.rewards?.points_required || 0,
          icon: Gift,
          image_url: redemption.rewards?.image_url
        };
    }
  };

  const displayInfo = getDisplayInfo();
  const IconComponent = displayInfo.icon;

  // Format the date
  const formatDate = (dateString: string) => {
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

  // Get status display text
  const getStatusText = () => {
    switch (redemption.status?.toLowerCase()) {
      case 'completed':
        return 'Completed';
      case 'validated':
        return 'Validated';
      case 'pending':
        return 'Pending';
      default:
        return redemption.status || 'Completed';
    }
  };

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {displayInfo.image_url ? (
            <OptimizedImage 
              src={displayInfo.image_url} 
              alt={displayInfo.name} 
              width={40} 
              height={40}
              className="rounded-full"
            />
          ) : (
            <AvatarFallback>
              <IconComponent className="h-5 w-5" />
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{displayInfo.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {formatDate(redemption.redeemed_at)}
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
          {displayInfo.points} pts
        </div>
        <div className="text-xs text-muted-foreground capitalize">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
});