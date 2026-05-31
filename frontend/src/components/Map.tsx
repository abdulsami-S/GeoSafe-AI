"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* ───────────────────────────────────────────────────────────────────────────
   MARKER ICONS — risk-colored with animated drop + glow
   ─────────────────────────────────────────────────────────────────────────── */
function makeIcon(color: string, glow: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">
        <div style="position:absolute;bottom:-3px;left:50%;width:18px;height:4px;border-radius:50%;background:rgba(0,0,0,0.3);transform:translateX(-50%)"></div>
        <div class="animate-marker-drop" style="
          width:28px;height:28px;border-radius:50%;
          background:${color};
          border:3px solid white;
          box-shadow:0 0 20px ${glow}, 0 2px 8px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

const ICONS = {
  default: makeIcon("#3B82F6", "rgba(59,130,246,0.7)"),
  Low:     makeIcon("#22C55E", "rgba(34,197,94,0.7)"),
  Medium:  makeIcon("#EAB308", "rgba(234,179,8,0.7)"),
  High:    makeIcon("#EF4444", "rgba(239,68,68,0.7)"),
};

/* ───────────────────────────────────────────────────────────────────────────
   ANALYSIS RESULT — optional, shown in the popup when available
   ─────────────────────────────────────────────────────────────────────────── */
export interface MapAnalysisResult {
  risk:      "Low" | "Medium" | "High";
  land_type: string;
  terrain:   string;
  elevation: number;
  gov_land:  boolean;
  gov_type:  string;
  on_road:   boolean;
  building_density: number;
}

interface MapProps {
  lat: number;
  lon: number;
  onLocationSelect?: (lat: number, lon: number) => void;
  riskLevel?: "Low" | "Medium" | "High";
  readOnly?: boolean;
  analysisResult?: MapAnalysisResult;
}

/* ── Fly-to on prop change ────────────────────────────────────────────────── */
function ChangeView({ lat, lon, zoom }: { lat: number; lon: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], zoom ?? map.getZoom(), { animate: true, duration: 1.0 });
    }
  }, [lat, lon, zoom, map]);
  return null;
}

/* ── Click handler ────────────────────────────────────────────────────────── */
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

/* ── SSR guard ────────────────────────────────────────────────────────────── */
const subscribe = () => () => {};

/* ───────────────────────────────────────────────────────────────────────────
   MAP COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
export default function Map({ lat, lon, onLocationSelect, riskLevel, readOnly, analysisResult }: MapProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const icon = useMemo(
    () => (riskLevel ? ICONS[riskLevel] : ICONS.default),
    [riskLevel]
  );

  const riskColor = useMemo(() => {
    switch (riskLevel) {
      case "High":   return "#EF4444";
      case "Medium": return "#EAB308";
      case "Low":    return "#22C55E";
      default:       return "#3B82F6";
    }
  }, [riskLevel]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center text-gray-400 text-sm">
        Loading map…
      </div>
    );
  }

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={14}
      scrollWheelZoom={true}
      className="w-full h-full rounded-xl z-0"
    >
      {/* ── Base: Esri World Imagery (satellite) ─────────────────────────── */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Sources: Esri, Maxar, Earthstar Geographics'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      {/* ── Labels overlay so place names remain readable on satellite ──── */}
      <TileLayer
        attribution=""
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      {/* Re-center on prop changes; zoom to 15 when we have a result */}
      <ChangeView lat={lat} lon={lon} zoom={analysisResult ? 15 : undefined} />

      {!readOnly && onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

      {/* ── Marker with optional rich popup ──────────────────────────────── */}
      <Marker position={[lat, lon]} icon={icon}>
        {analysisResult && (
          <Popup
            className="geosafe-popup"
            closeButton={true}
            autoPan={true}
            maxWidth={280}
          >
            <div style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              padding: "4px 0",
              minWidth: 220,
            }}>
              {/* Risk badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10, paddingBottom: 8,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: riskColor, opacity: 0.9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 12px ${riskColor}55`,
                }}>
                  <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>
                    {analysisResult.risk === "High" ? "!" : analysisResult.risk === "Medium" ? "~" : "✓"}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                    AI Risk Assessment
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: riskColor, lineHeight: 1.1 }}>
                    {analysisResult.risk} Risk
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "6px 12px", fontSize: 12,
              }}>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 10, fontWeight: 600 }}>Land Type</div>
                  <div style={{ color: "#F3F4F6", fontWeight: 700 }}>{analysisResult.land_type}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 10, fontWeight: 600 }}>Terrain</div>
                  <div style={{ color: "#F3F4F6", fontWeight: 700 }}>{analysisResult.terrain}</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 10, fontWeight: 600 }}>Elevation</div>
                  <div style={{ color: "#F3F4F6", fontWeight: 700 }}>{analysisResult.elevation}m</div>
                </div>
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: 10, fontWeight: 600 }}>Buildings</div>
                  <div style={{ color: "#F3F4F6", fontWeight: 700 }}>{analysisResult.building_density}</div>
                </div>
              </div>

              {/* Warnings */}
              {(analysisResult.gov_land || analysisResult.on_road) && (
                <div style={{
                  marginTop: 8, padding: "6px 8px",
                  background: "rgba(239,68,68,0.12)", borderRadius: 6,
                  border: "1px solid rgba(239,68,68,0.25)",
                  fontSize: 11, color: "#FCA5A5", fontWeight: 600,
                }}>
                  ⚠ {analysisResult.on_road ? "On public road" : `Restricted: ${analysisResult.gov_type}`}
                </div>
              )}

              {/* Coordinates footer */}
              <div style={{
                marginTop: 8, fontSize: 10, color: "#6B7280",
                fontFamily: "monospace",
              }}>
                {lat.toFixed(5)}° N, {lon.toFixed(5)}° E
              </div>
            </div>
          </Popup>
        )}
      </Marker>

      {/* ── Scan radius circle — risk-colored ────────────────────────────── */}
      {riskLevel && (
        <>
          {/* Outer glow ring */}
          <Circle
            center={[lat, lon]}
            pathOptions={{
              color: riskColor,
              weight: 1.5,
              fillColor: riskColor,
              fillOpacity: 0.08,
              dashArray: "6 4",
            }}
            radius={10000}
          />
          {/* Inner solid ring */}
          <Circle
            center={[lat, lon]}
            pathOptions={{
              color: riskColor,
              weight: 2,
              fillColor: riskColor,
              fillOpacity: 0.15,
            }}
            radius={3000}
          />
        </>
      )}
    </MapContainer>
  );
}
