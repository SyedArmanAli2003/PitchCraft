import { memo } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { label: "How It Works", to: "/how-it-works", external: false },
  { label: "Examples",     to: "/examples",      external: false },
  { label: "Docs",         to: "/docs",           external: false },
  { label: "About",        to: "/about",          external: false },
  { label: "GitHub",       to: "https://github.com/SyedArmanAli2003/PitchCraft", external: true },
] as const;

const Navbar = memo(function Navbar() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 lg:px-14 py-4"
      style={{
        /* Dark fill so heading text never bleeds through on any page.
           Using rgba instead of hsl so alpha works correctly. */
        background: "rgba(7, 6, 18, 0.88)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="shrink-0 text-lg font-semibold tracking-tight select-none cursor-pointer bg-transparent border-none p-0"
        aria-label="PitchCraft home"
      >
        <span style={{ color: "hsl(258,90%,72%)" }}>✦</span>
        <span style={{ color: "rgba(255,255,255,0.9)" }}> Pitch</span>
        <span style={{ color: "hsl(258,90%,72%)" }}>Craft</span>
      </button>

      {/* Center nav links — hidden below lg */}
      <div className="hidden lg:flex items-center gap-7">
        {NAV_LINKS.map((link) =>
          link.external ? (
            <a
              key={link.label}
              href={link.to}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs uppercase tracking-widest cursor-pointer transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.85)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.4)")
              }
            >
              {link.label}
            </a>
          ) : (
            <button
              key={link.label}
              onClick={() => navigate(link.to)}
              className="text-xs uppercase tracking-widest cursor-pointer bg-transparent border-none transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "inherit" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.85)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.4)")
              }
            >
              {link.label}
            </button>
          )
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/generate")}
        className="cursor-pointer"
        style={{
          background: "hsl(258,90%,66%)",
          color: "#fff",
          border: "none",
          padding: "0.55rem 1.2rem",
          borderRadius: "6px",
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transition: "opacity 0.2s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "0.82")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
        }
      >
        Generate Plan
      </button>
    </nav>
  );
});

export default Navbar;
