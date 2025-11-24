// components/punch-card-details.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PunchCard, PunchCardCustomer, getPunchCardParticipationForCustomer } from '@/lib/punch-cards';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle, Users, Award } from 'lucide-react';

interface PunchCardDetailsProps {
  punchCard: PunchCard;
  onBack: () => void;
  onAddPunch?: (customerId: string) => void; // Optional callback for adding punches
}

export function PunchCardDetails({ punchCard, onBack, onAddPunch }: PunchCardDetailsProps) {
  const [participatingCustomers, setParticipatingCustomers] = useState<PunchCardCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (punchCard.id) {
      fetchParticipatingCustomers();
    }
  }, [punchCard.id]);

  const fetchParticipatingCustomers = async () => {
    try {
      setIsLoading(true);
      // This would need to be updated to fetch customers participating in this specific punch card
      // For now, I'll simulate with an API call that doesn't exist yet
      // const data = await getPunchCardCustomers(punchCard.id);
      // setParticipatingCustomers(data);
      
      // For demo purposes, I'll create mock data
      setParticipatingCustomers([
        {
          id: 'mock-1',
          punch_card_id: punchCard.id,
          customer_id: 'customer-1',
          punches_count: 7,
          created_at: new Date().toISOString(),
          last_punch_at: new Date().toISOString(),
          is_completed: false,
        },
        {
          id: 'mock-2',
          punch_card_id: punchCard.id,
          customer_id: 'customer-2',
          punches_count: 10,
          created_at: new Date().toISOString(),
          last_punch_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          is_completed: true,
        },
      ]);
    } catch (error) {
      console.error('Error fetching participating customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (current: number, required: number) => {
    return Math.min(100, (current / required) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Punch Cards
        </Button>
        <Button>Add Punch</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {punchCard.title}
                {punchCard.is_active ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {punchCard.punches_required} punches for {punchCard.reward_description}
              </CardDescription>
            </div>
            {punchCard.image_url && (
              <div className="h-16 w-16 rounded-md overflow-hidden">
                <img 
                  src={punchCard.image_url} 
                  alt={punchCard.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {punchCard.description || 'No description provided.'}
              </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Required Punches</h3>
                <p className="text-2xl font-bold">{punchCard.punches_required}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Reward</h3>
                <p className="text-sm">{punchCard.reward_description}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Validity Period</h3>
                <p className="text-sm">
                  {format(new Date(punchCard.valid_from), 'MMM d, yyyy')}
                  {punchCard.valid_until && ` - ${format(new Date(punchCard.valid_until), 'MMM d, yyyy')}`}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Created</h3>
                <p className="text-sm">{format(new Date(punchCard.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participating Customers
            </CardTitle>
            <Badge variant="outline">
              {participatingCustomers.length} customers
            </Badge>
          </div>
          <CardDescription>
            Customers currently participating in this punch card program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : participatingCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers participating in this punch card yet
            </div>
          ) : (
            <div className="space-y-4">
              {participatingCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div 
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                        style={{ width: '40px', height: '40px' }}
                      >
                        <span className="font-medium">C</span>
                      </div>
                      {customer.is_completed ? (
                        <Award className="absolute -bottom-1 -right-1 h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                      ) : (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-xs text-white font-bold">
                            {customer.punches_count}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Customer {customer.customer_id.substring(0, 8)}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {customer.is_completed ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Completed
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {customer.punches_count}/{punchCard.punches_required} punches
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${progressPercentage(customer.punches_count, punchCard.punches_required)}%` }}
                      ></div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => onAddPunch && onAddPunch(customer.customer_id)}
                    >
                      Add Punch
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}