import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  totalPointsFromConversions,
}: InfluencerStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          <Badge variant="secondary" className="text-xs">
            All time
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPoints}</div>
          <p className="text-xs text-muted-foreground">Your total points balance</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Affiliate Links</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{affiliateLinksCount}</div>
          <p className="text-xs text-muted-foreground">Links you've generated</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Total
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionsCount}</div>
          <p className="text-xs text-muted-foreground">Successful referrals</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Points from Referrals</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Earned
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPointsFromConversions}</div>
          <p className="text-xs text-muted-foreground">From affiliate marketing</p>
        </CardContent>
      </Card>
    </div>
  )
}