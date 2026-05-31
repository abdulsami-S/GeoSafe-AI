"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Menu, X, Home, Compass, Info } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/how-it-works", label: "How It Works", icon: Compass },
    { href: "/about", label: "About", icon: Info },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.6)]" style={{ backgroundColor: 'rgba(10,12,20,0.97)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div 
                className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors"
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Map className="w-6 h-6 text-primary" />
              </motion.div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                GeoSafe <span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative p-2.5 rounded-full transition-colors duration-200 group flex items-center justify-center ${
                      isActive ? "text-primary" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeNav"
                        className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <IconComponent className="w-5 h-5" />
                    
                    {/* Tooltip */}
                    <span className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-gray-900/95 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider text-gray-200 rounded-md px-2.5 py-1.5 border border-white/10 whitespace-nowrap shadow-[0_10px_20px_rgba(0,0,0,0.6)] z-[60] pointer-events-none">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
              
              <Link
                href="/analyze"
                className="relative"
              >
                <motion.div
                  className="font-sans tracking-wider uppercase bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center cursor-pointer"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 25px rgba(59,130,246,0.85)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Analyze Land
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-2 focus:outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <motion.div
              animate={{ rotate: mobileOpen ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden bg-[rgb(10,12,20)] border-t border-white/[0.08] px-4 pb-4 space-y-2 overflow-hidden"
          >
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? "text-white bg-white/5" : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/analyze"
              className="block pt-2"
              onClick={() => setMobileOpen(false)}
            >
              <div className="font-sans tracking-wider uppercase bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-xs font-semibold text-center transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                Analyze Land
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
