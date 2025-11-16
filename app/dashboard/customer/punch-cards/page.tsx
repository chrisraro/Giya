// app/dashboard/customer/punch-cards/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PunchCardCustomer, getPunchCardParticipationForCustomer } from '@/lib/punch-cards';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle, QrCode, Award, MapPin } from 'lucide-react';

export default function CustomerPunchCardsPage() {
  const [participatingCards, setParticipatingCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, userRole } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    if (user) {
      fetchParticipatingCards();
    }
  }, [user]);

  const fetchParticipatingCards = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await getPunchCardParticipationForCustomer(user.id);
      setParticipatingCards(data);
    } catch (error) {
      console.error('Error fetching punch card participation:', error);
      toast.error('Failed to fetch punch cards');
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

  if (userRole !== 'customer') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only customer users can access this page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">My Punch Cards</h1>
            <p className="text-muted-foreground">
              Track your progress in punch card loyalty programs
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : participatingCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Punch Cards</h3>
            <p className="text-muted-foreground mb-4 text-center">
              You're not participating in any punch card programs yet. 
              Visit businesses to start collecting punches!
            </p>
            <Button>
              <MapPin className="mr-2 h-4 w-4" />
              Discover Businesses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {participatingCards.map((participation) => (
            <Card key={participation.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {participation.punch_card.title}
                      {participation.is_completed ? (
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
                      ) : participation.punch_card.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {participation.punch_card.business_name}
                    </CardDescription>
                  </div>
                  {participation.punch_card.image_url && (
                    <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={participation.punch_card.image_url} 
                        alt={participation.punch_card.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        {participation.punches_count}/{participation.punch_card.punches_required} punches
                      </span>
                      <span className="text-sm font-medium">
                        {participation.is_completed ? 'Completed!' : 
                          `${participation.punch_card.punches_required - participation.punches_count} more to go!`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          participation.is_completed ? 'bg-green-600' : 'bg-blue-600'
                        }`} 
                        style={{ 
                          width: `${progressPercentage(participation.punches_count, participation.punch_card.punches_required)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Reward</h3>
                      <p className="text-sm">{participation.punch_card.reward_description}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-1">Status</h3>
                      <div className="flex items-center">
                        {participation.is_completed ? (
                          <span className="flex items-center text-green-600">
                            <Award className="h-4 w-4 mr-1" />
                            Completed on {format(new Date(participation.completed_at), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="flex items-center">
                            {participation.punches_count === 0 ? (
                              <>
                                <Clock className="h-4 w-4 mr-1" />
                                Not started
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                In progress
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {participation.punch_card.valid_until && (
                    <div className="text-sm text-muted-foreground">
                      Valid until: {format(new Date(participation.punch_card.valid_until), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}