import { NextRequest, NextResponse } from "next/server";
import RouteService from "@/services/routeService";
import {supabase} from "@/utils/supabase/client";

export async function GET(request: NextRequest) {
  try {
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
    const routes = await routeService.getRoutes(userId);

    return NextResponse.json({
      routes
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({
      error: "An error occurred while fetching routes"
    }, { status: 500 });
  }
}
