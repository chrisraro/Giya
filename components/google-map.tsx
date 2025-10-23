"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GoogleMapProps {
  url: string
  address?: string
  apiKey?: string
}

export function GoogleMap({ url, address }: GoogleMapProps) {
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
          setIsValidUrl(!!valid)
        }
        
        if (valid) {
          // Convert URL to embed format
          let embedUrl = url;
          
          // Handle different Google Maps URL formats
          if (url.includes('maps.app.goo.gl')) {
            // For short URLs, we'll just link to them
            if (isComponentMounted.current) {
              setEmbedUrl(null); // We can't embed short URLs directly
            }
          } else if (url.includes('/place/')) {
            // Extract place ID and create embed URL
            const placeIdMatch = url.match(/\/place\/([^\/\?]+)/);
            if (placeIdMatch && placeIdMatch[1]) {
              embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x${encodeURIComponent(placeIdMatch[1])}!2z${encodeURIComponent(address || '')}!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s`;
            } else {
              // Fallback to basic embed
              embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(address || '')}!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s`;
            }
          } else if (url.includes('/@')) {
            // Extract coordinates from URL like /@lat,lng,zoom
            const coordMatch = url.match(/\/@(-?\d+\.\d+),(-?\d+\.\d+),(\d+)z/);
            if (coordMatch) {
              const [, lat, lng] = coordMatch;
              embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(address || '')}!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s`;
            }
          } else {
            // For other URLs, try to extract query parameters
            const urlObj = new URL(url);
            const qParam = urlObj.searchParams.get('q');
            if (qParam) {
              embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${encodeURIComponent(qParam)}!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s`;
            }
          }
          
          if (isComponentMounted.current) {
            setEmbedUrl(embedUrl);
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