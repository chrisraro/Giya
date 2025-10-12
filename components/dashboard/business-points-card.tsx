import React, { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { OptimizedImage } from "@/components/optimized-image";

interface BusinessPoints {
  business_id: string;
  business_name: string;
  profile_pic_url: string | null;
  total_points: number;
  available_rewards: number;
}

interface BusinessPointsCardProps {
  business: BusinessPoints;
}

export const BusinessPointsCard = memo(function BusinessPointsCard({ business }: BusinessPointsCardProps) {
  const router = useRouter();
  
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md"
      onClick={() => router.push(`/business/${business.business_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {business.profile_pic_url ? (
              <OptimizedImage 
                src={business.profile_pic_url} 
                alt={business.business_name} 
                width={48} 
                height={48}
                className="rounded-full"
              />
            ) : (
              <AvatarFallback>{business.business_name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{business.business_name}</h3>
            <p className="text-sm text-muted-foreground">
              {business.available_rewards} reward{business.available_rewards !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium">Your Points</span>
          <span className="text-2xl font-bold text-primary">{business.total_points}</span>
        </div>
      </CardContent>
    </Card>
  );
});