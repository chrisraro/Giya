"use client";

import { useState } from "react";
import { MediaGallery } from "@/components/media-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MediaGalleryTestPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Media Gallery Test</CardTitle>
          <CardDescription>Test the media gallery component functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Media Gallery Component</h3>
            <MediaGallery
              userId="test-user-id"
              userType="customer"
              currentImageUrl={selectedImage}
              onImageSelect={setSelectedImage}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Image</h3>
            {selectedImage ? (
              <div className="space-y-2">
                <img 
                  src={selectedImage} 
                  alt="Selected" 
                  className="max-w-xs rounded-lg border"
                />
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedImage(null)}
                >
                  Clear Selection
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No image selected</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}