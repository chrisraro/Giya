// components/bulk-punch-card-operations.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { bulkAddPunches, bulkCreatePunchCards, bulkUpdatePunchCards, bulkDeletePunchCards } from '@/lib/punch-card-utils';
import { PunchCard } from '@/lib/punch-cards';

interface BulkPunchCardOperationsProps {
  businessId: string;
  punchCards: PunchCard[];
  onOperationComplete: () => void;
}

export function BulkPunchCardOperations({ businessId, punchCards, onOperationComplete }: BulkPunchCardOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<'add_punches' | 'create_cards' | 'update_cards' | 'delete_cards' | null>(null);
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: any[]; errors?: any[] } | null>(null);

  const handleOperationSelect = (op: 'add_punches' | 'create_cards' | 'update_cards' | 'delete_cards') => {
    setOperation(op);
    setResult(null);
    setCsvData('');
  };

  const handleProcess = async () => {
    if (!operation || !csvData.trim()) {
      toast.error('Please select an operation and provide data');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      switch (operation) {
        case 'add_punches': {
          // Parse CSV data for punch additions
          // Expected format: punch_card_id,customer_id,transaction_id (optional)
          const lines = csvData.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          if (headers[0] !== 'punch_card_id' || headers[1] !== 'customer_id') {
            throw new Error('Invalid CSV format. Expected headers: punch_card_id,customer_id[,transaction_id]');
          }

          const punchesData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              punch_card_id: values[0],
              customer_id: values[1],
              transaction_id: values[2] || undefined
            };
          });

          const response = await bulkAddPunches(punchesData);
          setResult(response);
          if (response.success) {
            toast.success(response.message);
          } else {
            toast.error(response.message);
          }
          break;
        }

        case 'create_cards': {
          // Parse CSV data for punch card creation
          // Expected format: title,description,punches_required,reward_description,image_url,is_active,valid_until
          const lines = csvData.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const requiredHeaders = ['title', 'punches_required', 'reward_description'];
          for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
              throw new Error(`Missing required header: ${required}`);
            }
          }

          const punchCardsData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const data: any = {};
            
            headers.forEach((header, index) => {
              if (index < values.length) {
                if (header === 'punches_required') {
                  data[header] = parseInt(values[index]);
                } else if (header === 'is_active') {
                  data[header] = values[index].toLowerCase() === 'true';
                } else {
                  data[header] = values[index] || undefined;
                }
              }
            });

            return data;
          });

          const response = await bulkCreatePunchCards(punchCardsData);
          setResult(response);
          if (response.success) {
            toast.success(response.message);
          } else {
            toast.error(response.message);
          }
          break;
        }

        case 'update_cards': {
          // Parse CSV data for punch card updates
          // Expected format: id,field1,value1,field2,value2,...
          const lines = csvData.trim().split('\n');
          
          if (!lines[0].includes('id')) {
            throw new Error('Invalid CSV format. First column must be "id"');
          }

          const updates = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const update: any = { id: values[0] };
            
            // Process field-value pairs
            for (let i = 1; i < values.length; i += 2) {
              if (i + 1 < values.length) {
                const field = values[i];
                const value = values[i + 1];
                
                // Convert specific fields to appropriate types
                if (field === 'punches_required') {
                  update[field] = parseInt(value);
                } else if (field === 'is_active') {
                  update[field] = value.toLowerCase() === 'true';
                } else {
                  update[field] = value || undefined;
                }
              }
            }

            return update;
          });

          const response = await bulkUpdatePunchCards(updates);
          setResult(response);
          if (response.success) {
            toast.success(response.message);
          } else {
            toast.error(response.message);
          }
          break;
        }

        case 'delete_cards': {
          // Parse CSV data for punch card deletions
          // Expected format: id (one per line)
          const ids = csvData.trim().split('\n').map(line => line.trim()).filter(id => id);
          
          const response = await bulkDeletePunchCards(ids);
          setResult(response);
          if (response.success) {
            toast.success(response.message);
          } else {
            toast.error(response.message);
          }
          break;
        }
      }

      // Refresh parent data
      onOperationComplete();
    } catch (error) {
      console.error('Error processing bulk operation:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing bulk operation');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSampleData = () => {
    switch (operation) {
      case 'add_punches':
        return `punch_card_id,customer_id,transaction_id
${punchCards[0]?.id || 'punch_card_id_here'},customer_id_here,transaction_id_here`;
      case 'create_cards':
        return `title,description,punches_required,reward_description,image_url,is_active,valid_until
Summer Special,Get a free coffee after 10 visits,10,Free Coffee,https://example.com/image.jpg,true,2025-12-31`;
      case 'update_cards':
        return `id,field1,value1,field2,value2
${punchCards[0]?.id || 'punch_card_id_here'},title,New Title,is_active,true`;
      case 'delete_cards':
        return `${punchCards[0]?.id || 'punch_card_id_here'}
${punchCards[1]?.id || 'another_punch_card_id_here'}`;
      default:
        return '';
    }
  };

  const getInstructions = () => {
    switch (operation) {
      case 'add_punches':
        return (
          <div className="space-y-2">
            <p className="text-sm">Add punches to multiple customers at once.</p>
            <p className="text-sm"><strong>Format:</strong> punch_card_id,customer_id,transaction_id (transaction_id is optional)</p>
            <p className="text-sm"><strong>Example:</strong></p>
            <pre className="text-xs bg-muted p-2 rounded">
              punch_card_id,customer_id,transaction_id{'\n'}
              abc123,xyz789,txn456{'\n'}
              def456,uvw123,
            </pre>
          </div>
        );
      case 'create_cards':
        return (
          <div className="space-y-2">
            <p className="text-sm">Create multiple punch cards at once.</p>
            <p className="text-sm"><strong>Required fields:</strong> title, punches_required, reward_description</p>
            <p className="text-sm"><strong>Optional fields:</strong> description, image_url, is_active, valid_until</p>
            <p className="text-sm"><strong>Example:</strong></p>
            <pre className="text-xs bg-muted p-2 rounded">
              title,description,punches_required,reward_description,image_url,is_active,valid_until{'\n'}
              Summer Special,Get a free coffee after 10 visits,10,Free Coffee,https://example.com/image.jpg,true,2025-12-31
            </pre>
          </div>
        );
      case 'update_cards':
        return (
          <div className="space-y-2">
            <p className="text-sm">Update multiple punch cards at once.</p>
            <p className="text-sm"><strong>Format:</strong> id,field1,value1,field2,value2,...</p>
            <p className="text-sm"><strong>Example:</strong></p>
            <pre className="text-xs bg-muted p-2 rounded">
              id,field1,value1,field2,value2{'\n'}
              abc123,title,New Title,is_active,true{'\n'}
              def456,reward_description,Free Dessert,punches_required,8
            </pre>
          </div>
        );
      case 'delete_cards':
        return (
          <div className="space-y-2">
            <p className="text-sm">Delete multiple punch cards at once.</p>
            <p className="text-sm"><strong>Format:</strong> One punch card ID per line</p>
            <p className="text-sm"><strong>Example:</strong></p>
            <pre className="text-xs bg-muted p-2 rounded">
              abc123{'\n'}
              def456{'\n'}
              ghi789
            </pre>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Bulk Operations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Punch Card Operations</DialogTitle>
          <DialogDescription>
            Perform bulk operations on punch cards. Select an operation type and provide data in CSV format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!operation ? (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 p-6"
                onClick={() => handleOperationSelect('add_punches')}
              >
                <Plus className="h-6 w-6" />
                <span>Add Punches</span>
                <Badge variant="secondary" className="text-xs">For customers</Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 p-6"
                onClick={() => handleOperationSelect('create_cards')}
              >
                <Plus className="h-6 w-6" />
                <span>Create Cards</span>
                <Badge variant="secondary" className="text-xs">New punch cards</Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 p-6"
                onClick={() => handleOperationSelect('update_cards')}
              >
                <Edit className="h-6 w-6" />
                <span>Update Cards</span>
                <Badge variant="secondary" className="text-xs">Existing cards</Badge>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 p-6"
                onClick={() => handleOperationSelect('delete_cards')}
              >
                <Trash2 className="h-6 w-6" />
                <span>Delete Cards</span>
                <Badge variant="secondary" className="text-xs">Remove cards</Badge>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium capitalize">
                  {operation.replace('_', ' ')}
                </h3>
                <Button 
                  variant="ghost" 
                  onClick={() => setOperation(null)}
                >
                  Back
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvData">CSV Data</Label>
                <Textarea
                  id="csvData"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here..."
                  rows={8}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCsvData(getSampleData())}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Load Sample Data
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getInstructions()}
                </AlertDescription>
              </Alert>

              {result && (
                <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.message}
                      </p>
                      {result.results && result.results.length > 0 && (
                        <p className="text-sm text-green-700 mt-1">
                          Successfully processed {result.results.length} items
                        </p>
                      )}
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-700">
                            {result.errors.length} errors occurred:
                          </p>
                          <ul className="text-xs text-red-600 mt-1 list-disc list-inside space-y-1">
                            {result.errors.slice(0, 3).map((error, index) => (
                              <li key={index}>
                                {error.item?.punch_card_id || error.item?.customer_id || error.id || 'Item'}: {error.error}
                              </li>
                            ))}
                            {result.errors.length > 3 && (
                              <li>...and {result.errors.length - 3} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOperation(null);
                    setResult(null);
                    setCsvData('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || !csvData.trim()}
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    'Process'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}