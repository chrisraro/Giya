import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Link2, Users } from "lucide-react"

interface InfluencerStatsProps {
  totalPoints: number
  affiliateLinksCount: number
  conversionsCount: number
  totalPointsFromConversions: number
}

export function InfluencerStats({ 
  totalPoints, 
  affiliateLinksCount, 
  conversionsCount, 
  totalPointsFromConversions 
}: InfluencerStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalPoints}</div>
          <p className="text-xs text-muted-foreground">Available to redeem</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Affiliate Links</CardTitle>
          <Link2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{affiliateLinksCount}</div>
          <p className="text-xs text-muted-foreground">Active links</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionsCount}</div>
          <p className="text-xs text-muted-foreground">Total referrals</p>
          {totalPointsFromConversions > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {totalPointsFromConversions} pts earned
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}