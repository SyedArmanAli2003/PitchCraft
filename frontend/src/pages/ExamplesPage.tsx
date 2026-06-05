import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const EXAMPLES = [
  {
    idea: "An AI-powered meal planning app that learns your dietary preferences and generates grocery lists automatically",
    score: 8.4,
    market: "$52B",
    growth: "18% YoY",
    personas: ["Busy Professional", "Health-Conscious Parent", "Fitness Enthusiast"],
    revenue: "$280K / $890K / $2.1M",
    category: "Health Tech",
    color: "hsl(142,71%,45%)",
  },
  {
    idea: "A SaaS platform for small law firms to automate client intake, document generation, and billing",
    score: 7.9,
    market: "$23B",
    growth: "14% YoY",
    personas: ["Solo Attorney", "Paralegal", "Small Firm Partner"],
    revenue: "$120K / $580K / $1.6M",
    category: "Legal Tech",
    color: "hsl(258,85%,64%)",
  },
  {
    idea: "A B2B marketplace connecting African artisan manufacturers directly with European retail buyers",
    score: 7.2,
    market: "$8.4B",
    growth: "22% YoY",
    personas: ["EU Retail Buyer", "African SME Maker", "Fair-Trade Retailer"],
    revenue: "$65K / $310K / $980K",
    category: "E-Commerce",
    color: "hsl(38,92%,55%)",
  },
];

export default function ExamplesPage() {
  const navigate = useNavigate();

  return (
    <div className="font-sora antialiased min-h-screen" style={{ background: "hsl(240,25%,4%)" }}>
      <Navbar />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 md:px-14 pt-36 pb-12 text-center">
        <span
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
          style={{
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "hsl(258,80%,78%)",
          }}
        >
          ✦ 3 Sample Plans · AI-Generated
        </span>
        <h1
          className="font-bold uppercase leading-tight tracking-[-0.03em] mb-5"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "rgba(255,255,255,0.95)" }}
        >
          Example{" "}
          <span style={{ color: "hsl(258,85%,74%)", textShadow: "0 0 40px rgba(139,92,246,0.45)" }}>
            Business Plans
          </span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", maxWidth: "500px", margin: "0 auto" }}>
          See what PitchCraft generates in under 60 seconds — real outputs from the 7-step AI agent.
        </p>
      </div>

      {/* Plan cards */}
      <div className="max-w-4xl mx-auto px-6 md:px-14 pb-24 flex flex-col gap-8">
        {EXAMPLES.map((ex, i) => (
          <div
            key={i}
            className="rounded-2xl p-7 transition-colors duration-200"
            style={{
              background: "hsl(240,15%,8%)",
              border: "1px solid hsl(240,12%,15%)",
              borderLeftWidth: "4px",
              borderLeftColor: ex.color,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderTopColor = ex.color)
            }
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div className="flex-1">
                <span
                  className="text-xs px-2.5 py-1 rounded-full mb-3 inline-block"
                  style={{
                    background: `${ex.color}18`,
                    border: `1px solid ${ex.color}40`,
                    color: ex.color,
                  }}
                >
                  {ex.category}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", maxWidth: "520px" }}>
                  "{ex.idea}"
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>
                  Viability
                </p>
                <p className="text-4xl font-bold" style={{ color: ex.color, lineHeight: 1 }}>
                  {ex.score}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>/10</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { label: "Market Size", value: ex.market },
                { label: "Growth Rate", value: ex.growth },
                { label: "3-Year Revenue", value: ex.revenue },
                { label: "Personas", value: ex.personas.length + " profiles" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {stat.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Personas */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", alignSelf: "center" }}>
                Personas:
              </span>
              {ex.personas.map((p) => (
                <span
                  key={p}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  👤 {p}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="text-center mt-8">
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
            Your idea is next. Generate a real plan in 60 seconds.
          </p>
          <button
            onClick={() => navigate("/generate")}
            style={{
              background: "hsl(258,85%,64%)",
              color: "#fff",
              padding: "0.9rem 2.25rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 28px rgba(139,92,246,0.45)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.boxShadow = "none")
            }
          >
            Generate My Plan — Free →
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
