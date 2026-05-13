"use client";

/**
 * MapWrapper — thin SSR-safe shell around the heavy Leaflet Map component.
 *
 * WHY TWO LAYERS (MapWrapper + Map)?
 * Leaflet accesses `window` at import time which crashes Next.js's server-side
 * render pass.  We use Next dynamic() with { ssr: false } to exclude the
 * import entirely from the server bundle.
 *
 * WHY NOT PUT dynamic() DIRECTLY ON Map?
 * The analyze page uses a SECOND dynamic() call around MapWrapper so the
 * entire map is excluded from the initial page bundle — it's only downloaded
 * when the user clicks "Show Interactive Map".  Having both levels of dynamic
 * import gives us:
 *   1. SSR safety    (MapWrapper's ssr:false)
 *   2. Code-split / lazy load (analyze page's dynamic on MapWrapper itself)
 */

import dynamic from "next/dynamic";

interface MapWrapperProps {
  lat: number;
  lon: number;
  onLocationSelect?: (lat: number, lon: number) => void;
  riskLevel?: "Low" | "Medium" | "High";
  readOnly?: boolean;
}

// Dynamic import with SSR disabled — Leaflet is never included in the
// server bundle, which prevents the "window is not defined" crash.
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
