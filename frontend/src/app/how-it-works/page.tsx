"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Layers, Cpu, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">How GeoSafe AI Works</h1>
        <p className="text-xl text-gray-400">From a simple map click to advanced spatial intelligence.</p>
      </div>

      <div className="space-y-12 relative before:absolute before:inset-0 before:ml-[28px] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-primary/50 before:to-transparent z-0">
        
        <Step 
          number={1} 
          icon={MapPin} 
          title="User Input" 
          description="You provide a location and your intended purpose (like building a house or starting a farm)." 
          tech="We take the WGS84 (EPSG:4326) coordinates from the Leaflet map and pass it to our FastAPI backend. The point is validated and buffered if necessary."
        />

        <Step 
          number={2} 
          icon={Layers} 
          title="GIS Feature Extraction" 
          description="We instantly check the surrounding area for water bodies, forests, elevation, and existing infrastructure." 
          tech="Using GeoPandas and Shapely, the point is converted to EPSG:3857 for accurate meter-based spatial queries. We use R-Tree spatial indexing (.sindex) on massive OpenStreetMap shapefiles to perform sub-second intersections."
        />

        <Step 
          number={3} 
          icon={Cpu} 
          title="Machine Learning Classifier" 
          description="Our AI compares your location against thousands of past safety scenarios to recognize patterns." 
          tech="A Scikit-Learn Random Forest Classifier receives a feature vector (e.g., [dist_river, dist_lake, dist_ocean, dist_forest, elevation, terrain_val]) and outputs a probability array mapping to classes 0 (Low), 1 (Medium), or 2 (High) risk."
        />

        <Step 
          number={4} 
          icon={ShieldAlert} 
          title="Intelligent Risk Output" 
          description="You get a clear, color-coded safety rating along with plain-English advice on whether the land is suitable for your purpose." 
          tech="The raw ML output is combined with deterministic rule-based checks (e.g., 'Is this exactly on a road?'). The backend generates a dynamic, context-aware explanation string and returns the payload to the Next.js frontend."
        />

      </div>
    </div>
  );
}

function Step({ number, icon: Icon, title, description, tech }: any) {
  const [showTech, setShowTech] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-12 md:even:flex-row-reverse group"
    >
      {/* Number Icon */}
      <div className="absolute md:relative left-0 md:left-auto w-14 h-14 bg-background border-4 border-primary/30 rounded-full flex items-center justify-center text-primary font-bold text-xl group-hover:border-primary group-hover:bg-primary/10 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0">
        {number}
      </div>

      {/* Content */}
      <div className="ml-20 md:ml-0 glass-panel p-6 md:w-[calc(50%-3rem)] hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        
        <p className="text-gray-300 text-lg leading-relaxed mb-4">
          {description}
        </p>

        <button 
          onClick={() => setShowTech(!showTech)}
          className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          {showTech ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showTech ? "Hide Technical Details" : "View Technical Details"}
        </button>

        <AnimatePresence>
          {showTech && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5 text-sm text-gray-400 font-mono leading-relaxed">
                {tech}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
