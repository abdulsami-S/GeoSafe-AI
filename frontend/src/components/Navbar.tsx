"use client";

import Link from "next/link";
import { Map, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.6)]" style={{ backgroundColor: 'rgba(10,12,20,0.97)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                <Map className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                GeoSafe <span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/how-it-works"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
              <Link
                href="/analyze"
                className="font-display bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]"
              >
                Analyze Land
              </Link>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[rgb(10,12,20)] border-t border-white/[0.08] px-4 pb-4 space-y-2">
          <Link
            href="/how-it-works"
            className="block text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            How It Works
          </Link>
          <Link
            href="/about"
            className="block text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium"
            onClick={() => setMobileOpen(false)}
          >
            About
          </Link>
          <Link
            href="/analyze"
            className="block font-display bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-semibold text-center transition-all"
            onClick={() => setMobileOpen(false)}
          >
            Analyze Land
          </Link>
        </div>
      )}
    </nav>
  );
}
