import { Card, CardContent } from "@/components/ui/card"
import { Award } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamically import the memoized component
const BusinessPointsCard = dynamic(() => import('@/components/dashboard/business-points-card').then(mod => mod.BusinessPointsCard), {
  ssr: false
})

interface BusinessPoints {
  business_id: string;
  business_name: string;
  profile_pic_url: string | null;
  total_points: number;
  available_rewards: number;
}

interface BusinessPointsSectionProps {
  businessPoints: BusinessPoints[]
}

export function BusinessPointsSection({ businessPoints }: BusinessPointsSectionProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Your Business Points</h2>
      {businessPoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No business points yet</p>
            <p className="text-xs text-muted-foreground">Start shopping to earn points at businesses!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businessPoints.map((business) => (
            <BusinessPointsCard key={business.business_id} business={business} />
          ))}
        </div>
      )}
    </div>
  )
}