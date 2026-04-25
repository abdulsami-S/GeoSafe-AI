import Link from "next/link";
import { Map, ShieldAlert } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel !rounded-none !border-t-0 !border-l-0 !border-r-0 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                <Map className="w-6 h-6 text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                GeoSafe <span className="text-primary">AI</span>
              </span>
            </Link>
          </div>
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
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]"
              >
                Analyze Land
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
