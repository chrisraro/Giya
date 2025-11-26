import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Receipt, 
  Trophy, 
  TrendingUp, 
  Gift, 
  Users,
  Star,
  Clock,
  CheckCircle
} from "lucide-react"
import { useRouter } from "next/navigation"

interface CustomerDashboardOverviewProps {
  customerData: {
    fullName: string
    totalPoints: number
    recentReceipts: number
    affiliateEarnings: number
    favoriteBusinesses: Array<{
      id: string
      name: string
      points: number
      visits: number
    }>
  }
  onUploadReceipt: () => void
}

export function CustomerDashboardOverview({ customerData, onUploadReceipt }: CustomerDashboardOverviewProps) {
  const router = useRouter()
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {customerData.fullName}!</h1>
          <p className="text-muted-foreground">Ready to earn more points today?</p>
        </div>
        <Button onClick={onUploadReceipt} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Receipt
        </Button>
      </div>
      
      {/* Points Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.totalPoints.toLocaleString()}</div>
            <p className="text-xs opacity-90">Available to redeem</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.recentReceipts}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Earnings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.affiliateEarnings}</div>
            <p className="text-xs text-muted-foreground">Points earned</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Ways to earn more points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={onUploadReceipt}
            >
              <Upload className="h-6 w-6" />
              <span>Upload Receipt</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/dashboard/customer/rewards')}
            >
              <Gift className="h-6 w-6" />
              <span>Redeem Rewards</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/dashboard/customer/process-receipt')}
            >
              <Receipt className="h-6 w-6" />
              <span>Process Receipt</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push('/dashboard/customer/affiliate')}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Earn Affiliate Points</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest points transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Receipt Processed</p>
                <p className="text-sm text-muted-foreground">+150 points at Sample Restaurant</p>
              </div>
              <span className="text-sm font-medium">2h ago</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="bg-blue-100 p-2 rounded-full">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Reward Redeemed</p>
                <p className="text-sm text-muted-foreground">Free coffee at Coffee Shop</p>
              </div>
              <span className="text-sm font-medium">1d ago</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Affiliate Earnings</p>
                <p className="text-sm text-muted-foreground">+50 points from referral</p>
              </div>
              <span className="text-sm font-medium">2d ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Favorite Businesses */}
      <Card>
        <CardHeader>
          <CardTitle>Favorite Businesses</CardTitle>
          <CardDescription>Where you earn the most points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerData.favoriteBusinesses.map((business) => (
              <div 
                key={business.id} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer"
                onClick={() => router.push(`/business/${business.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="font-medium text-sm">{business.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {business.visits} visits
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{business.points} pts</p>
                  <Badge variant="secondary" className="mt-1">
                    {business.points > 1000 ? 'Gold' : business.points > 500 ? 'Silver' : 'Bronze'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tips to Earn More Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">1</span>
              <span>Upload your receipts immediately after purchase to earn points</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">2</span>
              <span>Keep receipts clear and readable for faster processing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">3</span>
              <span>Refer friends to earn affiliate points on their purchases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs mt-0.5">4</span>
              <span>Visit businesses regularly to unlock loyalty bonuses</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}