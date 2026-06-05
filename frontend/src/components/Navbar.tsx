const NAV_LINKS = [
  "How It Works",
  "Examples",
  "API",
  "Pricing",
  "GitHub",
] as const;

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16 py-5">
      {/* Logo */}
      <a href="/" className="flex items-center gap-1 select-none">
        <span className="text-primary mr-0.5">✦</span>
        <span className="text-xl font-semibold text-foreground">
          Pitch<span className="text-primary">Craft</span>
        </span>
      </a>

      {/* Center nav links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            {link}
          </a>
        ))}
      </div>

      {/* CTA button */}
      <button
        className="
          hidden md:inline-flex items-center
          bg-nav-button hover:bg-nav-button/80
          text-foreground
          text-xs uppercase tracking-widest font-medium
          px-6 py-3 rounded-lg
          transition-colors duration-200
          cursor-pointer border border-border
        "
      >
        Generate Plan
      </button>
    </nav>
  );
}
