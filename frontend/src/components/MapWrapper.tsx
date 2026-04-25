"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-card/50 flex items-center justify-center animate-pulse rounded-xl">Loading map engine...</div>,
});

export default function MapWrapper(props: any) {
  return <MapComponent {...props} />;
}
