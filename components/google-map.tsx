"use client"

import { useState, useEffect } from "react"
import { MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GoogleMapProps {
  url: string
  address?: string
  apiKey?: string
}

export function GoogleMap({ url, address, apiKey }: GoogleMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)

  // Convert Google Maps URL to embed format
  const getEmbedUrl = () => {
    try {
      console.log("Processing Google Maps URL:", { url, apiKey })
      
      // If we don't have an API key, return the original URL
      if (!apiKey || apiKey.length < 10) {
        console.log("No valid API key provided for Google Maps")
        return url
      }
      
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
            const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`
            console.log("Generated embed URL with coordinates:", embedUrl)
            return embedUrl
          }
          // Fallback to place name search
          const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeIdentifier)}`
          console.log("Generated embed URL with place name:", embedUrl)
          return embedUrl
        }
      }
      
      // Handle search URLs
      if (url.includes('google.com/maps/search/')) {
        const searchMatch = url.match(/\/search\/([^\/\?]+)/)
        if (searchMatch && searchMatch[1]) {
          const searchQuery = searchMatch[1]
          const embedUrl = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}`
          console.log("Generated embed URL for search:", embedUrl)
          return embedUrl
        }
      }
      
      // Handle direction URLs
      if (url.includes('google.com/maps/dir/')) {
        const dirMatch = url.match(/\/dir\/([^\/]+)\/([^\/\?]+)/)
        if (dirMatch && dirMatch[1] && dirMatch[2]) {
          const origin = dirMatch[1]
          const destination = dirMatch[2]
          const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
          console.log("Generated embed URL for directions:", embedUrl)
          return embedUrl
        }
      }
      
      // Fallback: try to extract coordinates from standard URL
      if (url.includes('/maps/')) {
        const coordsMatch = url.match(/@([0-9.-]+),([0-9.-]+),([0-9]+z)/)
        if (coordsMatch) {
          const lat = coordsMatch[1]
          const lng = coordsMatch[2]
          const embedUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=15`
          console.log("Generated embed URL with view:", embedUrl)
          return embedUrl
        }
      }
      
      // Return original URL if we can't convert it
      console.log("Could not convert URL, returning original:", url)
      return url
    } catch (error) {
      console.error('Error converting Google Maps URL:', error)
      return url
    }
  }

  useEffect(() => {
    // Process the URL when component mounts or props change
    const processed = getEmbedUrl()
    setProcessedUrl(processed)
    console.log("Processed URL for iframe:", processed)
  }, [url, apiKey])

  const handleMapLoad = () => {
    console.log("Google Maps loaded successfully")
    setMapLoaded(true)
    setMapError(false)
  }

  const handleMapError = (e: any) => {
    console.error("Google Maps failed to load:", e)
    setMapError(true)
    setMapLoaded(true)
  }

  // If we don't have an API key, show fallback
  if (!apiKey || apiKey.length < 10) {
    console.log("No valid API key, showing fallback UI")
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            {address ? `Location: ${address}` : "Interactive map not available"}
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

  // If we couldn't process the URL, show fallback
  if (!processedUrl) {
    console.log("No processed URL, showing fallback UI")
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            {address ? `Location: ${address}` : "Interactive map not available"}
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

  console.log("Rendering iframe with URL:", processedUrl)

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted relative">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading map...</div>
        </div>
      )}
      <iframe
        src={processedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={handleMapLoad}
        onError={handleMapError}
        className={`w-full h-full ${mapLoaded ? '' : 'invisible'}`}
        title="Google Maps"
      />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center p-4">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">
              Unable to load map. {address ? `Location: ${address}` : ""}
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
      )}
    </div>
  )
}