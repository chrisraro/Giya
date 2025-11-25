"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, TrendingUp, Target, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { BusinessAnalyticsDashboard } from "@/components/business-analytics-dashboard"

export default function BusinessAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adSpend, setAdSpend] = useState("")
  const [date, setDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      
      // Fetch real data from the database
      const { data: businessAnalytics, error: analyticsError } = await supabase
        .from('business_analytics')
        .select('*')
        .eq('business_id', businessId)
        .order('date', { ascending: false })
        .limit(30) // Last 30 days
        
      if (analyticsError) throw analyticsError
      
      // Fetch receipts data for additional metrics
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('total_amount, points_earned, created_at')
        .eq('business_id', businessId)
        .eq('status', 'processed')
        .order('created_at', { ascending: false })
        .limit(100)
        
      if (receiptsError) throw receiptsError
      
      // Calculate totals
      const totalRevenue = businessAnalytics.reduce((sum, day) => sum + (day.verified_revenue || 0), 0)
      const totalAdSpend = businessAnalytics.reduce((sum, day) => sum + (day.ad_spend || 0), 0)
      const totalReceipts = businessAnalytics.reduce((sum, day) => sum + (day.total_receipts || 0), 0)
      const totalPointsIssued = businessAnalytics.reduce((sum, day) => sum + (day.total_points_issued || 0), 0)
      
      // Format daily data for charts
      const dailyData = businessAnalytics.map(day => ({
        date: day.date,
        revenue: day.verified_revenue || 0,
        adSpend: day.ad_spend || 0,
        receipts: day.total_receipts || 0,
        pointsIssued: day.total_points_issued || 0
      }))
      
      // Mock top products (in a real implementation, this would come from receipt item data)
      const topProducts = [
        { name: "Signature Burger", revenue: 3200, quantity: 42 },
        { name: "Caesar Salad", revenue: 2100, quantity: 28 },
        { name: "Craft Beer", revenue: 1800, quantity: 65 },
        { name: "Dessert Platter", revenue: 1500, quantity: 22 },
        { name: "Coffee Special", revenue: 950, quantity: 78 }
      ]
      
      setAnalyticsData({
        totalRevenue,
        totalAdSpend,
        totalReceipts,
        totalPointsIssued,
        dailyData,
        topProducts
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Submit ad spend data
  const submitAdSpend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!adSpend || !date) {
      toast.error('Please enter both ad spend amount and date')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const businessId = await getBusinessId()
      if (!businessId) return
      
      // Save ad spend data to the business_analytics table
      const { error } = await supabase
        .from('business_analytics')
        .upsert({
          business_id: businessId,
          date: date,
          ad_spend: parseFloat(adSpend),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'business_id,date'
        })
      
      if (error) throw error
      
      toast.success('Ad spend data submitted successfully!')
      setAdSpend("")
      setDate("")
      
      // Refresh analytics
      fetchAnalytics()
    } catch (error) {
      console.error('Error submitting ad spend:', error)
      toast.error('Failed to submit ad spend data')
    } finally {
      setIsSubmitting(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your ad spend vs. verified revenue and customer engagement
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
      
      {analyticsData && (
        <BusinessAnalyticsDashboard 
          businessId="" 
          analyticsData={analyticsData} 
        />
      )}
      
      {/* Ad Spend Input */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Update Ad Spend
          </CardTitle>
          <CardDescription>
            Record your daily advertising spend to track ROI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitAdSpend} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="adSpend">Ad Spend (₱)</Label>
              <Input
                id="adSpend"
                type="number"
                placeholder="0.00"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Ad Spend"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}