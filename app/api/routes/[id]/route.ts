import { NextRequest, NextResponse } from "next/server";
import RouteService from "@/services/routeService";
import {supabase} from "@/utils/supabase/client";

interface RouteParams {
  id: string;
}

export async function GET(request: NextRequest, { params } : any) {
  try {
    params = (await params as Promise<RouteParams>);
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        error: "Route ID is required"
      }, { status: 400 });
    }

    // Extract JWT from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({
        error: "Authorization header is required"
      }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({
        error: "Token is required"
      }, { status: 401 });
    }

    // Validate the token and get the user ID
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData) {
      return NextResponse.json({
        error: "Invalid token"
      }, { status: 401 });
    }
    if (!userData.user) {
      return NextResponse.json({
        error: "User not found"
      }, { status: 401 });
    }

    const userId = userData.user.id;

    const routeService = RouteService.getInstance();
    const route = await routeService.getRouteById(id, userId);

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

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    params = (await params as Promise<RouteParams>);
    const { id } = params;

    if (!id) {
      return NextResponse.json({
        error: "Route ID is required"
      }, { status: 400 });
    }

    // Extract JWT from request headers
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({
        error: "Authorization header is required"
      }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({
        error: "Token is required"
      }, { status: 401 });
    }

    // Validate the token and get the user ID
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData) {
      return NextResponse.json({
        error: "Invalid token"
      }, { status: 401 });
    }
    if (!userData.user) {
      return NextResponse.json({
        error: "User not found"
      }, { status: 401 });
    }

    const userId = userData.user.id;

    const routeService = RouteService.getInstance();
    const success = await routeService.deleteRoute(id, userId);

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
