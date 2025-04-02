'use client';

import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, RotateCcw, Loader2, X, Check } from 'lucide-react';
import GeocodingService from '@/services/geocodingService';

// Define our interface for the waypoints/markers
interface Waypoint {
  id: string;
  latlng: L.LatLng;
  address: string;
}

// Define interface for route summary
interface RouteSummary {
  totalDistance: number;
  totalTime: number;
  loading: boolean;
}

const MapComponent: React.FC = () => {
  // State for our map, markers and routing
  const [map, setMap] = useState<L.Map | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Custom marker icon
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="marker-pin"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });
  };

  // Fix Leaflet icon issues
  useEffect(() => {
    // Custom styles for the markers
    const style = document.createElement('style');
    style.textContent = `
      .custom-map-marker {
        background: transparent;
      }
      .marker-pin {
        width: 20px;
        height: 20px;
        border-radius: 50% 50% 50% 0;
        background: #3b82f6;
        transform: rotate(-45deg);
        border: 2px solid #fff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -15px 0 0 -10px;
      }
      .marker-pin::after {
        content: '';
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        margin: -4px 0 0 -4px;
      }
    `;
    document.head.appendChild(style);

    // Default fix for standard markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Initialize the map
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    console.log("Initializing map...");

    try {
      // Create the map instance with a specific height to ensure visibility
      const mapInstance = L.map(mapContainerRef.current, {
        center: [48.8566, 2.3522], // Paris as default center
        zoom: 13,
        zoomControl: true,
      });

      // Add a more elegant tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance);

      // Set the map in state
      setMap(mapInstance);

      console.log("Map initialized successfully");

      // Cleanup on unmount
      return () => {
        mapInstance.remove();
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  // Handle map click to add waypoints
  useEffect(() => {
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      // Get the clicked location
      const { lat, lng } = e.latlng;
      console.log(`Clicked at [${lat}, ${lng}]`);

      try {
        // Show route loading state if we already have a waypoint
        if (waypoints.length > 0) {
          setRouteSummary(prev => prev ? { ...prev, loading: true } : { totalDistance: 0, totalTime: 0, loading: true });
        }

        // Call the API endpoint directly
        const response = await fetch(`/api/geocoding/reverse?lat=${lat}&lng=${lng}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const address = data.display_name || 'Unknown location';

        // Add the new waypoint
        const newWaypoint: Waypoint = {
          id: Date.now().toString(),
          latlng: e.latlng,
          address,
        };

        setWaypoints(prev => [...prev, newWaypoint]);
        console.log(`Added waypoint: ${address}`);
      } catch (error) {
        console.error('Error fetching address:', error);

        // Add waypoint even if address lookup fails
        const newWaypoint: Waypoint = {
          id: Date.now().toString(),
          latlng: e.latlng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };

        setWaypoints(prev => [...prev, newWaypoint]);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, waypoints.length]);

  // Create markers for waypoints
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add new markers for each waypoint using custom icons
    waypoints.forEach((waypoint, index) => {
      const marker = L.marker(waypoint.latlng, {
        icon: createCustomIcon(),
        title: `Point ${index + 1}`
      })
        ?.addTo(map)
        ?.bindPopup(`<b>Point ${index + 1}</b><br>${waypoint.address}`);
    });

    // Update routing if we have 2 or more waypoints
    if (waypoints.length >= 2) {
      updateRouting();
    } else if (routingControlRef.current) {
      // Remove routing if we have fewer than 2 waypoints
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setRouteSummary(null);
    }
  }, [waypoints, map]);

  // Update the routing between waypoints
  const updateRouting = () => {
    if (!map) return;

    // Set loading state
    setRouteSummary({ totalDistance: 0, totalTime: 0, loading: true });

    // Remove existing routing control if it exists
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Create routing waypoints from our waypoints
    const routeWaypoints = waypoints.map(wp => L.latLng(wp.latlng.lat, wp.latlng.lng));

    // Create a new routing control with custom styling
    try {
      routingControlRef.current = L.Routing.control({
        waypoints: routeWaypoints,
        routeWhileDragging: true,
        showAlternatives: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [
            { color: '#6366F1', weight: 6, opacity: 0.6 },
            { color: '#4F46E5', weight: 4, opacity: 0.8, dashArray: '1,10' }
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        createMarker: () => null, // We'll create our own markers
        addWaypoints: false,
        draggableWaypoints: false,
        // Customize the routing container to only show summary
        plan: L.Routing.plan(routeWaypoints, {
          createMarker: function() { return null; },
          draggableWaypoints: false,
          dragStyles: []
        }),
        collapsible: true,
        show: false, // Don't show turn-by-turn instructions
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving'
        })
      }).addTo(map);

      // Update route summary when route is calculated
      routingControlRef.current.on('routesfound', function(e: any) {
        const routes = e.routes;
        const summary = routes[0].summary;

        // Convert to human-readable format
        const totalDistance = Math.round(summary.totalDistance / 1000 * 10) / 10; // km with 1 decimal
        const totalHours = Math.floor(summary.totalTime / 3600);
        const totalMinutes = Math.floor((summary.totalTime % 3600) / 60);

        setRouteSummary({
          totalDistance: totalDistance,
          totalTime: totalHours * 60 + totalMinutes, // time in minutes
          loading: false
        });

        console.log("Route calculated:", totalDistance, "km,", totalHours, "h", totalMinutes, "min");
      });

      console.log("Routing added between waypoints");
    } catch (error) {
      console.error("Error creating routing:", error);
      setRouteSummary(null);
    }
  };

  // Remove a specific waypoint
  const removeWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    console.log(`Removed waypoint ${id}`);
  };

  // Clear all waypoints
  const clearWaypoints = () => {
    setWaypoints([]);

    if (map && routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
      setRouteSummary(null);
    }

    console.log("All waypoints cleared");
  };

  // Reset to the last two waypoints (for creating a simple A to B route)
  const resetToSimpleRoute = () => {
    if (waypoints.length >= 2) {
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      setWaypoints([start, end]);
      console.log("Reset to simple A-B route");
    }
  };

  // Finish button handler - now with API integration
  const handleFinish = async () => {
    if (waypoints.length < 2) {
      alert("You need at least 2 points to save an itinerary");
      return;
    }

    setIsSaving(true);

    console.log("Saving itinerary with waypoints:");
    waypoints.forEach((waypoint, index) => {
      console.log(`Point ${index + 1}: ${waypoint.address} [${waypoint.latlng.lat.toFixed(6)}, ${waypoint.latlng.lng.toFixed(6)}]`);
    });

    try {
      // Prepare waypoints for API - convert L.LatLng objects to plain objects
      const serializedWaypoints = waypoints.map(wp => ({
        id: wp.id,
        latlng: {
          lat: wp.latlng.lat,
          lng: wp.latlng.lng
        },
        address: wp.address
      }));

      // Send the waypoints to the API
      const response = await fetch('/api/routes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waypoints: serializedWaypoints,
          name: `Route ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save route');
      }

      const result = await response.json();
      console.log("Route saved successfully:", result);

      alert(`Itinerary saved with ${waypoints.length} points!`);
    } catch (error) {
      console.error("Error saving route:", error);
      alert(`Error saving itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Format time using the GeocodingService
  const formatTime = (minutes: number) => {
    return GeocodingService.formatRouteTime(minutes);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map container with explicit height */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0"
        style={{ height: '100vh' }}
      ></div>

      {/* Controls overlay in bottom right */}
      <div className="absolute bottom-4 right-4 z-10 space-y-2">
        <Button
          variant="destructive"
          onClick={clearWaypoints}
          className="flex items-center shadow-lg"
          disabled={waypoints.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All Points
        </Button>

        <Button
          variant="outline"
          onClick={resetToSimpleRoute}
          className="flex items-center bg-white shadow-lg"
          disabled={waypoints.length < 3}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to A-B Route
        </Button>
      </div>

      {/* Finish button in top right */}
      {waypoints.length > 0 && (
        <Button
          variant="default"
          onClick={handleFinish}
          className="absolute top-4 right-4 z-10 shadow-lg bg-green-600 hover:bg-green-700 text-white flex items-center"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Finish Itinerary
            </>
          )}
        </Button>
      )}

      {/* Route summary box in bottom center - Adjusted height and padding */}
      {routeSummary && (
        <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="py-2 px-6 flex items-center space-x-6">
            {routeSummary.loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Calculating route...</span>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500">Distance</span>
                  <span className="text-base font-bold">{routeSummary.totalDistance} km</span>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500">Time</span>
                  <span className="text-base font-bold">{GeocodingService.formatRouteTime(routeSummary.totalTime)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Waypoints list overlay with remove buttons - redesigned */}
      {waypoints.length > 0 && (
        <Card className="absolute top-4 left-20 z-10 w-72 max-h-[70vh] overflow-hidden shadow-lg bg-white/85 backdrop-blur-md rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Waypoints ({waypoints.length})</h2>
          </div>
          <div className="max-h-[calc(70vh-48px)] overflow-auto p-1">
            {waypoints.map((waypoint, index) => (
              <div
                key={waypoint.id}
                className="group px-3 py-2 hover:bg-gray-50/80 rounded-lg transition-colors duration-150 relative"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full mr-2">
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      Point {index + 1}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {waypoint.address}
                    </p>
                  </div>
                  <button
                    onClick={() => removeWaypoint(waypoint.id)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 absolute right-2 top-2"
                    title="Remove this point"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MapComponent;
