/**
 * Interface for geographical coordinates
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Interface for waypoints
 */
export interface Waypoint {
  id: string;
  latlng: LatLng;
  address: string;
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
   * Call Nominatim API directly to get coordinates from address
   * This method is called by the API endpoint
   */
  static async callNominatimForwardGeocode(address: string): Promise<any> {
    // Encode the address properly for URL
    const encodedAddress = encodeURIComponent(address);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
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
   * Reverse geocode a lat/lng position to an address
   * Using OpenStreetMap's Nominatim service
   */
  static async reverseGeocode(latlng: LatLng): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (your@email.com)', // Recommended by Nominatim
          },
        }
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
   * Forward geocode an address to lat/lng coordinates
   * Using OpenStreetMap's Nominatim service
   */
  static async forwardGeocode(address: string): Promise<LatLng | null> {
    try {
      // Encode the address properly for URL
      const encodedAddress = encodeURIComponent(address);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0 (your@email.com)', // Recommended by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate the distance between two points in kilometers
   * Using the Haversine formula
   */
  static calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate the total distance of a route with multiple waypoints
   */
  static calculateRouteDistance(waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const point1 = waypoints[i].latlng;
      const point2 = waypoints[i + 1].latlng;
      totalDistance += this.calculateDistance(point1, point2);
    }

    return totalDistance;
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
