// lib/google-maps-cleanup.ts
// Utility functions for safely cleaning up Google Maps instances

/**
 * Safely cleans up Google Maps instances and event listeners
 * @param mapInstance The Google Maps instance
 * @param markerInstance The Google Maps marker instance
 * @param listeners Array of event listeners to remove
 */
export function cleanupGoogleMapsInstances(
  mapInstance: any,
  markerInstance: any,
  listeners: any[] = []
): void {
  try {
    // Remove all event listeners
    listeners.forEach(listener => {
      if (listener && typeof window !== 'undefined' && window.google?.maps?.event?.removeListener) {
        try {
          window.google.maps.event.removeListener(listener);
        } catch (error) {
          console.warn("Error removing Google Maps listener:", error);
        }
      }
    });

    // Clean up marker
    if (markerInstance) {
      try {
        markerInstance.setMap(null);
      } catch (error) {
        console.warn("Error cleaning up Google Maps marker:", error);
      }
    }

    // Clean up map instance
    if (mapInstance) {
      try {
        // Clear all event listeners on the map
        if (window.google?.maps?.event?.clearInstanceListeners) {
          window.google.maps.event.clearInstanceListeners(mapInstance);
        }
      } catch (error) {
        console.warn("Error clearing Google Maps instance listeners:", error);
      }
    }
  } catch (error) {
    console.warn("Error during Google Maps cleanup:", error);
  }
}

/**
 * Safely removes a DOM element and all its children
 * @param element The element to remove
 */
export function safeRemoveElement(element: HTMLElement | null): void {
  if (!element || !element.parentNode) {
    return;
  }
  
  try {
    // Remove all child elements first
    while (element.firstChild) {
      try {
        element.removeChild(element.firstChild);
      } catch (error) {
        console.warn("Error removing child element:", error);
      }
    }
    
    // Then remove the element itself
    element.parentNode.removeChild(element);
  } catch (error) {
    console.warn("Error removing element:", error);
  }
}

/**
 * Cleans up any orphaned Google Maps instances
 */
export function cleanupOrphanedMaps(): void {
  if (typeof window === 'undefined' || !window.google?.maps) {
    return;
  }
  
  try {
    // This is a placeholder for more complex cleanup logic
    // In practice, you might need to track map instances globally
    console.log("🧹 Checking for orphaned Google Maps instances...");
  } catch (error) {
    console.warn("Error during orphaned maps cleanup:", error);
  }
}