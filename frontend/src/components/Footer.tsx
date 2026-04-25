export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/50 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
        <p>© {new Date().getFullYear()} GeoSafe AI. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="https://github.com/abdulsami-S/GeoSafe-AI" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
