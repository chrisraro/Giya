import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Google Maps URL to an embed URL
 * Handles various Google Maps URL formats
 */
export function convertGoogleMapsUrlToEmbed(url: string): string {
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
      const placeMatch = url.match(/\/place\/([^\/]+)\/?(@[0-9.,]+z)?/);
      if (placeMatch && placeMatch[1]) {
        const placeIdentifier = placeMatch[1];
        // Try to extract coordinates if available
        const coordsMatch = url.match(/@([0-9.-]+),([0-9.-]+),([0-9]+z)/);
        if (coordsMatch) {
          const lat = coordsMatch[1];
          const lng = coordsMatch[2];
          return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;
        }
        // Fallback to place name search
        return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeIdentifier)}`;
      }
    }
    
    // Handle search URLs
    if (url.includes('google.com/maps/search/')) {
      const searchMatch = url.match(/\/search\/([^\/\?]+)/);
      if (searchMatch && searchMatch[1]) {
        const searchQuery = searchMatch[1];
        return `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}`;
      }
    }
    
    // Handle direction URLs
    if (url.includes('google.com/maps/dir/')) {
      const dirMatch = url.match(/\/dir\/([^\/]+)\/([^\/\?]+)/);
      if (dirMatch && dirMatch[1] && dirMatch[2]) {
        const origin = dirMatch[1];
        const destination = dirMatch[2];
        return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
      }
    }
    
    // Fallback: try to extract coordinates from standard URL
    if (url.includes('/maps/')) {
      const coordsMatch = url.match(/@([0-9.-]+),([0-9.-]+),([0-9]+z)/);
      if (coordsMatch) {
        const lat = coordsMatch[1];
        const lng = coordsMatch[2];
        return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=15`;
      }
    }
    
    // Return original URL if we can't convert it
    return url;
  } catch (error) {
    console.error('Error converting Google Maps URL:', error);
    // Return original URL if conversion fails
    return url;
  }
}

/**
 * Checks if a Google Maps URL is likely to work in an iframe
 * Returns true if it's an embed URL or can be converted to one
 */
export function isGoogleMapsEmbeddable(url: string): boolean {
  try {
    // Embed URLs should work
    if (url.includes('/maps/embed')) {
      return true;
    }
    
    // Check if it's a format we can convert
    return url.includes('google.com/maps/place/') || 
           url.includes('google.com/maps/search/') || 
           url.includes('google.com/maps/dir/') || 
           url.includes('/maps/@');
  } catch (error) {
    console.error('Error checking Google Maps URL:', error);
    return false;
  }
}