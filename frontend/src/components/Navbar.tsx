import { memo } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = ["How It Works", "Examples", "API", "Pricing", "GitHub"] as const;

const Navbar = memo(function Navbar() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 lg:px-16 py-5"
      style={{ background: "transparent" }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="text-xl font-semibold tracking-tight select-none cursor-pointer bg-transparent border-none p-0"
        style={{ color: "inherit" }}
      >
        <span style={{ color: "hsl(258,90%,72%)" }}>✦</span>
        <span style={{ color: "rgba(255,255,255,0.9)" }}> Pitch</span>
        <span style={{ color: "hsl(258,90%,72%)" }}>Craft</span>
      </button>

      {/* Center links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="text-sm uppercase tracking-widest cursor-pointer transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onClick={(e) => e.preventDefault()}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.4)")
            }
          >
            {link}
          </a>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/generate")}
        className="hidden md:inline-flex cursor-pointer"
        style={{
          background: "hsl(258,90%,66%)",
          color: "#fff",
          border: "none",
          padding: "0.6rem 1.25rem",
          borderRadius: "6px",
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transition: "opacity 0.2s ease",
          opacity: 1,
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
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
