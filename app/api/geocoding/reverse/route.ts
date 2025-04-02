import { NextRequest, NextResponse } from "next/server";
import GeocodingService from "@/services/geocodingService";

export async function GET(request: NextRequest) {
  try {
    // Get lat/lng from URL parameters
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Validate parameters
    if (!lat || !lng) {
      return NextResponse.json({
        error: "Latitude and longitude are required"
      }, { status: 400 });
    }

    // Check if they're valid numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json({
        error: "Invalid latitude or longitude values"
      }, { status: 400 });
    }

    try {
      // Use the service to make the geocoding request
      const data = await GeocodingService.callNominatimReverseGeocode(latNum, lngNum);

      // Return the data to the client
      return NextResponse.json(data);
    } catch (geocodingError) {
      console.error("Nominatim API error:", geocodingError);
      return NextResponse.json({
        error: "Error from geocoding service",
        message: geocodingError instanceof Error ? geocodingError.message : 'Unknown error'
      }, { status: 502 }); // 502 Bad Gateway indicates a server-to-server error
    }
  } catch (error) {
    console.error("Geocoding API error:", error);

    return NextResponse.json({
      error: "Failed to get address information",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
