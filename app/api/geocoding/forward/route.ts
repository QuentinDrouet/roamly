import { NextRequest, NextResponse } from "next/server";
import GeocodingService from "@/services/geocodingService";

/**
 * API route for forward geocoding (converting address to coordinates)
 * Endpoint: /api/geocoding/forward
 * Method: GET
 * Query parameters:
 *   - address: The address to geocode
 */
export async function GET(request: NextRequest) {
  try {
    // Get the address from query parameters
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    // Validate input
    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 });
    }

    // Call Nominatim service through our geocoding service
    const result = await GeocodingService.callNominatimForwardGeocode(address);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Forward geocoding API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
