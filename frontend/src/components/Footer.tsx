import { useNavigate } from "react-router-dom";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "How It Works", to: "/how-it-works" },
      { label: "Examples",     to: "/examples" },
      { label: "Generate Plan",to: "/generate" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", to: "/docs" },
      { label: "About",         to: "/about" },
      { label: "GitHub", to: "https://github.com/SyedArmanAli2003/PitchCraft", external: true },
    ],
  },
  {
    heading: "Built With",
    links: [
      { label: "Gemini 3 Flash", to: "https://aistudio.google.com", external: true },
      { label: "MongoDB Atlas",  to: "https://www.mongodb.com/atlas", external: true },
      { label: "FastAPI",        to: "https://fastapi.tiangolo.com", external: true },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      style={{
        background: "hsl(240,20%,4%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto px-8 md:px-14 pt-16 pb-10">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="md:col-span-1">
            <button
              onClick={() => navigate("/")}
              className="text-lg font-semibold tracking-tight cursor-pointer bg-transparent border-none p-0 mb-4 block"
            >
              <span style={{ color: "hsl(258,90%,72%)" }}>✦</span>
              <span style={{ color: "rgba(255,255,255,0.9)" }}> Pitch</span>
              <span style={{ color: "hsl(258,90%,72%)" }}>Craft</span>
            </button>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", lineHeight: "1.7" }}>
              Turn any startup idea into a complete business plan in under 60 seconds using AI.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="https://github.com/SyedArmanAli2003/PitchCraft"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-full transition-colors duration-200"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.85)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.5)")
                }
              >
                ★ Star on GitHub
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <p
                className="text-xs uppercase tracking-widest mb-4 font-medium"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm transition-colors duration-200"
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
                        {link.label} ↗
                      </a>
                    ) : (
                      <button
                        onClick={() => navigate(link.to)}
                        className="text-sm transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 text-left"
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
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
            © 2026 PitchCraft. Built for the Rapid Agent Hackathon · MongoDB Partner Track.
          </p>
          <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.72rem" }}>
            Powered by Gemini 3 Flash + MongoDB Atlas + FastAPI
          </p>
        </div>
      </div>
    </footer>
  );
}
