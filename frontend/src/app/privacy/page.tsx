"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Eye, Lock, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-white mb-4">
            Privacy <span className="italic font-light text-primary">Policy</span>
          </h1>
          <p className="text-gray-400">Last updated: May 31, 2026</p>
        </div>

        <div className="glass-panel p-8 sm:p-10 space-y-8 text-gray-300 leading-relaxed font-light">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> 1. Information We Collect
            </h2>
            <p>
              GeoSafe AI does not require user registration. We collect and process only the inputs you explicitly provide:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Geospatial coordinates (Latitude and Longitude)</li>
              <li>Your intended land development purpose (General, Residential, Industrial, Farming)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> 2. How We Use Your Data
            </h2>
            <p>
              Your geospatial inputs are used solely to run spatial queries against local GIS databases and our Random Forest ML classifier. 
              To optimize performance and eliminate redundant API calculations, queries are rounded to 3 decimal places (~111m precision) and stored in a temporary in-memory FIFO cache. No persistent databases are used.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> 3. Cookies and Analytics
            </h2>
            <p>
              We do not use tracking cookies, third-party trackers, or display advertising on our platform. Any settings configurations (such as layout choices) are stored locally in your browser's Local Storage and are never transmitted to our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🛡️ 4. Data Security
            </h2>
            <p>
              We employ standard transport layer security (HTTPS) to encrypt data in transit between your browser and our API servers. Because we do not store personal identification information, there is no risk of exposing confidential databases.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ✉️ 5. Contact Us
            </h2>
            <p>
              If you have any questions about this privacy statement, please contact the GeoSafe AI Open Source Team on our GitHub repository.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
