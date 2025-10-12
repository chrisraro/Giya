"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { put } from '@vercel/blob';

export default function BlobTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  
  const testBlobUpload = async () => {
    setIsTesting(true);
    try {
      // Create a simple test file
      const testFile = new File(["Hello, Vercel Blob!"], "test.txt", {
        type: "text/plain",
      });
      
      // Try to upload to Vercel Blob
      const blob = await put('test/test.txt', testFile, {
        access: 'public',
      });
      
      toast.success('Vercel Blob is working correctly!', {
        description: `File uploaded to: ${blob.url}`
      });
    } catch (error) {
      console.error('Vercel Blob test failed:', error);
      toast.error('Vercel Blob test failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Vercel Blob Test</CardTitle>
          <CardDescription>Test if Vercel Blob is properly configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Click the button below to test Vercel Blob functionality:</p>
          <Button 
            onClick={testBlobUpload} 
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Vercel Blob'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}