/**
 * Interface for geographical coordinates
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Interface for route summary information
 */
export interface RouteSummary {
  totalDistance: number;
  totalTime: number;
  loading: boolean;
}

/**
 * Service for handling geocoding and map-related operations
 */
export class GeocodingService {
  /**
   * Call Nominatim API directly to get address from coordinates
   * This method is called by the API endpoint
   */
  static async callNominatimReverseGeocode(lat: number, lng: number): Promise<any> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YourAppName/1.0 (your@email.com)', // Change this to your app info
          'Accept-Language': 'en', // You can customize the language
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Client-side method to reverse geocode via our API endpoint
   */
  static async reverseGeocode(latlng: LatLng): Promise<string> {
    try {
      const response = await fetch(
        `/api/geocoding/reverse?lat=${latlng.lat}&lng=${latlng.lng}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    }
  }

  /**
   * Format route time from minutes to a human-readable string
   */
  static formatRouteTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  }
}

export default GeocodingService;
