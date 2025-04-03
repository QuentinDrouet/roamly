import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from "@/utils/supabase/client";
import { DateTime } from 'luxon';

// Interface definitions
interface SerializedWaypoint {
  id: string;
  latlng: {
    lat: number;
    lng: number;
  };
  address: string;
}

interface PlaceToVisit {
  name: string;
  address: string;
  context: string;
  paid: string;
  latlng?: L.LatLng | { lat: number; lng: number };
}

interface LocationInfo {
  address: string;
  introduction: string;
  creationDate: string;
  placesToVisit: PlaceToVisit[];
  waypoint?: any;
}

interface OpenAIResponse {
  results: LocationInfo[];
}

interface SavedRoute {
  id: string;
  name: string;
  user_id: string;
  waypoints: SerializedWaypoint[];
  locationInfo: OpenAIResponse;
  created_at: string;
}

interface RoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadRoute: (routeId: string) => Promise<void>;
  user: any;
}

const RoutesModal: React.FC<RoutesModalProps> = ({ isOpen, onClose, onLoadRoute, user }) => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);
  const [isDeletingRoute, setIsDeletingRoute] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSavedRoutes();
    }
  }, [isOpen, user]);

  // Fetch saved routes
  const fetchSavedRoutes = async () => {
    if (!user) return;

    setIsLoadingRoutes(true);
    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      console.error("Session not found");
      setIsLoadingRoutes(false);
      return;
    }

    try {
      const response = await fetch('/api/routes/list', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch routes: ${response.status}`);
      }

      const { routes } = await response.json();
      setSavedRoutes(routes);
      console.log("Fetched saved routes:", routes);
    } catch (error) {
      console.error("Error fetching saved routes:", error);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Delete a saved route
  const deleteRoute = async (routeId: string) => {
    setIsDeletingRoute(true);
    setRouteToDelete(routeId);
    if (!user) {
      console.error("User not found");
      setIsLoadingRoutes(false);
      setIsDeletingRoute(false);
      return;
    }

    const session = await supabase.auth.getSession();

    if (!session.data.session) {
      console.error("Session not found");
      setIsLoadingRoutes(false);
      return;
    }

    try {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete route: ${response.status}`);
      }

      // Remove the route from the list
      setSavedRoutes(prev => prev.filter(route => route.id !== routeId));
      console.log(`Route ${routeId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting route:", error);
    } finally {
      setIsDeletingRoute(false);
      setRouteToDelete(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const datetime = DateTime.fromISO(dateString);
    return datetime.toLocaleString(DateTime.DATE_MED);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle>My Saved Routes</DialogTitle>
          <DialogDescription>
            Select a route to load it on the map or delete saved routes.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {isLoadingRoutes ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : savedRoutes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">{"You don't have any saved routes yet."}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedRoutes.map((route) => (
                <Card key={route.id} className="route-card overflow-hidden hover:bg-gray-50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-medium text-gray-800 text-sm truncate">{route.name}</h3>
                          <span className="text-xs text-gray-500">{formatDate(route.created_at)}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                          {route.waypoints.map((wp, idx) => (
                            <span key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                  title={wp.address}
                            >
                              {idx + 1}. {wp.address.split(',').slice(0,2).join(', ')}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {route.waypoints.length} points • {route.locationInfo.results.reduce(
                            (acc, loc) => acc + (loc.placesToVisit?.length || 0), 0
                          )} places to visit
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onLoadRoute(route.id)}
                              className="h-7 px-2 text-xs"
                            >
                              Load
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                                >
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete route?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your saved route.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteRoute(route.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {isDeletingRoute && route.id === routeToDelete ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Delete"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoutesModal;
