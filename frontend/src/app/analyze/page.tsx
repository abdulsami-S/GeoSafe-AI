"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Info, Navigation, Share2, AlertTriangle,
  CheckCircle, ShieldAlert, Target, InfoIcon, Map as MapIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useDebounce } from "@/hooks/useDebounce";

// ── PERF 3 (Frontend): Lazy-load the map ────────────────────────────────────
// MapWrapper already disables SSR.  Here we go one step further: the map
// component is NOT imported at module-level.  It is only downloaded when the
// user first clicks "Show Interactive Map", keeping the initial JS bundle
// smaller and avoiding Leaflet's heavy initialisation during first paint.
// The user sees a placeholder button instead of an invisible blocking load.
const MapWrapper = dynamic(() => import("@/components/MapWrapper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm animate-pulse">
      Loading map engine…
    </div>
  ),
});

interface AnalysisResult {
  risk: "Low" | "Medium" | "High";
  purpose: string;
  land_type: string;
  terrain: string;
  elevation: number;
  building_density: number;
  res_pct: number;
  ind_pct: number;
  farm_pct: number;
  forest_pct: number;
  water_pct: number;
  other_pct: number;
  on_road: boolean;
  near_road: boolean;
  nearby_roads_count: number;
  gov_land: boolean;
  gov_type: string;
  explanation: string;
}

// ── Progressive reveal phases ────────────────────────────────────────────────
// The backend returns one JSON blob, but we reveal the result in timed phases
// so the UI feels responsive rather than showing "nothing → everything" at
// once.  Each phase unlocks after a short delay once data arrives.
type RevealPhase = "none" | "banner" | "explanation" | "metrics";

// Loading steps shown while the API call is in-flight.
// Each step becomes "active" after the previous one completes, giving the
// user a sense of real progress without needing streaming from the server.
const LOADING_STEPS = [
  { label: "Querying GIS databases…",               duration: 900 },
  { label: "Calculating distances to water bodies…", duration: 700 },
  { label: "Running Random Forest classifier…",      duration: 500 },
  { label: "Generating environmental insights…",     duration: 400 },
];

