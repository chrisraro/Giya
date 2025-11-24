// app/dashboard/business/punch-cards/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, QrCode, Edit, Trash2, CheckCircle, Clock, XCircle, User, TrendingUp, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { PunchCard, createPunchCard, getPunchCardsForBusiness, updatePunchCard, deletePunchCard } from '@/lib/punch-cards';
import { PunchCardQrGenerator } from '@/components/punch-card-qr-generator';
import { BulkPunchCardOperations } from '@/components/bulk-punch-card-operations';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function BusinessPunchCardsPage() {
  const [punchCards, setPunchCards] = useState<PunchCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPunchCard, setEditingPunchCard] = useState<PunchCard | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [punchesRequired, setPunchesRequired] = useState<number>(10);
  const [rewardDescription, setRewardDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');

  const router = useRouter();
  const { user, userRole } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    if (user && userRole === 'business') {
      fetchPunchCards();
    }
  }, [user, userRole]);

  const fetchPunchCards = async () => {
    if (!user || userRole !== 'business') return;

    try {
      setIsLoading(true);
      const data = await getPunchCardsForBusiness(user.id);
      setPunchCards(data);
    } catch (error) {
      console.error('Error fetching punch cards:', error);
      toast.error('Failed to fetch punch cards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!rewardDescription.trim()) {
      toast.error('Reward Description is required.');
      return;
    }
    if (punchesRequired < 1) {
      toast.error('Punches Required must be at least 1.');
      return;
    }

    try {
      if (editingPunchCard) {
        // Update existing punch card
        await updatePunchCard(editingPunchCard.id, {
          title,
          description,
          punches_required: punchesRequired,
          reward_description: rewardDescription,
          image_url: imageUrl,
          is_active: isActive,
          valid_from: validFrom,
          valid_until: validUntil
        });
        toast.success('Punch card updated successfully');
      } else {
        // Create new punch card
        await createPunchCard({
          business_id: user!.id,
          title,
          description,
          punches_required: punchesRequired,
          reward_description: rewardDescription,
          image_url: imageUrl,
          is_active: isActive,
          valid_from: validFrom || new Date().toISOString(),
          valid_until: validUntil
        });
        toast.success('Punch card created successfully');
      }
      
      resetForm();
      fetchPunchCards();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving punch card:', error);
      toast.error('Failed to save punch card');
    }
  };

  const handleEdit = (punchCard: PunchCard) => {
    setEditingPunchCard(punchCard);
    setTitle(punchCard.title);
    setDescription(punchCard.description || '');
    setPunchesRequired(punchCard.punches_required);
    setRewardDescription(punchCard.reward_description);
    setImageUrl(punchCard.image_url || '');
    setIsActive(punchCard.is_active);
    setValidFrom(punchCard.valid_from);
    setValidUntil(punchCard.valid_until || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this punch card?')) return;
    
    try {
      await deletePunchCard(id);
      toast.success('Punch card deleted successfully');
      fetchPunchCards();
    } catch (error) {
      console.error('Error deleting punch card:', error);
      toast.error('Failed to delete punch card');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPunchesRequired(10);
    setRewardDescription('');
    setImageUrl('');
    setIsActive(true);
    setValidFrom('');
    setValidUntil('');
    setEditingPunchCard(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setIsDialogOpen(true);
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

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Punch Cards</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create and manage punch card loyalty programs
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/business/punch-cards/customers')}
              className="w-full sm:w-auto"
            >
              <User className="mr-2 h-4 w-4" />
              View Customers
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/business/punch-cards/analytics')}
              className="w-full sm:w-auto"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <BulkPunchCardOperations 
              businessId={user!.id}
              punchCards={punchCards}
              onOperationComplete={fetchPunchCards}
            />
          </div>
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Punch Card
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl w-[95%] sm:w-auto mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              {editingPunchCard ? 'Edit Punch Card' : 'Create New Punch Card'}
            </DialogTitle>
            <DialogDescription>
              {editingPunchCard
                ? 'Update the details of your punch card program'
                : 'Create a new punch card loyalty program'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your punch card program..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="punchesRequired">Punches Required</Label>
              <Input
                id="punchesRequired"
                type="number"
                value={punchesRequired}
                onChange={(e) => setPunchesRequired(Number(e.target.value))}
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="rewardDescription">Reward Description</Label>
              <Input
                id="rewardDescription"
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                required
                placeholder="e.g., Free coffee after 10 purchases"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={validFrom.replace('Z', '')}
                onChange={(e) => setValidFrom(e.target.value + 'Z')}
              />
            </div>

            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={validUntil?.replace('Z', '') || ''}
                onChange={(e) => setValidUntil(e.target.value ? e.target.value + 'Z' : '')}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingPunchCard ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : punchCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Punch Cards Yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create your first punch card loyalty program to start rewarding customers
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Punch Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {punchCards.map((punchCard) => (
            <Card key={punchCard.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <CardTitle className="text-lg truncate">
                        {punchCard.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        {punchCard.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="truncate">
                      {punchCard.punches_required} punches for {punchCard.reward_description}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1 self-start sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(punchCard)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(punchCard.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {punchCard.image_url && (
                  <div className="mt-2">
                    <img
                      src={punchCard.image_url}
                      alt={punchCard.title}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
                
                {/* Punch Card QR Code */}
                <div className="mt-4">
                  <PunchCardQrGenerator 
                    punchCardId={punchCard.id}
                    title={punchCard.title}
                    businessName="Your Business"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-3">
                <p className="text-sm text-muted-foreground mb-4">
                  {punchCard.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Validity:</span>
                    <div>
                      {format(new Date(punchCard.valid_from), 'MMM d, yyyy')}
                      {punchCard.valid_until && ` - ${format(new Date(punchCard.valid_until), 'MMM d, yyyy')}`}
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <div>{format(new Date(punchCard.created_at), 'MMM d, yyyy')}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-border">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm">Punches: 0/{punchCard.punches_required}</span>
                  </div>
                  <Badge variant="outline">0 customers</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}