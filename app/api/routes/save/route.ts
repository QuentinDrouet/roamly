// app/api/routes/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import RouteService, { WaypointDTO } from "@/services/routeService";

interface SaveRouteRequest {
  waypoints: WaypointDTO[];
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SaveRouteRequest;
    const { waypoints, name } = body;

    // Basic validation
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json({
        error: "At least 2 valid waypoints are required"
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

    // Call the route service to save the route
    const routeService = RouteService.getInstance();
    const savedRoute = await routeService.saveRoute(waypoints, name);

    return NextResponse.json({
      message: "Route saved successfully",
      route: savedRoute
    }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      error: "An error occurred while saving the route"
    }, { status: 500 });
  }
}
