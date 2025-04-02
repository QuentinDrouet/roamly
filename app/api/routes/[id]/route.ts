import { NextRequest, NextResponse } from "next/server";
import RouteService from "@/services/routeService";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        error: "Route ID is required"
      }, { status: 400 });
    }

    const routeService = RouteService.getInstance();
    const route = await routeService.getRouteById(id);

    if (!route) {
      return NextResponse.json({
        error: "Route not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      route
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      error: "An error occurred while fetching the route"
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        error: "Route ID is required"
      }, { status: 400 });
    }

    const routeService = RouteService.getInstance();
    const success = await routeService.deleteRoute(id);

    if (!success) {
      return NextResponse.json({
        error: "Route not found or could not be deleted"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Route deleted successfully"
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      error: "An error occurred while deleting the route"
    }, { status: 500 });
  }
}
