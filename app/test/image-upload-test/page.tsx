"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProfileImageUpload } from "@/components/profile-image-upload"
import { OfferImageUpload } from "@/components/offer-image-upload"
import { MediaGallery } from "@/components/media-gallery"

export default function ImageUploadTestPage() {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [offerImageUrl, setOfferImageUrl] = useState<string | null>(null)
  const [galleryImageUrl, setGalleryImageUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("test-user-id")
  const supabase = createClient()

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Image Upload Test</CardTitle>
          <CardDescription>Test different image upload components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Profile Image Upload (Vercel Blob)</h3>
            <ProfileImageUpload
              currentImageUrl={profileImageUrl}
              userId={userId}
              userType="business"
              onImageUpdate={setProfileImageUrl}
              size="md"
            />
            {profileImageUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Uploaded Profile Image URL:</p>
                <p className="text-xs font-mono break-all">{profileImageUrl}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Offer Image Upload (Supabase Storage)</h3>
            <OfferImageUpload
              currentImageUrl={offerImageUrl}
              businessId={userId}
              offerId="test-offer-id"
              offerType="reward"
              onImageUpdate={setOfferImageUrl}
            />
            {offerImageUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Uploaded Offer Image URL:</p>
                <p className="text-xs font-mono break-all">{offerImageUrl}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Media Gallery (Vercel Blob)</h3>
            <MediaGallery
              userId={userId}
              userType="business"
              currentImageUrl={galleryImageUrl}
              onImageSelect={setGalleryImageUrl}
            />
            {galleryImageUrl && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Selected Gallery Image URL:</p>
                <p className="text-xs font-mono break-all">{galleryImageUrl}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}