"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Users, MousePointerClick, ShoppingCart, TrendingUp, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function BusinessAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  
  // Get business ID from authenticated user
  const getBusinessId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id || null
  }
  
  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true)
    
    try {
      const businessId = await getBusinessId()
      if (!businessId) return
      
      // Fetch business info and Meta Pixel ID
      const { data: business } = await supabase
        .from('businesses')
        .select('meta_pixel_id, business_name')
        .eq('id', businessId)
        .single()
      
      // Count referral signups (CompleteRegistration events)
      const { count: referralSignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', businessId)
      
      // Get customers referred by this business who made transactions
      const { data: referredCustomers } = await supabase
        .from('profiles')
        .select('id')
        .eq('referred_by', businessId)
      
      let firstPurchaseCount = 0
      let totalConversionRevenue = 0
      
      if (referredCustomers && referredCustomers.length > 0) {
        const customerIds = referredCustomers.map(c => c.id)
        
        // Get first transaction for each referred customer
        const { data: transactions } = await supabase
          .from('points_transactions')
          .select('customer_id, amount_spent')
          .in('customer_id', customerIds)
          .order('transaction_date', { ascending: true })
        
        if (transactions) {
          // Group by customer and get their first transaction
          const firstTransactions = new Map()
          transactions.forEach(txn => {
            if (!firstTransactions.has(txn.customer_id)) {
              firstTransactions.set(txn.customer_id, txn.amount_spent)
            }
          })
          
          firstPurchaseCount = firstTransactions.size
          totalConversionRevenue = Array.from(firstTransactions.values()).reduce((sum, amount) => sum + amount, 0)
        }
      }
      
      const conversionRate = referralSignups ? (firstPurchaseCount / referralSignups * 100) : 0
      
      setAnalyticsData({
        metaPixelId: business?.meta_pixel_id || null,
        businessName: business?.business_name || 'Your Business',
        referralSignups: referralSignups || 0,
        firstPurchases: firstPurchaseCount,
        conversionRevenue: totalConversionRevenue,
        conversionRate: conversionRate
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAnalytics()
  }, [])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/dashboard/business'}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meta Pixel Conversions</h1>
            <p className="text-muted-foreground mt-1">
              Track customer signups and purchases from your referral link
            </p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
      
      {analyticsData ? (
        <>
          {analyticsData.metaPixelId ? (
            <>
              {/* Meta Pixel Status Banner */}
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">✓ Meta Pixel Connected</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Pixel ID: <code className="bg-blue-100 px-2 py-1 rounded">{analyticsData.metaPixelId}</code>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-900">Total Conversion Revenue</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ₱{analyticsData.conversionRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Metrics */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Signups from Ads</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.referralSignups}
                    </div>
                    <p className="text-xs text-muted-foreground">CompleteRegistration events</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">First Purchases</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analyticsData.firstPurchases}
                    </div>
                    <p className="text-xs text-muted-foreground">Purchase conversion events</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      analyticsData.conversionRate >= 30 ? 'text-green-600' :
                      analyticsData.conversionRate >= 15 ? 'text-yellow-600' :
                      'text-orange-600'
                    }`}>
                      {analyticsData.conversionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsData.firstPurchases} of {analyticsData.referralSignups} converted
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Conversion Insights
                  </CardTitle>
                  <CardDescription>
                    Understanding your Meta Pixel performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">CompleteRegistration Events</h4>
                        <p className="text-sm text-muted-foreground">
                          {analyticsData.referralSignups} customers signed up using your referral link from Meta ads.
                          These are tracked as CompleteRegistration events in your Meta Pixel.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Purchase Events</h4>
                        <p className="text-sm text-muted-foreground">
                          {analyticsData.firstPurchases} referred customers made their first purchase, generating 
                          ₱{analyticsData.conversionRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })} in revenue.
                          Only first purchases fire the Purchase event (no double counting).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className={`h-8 w-8 rounded-full ${
                          analyticsData.conversionRate >= 30 ? 'bg-green-100' :
                          analyticsData.conversionRate >= 15 ? 'bg-yellow-100' :
                          'bg-orange-100'
                        } flex items-center justify-center`}>
                          <MousePointerClick className={`h-4 w-4 ${
                            analyticsData.conversionRate >= 30 ? 'text-green-600' :
                            analyticsData.conversionRate >= 15 ? 'text-yellow-600' :
                            'text-orange-600'
                          }`} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Conversion Rate</h4>
                        <p className="text-sm text-muted-foreground">
                          Your conversion rate is {analyticsData.conversionRate.toFixed(1)}%. 
                          {analyticsData.conversionRate >= 30 && "Excellent! This is a very strong conversion rate."}
                          {analyticsData.conversionRate >= 15 && analyticsData.conversionRate < 30 && "Good conversion rate. Consider optimizing your onboarding flow to improve."}
                          {analyticsData.conversionRate < 15 && "Consider improving your customer onboarding experience to increase conversions."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">Meta Pixel Not Connected</h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Connect your Meta Pixel to start tracking conversions from your ads.
                  </p>
                  <Button onClick={() => window.location.href = '/dashboard/business/settings'} variant="outline">
                    Go to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}