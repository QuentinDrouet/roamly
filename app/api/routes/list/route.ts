// app/api/routes/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import RouteService from "@/services/routeService";

export async function GET(request: NextRequest) {
  try {
    const routeService = RouteService.getInstance();
    const routes = await routeService.getRoutes();

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
