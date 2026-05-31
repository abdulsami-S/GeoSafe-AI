"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Map, Droplets, TreePine, AlertTriangle,
  CheckCircle2, Factory, Home as HomeIcon, Tractor, Building,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero Section ──────────────────────────────────────────────────────
          Uses pure CSS gradients + dot overlay. No external image dependency.
          Added slowly rotating compass rose grid + drifting coordinate stream. */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-[#0a0c14] py-16">
        {/* Base gradient fill — always visible on any screen */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #020c2e 0%, #0a0c14 50%, #011a0a 100%)' }} />
        {/* Radial "glow" centred behind the headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full blur-[100px]" style={{ background: 'rgba(59,130,246,0.15)' }} />
        {/* Secondary accent glow */}
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full blur-[80px]" style={{ background: 'rgba(16,185,129,0.10)' }} />
        
        {/* Grid dot overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(59,130,246,0.7) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        {/* Slowly rotating Compass / Radar Grid */}
        <motion.div
          className="absolute right-[-10%] top-[-10%] w-[650px] h-[650px] opacity-[0.07] text-primary pointer-events-none select-none hidden lg:block"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 75, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5">
            <circle cx="100" cy="100" r="90" strokeDasharray="3,3" />
            <circle cx="100" cy="100" r="70" />
            <circle cx="100" cy="100" r="50" strokeDasharray="5,5" />
            <circle cx="100" cy="100" r="30" />
            <line x1="100" y1="5" x2="100" y2="195" />
            <line x1="5" y1="100" x2="195" y2="100" />
            <line x1="36.36" y1="36.36" x2="163.64" y2="163.64" strokeDasharray="3,3" />
            <line x1="36.36" y1="163.64" x2="163.64" y2="36.36" strokeDasharray="3,3" />
            <path d="M100,5 L96,15 L104,15 Z" fill="currentColor" />
            <path d="M100,195 L96,185 L104,185 Z" fill="currentColor" />
            <path d="M5,100 L15,96 L15,104 Z" fill="currentColor" />
            <path d="M195,100 L185,96 L185,104 Z" fill="currentColor" />
          </svg>
        </motion.div>

        {/* Drifting Coordinates stream */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.08] select-none pointer-events-none font-mono text-[9px] text-primary">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "-100%" }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute left-[5%] space-y-24"
          >
            <div>LAT: 17.38504° N<br/>LON: 78.48667° E</div>
            <div>LAT: 40.71278° N<br/>LON: -74.00594° W</div>
            <div>LAT: 51.50735° N<br/>LON: -0.12776° W</div>
            <div>LAT: 35.67620° N<br/>LON: 139.6503° E</div>
          </motion.div>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "-100%" }}
            transition={{ duration: 48, repeat: Infinity, ease: "linear", delay: 8 }}
            className="absolute right-[5%] space-y-24"
          >
            <div>ELEV: 542m<br/>SLOPE: 4.2%</div>
            <div>ELEV: 12m<br/>SLOPE: 0.8%</div>
            <div>ELEV: 104m<br/>SLOPE: 12.5%</div>
            <div>ELEV: 35m<br/>SLOPE: 1.5%</div>
          </motion.div>
        </div>

        {/* Bottom fade into page background */}
        <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: 'linear-gradient(to top, #0a0c14, transparent)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-widest uppercase mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Geospatial Analysis
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-normal tracking-tight mb-6 leading-tight">
              <span className="text-white italic">Know Your Land</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent font-medium">
                Before You Build
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
              Advanced spatial intelligence and machine learning to analyze land
              safety, environmental risks, and suitability in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/analyze"
                className="font-sans tracking-widest uppercase"
              >
                <motion.div
                  className="bg-primary text-white px-8 py-4 rounded-full text-xs font-bold shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_35px_rgba(59,130,246,0.85)] flex items-center justify-center gap-2 group cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Analyze Your Land Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </Link>
              <Link
                href="/how-it-works"
                className="font-sans tracking-widest uppercase"
              >
                <motion.div
                  className="glass-panel hover:bg-white/5 text-white px-8 py-4 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  See How It Works
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "AI Accuracy",    value: "90%+" },
              { label: "Risk Levels",    value: "3"    },
              { label: "GIS Layers",     value: "10+"  },
              { label: "Analysis Time",  value: "< 2s" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 80 }}
              >
                <div className="font-display text-5xl font-light text-white mb-2">{stat.value}</div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — 3 Steps */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-normal text-white mb-4">Simple, <span className="italic font-light text-primary">Powerful</span> Process</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Non-technical? No problem. Get enterprise-grade spatial analysis in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">

            {[
              { icon: Map,          title: "1. Select Location", desc: "Drop a pin on the map or enter coordinates." },
              { icon: CheckCircle2, title: "2. AI Analysis",     desc: "Our engine processes 10+ GIS layers instantly." },
              { icon: AlertTriangle, title: "3. Get Results",    desc: "Receive simple, actionable land intelligence." },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="relative z-10 glass-panel p-8 text-center transition-all duration-300"
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ 
                  y: -8, 
                  borderColor: "rgba(59,130,246,0.3)",
                  boxShadow: "0 12px 30px -10px rgba(59,130,246,0.3)"
                }}
              >
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-normal text-white mb-4">Comprehensive <span className="italic font-light text-primary">Features</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Droplets,     title: "Water Detection",       desc: "Identifies nearby rivers, lakes, and oceans." },
              { icon: TreePine,     title: "Forest Awareness",      desc: "Checks proximity to protected forest zones." },
              { icon: Factory,      title: "Surrounding Analysis",  desc: "Calculates % of nearby industrial/residential zones." },
              { icon: AlertTriangle,title: "Risk Score",            desc: "Machine learning classification (Low/Medium/High)." },
              { icon: HomeIcon,     title: "Infrastructure",        desc: "Detects proximity to roads and buildings." },
              { icon: CheckCircle2, title: "Plain English Insights",desc: "AI explains results so anyone can understand." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="glass-panel p-6 flex gap-4 transition-colors duration-300"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(59,130,246,0.25)",
                  boxShadow: "0 8px 25px -10px rgba(59,130,246,0.15)"
                }}
              >
                <div className="shrink-0 mt-1">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-normal text-white mb-4">Who Is <span className="italic font-light text-primary">This For?</span></h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HomeIcon,     title: "Urban Planners", desc: "Ensure new developments are safe and compliant." },
              { icon: Tractor,      title: "Farmers",        desc: "Find safe, suitable land for agriculture." },
              { icon: Building,     title: "Investors",      desc: "Assess risk before buying commercial real estate." },
              { icon: AlertTriangle,title: "Government",     desc: "Monitor encroachments in restricted zones." },
            ].map((useCase, i) => (
              <motion.div
                key={i}
                className="glass-panel p-6 border-t-4 transition-all duration-300"
                style={{ borderTopColor: "rgb(var(--primary))" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 80 }}
                whileHover={{ 
                  y: -10, 
                  backgroundColor: "rgba(255,255,255,0.04)",
                  boxShadow: "0 15px 35px -10px rgba(59,130,246,0.35)"
                }}
              >
                <useCase.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                <p className="text-gray-400 text-sm">{useCase.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
