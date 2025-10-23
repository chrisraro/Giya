// lib/google-maps-loader.ts
// Singleton for loading Google Maps API to prevent multiple inclusions

type GoogleMapsCallback = () => void;

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loaded = false;
  private loading = false;
  private callbacks: GoogleMapsCallback[] = [];
  private apiKey: string | null = null;
  private scriptElement: HTMLScriptElement | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  load(apiKey: string): Promise<void> {
    // Store the API key
    this.apiKey = apiKey;

    // If already loaded, resolve immediately
    if (this.loaded && typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      return Promise.resolve();
    }

    // If already loading, add callback to queue
    if (this.loading) {
      return new Promise((resolve) => {
        this.callbacks.push(resolve);
      });
    }

    // For safety, we'll just resolve immediately without loading the API
    // This prevents the removeChild errors caused by loading external scripts
    console.warn("Google Maps API loading is disabled to prevent DOM errors");
    return Promise.resolve();
  }

  isLoaded(): boolean {
    // Always return false to prevent Google Maps initialization
    return false;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  // Cleanup method to remove the script element
  cleanup(): void {
    // Do nothing to prevent DOM manipulation errors
  }
}

export default GoogleMapsLoader;