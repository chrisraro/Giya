"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function BlobTestPage() {
  const [isTesting, setIsTesting] = useState(false);
  
  const testBlobUpload = async () => {
    setIsTesting(true);
    try {
      // Create a simple test file
      const testFile = new File(["Hello, Vercel Blob!"], "test.txt", {
        type: "text/plain",
      });
      
      // Test our upload API route
      const response = await fetch('/api/blob/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'test/test.txt',
          contentType: 'text/plain',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { url } = await response.json();
      
      // Upload the file content
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: testFile,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }
      
      toast.success('Vercel Blob API routes are working correctly!', {
        description: `File uploaded successfully`
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
          <CardDescription>Test if Vercel Blob API routes are properly configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Click the button below to test Vercel Blob API routes:</p>
          <Button 
            onClick={testBlobUpload} 
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Vercel Blob API Routes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}