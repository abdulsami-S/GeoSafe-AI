"use client";

import { motion } from "framer-motion";
import { Code2, Users, Database, Globe, BrainCircuit } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background Technology telemetry drift */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.10] select-none pointer-events-none font-mono text-[9px] text-primary">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-[12%] space-x-32 flex whitespace-nowrap"
        >
          <span>import geopandas as gpd</span>
          <span>from sklearn.ensemble import RandomForestClassifier</span>
          <span>import rasterio</span>
          <span>from shapely.geometry import Point</span>
        </motion.div>
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: "-100%" }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[18%] space-x-32 flex whitespace-nowrap"
        >
          <span>import next from 'next'</span>
          <span>import tailwindcss</span>
          <span>import leaflet as L</span>
          <span>import framer_motion</span>
        </motion.div>
      </div>

      {/* Story Section */}
      <section className="text-center mb-24 max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-normal text-white mb-6">
            About <span className="italic font-light text-primary">GeoSafe AI</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed font-light">
            We built GeoSafe AI to democratize spatial intelligence. Historically, accessing land safety data required expensive GIS software and specialized knowledge. We combined open-source geospatial data with machine learning to provide instant, accessible, and accurate land analysis for everyone.
          </p>
        </motion.div>
      </section>

      {/* Tech Stack Visualization */}
      <section className="mb-24">
        <h2 className="font-display text-3xl font-normal text-center text-white mb-10">
          Powered By <span className="italic font-light text-primary">Open Technology</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 90 }}
            whileHover={{ 
              scale: 1.025, 
              borderColor: "rgba(59,130,246,0.3)",
              boxShadow: "0 10px 25px -10px rgba(59,130,246,0.2)"
            }}
            className="glass-panel p-8 text-center transition-colors duration-300"
          >
            <motion.div 
              className="w-16 h-16 bg-blue-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4"
              whileHover={{ rotate: 15, scale: 1.05 }}
            >
              <Globe className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Modern Frontend</h3>
            <p className="text-gray-400 mb-4">A lightning-fast, accessible user interface.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Next.js 16</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Tailwind CSS</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Leaflet.js</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 90 }}
            whileHover={{ 
              scale: 1.025, 
              borderColor: "rgba(34,197,94,0.3)",
              boxShadow: "0 10px 25px -10px rgba(34,197,94,0.2)"
            }}
            className="glass-panel p-8 text-center transition-colors duration-300"
          >
            <motion.div 
              className="w-16 h-16 bg-green-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4"
              whileHover={{ rotate: 15, scale: 1.05 }}
            >
              <Database className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Robust Backend</h3>
            <p className="text-gray-400 mb-4">High-performance spatial queries and APIs.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">FastAPI</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">GeoPandas</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Shapely</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 90 }}
            whileHover={{ 
              scale: 1.025, 
              borderColor: "rgba(168,85,247,0.3)",
              boxShadow: "0 10px 25px -10px rgba(168,85,247,0.2)"
            }}
            className="glass-panel p-8 text-center transition-colors duration-300"
          >
            <motion.div 
              className="w-16 h-16 bg-purple-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4"
              whileHover={{ rotate: 15, scale: 1.05 }}
            >
              <BrainCircuit className="w-8 h-8 text-purple-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Machine Learning</h3>
            <p className="text-gray-400 mb-4">Intelligent risk classification models.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Scikit-Learn</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Random Forest</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Joblib</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-24">
        <h2 className="font-display text-3xl font-normal text-center text-white mb-10 flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Meet The <span className="italic font-light text-primary">Team</span>
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Abdul Sami",        role: "Lead Developer"     },
            { name: "Thrivikram",         role: "GIS Engineer"       },
            { name: "Leela Yashwanth",    role: "ML Engineer"        },
            { name: "Mohammad Samiullah", role: "Backend Developer"  },
          ].map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: i * 0.06 }}
              whileHover={{ 
                scale: 1.03,
                borderColor: "rgba(59,130,246,0.3)",
                boxShadow: "0 10px 25px -10px rgba(59,130,246,0.25)",
                backgroundColor: "rgba(255, 255, 255, 0.04)"
              }}
              className="glass-panel p-6 text-center transition-colors duration-300"
            >
              <motion.div 
                className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary/30 flex items-center justify-center cursor-pointer" 
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(59,130,246,0.1))' }}
                whileHover={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-2xl font-bold text-white select-none">{member.name.charAt(0)}</span>
              </motion.div>
              <h3 className="text-lg font-bold text-white">{member.name}</h3>
              <p className="text-sm text-primary mt-1">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="text-center">
        <motion.div 
          className="glass-panel p-10 max-w-3xl mx-auto bg-primary/5 border-primary/20 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Code2 className="w-12 h-12 text-white mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-4">Open Source</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto font-light">
            GeoSafe AI is an open-source project. Check out our repository, contribute, or run it locally yourself!
          </p>
          <motion.a 
            href="https://github.com/abdulsami-S/GeoSafe-AI" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Code2 className="w-5 h-5" /> View on GitHub
          </motion.a>
        </motion.div>
      </section>

    </div>
  );
}
