"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GoogleMapProps {
  url: string
  address?: string
  apiKey?: string
}

export function GoogleMap({ url, address, apiKey }: GoogleMapProps) {
  const [isValidUrl, setIsValidUrl] = useState(false)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const isComponentMounted = useRef(true)

  useEffect(() => {
    isComponentMounted.current = true;

    // Check if URL is valid and create embed URL
    try {
      if (url) {
        // Check if it's a valid Google Maps URL
        const valid = url.includes('google.com/maps') || url.includes('maps.app.goo.gl');
        if (isComponentMounted.current) {
          setIsValidUrl(valid)
        }

        if (valid) {
          // Check if URL is embeddable using the utility function
          const isEmbeddable = url.includes('google.com/maps/place/') ||
                               url.includes('google.com/maps/search/') ||
                               url.includes('google.com/maps/dir/') ||
                               url.includes('/maps/@');

          if (isEmbeddable) {
            // Use the utility function but without importing in useEffect
            // Instead, recreate the logic inline for the most common cases
            let embedUrl = null;
            try {
              const googleMapsApiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

              if (url.includes('google.com/maps/place/')) {
                // Extract coordinates or place identifier from URL
                const match = url.match(/\/maps\/place\/([^\/]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (match) {
                  const [, placeId, lat, lng] = match;
                  embedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${lat},${lng}`;
                } else {
                  // If no coordinates found, try to use the place name
                  const placeNameMatch = url.match(/\/maps\/place\/([^\/]+)/);
                  if (placeNameMatch) {
                    const placeName = placeNameMatch[1].replace(/%20/g, ' ').replace(/\+/g, ' ');
                    embedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(placeName)}`;
                  }
                }
              } else if (url.includes('google.com/maps/search/')) {
                const queryParams = new URLSearchParams(new URL(url).search);
                const searchQuery = queryParams.get('q');
                if (searchQuery) {
                  embedUrl = `https://www.google.com/maps/embed/v1/search?key=${googleMapsApiKey}&q=${encodeURIComponent(searchQuery)}`;
                }
              } else if (url.includes('google.com/maps/dir/')) {
                // Directions URL - difficult to embed, so skip
                embedUrl = null;
              } else if (url.includes('/maps/@')) {
                // Extract coordinates from URL like /@lat,lng,zoom
                const coordMatch = url.match(/\/@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)z/);
                if (coordMatch) {
                  const [, lat, lng] = coordMatch;
                  embedUrl = `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${lat},${lng}&zoom=15`;
                }
              }

              if (embedUrl && isComponentMounted.current) {
                setEmbedUrl(embedUrl);
              }
            } catch (err) {
              console.error("Error creating embed URL:", err);
              if (isComponentMounted.current) {
                setEmbedUrl(null);
              }
            }
          } else {
            // If not embeddable, set to null so we use the fallback
            if (isComponentMounted.current) {
              setEmbedUrl(null);
            }
          }
        }
      } else {
        if (isComponentMounted.current) {
          setIsValidUrl(false);
          setEmbedUrl(null);
        }
      }
    } catch (error) {
      console.error("Error processing Google Maps URL:", error);
      if (isComponentMounted.current) {
        setIsValidUrl(false);
        setEmbedUrl(null);
      }
    }

    // Cleanup function
    return () => {
      isComponentMounted.current = false;
    }
  }, [url, address])

  // If URL is not valid, show fallback
  if (!isValidUrl || !url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            {address ? `Location: ${address}` : "Interactive map not available"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {url ? "Invalid Google Maps link" : "No Google Maps link provided"}
          </p>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                Open in Google Maps
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    )
  }

  // If we have an embed URL, show the embedded map
  if (embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg relative">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map of ${address || 'location'}`}
        />
      </div>
    )
  }

  // Fallback with link to open in Google Maps
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
      <div className="text-center p-4">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground mb-4">
          {address ? `Location: ${address}` : "Interactive map preview"}
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2">
            <MapPin className="h-4 w-4" />
            Open in Google Maps
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>
    </div>
  )
}