export default function AnalyzePage() {
  const [lat, setLat]         = useState<string>("");
  const [lon, setLon]         = useState<string>("");
  const [purpose, setPurpose] = useState<string>("General");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<AnalysisResult | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("none");

  // ── PERF 2 (Frontend): Progressive loading step tracker ──────────────────
  // Tracks which step label is currently "active" in the loading animation.
  // Steps advance on a timer so the UI always feels alive, even when the
  // backend is simply doing its work silently.
  const [activeStep, setActiveStep] = useState<number>(-1);

  // ── PERF 1 (Frontend): Debounce coordinate inputs ───────────────────────
  // The raw lat/lon state updates on every keystroke (required for controlled
  // inputs), but debouncedLat/Lon only updates 400 ms AFTER the user pauses
  // typing.  The Leaflet map uses the debounced value so it doesn't re-center
  // on every character the user types.
  const debouncedLat = useDebounce(lat, 400);
  const debouncedLon = useDebounce(lon, 400);

  // ── AbortController ref ───────────────────────────────────────────────────
  // Stores the AbortController for the current in-flight fetch so we can
  // cancel it if the user submits a new request before the previous one
  // finishes — prevents stale results from overwriting a newer analysis.
  const abortRef = useRef<AbortController | null>(null);

  // Timers for the progressive reveal phases
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Timers for the loading step advancement
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Progressive reveal: unlock phases with timed delays ──────────────────
  const startReveal = useCallback(() => {
    revealTimers.current.forEach(clearTimeout);
    setRevealPhase("banner");
    revealTimers.current = [
      setTimeout(() => setRevealPhase("explanation"), 300),
      setTimeout(() => setRevealPhase("metrics"),     600),
    ];
  }, []);

  // ── Start the loading step progression ───────────────────────────────────
  // Each step becomes active after the cumulative duration of all previous
  // steps.  If the API responds faster than the total duration, the result
  // still reveals correctly via startReveal().
  const startLoadingSteps = useCallback(() => {
    stepTimers.current.forEach(clearTimeout);
    setActiveStep(0);
    let cumulative = 0;
    LOADING_STEPS.slice(1).forEach((step, i) => {
      cumulative += LOADING_STEPS[i].duration;
      stepTimers.current.push(
        setTimeout(() => setActiveStep(i + 1), cumulative)
      );
    });
  }, []);

  const stopLoadingSteps = useCallback(() => {
    stepTimers.current.forEach(clearTimeout);
    setActiveStep(-1);
  }, []);

  // Clean up all timers on unmount
  useEffect(
    () => () => {
      revealTimers.current.forEach(clearTimeout);
      stepTimers.current.forEach(clearTimeout);
    },
    []
  );

  const loadDemo = () => {
    setLat("17.3850");
    setLon("78.4867");
    setPurpose("Residential");
  };

  const handleMapSelect = (newLat: number, newLon: number) => {
    setLat(newLat.toFixed(5));
    setLon(newLon.toFixed(5));
  };

  // ── Main analysis handler ──────────────────────────────────────────────────
  const analyzeLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lon) {
      setError("Please enter or select a location.");
      return;
    }

    // Cancel any previous in-flight request before starting a new one.
    // This prevents a slow prior request from overwriting the result of a
    // newer, faster request (race condition).
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);
    setRevealPhase("none");
    startLoadingSteps();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/check`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            purpose,
          }),
          // ── PERF 1 (Frontend): AbortController ──────────────────────────
          // Passing the signal links this fetch to our controller.  If the
          // user submits again (or navigates away), the pending request is
          // cancelled so we don't process a stale response.
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error("Failed to analyze location");

      const data: AnalysisResult = await response.json();
      setResult(data);
      startReveal(); // kick off the staged reveal
    } catch (err: unknown) {
      // Ignore AbortError — it means we deliberately cancelled the request
      if (err instanceof Error && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "An error occurred during analysis."
      );
    } finally {
      setLoading(false);
      stopLoadingSteps();
    }
  };

  const shareResult = async () => {
    if (!result) return;
    const shareText = `GeoSafe AI Land Analysis:\nRisk Level: ${result.risk}\nLocation: ${lat}, ${lon}\nAI Insight: ${result.explanation}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "GeoSafe AI Land Analysis", text: shareText });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Result copied to clipboard!");
    }
  };

  const mapLat = parseFloat(debouncedLat) || 20;
  const mapLon = parseFloat(debouncedLon) || 0;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="font-display text-3xl md:text-4xl font-normal text-white mb-2">
          Analyze Land <span className="italic font-light text-primary">Safety</span>
        </h1>
        <p className="text-gray-400">
          Select a location to run instant AI spatial analysis.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">

        {/* Left Column: Form + Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 sm:p-8">
            <form onSubmit={analyzeLand} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  Coordinates
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Latitude (N/S) and Longitude (E/W) pinpoint exact
                      locations on Earth. Click on the map to autofill.
                    </div>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={loadDemo}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" /> Try Demo Location
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  id="lat-input"
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-[rgba(10,12,20,0.5)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
                <input
                  id="lon-input"
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full bg-[rgba(10,12,20,0.5)] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Intended Purpose
                </label>
                {/* Custom-styled select — overrides browser default grey/white appearance.
                    The wrapper div provides a positioned custom SVG arrow since
                    appearance-none removes the native one. */}
                <div className="relative">
                  <select
                    id="purpose-select"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 pr-10 text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    style={{
                      colorScheme: "dark",
                      backgroundColor: "rgb(14, 17, 28)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                    }}
                  >
                    <option value="General"     style={{ backgroundColor: "#111827", color: "white" }}>General Analysis</option>
                    <option value="Residential" style={{ backgroundColor: "#111827", color: "white" }}>Residential (Housing)</option>
                    <option value="Industrial"  style={{ backgroundColor: "#111827", color: "white" }}>Industrial (Factories)</option>
                    <option value="Farming"     style={{ backgroundColor: "#111827", color: "white" }}>Farming (Agriculture)</option>
                  </select>
                  {/* Custom chevron arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                id="analyze-btn"
                type="submit"
                disabled={loading}
                className="w-full font-display bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-geo-spin inline-block" />
                    Processing AI Analysis…
                  </span>
                ) : (
                  <><MapPin className="w-5 h-5" /> Run Safety Scan</>
                )}
              </button>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2 items-start animate-fade-in-up">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* ── PERF 3: Deferred map — only mounts when the user asks for it ── */}
          {/* WHY: Leaflet adds ~200 kB of JS to the bundle. By only mounting the  */}
          {/* map when the user explicitly requests it, we keep the initial page   */}
          {/* load fast and reduce Time-to-Interactive significantly.              */}
          <div
            className="glass-panel overflow-hidden relative"
            style={{ minHeight: showMap ? "400px" : "auto" }}
          >
            {!showMap ? (
              <button
                id="show-map-btn"
                onClick={() => setShowMap(true)}
                className="w-full font-display flex items-center justify-center gap-3 py-6 text-gray-400 hover:text-white hover:bg-white/5 transition-colors rounded-xl"
              >
                <MapIcon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Show Interactive Map</span>
              </button>
            ) : (
              <div className="h-[400px] relative overflow-hidden rounded-xl animate-fade-in-up">
                <MapWrapper
                  lat={mapLat}
                  lon={mapLon}
                  onLocationSelect={handleMapSelect}
                  riskLevel={result?.risk}
                />
                
                {/* Radar scanning sweep overlay while loading */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#0a0c14]/50 z-[400] pointer-events-none flex items-center justify-center overflow-hidden border border-primary/20 rounded-xl"
                    >
                      {/* Sweeping scanline */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent h-1/2 w-full origin-top"
                        animate={{ y: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                      />
                      
                      {/* Sonar concentric ripples */}
                      <div className="relative w-80 h-80 rounded-full border border-primary/20 flex items-center justify-center">
                        <motion.div 
                          className="absolute rounded-full border border-primary/40 w-full h-full"
                          animate={{ scale: [0.1, 1], opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
                        />
                        <motion.div 
                          className="absolute rounded-full border border-primary/25 w-full h-full"
                          animate={{ scale: [0.1, 1], opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 0.8 }}
                        />
                        <motion.div 
                          className="absolute rounded-full border border-primary/10 w-full h-full"
                          animate={{ scale: [0.1, 1], opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut", delay: 1.6 }}
                        />
                        {/* Crosshairs */}
                        <div className="absolute w-full h-[0.5px] bg-primary/25" />
                        <div className="absolute h-full w-[0.5px] bg-primary/25" />
                        <span className="text-[10px] text-primary/70 font-mono tracking-widest absolute bg-black/75 px-2 py-0.5 rounded border border-primary/20">SCANNING AREA</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute top-4 left-4 z-[399] bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <InfoIcon className="w-3 h-3 text-primary" /> Click map to select location
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">

            {/* Empty state */}
            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center text-center p-8 border-dashed"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                  <Target className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Awaiting Location</h3>
                <p className="text-gray-400 max-w-sm">
                  Enter coordinates or select a point on the map to generate a
                  comprehensive land intelligence report.
                </p>
              </motion.div>
            )}

            {/* ── PERF 2 (Frontend): Progressive loading stepper ─────────────────
                WHY: The backend processes GIS data synchronously and returns one
                JSON blob — we cannot stream partial results.  However we CAN give
                the user a sense of real progress by advancing labelled steps on a
                timer that mirrors typical backend timing.  This turns the blank
                "loading…" wait into an informative sequence and reduces perceived
                latency significantly.
            ──────────────────────────────────────────────────────────────────── */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center p-8"
              >
                {/* Dual-ring orbital spinner */}
                <div className="relative w-28 h-28 mb-8">
                  <div className="absolute inset-0 border-[3px] border-primary/15 rounded-full" />
                  <div className="absolute inset-0 border-[3px] border-transparent border-t-primary border-r-primary rounded-full animate-geo-spin" />
                  <div className="absolute inset-3 border-[3px] border-primary/10 rounded-full" />
                  <div className="absolute inset-3 border-[3px] border-transparent border-b-primary/70 border-l-primary/70 rounded-full animate-geo-spin-reverse" />
                  <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-primary/15 animate-scanner-ping" />
                  <Target className="w-7 h-7 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>

                <h3 className="text-xl font-bold text-white mb-5 animate-fade-in-up">
                  AI Analyzing Terrain…
                </h3>

                {/* ── Timed step progression ──
                    Each step fades in at the correct cumulative offset and
                    shows a pulsing dot while active, a filled dot when done. */}
                <div className="space-y-3 w-full max-w-xs">
                  {LOADING_STEPS.map((step, i) => {
                    const isDone   = activeStep > i;
                    const isActive = activeStep === i;
                    const isPending = activeStep < i;

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                          isPending ? "opacity-30" : "opacity-100"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isDone
                            ? "bg-primary/80"
                            : isActive
                              ? "bg-primary/20"
                              : "bg-white/10"
                        }`}>
                          {isDone ? (
                            <CheckCircle className="w-3 h-3 text-white" />
                          ) : isActive ? (
                            <div className="w-2 h-2 bg-primary rounded-full animate-dot-pulse" />
                          ) : (
                            <div className="w-2 h-2 bg-white/20 rounded-full" />
                          )}
                        </div>
                        <span className={isDone ? "text-gray-300 line-through" : isActive ? "text-white" : "text-gray-500"}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── PERF 2 (Frontend): Progressive staged reveal ─────────────────
                Phase 1 (banner)      → appears immediately on data arrival
                Phase 2 (explanation) → fades in 300 ms later
                Phase 3 (metrics)     → fades in 600 ms later (staggered cards)

                This three-phase reveal mimics streaming even though we receive
                a single JSON response, giving the UI a "building up" feel.
            ──────────────────────────────────────────────────────────────────── */}
            {result && !loading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Phase 1 — Risk Banner (appears immediately) */}
                {revealPhase !== "none" && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`glass-panel p-6 flex flex-col sm:flex-row items-center justify-between border-l-4 transition-shadow duration-500 ${
                      result.risk === "High"
                        ? "border-l-high   bg-high/5   animate-pulse-danger"
                        : result.risk === "Medium"
                          ? "border-l-medium bg-medium/5 animate-glow-medium"
                          : "border-l-safe   bg-safe/5   animate-glow-safe"
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        result.risk === "High"
                          ? "bg-high/20   text-high"
                          : result.risk === "Medium"
                            ? "bg-medium/20 text-medium"
                            : "bg-safe/20   text-safe"
                      }`}>
                        {result.risk === "High"   ? <ShieldAlert   className="w-7 h-7" /> :
                         result.risk === "Medium" ? <AlertTriangle className="w-7 h-7" /> :
                                                     <CheckCircle   className="w-7 h-7" />}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-medium">AI Risk Assessment</p>
                        <h2 className={`text-3xl font-black ${
                          result.risk === "High"   ? "text-high"   :
                          result.risk === "Medium" ? "text-medium" : "text-safe"
                        }`}>
                          {result.risk} Risk
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={shareResult}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> Share Result
                    </button>
                  </motion.div>
                )}

                {/* Phase 2 — AI Explanation Box (appears after 300 ms) */}
                {(revealPhase === "explanation" || revealPhase === "metrics") && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-panel p-6 bg-primary/5 border-primary/20 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Target className="w-24 h-24 text-primary" />
                    </div>
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" /> What does this mean for me?
                    </h3>
                    <p className="text-gray-300 leading-relaxed relative z-10">
                      <TypewriterText text={result.explanation} />
                    </p>
                  </motion.div>
                )}

                {/* Phase 3 — Metric Cards (appears after 600 ms, staggered) */}
                {revealPhase === "metrics" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <MetricCard title="Land Type"        value={result.land_type}                                          index={0} />
                    <MetricCard title="Terrain"          value={result.terrain}                                             index={1} />
                    <MetricCard title="Elevation"        value={`${result.elevation}m`}                                     index={2} />
                    <MetricCard title="Gov. Restricted?" value={result.gov_land ? `Yes (${result.gov_type})` : "No"}  alert={result.gov_land} index={3} />
                    <MetricCard title="On Public Road?"  value={result.on_road ? "Yes" : "No"}                         alert={result.on_road}  index={4} />
                    <MetricCard title="Surroundings"     value={`${result.res_pct}% Res.`} sub={`${result.ind_pct}% Ind.`}                      index={5} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Metric card sub-component ────────────────────────────────────────────────
function MetricCard({
  title, value, sub, alert, index = 0,
}: {
  title: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
      className={`glass-panel p-4 transition-colors duration-250 ${
        alert ? "border-red-500/50 bg-red-500/5" : ""
      }`}
    >
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className={`font-display font-bold text-lg ${alert ? "text-red-400" : "text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </motion.div>
  );
}

// ── Typewriter component for AI Insight reveal ────────────────────────────────
function TypewriterText({ text }: { text: string }) {
  const words = text.split(" ");
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.025 }
    }
  };
  
  const childVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" as const }
    }
  };
  
  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="inline-block"
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={childVariants}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
