// services/routeService.ts

/**
 * Route interface with simple types that can be serialized
 */
export interface Route {
  id: string;
  name: string;
  waypoints: WaypointDTO[];
  createdAt: string;
}

/**
 * Data Transfer Object for waypoints with simple types that can be serialized
 */
export interface WaypointDTO {
  id: string;
  latlng: {
    lat: number;
    lng: number;
  };
  address: string;
}

/**
 * Service for handling route operations with the backend
 */
class RouteService {
  private static instance: RouteService;
  private routes: Route[] = []; // In-memory storage (replace with DB in production)

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get singleton instance of RouteService
   */
  public static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }

  /**
   * Save a new route
   */
  public async saveRoute(waypoints: WaypointDTO[], name?: string): Promise<Route> {
    if (waypoints.length < 2) {
      throw new Error("A route must have at least 2 waypoints");
    }

    // Create a new route
    const route: Route = {
      id: this.generateId(),
      name: name || `Route ${this.routes.length + 1}`,
      waypoints,
      createdAt: new Date().toISOString()
    };

    // In a real application, you would save to a database here
    this.routes.push(route);

    return route;
  }

  /**
   * Get all saved routes
   */
  public async getRoutes(): Promise<Route[]> {
    // In a real application, you would fetch from a database
    return this.routes;
  }

  /**
   * Get a specific route by ID
   */
  public async getRouteById(id: string): Promise<Route | undefined> {
    // In a real application, you would fetch from a database
    return this.routes.find(route => route.id === id);
  }

  /**
   * Delete a route by ID
   */
  public async deleteRoute(id: string): Promise<boolean> {
    // In a real application, you would delete from a database
    const initialLength = this.routes.length;
    this.routes = this.routes.filter(route => route.id !== id);
    return this.routes.length < initialLength;
  }

  /**
   * Generate a unique ID for a route
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 9);
  }
}

export default RouteService;
