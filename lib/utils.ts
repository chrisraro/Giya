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
    // If it's already an embed URL, return as is
    if (url.includes('/maps/embed')) {
      return url;
    }
    
    // Handle different Google Maps URL formats
    if (url.includes('google.com/maps/place/')) {
      // Extract place ID or coordinates
      const placeMatch = url.match(/\/place\/([^\/]+)/);
      if (placeMatch && placeMatch[1]) {
        const placeId = placeMatch[1];
        return `https://www.google.com/maps/embed?pb=!1m18!1s${placeId}!5m1!1s`;
      }
    }
    
    if (url.includes('google.com/maps/search/')) {
      // Extract search query
      const searchMatch = url.match(/\/search\/([^\/]+)/);
      if (searchMatch && searchMatch[1]) {
        const searchQuery = searchMatch[1];
        return `https://www.google.com/maps/embed/v1/search?key=YOUR_API_KEY&q=${encodeURIComponent(searchQuery)}`;
      }
    }
    
    // Fallback: try to convert standard maps URL to embed
    if (url.includes('/maps/')) {
      return url.replace('/maps/', '/maps/embed/');
    }
    
    // Return original URL if we can't convert it
    return url;
  } catch (error) {
    console.error('Error converting Google Maps URL:', error);
    // Return original URL if conversion fails
    return url;
  }
}