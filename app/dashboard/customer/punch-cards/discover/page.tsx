// app/dashboard/customer/punch-cards/discover/page.tsx
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
import { CheckCircle, Clock, QrCode, Award, MapPin, Plus, Scan } from 'lucide-react';
import { PunchCardScanner } from '@/components/punch-card-scanner';

export default function CustomerDiscoverPunchCardsPage() {
  const [availableCards, setAvailableCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningCardId, setJoiningCardId] = useState<string | null>(null);
  const [showPunchCardScanner, setShowPunchCardScanner] = useState(false);
  const router = useRouter();
  const { user, userRole } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    if (user && userRole === 'customer') {
      fetchAvailableCards();
    }
  }, [user, userRole]);

  const fetchAvailableCards = async () => {
    if (!user || userRole !== 'customer') return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/punch-cards?customerId=${user.id}&available=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch available punch cards');
      }
      
      const result = await response.json();
      setAvailableCards(result.data);
    } catch (error) {
      console.error('Error fetching available punch cards:', error);
      toast.error('Failed to fetch available punch cards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinPunchCard = async (punchCardId: string) => {
    if (!user || userRole !== 'customer') return;
    
    setJoiningCardId(punchCardId);
    
    try {
      const response = await fetch('/api/punch-cards/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ punch_card_id: punchCardId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join punch card');
      }
      
      toast.success('Successfully joined punch card program!');
      // Refresh the available cards list
      fetchAvailableCards();
      // Redirect to the main punch cards page
      router.push('/dashboard/customer/punch-cards');
    } catch (error) {
      console.error('Error joining punch card:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join punch card');
    } finally {
      setJoiningCardId(null);
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
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Discover Punch Cards</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find and join punch card loyalty programs from businesses
            </p>
          </div>
          <Button onClick={() => setShowPunchCardScanner(true)}>
            <Scan className="mr-2 h-4 w-4" />
            Scan Punch Card
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : availableCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Available Punch Cards</h3>
            <p className="text-muted-foreground mb-4 text-center">
              There are no punch card programs available at the moment. 
              Check back later or discover new businesses!
            </p>
            <Button onClick={() => router.push('/dashboard/customer/discover')}>
              <MapPin className="mr-2 h-4 w-4" />
              Discover Businesses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {availableCards.map((punchCard) => (
            <Card key={punchCard.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <CardTitle className="text-lg truncate">
                        {punchCard.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-1 sm:mt-0">
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                    <CardDescription className="truncate">
                      {punchCard.business_name}
                    </CardDescription>
                  </div>
                  {punchCard.image_url && (
                    <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 self-start sm:self-auto">
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
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-1">
                      <span className="text-sm font-medium">
                        0/{punchCard.punches_required} punches
                      </span>
                      <span className="text-sm font-medium">
                        {punchCard.punches_required} punches to go!
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-blue-600"
                        style={{
                          width: '0%'
                        }}
                      ></div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Description</h3>
                      <p className="text-sm">{punchCard.description || 'No description provided'}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-1">Reward</h3>
                      <p className="text-sm">{punchCard.reward_description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
                    {punchCard.valid_until && (
                      <div className="text-sm text-muted-foreground">
                        Valid until: {format(new Date(punchCard.valid_until), 'MMM d, yyyy')}
                      </div>
                    )}
                    <Button 
                      onClick={() => handleJoinPunchCard(punchCard.id)}
                      disabled={joiningCardId === punchCard.id}
                      className="w-full sm:w-auto"
                    >
                      {joiningCardId === punchCard.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Joining...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Join Program
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Punch Card Scanner */}
      <PunchCardScanner 
        isOpen={showPunchCardScanner} 
        onClose={() => setShowPunchCardScanner(false)} 
        onPunchAdded={() => {
          // Refresh the available cards list when a punch is added
          fetchAvailableCards();
        }} 
      />
    </div>
  );
}
