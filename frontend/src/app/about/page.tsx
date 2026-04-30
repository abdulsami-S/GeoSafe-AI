"use client";

import { motion } from "framer-motion";
import { Code2, Users, Database, Globe, BrainCircuit } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Story Section */}
      <section className="text-center mb-24 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">About GeoSafe AI</h1>
        <p className="text-xl text-gray-300 leading-relaxed">
          We built GeoSafe AI to democratize spatial intelligence. Historically, accessing land safety data required expensive GIS software and specialized knowledge. We combined open-source geospatial data with machine learning to provide instant, accessible, and accurate land analysis for everyone.
        </p>
      </section>

      {/* Tech Stack Visualization */}
      <section className="mb-24">
        <h2 className="text-3xl font-bold text-center text-white mb-10">Powered By Open Technology</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-panel p-8 text-center hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Modern Frontend</h3>
            <p className="text-gray-400 mb-4">A lightning-fast, accessible user interface.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Next.js 14</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Tailwind CSS</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Leaflet.js</span>
            </div>
          </div>

          <div className="glass-panel p-8 text-center hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Robust Backend</h3>
            <p className="text-gray-400 mb-4">High-performance spatial queries and APIs.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">FastAPI</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">GeoPandas</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Shapely</span>
            </div>
          </div>

          <div className="glass-panel p-8 text-center hover:-translate-y-2 transition-transform">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <BrainCircuit className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Machine Learning</h3>
            <p className="text-gray-400 mb-4">Intelligent risk classification models.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Scikit-Learn</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Random Forest</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300">Joblib</span>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-24">
        <h2 className="text-3xl font-bold text-center text-white mb-10 flex items-center justify-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Meet The Team
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {["Abdul Sami", "Thrivikram", "Leela Yashwanth", "Mohammad Samiullah"].map((name, i) => (
            <motion.div 
              key={name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-6 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-primary/40 to-primary/10 rounded-full mx-auto mb-4 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{name.charAt(0)}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-sm text-primary">Core Contributor</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* GitHub CTA */}
      <section className="text-center">
        <div className="glass-panel p-10 max-w-3xl mx-auto bg-primary/5 border-primary/20">
          <Code2 className="w-12 h-12 text-white mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Open Source</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            GeoSafe AI is an open-source project. Check out our repository, contribute, or run it locally yourself!
          </p>
          <a 
            href="https://github.com/abdulsami-S/GeoSafe-AI" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-full font-bold transition-colors"
          >
            <Code2 className="w-5 h-5" /> View on GitHub
          </a>
        </div>
      </section>

    </div>
  );
}
