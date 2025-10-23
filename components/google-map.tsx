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
  const isComponentMounted = useRef(true)

  useEffect(() => {
    isComponentMounted.current = true;
    
    // Check if URL is valid
    try {
      const valid = url && (url.includes('google.com/maps') || url.includes('maps.app.goo.gl'));
      if (isComponentMounted.current) {
        setIsValidUrl(!!valid)
      }
    } catch (error) {
      if (isComponentMounted.current) {
        setIsValidUrl(false)
      }
    }
    
    // Cleanup function
    return () => {
      isComponentMounted.current = false;
    }
  }, [url])

  // If URL is not valid, show fallback
  if (!isValidUrl) {
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

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Map preview available
          </p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2 mt-2">
              <MapPin className="h-4 w-4" />
              Open in Google Maps
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
