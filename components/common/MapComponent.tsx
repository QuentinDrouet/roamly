'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2,
  RotateCcw,
  Loader2,
  X,
  Check,
  Info,
  Save,
  Map
} from 'lucide-react';
import GeocodingService from '@/services/geocodingService';
import { useUser } from '@/contexts/UserContext';
import RoutesModal from './RoutesModal';
import {supabase} from "@/utils/supabase/client";

// Define our interface for the waypoints/markers
interface Waypoint {
  id: string;
  latlng: L.LatLng;
  address: string;
}

// Define serialized waypoint for API calls
interface SerializedWaypoint {
  id: string;
  latlng: {
    lat: number;
    lng: number;
  };
  address: string;
}

// Define interface for route summary
interface RouteSummary {
  totalDistance: number;
  totalTime: number;
  loading: boolean;
}

// Define interfaces for OpenAI response
interface PlaceToVisit {
  name: string;
  address: string;
  context: string;
  paid: string;
  latlng?: L.LatLng; // Add optional coordinates for geocoded addresses
}

interface LocationInfo {
  address: string;
  introduction: string;
  creationDate: string;
  placesToVisit: PlaceToVisit[];
  waypoint?: Waypoint; // Reference to the original waypoint
}

interface OpenAIResponse {
  results: LocationInfo[];
}

