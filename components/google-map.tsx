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
  const [isShortUrl, setIsShortUrl] = useState(false)

  // Convert Google Maps URL to embed format
  const getEmbedUrl = () => {
    try {
      console.log("Processing Google Maps URL:", { url, apiKey })
      
      // Check if it's a Google Maps short URL
      const isShort = url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps');
      setIsShortUrl(isShort);
      
      // If we don't have an API key, return the original URL
      if (!apiKey || apiKey.length < 10) {
        console.log("No valid API key provided for Google Maps")
        // For place URLs, we can still try to create an embed URL without API key
        if (url.includes('google.com/maps/place/')) {
          // Try to extract coordinates if available
          const coordsMatch = url.match(/@([0-9.-]+),([0-9.-]+),([0-9]+z)/)
          if (coordsMatch) {
            const lat = coordsMatch[1]
            const lng = coordsMatch[2]
            // Return a basic iframe URL without API key
            return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d${coordsMatch[3]}!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat}!5e0!3m2!1sen!2s!4v${Date.now()}!5m2!1sen!2s`
          }
        }
        return url
      }
      
      // Handle Google Maps short URLs (goo.gl) - these can't be embedded directly
      if (isShort) {
        console.log("Google Maps short URL detected - cannot embed directly. Showing fallback.")
        return null
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
      
      // Return null for URLs we can't convert, which will trigger fallback
      console.log("Could not convert URL, triggering fallback:", url)
      return null
    } catch (error) {
      console.error('Error converting Google Maps URL:', error)
      return null
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

  // If it's a short URL, show fallback
  if (isShortUrl) {
    console.log("Showing fallback UI for short URL", { isShortUrl })
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            {address ? `Location: ${address}` : "Interactive map not available"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Google Maps short links cannot be embedded directly.
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

  // If we can't process the URL, show fallback
  if (processedUrl === null) {
    console.log("Showing fallback UI for unprocessable URL", { processedUrl })
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-4">
            {address ? `Location: ${address}` : "Interactive map not available"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Map cannot be displayed in this context.
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