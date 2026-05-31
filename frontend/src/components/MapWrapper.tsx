"use client";

/**
 * MapWrapper — thin SSR-safe shell around the heavy Leaflet Map component.
 *
 * WHY TWO LAYERS (MapWrapper + Map)?
 * Leaflet accesses `window` at import time which crashes Next.js's server-side
 * render pass.  We use Next dynamic() with { ssr: false } to exclude the
 * import entirely from the server bundle.
 */

import dynamic from "next/dynamic";
import type { MapAnalysisResult } from "./Map";

interface MapWrapperProps {
  lat: number;
  lon: number;
  onLocationSelect?: (lat: number, lon: number) => void;
  riskLevel?: "Low" | "Medium" | "High";
  readOnly?: boolean;
  analysisResult?: MapAnalysisResult;
}

const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-card/50 flex items-center justify-center animate-pulse rounded-xl text-gray-400 text-sm">
      Loading map engine…
    </div>
  ),
});

export default function MapWrapper(props: MapWrapperProps) {
  return <MapComponent {...props} />;
}

