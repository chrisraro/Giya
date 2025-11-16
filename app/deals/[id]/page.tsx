// app/deals/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { handleApiError } from '@/lib/error-handler';
import { OptimizedImage } from '@/components/optimized-image';

interface Deal {
  id: string;
  title: string;
  description: string;
  deal_type: string;
  discount_percentage: number | null;
  discount_value: number | null;
  original_price: number | null;
  exclusive_price: number | null;
  image_url: string | null;
  terms_and_conditions: string | null;
  is_active: boolean;
  validity_start: string | null;
  validity_end: string | null;
  business_id: string;
  business_name: string;
  business_profile_pic: string | null;
}

export default function DealDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRedemptionQR, setShowRedemptionQR] = useState(false);
  const [redemptionQRCode, setRedemptionQRCode] = useState<string>('');
  const [showRedemptionForm, setShowRedemptionForm] = useState(false);
  const [pointsRequired, setPointsRequired] = useState<number>(0);
  const [customerPoints, setCustomerPoints] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          title,
          description,
          deal_type,
          discount_percentage,
          discount_value,
          original_price,
          exclusive_price,
          image_url,
          terms_and_conditions,
          is_active,
          validity_start,
          validity_end,
          business_id,
          businesses!inner (
            business_name,
            profile_pic_url
          )
        `)
        .eq('id', Array.isArray(id) ? id[0] : id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        setDeal({
          ...data,
          business_name: data.businesses?.business_name || 'Unknown Business',
          business_profile_pic: data.businesses?.profile_pic_url || null,
        });
      }
    } catch (error) {
      console.error('Error fetching deal:', error);
      toast.error('Failed to load deal details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemDeal = async () => {
    if (!user) {
      toast.error('You must be logged in to redeem deals');
      router.push('/auth/login');
      return;
    }

    if (userRole !== 'customer') {
      toast.error('Only customers can redeem deals');
      return;
    }

    try {
      // Check if the deal requires points
      if (deal?.points_required && deal.points_required > 0) {
        // Check if customer has enough points
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (customerError) throw customerError;

        if (customerData.total_points < deal.points_required) {
          toast.error(`Not enough points. You need ${deal.points_required} points but have ${customerData.total_points}.`);
          return;
        }
      }

      // Generate a redemption QR code
      const redemptionCode = `GIYA-DEAL-REDEMPTION-${deal?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create redemption record
      const { error: redemptionError } = await supabase
        .from('deal_usage')
        .insert([{
          deal_id: deal?.id,
          customer_id: user.id,
          business_id: deal?.business_id,
          used_at: new Date().toISOString(),
          points_used: deal?.points_required || 0
        }]);

      if (redemptionError) throw redemptionError;

      setRedemptionQRCode(redemptionCode);
      setShowRedemptionQR(true);
      toast.success('Deal redemption created successfully!');
    } catch (error) {
      console.error('Error redeeming deal:', error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Deal Not Found</h2>
            <p className="text-muted-foreground">The requested deal could not be found or is no longer available</p>
            <Button 
              className="mt-4"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-6"
        >
          ← Back to Deals
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            {deal.image_url && (
              <div className="h-64 w-full relative">
                <OptimizedImage
                  src={deal.image_url}
                  alt={deal.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{deal.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {deal.is_active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">{deal.deal_type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {deal.business_profile_pic ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      <OptimizedImage
                        src={deal.business_profile_pic}
                        alt={deal.business_name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-sm font-medium">{deal.business_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{deal.business_name}</p>
                    <p className="text-sm text-muted-foreground">Business</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{deal.description || 'No description provided.'}</p>
              </div>

              {deal.deal_type === 'discount' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Original Price</h3>
                    <p className="text-lg">${deal.original_price?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Discount</h3>
                    <p className="text-lg text-green-600">
                      {deal.discount_percentage ? `${deal.discount_percentage}% OFF` : `$${deal.discount_value} OFF`}
                    </p>
                  </div>
                </div>
              )}

              {deal.deal_type === 'exclusive' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Original Price</h3>
                    <p className="text-lg line-through text-muted-foreground">${deal.original_price?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Exclusive Price</h3>
                    <p className="text-lg text-red-600">${deal.exclusive_price?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
              )}

              {(deal.validity_start || deal.validity_end) && (
                <div>
                  <h3 className="font-medium mb-2">Validity Period</h3>
                  <p className="text-muted-foreground">
                    {deal.validity_start ? new Date(deal.validity_start).toLocaleDateString() : 'No start date'} 
                    {deal.validity_end ? ` - ${new Date(deal.validity_end).toLocaleDateString()}` : ' - No end date'}
                  </p>
                </div>
              )}

              {deal.terms_and_conditions && (
                <div>
                  <h3 className="font-medium mb-2">Terms & Conditions</h3>
                  <p className="text-muted-foreground text-sm">{deal.terms_and_conditions}</p>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleRedeemDeal}
                  disabled={!deal.is_active || (deal.validity_end && new Date() > new Date(deal.validity_end))}
                >
                  {deal.is_active 
                    ? (deal.validity_end && new Date() > new Date(deal.validity_end) 
                      ? 'Deal Expired' 
                      : 'Redeem Deal') 
                    : 'Deal Inactive'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Redemption QR Dialog */}
      <Dialog open={showRedemptionQR} onOpenChange={setShowRedemptionQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deal Redemption QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code to the business staff to complete your deal redemption
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            {redemptionQRCode && (
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeSVG 
                  value={redemptionQRCode} 
                  size={200} 
                  bgColor="#ffffff" 
                  fgColor="#000000" 
                  level="H" 
                />
              </div>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground break-all">
              {redemptionQRCode}
            </p>
            <Button 
              className="mt-6"
              onClick={() => navigator.clipboard.writeText(redemptionQRCode)}
            >
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}