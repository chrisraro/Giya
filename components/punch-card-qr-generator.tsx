"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface PunchCardQrGeneratorProps {
  punchCardId: string;
  title: string;
  businessName: string;
}

export function PunchCardQrGenerator({ punchCardId, title, businessName }: PunchCardQrGeneratorProps) {
  // Generate QR code data in the format: punch_card:{punchCardId}
  const qrData = `punch_card:${punchCardId}`;
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(qrData);
    toast.success("QR code data copied to clipboard!");
  };
  
  const handleDownload = () => {
    const svg = document.getElementById(`punch-card-qr-${punchCardId}`);
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `punch-card-${punchCardId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("QR code downloaded!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Punch Card QR Code</span>
        </CardTitle>
        <CardDescription>
          Customers can scan this QR code to add punches to their {title} punch card
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-lg">
          <QRCodeSVG 
            id={`punch-card-qr-${punchCardId}`}
            value={qrData} 
            size={200} 
            level="H"
          />
        </div>
        
        <div className="text-center">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{businessName}</p>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button 
            onClick={handleCopyToClipboard} 
            variant="outline" 
            className="flex-1"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Data
          </Button>
          <Button 
            onClick={handleDownload} 
            variant="outline" 
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Display this QR code prominently in your store for customers to scan
        </p>
      </CardContent>
    </Card>
  );
}