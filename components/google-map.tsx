"use client"

import { useEffect, useState } from "react"
import { MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GoogleMapProps {
  url: string
  address?: string
}

export function GoogleMap({ url, address }: GoogleMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)

  // Convert Google Maps URL to embed format
  const getEmbedUrl = () => {
    try {
      // Get API key from environment variables
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      
      // If it's already an embed URL, return as is
      if (url.includes('/maps/embed')) {
        // Add API key if missing
        if (!url.includes('key=') && apiKey) {
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}key=${apiKey}`;
        }
        return url;
      }
      
      // Handle place URLs
      if (url.includes('google.com/maps/place/')) {
        const placeMatch = url.match(/\/place\/([^\/]+)\/?(@[0-9.,]+z)?/)
        if (placeMatch && placeMatch[1]) {
          const placeIdentifier = placeMatch[1]
          // Try to extract coordinates if available
          const coordsMatch = url.match(/@([0-9.-]+),([0-9.-]+),([0-9]+z)/)
          if (coordsMatch) {
            const lat = coordsMatch[1]
            const lng = coordsMatch[2]
            return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`
          }
          // Fallback to place name search
          return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeIdentifier)}`
        }
      }
      
      // Handle search URLs
      if (url.includes('google.com/maps/search/')) {
        const searchMatch = url.match(/\/search\/([^\/\?]+)/)
        if (searchMatch && searchMatch[1]) {
          const searchQuery = searchMatch[1]
          return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}`
        }
      }
      
      // Handle direction URLs
      if (url.includes('google.com/maps/dir/')) {
        const dirMatch = url.match(/\/dir\/([^\/]+)\/([^\/\?]+)/)
        if (dirMatch && dirMatch[1] && dirMatch[2]) {
          const origin = dirMatch[1]
          const destination = dirMatch[2]
          return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
        }
      }
      
      // Fallback: try to extract coordinates from standard URL
      if (url.includes('/maps/')) {
        const coordsMatch = url.match(/@([0-9.-]+),([0-9.-]+),([0-9]+z)/)
        if (coordsMatch) {
          const lat = coordsMatch[1]
          const lng = coordsMatch[2]
          return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=15`
        }
      }
      
      // Return original URL if we can't convert it
      return url
    } catch (error) {
      console.error('Error converting Google Maps URL:', error)
      return url
    }
  }

  const handleMapLoad = () => {
    setMapLoaded(true)
  }

  const handleMapError = () => {
    setMapError(true)
    setMapLoaded(true)
  }

  // If we have an API key, we should be able to embed (assuming proper restrictions)
  const canEmbed = () => {
    return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  }

  if (mapError || !canEmbed()) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            {address ? `Location: ${address}` : "Interactive map not available"}
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

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted relative">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      )}
      <iframe
        src={getEmbedUrl()}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={handleMapLoad}
        onError={handleMapError}
        className={`w-full h-full ${mapLoaded ? '' : 'invisible'}`}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      )}
    </div>
  )
}