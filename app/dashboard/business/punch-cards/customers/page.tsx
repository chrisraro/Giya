// app/dashboard/business/punch-cards/customers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, Clock, Award, User, Plus } from 'lucide-react';

export default function BusinessPunchCardCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, userRole } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    if (user && userRole === 'business') {
      fetchPunchCardCustomers();
    }
  }, [user, userRole]);

  const fetchPunchCardCustomers = async () => {
    if (!user || userRole !== 'business') return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/punch-cards/customers-by-business?businessId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch punch card customers');
      }
      
      const result = await response.json();
      setCustomers(result.data);
    } catch (error) {
      console.error('Error fetching punch card customers:', error);
      toast.error('Failed to fetch punch card customers');
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (current: number, required: number) => {
    return Math.min(100, (current / required) * 100);
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

  // Group customers by punch card
  const groupedCustomers = customers.reduce((acc, customer) => {
    const punchCardId = customer.punch_card.id;
    if (!acc[punchCardId]) {
      acc[punchCardId] = {
        punchCard: customer.punch_card,
        customers: []
      };
    }
    acc[punchCardId].customers.push(customer);
    return acc;
  }, {} as Record<string, { punchCard: any; customers: any[] }>);

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
            <h1 className="text-2xl sm:text-3xl font-bold">Punch Card Customers</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View customers participating in your punch card programs
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : Object.keys(groupedCustomers).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Customers Yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              No customers have joined your punch card programs yet.
            </p>
            <Button onClick={() => router.push('/dashboard/business/punch-cards')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Punch Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCustomers).map(([punchCardId, group]) => (
            <div key={punchCardId} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <CardTitle className="text-lg truncate">
                          {group.punchCard.title}
                        </CardTitle>
                        <div className="flex gap-2 mt-1 sm:mt-0">
                          {group.punchCard.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="truncate">
                        {group.punchCard.punches_required} punches for {group.punchCard.reward_description}
                      </CardDescription>
                    </div>
                    {group.punchCard.image_url && (
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 self-start sm:self-auto">
                        <img
                          src={group.punchCard.image_url}
                          alt={group.punchCard.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    {group.punchCard.description}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Validity:</span>
                      <div>
                        {format(new Date(group.punchCard.valid_from), 'MMM d, yyyy')}
                        {group.punchCard.valid_until && ` - ${format(new Date(group.punchCard.valid_until), 'MMM d, yyyy')}`}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Participants:</span>
                      <div>{group.customers.length} customers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.customers.map((customer) => (
                  <Card key={customer.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {customer.customer.profile_pic_url ? (
                          <img
                            src={customer.customer.profile_pic_url}
                            alt={customer.customer.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{customer.customer.full_name}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            Joined {format(new Date(customer.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>
                              {customer.punches_count}/{customer.punch_card.punches_required} punches
                            </span>
                            <span>
                              {customer.is_completed ? 'Completed!' :
                                `${customer.punch_card.punches_required - customer.punches_count} more`}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                customer.is_completed ? 'bg-green-600' : 'bg-blue-600'
                              }`}
                              style={{
                                width: `${progressPercentage(customer.punches_count, customer.punch_card.punches_required)}%`
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            {customer.is_completed ? (
                              <span className="flex items-center text-green-600">
                                <Award className="h-4 w-4 mr-1" />
                                Completed
                              </span>
                            ) : customer.punches_count > 0 ? (
                              <span className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-1 text-blue-500" />
                                In progress
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                                Not started
                              </span>
                            )}
                          </div>
                          {customer.last_punch_at && (
                            <div className="text-xs text-muted-foreground">
                              Last: {format(new Date(customer.last_punch_at), 'MMM d')}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}