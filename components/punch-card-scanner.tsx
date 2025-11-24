"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Html5QrScanner } from "@/components/html5-qr-scanner";
import { useAuth } from "@/hooks/use-auth";

interface PunchCardScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPunchAdded?: () => void;
}

export function PunchCardScanner({ isOpen, onClose, onPunchAdded }: PunchCardScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleScanSuccess = async (data: string) => {
    if (!user) {
      toast.error("You must be logged in to scan punch cards");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Parse the QR code data - expecting format: punch_card:{punchCardId}
      const parts = data.split(':');
      if (parts.length !== 2 || parts[0] !== 'punch_card') {
        throw new Error('Invalid QR code format');
      }
      
      const punchCardId = parts[1];
      
      // Add a punch to the punch card
      const response = await fetch('/api/punch-cards/punches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          punch_card_id: punchCardId,
          customer_id: user.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add punch');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Punch added successfully!');
      
      // Close the scanner and notify parent
      onClose();
      if (onPunchAdded) {
        onPunchAdded();
      }
    } catch (error) {
      console.error('Error processing punch:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to process punch card scan'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan Punch Card
          </DialogTitle>
          <DialogDescription>
            Point your camera at the business's punch card QR code to add a punch
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Html5QrScanner 
            onScanSuccess={handleScanSuccess} 
            onClose={onClose} 
          />
        </div>
        
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Processing punch...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}