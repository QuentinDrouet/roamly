'use client';
import { createClient } from "@/utils/supabase/server"
import AuthActions from "@/components/common/AuthActions"
import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Import styles for Leaflet
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import '../styles/leafletOverrides.css'; // Add this file

// Import the MapComponent with dynamic loading (no SSR) since Leaflet needs the window object
const MapComponent = dynamic(() => import('@/components/common/MapComponent'), {
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <span className="ml-2 text-xl">Loading Map...</span>
    </div>
  ),
  ssr: false, // Important: don't render on the server
});


export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="w-screen h-screen overflow-hidden">
      <div className="self-start justify-self-end">
        <AuthActions user={user} />
      </div>
      <MapComponent />
    </main>
  );
}
