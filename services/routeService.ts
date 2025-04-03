import { supabase } from "@/utils/supabase/client";

export interface WaypointDTO {
  id: string;
  latlng: {
    lat: number;
    lng: number;
  };
  address: string;
}

export interface PlaceToVisitDTO {
  name: string;
  address: string;
  context: string;
  paid: string;
  latlng?: {
    lat: number;
    lng: number;
  };
}

export interface LocationInfoDTO {
  address: string;
  introduction: string;
  creationDate: string;
  placesToVisit: PlaceToVisitDTO[];
}

export interface OpenAIResponseDTO {
  results: LocationInfoDTO[];
}

export interface Route {
  id?: string;
  name: string;
  waypoints: WaypointDTO[];
  locationInfo?: OpenAIResponseDTO;
  created_at?: string;
  user_id?: string;
}

class RouteService {
  private supabase;
  private static instance: RouteService;
  constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }


  public async saveRouteWithInfo(
    waypoints: WaypointDTO[],
    locationInfo: OpenAIResponseDTO,
    name?: string,
    userId?: string
  ): Promise<Route> {
    if (waypoints.length < 2) {
      throw new Error("A route must have at least 2 waypoints");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }

    const route: Route = {
      name: name || `Route ${new Date().toISOString()}`,
      waypoints,
      locationInfo,
      user_id: userId,
    };

    const { data, error } = await this.supabase
      .from('routes')
      .insert(route)
      .select()
      .single();

    if (error) {
      console.error("Error saving route with info to Supabase:", error);
      throw error;
    }

    return data;
  }


  public async getRoutes(userId:string): Promise<Route[]> {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Fetch routes from Supabase
    const { data, error } = await this.supabase
      .from('routes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error getting routes from Supabase:", error);
      throw error;
    }

    return data || [];
  }

  public async getRouteById(id: string, userId: string): Promise<Route | null> {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Fetch the route by ID from Supabase
    const { data, error } = await this.supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Error getting route from Supabase:", error);
      throw error;
    }

    return data;
  }

  public async deleteRoute(id: string, userId: string): Promise<boolean> {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Delete the route from Supabase
    const { error } = await this.supabase
      .from('routes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error("Error deleting route from Supabase:", error);
      throw error;
    }

    return true;
  }
}

export default RouteService;
