"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Map, Droplets, TreePine, AlertTriangle, CheckCircle2, Factory, Home as HomeIcon, Tractor, Building } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/screenshots/background.jpg')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight mb-6">
              Know Your Land <br /> Before You Build
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10">
              Advanced spatial intelligence and machine learning to analyze land safety, environmental risks, and suitability in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/analyze"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] flex items-center justify-center gap-2"
              >
                Analyze Your Land Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/how-it-works"
                className="glass-panel hover:bg-white/5 text-white px-8 py-4 rounded-full text-lg font-bold transition-all flex items-center justify-center"
              >
                See How It Works
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
              { label: "AI Accuracy", value: "90%+" },
              { label: "Risk Levels", value: "3" },
              { label: "GIS Layers", value: "10+" },
              { label: "Analysis Time", value: "< 2s" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400 font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Powerful Process</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Non-technical? No problem. Get enterprise-grade spatial analysis in three simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 -translate-y-1/2 z-0" />
            
            {[
              { icon: Map, title: "1. Select Location", desc: "Drop a pin on the map or enter coordinates." },
              { icon: CheckCircle2, title: "2. AI Analysis", desc: "Our engine processes 10+ GIS layers instantly." },
              { icon: AlertTriangle, title: "3. Get Results", desc: "Receive simple, actionable land intelligence." }
            ].map((step, i) => (
              <motion.div
                key={i}
                className="relative z-10 glass-panel p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Comprehensive Features</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Droplets, title: "Water Detection", desc: "Identifies nearby rivers, lakes, and oceans." },
              { icon: TreePine, title: "Forest Awareness", desc: "Checks proximity to protected forest zones." },
              { icon: Factory, title: "Surrounding Analysis", desc: "Calculates % of nearby industrial/residential zones." },
              { icon: AlertTriangle, title: "Risk Score", desc: "Machine learning classification (Low/Medium/High)." },
              { icon: HomeIcon, title: "Infrastructure", desc: "Detects proximity to roads and buildings." },
              { icon: CheckCircle2, title: "Plain English Insights", desc: "AI explains the results so anyone can understand." }
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-6 flex gap-4 hover:bg-white/5 transition-colors">
                <div className="shrink-0 mt-1">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Who Is This For?</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HomeIcon, title: "Urban Planners", desc: "Ensure new developments are safe and compliant." },
              { icon: Tractor, title: "Farmers", desc: "Find safe, suitable land for agriculture." },
              { icon: Building, title: "Investors", desc: "Assess risk before buying commercial real estate." },
              { icon: AlertTriangle, title: "Government", desc: "Monitor encroachments in restricted zones." }
            ].map((useCase, i) => (
              <motion.div
                key={i}
                className="glass-panel p-6 border-t-4"
                style={{ borderTopColor: "var(--primary)" }}
                whileHover={{ y: -5 }}
              >
                <useCase.icon className="w-10 h-10 text-white mb-4" />
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
