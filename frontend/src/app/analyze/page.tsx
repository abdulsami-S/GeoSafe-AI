"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Info, Navigation, Share2, AlertTriangle, CheckCircle, ShieldAlert, Target, Loader2, InfoIcon } from "lucide-react";
import MapWrapper from "@/components/MapWrapper";

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

export default function AnalyzePage() {
  const [lat, setLat] = useState<string>("");
  const [lon, setLon] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("General");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo Location: Hyderabad, India
  const loadDemo = () => {
    setLat("17.3850");
    setLon("78.4867");
    setPurpose("Residential");
  };

  const handleMapSelect = (newLat: number, newLon: number) => {
    setLat(newLat.toFixed(5));
    setLon(newLon.toFixed(5));
  };

  const analyzeLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lat || !lon) {
      setError("Please enter or select a location.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: parseFloat(lat), lon: parseFloat(lon), purpose }),
      });

      if (!response.ok) throw new Error("Failed to analyze location");
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const shareResult = async () => {
    if (!result) return;
    
    const shareText = `GeoSafe AI Land Analysis:\nRisk Level: ${result.risk}\nLocation: ${lat}, ${lon}\nAI Insight: ${result.explanation}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GeoSafe AI Land Analysis',
          text: shareText,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Result copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Analyze Land Safety</h1>
        <p className="text-gray-400">Select a location to run instant AI spatial analysis.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Map */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6">
            <form onSubmit={analyzeLand} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  Coordinates
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Latitude (N/S) and Longitude (E/W) pinpoint exact locations on Earth. Click on the map to autofill.
                    </div>
                  </div>
                </label>
                <button type="button" onClick={loadDemo} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Try Demo Location
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Intended Purpose</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="General">General Analysis</option>
                  <option value="Residential">Residential (Housing)</option>
                  <option value="Industrial">Industrial (Factories)</option>
                  <option value="Farming">Farming (Agriculture)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing AI Analysis...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" /> Run Safety Scan
                  </>
                )}
              </button>
              
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </form>
          </div>

          <div className="glass-panel overflow-hidden h-[400px] relative">
            <MapWrapper 
              lat={parseFloat(lat) || 20} 
              lon={parseFloat(lon) || 0} 
              onLocationSelect={handleMapSelect}
              riskLevel={result?.risk}
            />
            <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <InfoIcon className="w-3 h-3 text-primary" /> Click map to select location
            </div>
          </div>
        </div>

        {/* Right Column: Results Dashboard */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center text-center p-8 border-dashed"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                  <Target className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Awaiting Location</h3>
                <p className="text-gray-400 max-w-sm">
                  Enter coordinates or select a point on the map to generate a comprehensive land intelligence report.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center p-8"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                  <Target className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">AI Analyzing Terrain...</h3>
                <div className="space-y-3 w-full max-w-xs">
                  {[
                    "Querying GIS databases...",
                    "Calculating spatial distance to water...",
                    "Running Random Forest classifier...",
                    "Generating environmental insights..."
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <motion.div 
                          className="w-2 h-2 bg-primary rounded-full"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                        />
                      </div>
                      {step}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Risk Banner */}
                <div className={`glass-panel p-6 flex flex-col sm:flex-row items-center justify-between border-l-4 ${
                  result.risk === 'High' ? 'border-l-high bg-high/5' : 
                  result.risk === 'Medium' ? 'border-l-medium bg-medium/5' : 
                  'border-l-safe bg-safe/5'
                }`}>
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      result.risk === 'High' ? 'bg-high/20 text-high' : 
                      result.risk === 'Medium' ? 'bg-medium/20 text-medium' : 
                      'bg-safe/20 text-safe'
                    }`}>
                      {result.risk === 'High' ? <ShieldAlert className="w-7 h-7" /> : 
                       result.risk === 'Medium' ? <AlertTriangle className="w-7 h-7" /> : 
                       <CheckCircle className="w-7 h-7" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium">AI Risk Assessment</p>
                      <h2 className={`text-3xl font-black ${
                        result.risk === 'High' ? 'text-high' : 
                        result.risk === 'Medium' ? 'text-medium' : 
                        'text-safe'
                      }`}>{result.risk} Risk</h2>
                    </div>
                  </div>
                  <button onClick={shareResult} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors">
                    <Share2 className="w-4 h-4" /> Share Result
                  </button>
                </div>

                {/* AI Explanation Box */}
                <div className="glass-panel p-6 bg-primary/5 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Target className="w-24 h-24 text-primary" />
                  </div>
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" /> What does this mean for me?
                  </h3>
                  <p className="text-gray-300 leading-relaxed relative z-10">
                    {result.explanation}
                  </p>
                </div>

                {/* Environmental Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MetricCard title="Land Type" value={result.land_type} />
                  <MetricCard title="Terrain" value={result.terrain} />
                  <MetricCard title="Elevation" value={`${result.elevation}m`} />
                  <MetricCard title="Gov. Restricted?" value={result.gov_land ? `Yes (${result.gov_type})` : "No"} alert={result.gov_land} />
                  <MetricCard title="On Public Road?" value={result.on_road ? "Yes" : "No"} alert={result.on_road} />
                  <MetricCard title="Surroundings" value={`${result.res_pct}% Res.`} sub={`${result.ind_pct}% Ind.`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, alert }: { title: string, value: string | number, sub?: string, alert?: boolean }) {
  return (
    <div className={`glass-panel p-4 ${alert ? 'border-red-500/50 bg-red-500/5' : ''}`}>
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className={`font-bold text-lg ${alert ? 'text-red-400' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
