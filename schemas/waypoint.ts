import { z } from 'zod';

// Schema for geographic coordinates
export const LatLngSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type LatLng = z.infer<typeof LatLngSchema>;

// Schema for waypoints
export const WaypointSchema = z.object({
  id: z.string(),
  latlng: LatLngSchema,
  address: z.string(),
});

export type Waypoint = z.infer<typeof WaypointSchema>;

// Schema for a route
export const RouteSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  waypoints: z.array(WaypointSchema),
  createdAt: z.date().optional().default(() => new Date()),
});

export type Route = z.infer<typeof RouteSchema>;
