import { NextRequest, NextResponse } from "next/server";
import RouteService, { WaypointDTO, OpenAIResponseDTO } from "@/services/routeService";

interface SaveRouteWithInfoRequest {
  waypoints: WaypointDTO[];
  locationInfo: OpenAIResponseDTO;
  name?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SaveRouteWithInfoRequest;
    const { waypoints, locationInfo, name, userId } = body;

    // Basic validation
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json({
        error: "At least 2 valid waypoints are required"
      }, { status: 400 });
    }

    // Validate location info
    if (!locationInfo || !locationInfo.results || !Array.isArray(locationInfo.results)) {
      return NextResponse.json({
        error: "Valid location information is required"
      }, { status: 400 });
    }

    // Validate user ID
    if (!userId) {
      return NextResponse.json({
        error: "User ID is required"
      }, { status: 400 });
    }

    // Validate each waypoint has necessary properties
    for (const waypoint of waypoints) {
      if (!waypoint.id || !waypoint.address ||
        !waypoint.latlng || typeof waypoint.latlng.lat !== 'number' ||
        typeof waypoint.latlng.lng !== 'number') {
        return NextResponse.json({
          error: "Invalid waypoint data"
        }, { status: 400 });
      }
    }

    // Call the route service to save the route with location info
    const routeService = RouteService.getInstance();
    const savedRoute = await routeService.saveRouteWithInfo(waypoints, locationInfo, name, userId);

    return NextResponse.json({
      message: "Route with location information saved successfully",
      route: savedRoute
    }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      error: "An error occurred while saving the route"
    }, { status: 500 });
  }
}