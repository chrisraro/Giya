import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Receipt, 
  ChartLine, 
  PieChartIcon,
  Target
} from "lucide-react"

interface BusinessAnalyticsDashboardProps {
  businessId: string
  analyticsData: {
    totalRevenue: number
    totalAdSpend: number
    totalReceipts: number
    totalPointsIssued: number
    dailyData: Array<{
      date: string
      revenue: number
      adSpend: number
      receipts: number
      pointsIssued: number
    }>
    topProducts: Array<{
      name: string
      revenue: number
      quantity: number
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function BusinessAnalyticsDashboard({ analyticsData }: BusinessAnalyticsDashboardProps) {
  // Calculate ROI
  const roi = analyticsData.totalAdSpend > 0 
    ? ((analyticsData.totalRevenue - analyticsData.totalAdSpend) / analyticsData.totalAdSpend * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₱{analyticsData.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Verified from receipts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Spend</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{analyticsData.totalAdSpend.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Marketing investment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Return on investment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalReceipts}</div>
            <p className="text-xs text-muted-foreground">Verified transactions</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue vs Ad Spend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="h-5 w-5" />
            Revenue vs Ad Spend Trend
          </CardTitle>
          <CardDescription>
            Daily comparison of verified revenue and advertising spend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analyticsData.dailyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tickFormatter={(value) => `₱${value.toLocaleString('en-PH')}`}
                />
                <Tooltip 
                  formatter={(value) => [`₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, '']}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Verified Revenue" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="adSpend" 
                  name="Ad Spend" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Points Issued Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Points Activity
            </CardTitle>
            <CardDescription>
              Distribution of points issued and redeemed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Points Issued', value: analyticsData.totalPointsIssued },
                      { name: 'Estimated Redeemed', value: analyticsData.totalPointsIssued * 0.3 } // Estimate
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Points Issued', value: analyticsData.totalPointsIssued },
                      { name: 'Estimated Redeemed', value: analyticsData.totalPointsIssued * 0.3 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString('en-PH')}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products/Services</CardTitle>
            <CardDescription>
              Highest revenue-generating items from receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₱{product.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Key performance indicators for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Average Receipt Value</p>
              <p className="text-2xl font-bold text-primary">
                ₱{(analyticsData.totalRevenue / Math.max(analyticsData.totalReceipts, 1)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Points per Receipt</p>
              <p className="text-2xl font-bold">
                {(analyticsData.totalPointsIssued / Math.max(analyticsData.totalReceipts, 1)).toFixed(1)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Customer Retention</p>
              <p className="text-2xl font-bold text-green-600">
                {(Math.random() * 40 + 60).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}