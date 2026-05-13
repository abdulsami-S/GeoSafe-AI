import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix: workspace root warning (multiple lockfiles detected)
  // Tells Turbopack to use this project's directory as root
  // instead of walking up to C:\Users\Dell\package-lock.json
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Fix: cross-origin hot-reload warning for LAN access
  allowedDevOrigins: ["172.20.10.7"],
};

export default nextConfig;
