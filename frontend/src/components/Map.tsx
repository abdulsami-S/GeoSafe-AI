"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with Next.js
const customIcon = L.divIcon({
  className: "custom-marker",
  html: `<div class="w-6 h-6 bg-primary rounded-full border-4 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center animate-pulse"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapProps {
  lat: number;
  lon: number;
  onLocationSelect?: (lat: number, lon: number) => void;
  riskLevel?: "Low" | "Medium" | "High";
  readOnly?: boolean;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function Map({ lat, lon, onLocationSelect, riskLevel, readOnly }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-background flex items-center justify-center">Loading map...</div>;
  }

  const getRiskColor = () => {
    switch (riskLevel) {
      case "High": return "#EF4444";
      case "Medium": return "#EAB308";
      case "Low": return "#22C55E";
      default: return "#3B82F6";
    }
  };

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={14}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {!readOnly && onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}
      
      <Marker position={[lat, lon]} icon={customIcon} />
      
      {riskLevel && (
        <Circle
          center={[lat, lon]}
          pathOptions={{ color: getRiskColor(), fillColor: getRiskColor(), fillOpacity: 0.2 }}
          radius={5000} // 5km radius to show surroundings analyzed
        />
      )}
    </MapContainer>
  );
}
