import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, Camera, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from '@/lib/supabase/client';
import { Html5QrScanner } from "@/components/html5-qr-scanner";

interface TableQRScannerProps {
  onTableScan: (tableQrCode: string, businessId: string) => void;
  onClose: () => void;
}

export function TableQRScanner({ onTableScan, onClose }: TableQRScannerProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [scannedTable, setScannedTable] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const supabase = createClient();

  const handleScanSuccess = async (qrData: string) => {
    setIsScanning(false);
    setScannedTable(qrData);
    setValidationError(null);
    
    // Validate that this QR code belongs to a business
    setIsValidating(true);
    
    try {
      // Parse the QR code to extract business ID and table ID
      // Expected format: "giya://table/{business_id}/{table_id}"
      const qrParts = qrData.split('/');
      if (qrParts.length < 5 || qrParts[2] !== 'table') {
        throw new Error('Invalid QR code format');
      }
      
      const businessIdFromQr = qrParts[3];
      
      // Validate that this business exists and is active
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id, business_name, is_active')
        .eq('id', businessIdFromQr)
        .single();
        
      if (businessError) {
        throw new Error('Business not found');
      }
      
      if (!business.is_active) {
        throw new Error('Business is not currently active');
      }
      
      setBusinessId(businessIdFromQr);
      toast.success(`Verified table at ${business.business_name}`);
    } catch (error) {
      console.error('Error validating table QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Invalid table QR code';
      setValidationError(errorMessage);
      toast.error(errorMessage);
      setIsScanning(true);
      setScannedTable(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmScan = () => {
    if (scannedTable && businessId) {
      onTableScan(scannedTable, businessId);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan Table QR Code
          </CardTitle>
          <CardDescription>Point your camera at the QR code on your table</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Position the QR code within the frame to scan automatically
              </p>
            </div>
            <Html5QrScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={handleCancel} 
            />
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel
            </Button>
          </div>
        ) : scannedTable ? (
          <div className="space-y-4">
            {validationError ? (
              <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-red-50">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-red-600">Validation Failed</p>
                  <p className="text-sm text-red-500 mt-1">
                    {validationError}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-4 rounded-lg border bg-green-50">
                <div className="p-3 rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Table Scanned Successfully</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Table ID: {scannedTable.substring(0, 8)}...
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsScanning(true)} className="flex-1">
                Rescan
              </Button>
              {!validationError && (
                <Button 
                  onClick={handleConfirmScan} 
                  disabled={isValidating}
                  className="flex-1"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}