// app/dashboard/business/punch-cards/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CheckCircle, Zap } from 'lucide-react';

interface PunchCardAnalytics {
  punch_card_id: string;
  title: string;
  punches_required: number;
  total_participants: number;
  completed_count: number;
  total_punches: number;
  completion_rate: number;
}

interface BusinessStats {
  total_punch_cards: number;
  total_participants: number;
  total_punches: number;
  total_completed: number;
  completion_rate: number;
}

export default function PunchCardAnalyticsPage() {
  const [analytics, setAnalytics] = useState<{
    business_stats: BusinessStats;
    punch_card_analytics: PunchCardAnalytics[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, userRole } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    if (user && userRole === 'business') {
      fetchAnalytics();
    }
  }, [user, userRole]);

  const fetchAnalytics = async () => {
    if (!user || userRole !== 'business') return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/punch-cards/analytics?businessId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const result = await response.json();
      setAnalytics(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is being determined
  if (userRole === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (userRole !== 'business') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only business users can access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const punchCardData = analytics?.punch_card_analytics.map(item => ({
    name: item.title.length > 15 ? `${item.title.substring(0, 15)}...` : item.title,
    participants: item.total_participants,
    completions: item.completed_count,
    completionRate: item.completion_rate
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Punch Card Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track performance of your punch card loyalty programs
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Business Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Punch Cards</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.business_stats.total_punch_cards || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.business_stats.total_participants || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Punches</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.business_stats.total_punches || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.business_stats.completion_rate || 0}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          {analytics?.punch_card_analytics && analytics.punch_card_analytics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Participants and Completions Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Punch Card Performance</CardTitle>
                  <CardDescription>Participants and completions by punch card</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={punchCardData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="participants" name="Participants" fill="#8884d8" />
                      <Bar dataKey="completions" name="Completions" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Completion Rate Chart */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Completion Rates</CardTitle>
                  <CardDescription>Completion rate for each punch card</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={punchCardData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                      <Legend />
                      <Bar dataKey="completionRate" name="Completion Rate" fill="#ffc658">
                        {punchCardData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
                <p className="text-muted-foreground mb-4 text-center">
                  You don't have any punch card programs yet. Create your first punch card to start tracking analytics.
                </p>
                <Button onClick={() => router.push('/dashboard/business/punch-cards')}>
                  Create Punch Card
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Detailed Punch Card Analytics */}
          {analytics?.punch_card_analytics && analytics.punch_card_analytics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analytics</CardTitle>
                <CardDescription>Performance metrics for each punch card</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.punch_card_analytics.map((item) => (
                    <div key={item.punch_card_id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {item.punches_required} punches required
                          </p>
                        </div>
                        <Badge variant="outline">
                          {item.completion_rate}% completion rate
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{item.total_participants}</div>
                          <div className="text-sm text-muted-foreground">Participants</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{item.completed_count}</div>
                          <div className="text-sm text-muted-foreground">Completions</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{item.total_punches}</div>
                          <div className="text-sm text-muted-foreground">Total Punches</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completion Progress</span>
                          <span>{item.completion_rate}%</span>
                        </div>
                        <Progress value={item.completion_rate} className="w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}