const MapComponent: React.FC = () => {
  // State for our map, markers and routing
  const [map, setMap] = useState<L.Map | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [locationInfo, setLocationInfo] = useState<OpenAIResponse | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState<boolean>(false);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<[number, number] | null>(null); // [locationIndex, placeIndex]

  // Routes modal state
  const [isRoutesModalOpen, setIsRoutesModalOpen] = useState<boolean>(false);

  // Refs to track marker and routing state
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{[key: string]: L.Marker}>({});
  const poiMarkersRef = useRef<{[key: string]: L.Marker}>({});
  const isRouteInitializedRef = useRef<boolean>(false);
  const { user } = useUser();

  // Custom marker icon
  const createCustomIcon = (isHovered = false, isPOI = false) => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `<div class="marker-pin ${isHovered ? 'hovered' : ''} ${isPOI ? 'poi' : ''}"></div>`,
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
        transition: transform 0.2s, background 0.2s;
      }
      .marker-pin.hovered {
        background: #f97316;
        transform: rotate(-45deg) scale(1.2);
        z-index: 1000;
      }
      .marker-pin.poi {
        background: #10b981;
        width: 16px;
        height: 16px;
        margin: -12px 0 0 -8px;
      }
      .marker-pin.poi::after {
        width: 6px;
        height: 6px;
        margin: -3px 0 0 -3px;
      }
      .marker-pin.poi.hovered {
        background: #6366f1;
        transform: rotate(-45deg) scale(1.3);
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
      .location-card {
        transition: background-color 0.2s;
      }
      .location-card:hover {
        background-color: rgba(249, 115, 22, 0.1);
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

  // Update the routing between waypoints - defined outside of effects to avoid recreation
  const updateRouting = useCallback(() => {
    if (!map || waypoints.length < 2) return;

    console.log("Updating routing...");

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
        routeWhileDragging: false, // Disable to prevent auto-updates
        showAlternatives: false,
        fitSelectedRoutes: false, // Don't auto-fit to prevent view changes
        lineOptions: {
          styles: [
            { color: '#6366F1', weight: 6, opacity: 0.6 },
            { color: '#4F46E5', weight: 4, opacity: 0.8, dashArray: '1,10' }
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        },
        addWaypoints: false,
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


        // Mark as initialized
        isRouteInitializedRef.current = true;
      });

      console.log("Routing added between waypoints");
    } catch (error) {
      console.error("Error creating routing:", error);
      setRouteSummary(null);
    }
  }, [map, waypoints]);

  // Initialize route only when waypoints change AND route isn't already initialized
  useEffect(() => {
    if (!map || waypoints.length < 2) {
      isRouteInitializedRef.current = false;
      return;
    }

    if (!isRouteInitializedRef.current) {
      updateRouting();
    }
  }, [map, waypoints, updateRouting]);

  // Load a saved route
  const loadRoute = async (routeId: string) => {
    setIsLoading(true);

    try {
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        console.error("Session not found");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/routes/${routeId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load route: ${response.status}`);
      }

      const { route: data } = await response.json();

      // Clear existing map elements
      clearMapObjects();

      // Convert serialized waypoints back to L.LatLng objects
      const loadedWaypoints = data.waypoints.map((wp: SerializedWaypoint) => ({
        id: wp.id,
        latlng: L.latLng(wp.latlng.lat, wp.latlng.lng),
        address: wp.address
      }));

      // Convert latlng in locationInfo if they exist
      const processedLocationInfo = {
        ...data.locationInfo,
        results: data.locationInfo.results.map((location: any) => ({
          ...location,
          placesToVisit: location.placesToVisit.map((place: any) => ({
            ...place,
            latlng: place.latlng ? L.latLng(place.latlng.lat, place.latlng.lng) : undefined
          }))
        }))
      };

      // Update state with the loaded data
      setWaypoints(loadedWaypoints);
      setLocationInfo(processedLocationInfo);
      isRouteInitializedRef.current = false;

      // Close the modal
      setIsRoutesModalOpen(false);

      // If we have a map, fit its bounds to the loaded waypoints
      if (map && loadedWaypoints.length > 0) {
        const bounds = L.latLngBounds(loadedWaypoints.map(wp => wp.latlng));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error("Error loading route:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all map objects (markers, POIs, routing)
  const clearMapObjects = useCallback(() => {
    if (!map) return;

    // Clear all waypoint markers
    Object.values(markersRef.current).forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Clear all POI markers
    Object.values(poiMarkersRef.current).forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    // Remove routing
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Reset refs
    markersRef.current = {};
    poiMarkersRef.current = {};
    isRouteInitializedRef.current = false;
  }, [map]);

  // Handle map click to add waypoints
  useEffect(() => {
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      // Get the clicked location
      const { lat, lng } = e.latlng;

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
        // Mark route as needing update when waypoints change
        isRouteInitializedRef.current = false;
      } catch (error) {
        console.error('Error fetching address:', error);

        // Add waypoint even if address lookup fails
        const newWaypoint: Waypoint = {
          id: Date.now().toString(),
          latlng: e.latlng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };

        setWaypoints(prev => [...prev, newWaypoint]);
        // Mark route as needing update when waypoints change
        isRouteInitializedRef.current = false;
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, waypoints.length]);

  // Separate effect for updating waypoint markers
  useEffect(() => {
    if (!map || !waypoints.length) return;

    console.log("Updating waypoint markers...");

    // Clear existing waypoint markers
    Object.values(markersRef.current).forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    markersRef.current = {};

    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      const isHovered = waypoint.id === hoveredMarker;
      const marker = L.marker(waypoint.latlng, {
        icon: createCustomIcon(isHovered),
        title: `Point ${index + 1}`
      })
        .addTo(map)
        .bindPopup(`<b>Point ${index + 1}</b><br>${waypoint.address}`);

      markersRef.current[waypoint.id] = marker;
    });
  }, [map, waypoints, hoveredMarker]);

  // Separate effect for updating POI markers
  useEffect(() => {
    if (!map || !locationInfo) return;

    console.log("Updating POI markers...");

    // Clear existing POI markers
    Object.values(poiMarkersRef.current).forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });

    poiMarkersRef.current = {};

    // Add POI markers
    locationInfo.results.forEach((location, locationIndex) => {
      if (location.placesToVisit) {
        location.placesToVisit.forEach((place, placeIndex) => {
          if (place.latlng) {
            const markerKey = `${locationIndex}-${placeIndex}`;
            const isSelected = selectedPlaceIndex &&
              selectedPlaceIndex[0] === locationIndex &&
              selectedPlaceIndex[1] === placeIndex;

            const marker = L.marker(place.latlng, {
              icon: createCustomIcon(isSelected, true),
              title: place.name
            })
              .addTo(map)
              .bindPopup(`<b>${place.name}</b><br>${place.address}<br>${place.paid === "Yes" ? "Paid" : "Free"}`);

            poiMarkersRef.current[markerKey] = marker;
          }
        });
      }
    });
  }, [map, locationInfo]);

  // Separate effect for handling POI marker selection states
  useEffect(() => {
    if (!map || !locationInfo) return;

    // Update POI marker icons based on selection state
    locationInfo.results.forEach((location, locationIndex) => {
      if (location.placesToVisit) {
        location.placesToVisit.forEach((place, placeIndex) => {
          const markerKey = `${locationIndex}-${placeIndex}`;
          const marker = poiMarkersRef.current[markerKey];

          if (marker) {
            const isSelected = selectedPlaceIndex &&
              selectedPlaceIndex[0] === locationIndex &&
              selectedPlaceIndex[1] === placeIndex;

            marker.setIcon(createCustomIcon(isSelected, true));
          }
        });
      }
    });
  }, [map, locationInfo, selectedPlaceIndex]);

  // Remove a specific waypoint
  const removeWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    // Mark route as needing update
    isRouteInitializedRef.current = false;
  };

  // Clear all waypoints
  const clearWaypoints = () => {
    setWaypoints([]);
    setLocationInfo(null);
    setRouteSummary(null);
    clearMapObjects();
    console.log("All waypoints cleared");
  };

  // Reset to the last two waypoints (for creating a simple A to B route)
  const resetToSimpleRoute = () => {
    if (waypoints.length >= 2) {
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      setWaypoints([start, end]);
      // Mark route as needing update
      isRouteInitializedRef.current = false;
      console.log("Reset to simple A-B route");
    }
  };

  // Handle hovering on a location card
  const handleLocationHover = (id: string | null) => {
    setHoveredMarker(id);
    setSelectedPlaceIndex(null);

    // Focus the map on the hovered marker without changing zoom level
    if (id && map && markersRef.current[id]) {
      const currentZoom = map.getZoom();
      map.setView(markersRef.current[id].getLatLng(), currentZoom, {
        animate: true,
        duration: 0.5
      });
    }
  };

  // Handle hovering on a place to visit
  const handlePlaceHover = (locationIndex: number, placeIndex: number) => {
    setSelectedPlaceIndex([locationIndex, placeIndex]);
    setHoveredMarker(null);

    if (map && locationInfo?.results[locationIndex]?.placesToVisit[placeIndex]?.latlng) {
      const place = locationInfo.results[locationIndex].placesToVisit[placeIndex];
      const currentZoom = map.getZoom();
      map.setView(place.latlng!, currentZoom, {
        animate: true,
        duration: 0.5
      });
    }
  };

  // Geocode a single address and return coordinates
  const geocodeAddress = async (address: string): Promise<L.LatLng | null> => {
    try {
      const response = await fetch(`/api/geocoding/forward?address=${encodeURIComponent(address)}`);

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        return L.latLng(data[0].lat, data[0].lon);
      }
      return null;
    } catch (error) {
      console.error(`Error geocoding address: ${address}`, error);
      return null;
    }
  };

  // Geocode all places to visit
  const geocodePlacesToVisit = async (locationInfo: OpenAIResponse): Promise<OpenAIResponse> => {
    setIsLoadingPOIs(true);

    try {
      const updatedResults = [...locationInfo.results];

      // Associate each result with its corresponding waypoint
      for (let i = 0; i < updatedResults.length; i++) {
        if (i < waypoints.length) {
          updatedResults[i].waypoint = waypoints[i];
        }

        // Geocode each place to visit
        if (updatedResults[i].placesToVisit && updatedResults[i].placesToVisit.length > 0) {
          for (let j = 0; j < updatedResults[i].placesToVisit.length; j++) {
            const place = updatedResults[i].placesToVisit[j];
            if (place.address) {
              const latlng = await geocodeAddress(place.address);
              if (latlng) {
                updatedResults[i].placesToVisit[j] = {
                  ...place,
                  latlng
                };
              }
            }
          }
        }
      }

      return {
        ...locationInfo,
        results: updatedResults
      };
    } catch (error) {
      console.error("Error geocoding places to visit:", error);
      return locationInfo;
    } finally {
      setIsLoadingPOIs(false);
    }
  };

  // Finish button handler - now with OpenAI API integration and geocoding for places
  const handleFinish = async () => {
    if (waypoints.length < 2) {
      alert("You need at least 2 points to save an itinerary");
      return;
    }

    setIsSaving(true);
    setIsLoading(true);

    try {
      // Extract addresses from waypoints for OpenAI API
      const addresses = waypoints.map(wp => wp.address);

      // Call the OpenAI API
      const response = await fetch('/api/openai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retrieve information');
      }

      let result = await response.json();
      console.log("OpenAI results:", result);

      // Geocode all places to visit
      result = await geocodePlacesToVisit(result);

      // Store the enhanced OpenAI response in state
      setLocationInfo(result);

      // Important: Don't touch the route when setting location info
      // We don't want to recalculate the route just because we got places to visit

    } catch (error) {
      console.error("Error processing itinerary:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  const saveRoute = async () => {
    if (!user) {
      alert("You need to be logged in to save the itinerary");
      return;
    }
    if (!locationInfo || waypoints.length < 2) {
      alert("You need at least 2 points and location information to save the itinerary");
      return;
    }

    setIsSaving(true);

    try {
      // Prepare waypoints for the API
      const serializedWaypoints = waypoints.map(wp => ({
        id: wp.id,
        latlng: {
          lat: wp.latlng.lat,
          lng: wp.latlng.lng
        },
        address: wp.address
      }));

      // Send waypoints and location information to the API
      const response = await fetch('/api/routes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          waypoints: serializedWaypoints,
          locationInfo: locationInfo,
          userId: user.id,
          name: `Itinerary ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save the itinerary');
      }

      const result = await response.json();
      console.log("Itinerary and information saved successfully:", result);

      alert("Itinerary and location information saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full h-full flex">
      {/* Left sidebar for location information */}
      {locationInfo && (
        <div className="w-80 h-full z-10 bg-white shadow-lg overflow-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Location Information</h2>
            <p className="text-sm text-gray-500">{waypoints.length} destinations</p>
          </div>

          <div className="divide-y divide-gray-100">
            {locationInfo.results.map((location, index) => (
              <div
                key={index}
                className={`p-4 location-card cursor-pointer ${hoveredMarker === waypoints[index]?.id ? 'bg-orange-50' : ''}`}
                onMouseEnter={() => handleLocationHover(waypoints[index]?.id)}
                onMouseLeave={() => handleLocationHover(null)}
              >
                <h3 className="font-semibold text-gray-800">{location.address}</h3>
                {location.creationDate && (
                  <p className="text-xs text-gray-500 mb-2">Established: {location.creationDate}</p>
                )}
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{location.introduction}</p>

                {location.placesToVisit && location.placesToVisit.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Places to Visit</h4>
                    <div className="space-y-2">
                      {location.placesToVisit.map((place, placeIndex) => (
                        <div
                          key={placeIndex}
                          className={`text-sm p-2 rounded cursor-pointer transition-all duration-150 ${
                            selectedPlaceIndex &&
                            selectedPlaceIndex[0] === index &&
                            selectedPlaceIndex[1] === placeIndex
                              ? "bg-indigo-50 border border-indigo-200"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          onMouseEnter={() => handlePlaceHover(index, placeIndex)}
                          onMouseLeave={() => setSelectedPlaceIndex(null)}
                        >
                          <div className="font-medium">{place.name}</div>
                          <div className="text-xs text-gray-500">{place.address}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs italic text-gray-600 line-clamp-1">{place.context}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${place.paid === "Yes" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                              {place.paid === "Yes" ? "Paid" : "Free"}
                            </span>
                          </div>
                          {!place.latlng && (
                            <div className="text-xs text-amber-600 mt-1">
                              <i>Could not map location</i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map container with explicit height */}
      <div
        className={`${locationInfo ? 'w-[calc(100%-20rem)]' : 'w-full'} h-full relative`}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0"
        ></div>

        {/* Controls overlay in bottom right */}
        <div className="absolute bottom-4 right-4 z-10 space-y-2">
          <Button
            variant="destructive"
            onClick={clearWaypoints}
            className="flex items-center shadow-lg"
            disabled={waypoints.length === 0 || isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Points
          </Button>

          {/* Show save button only if we have location info */}
          {locationInfo && waypoints.length > 0 && (
            <Button
              variant="outline"
              onClick={saveRoute}
              className="flex items-center bg-black text-white hover:text-white hover:bg-black/80 shadow-lg"
              disabled={isLoading || isSaving || !locationInfo}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Route
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={resetToSimpleRoute}
            className="flex items-center bg-white shadow-lg"
            disabled={waypoints.length < 3 || isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to A-B Route
          </Button>
        </div>

        {/* Top right buttons */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          {/* My Routes Button */}
          {user && (
            <Button
              variant="outline"
              onClick={() => setIsRoutesModalOpen(true)}
              className="shadow-lg bg-black text-white hover:text-white hover:bg-black/80 flex items-center"
              disabled={isLoading || isSaving}
            >
              <Map className="mr-2 h-4 w-4" />
              My Routes
            </Button>
          )}

          {/* Get Location Info Button */}
          {waypoints.length > 0 && (
            <Button
              variant="default"
              onClick={handleFinish}
              className="shadow-lg bg-black hover:bg-black/80 text-white hover:text-white flex items-center"
              disabled={isSaving || isLoading}
            >
              {isSaving || isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locationInfo ? "Loading..." : "Processing..."}
                </>
              ) : locationInfo ? (
                <>
                  <Info className="mr-2 h-4 w-4" />
                  Update Information
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Get Location Info
                </>
              )}
            </Button>
          )}
        </div>

        {/* Route summary box in bottom center */}
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

        {/* Waypoints list overlay with remove buttons - only show if no location info */}
        {waypoints.length > 0 && !locationInfo && (
          <Card className="absolute top-2 left-12 z-10 w-72 max-h-[70vh] overflow-hidden shadow-lg bg-white/85 backdrop-blur-md rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Waypoints ({waypoints.length})</h2>
            </div>
            <div className="max-h-[calc(70vh-48px)] overflow-auto p-1">
              {waypoints.map((waypoint, index) => (
                <div
                  key={waypoint.id}
                  className={`group px-3 py-2 hover:bg-gray-50/80 rounded-lg transition-colors duration-150 relative ${hoveredMarker === waypoint.id ? 'bg-orange-50' : ''}`}
                  onMouseEnter={() => handleLocationHover(waypoint.id)}
                  onMouseLeave={() => handleLocationHover(null)}
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
                      disabled={isLoading}
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

      {/* Loading overlay */}
      {(isLoading || isLoadingPOIs) && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 shadow-xl animate-pulse">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium">
                {isLoading ? "Getting location information..." : "Mapping points of interest..."}
              </h3>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          </Card>
        </div>
      )}

      <RoutesModal
        isOpen={isRoutesModalOpen}
        onClose={() => setIsRoutesModalOpen(false)}
        onLoadRoute={loadRoute}
        user={user}
      />
    </div>
  );
};

export default MapComponent;
