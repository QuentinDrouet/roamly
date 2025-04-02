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
 * Interface for a route
 */
export interface Route {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: Date | string;
}
