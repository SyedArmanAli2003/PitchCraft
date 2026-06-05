import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const ABOUT_STATS = [
  { value: "7", label: "AI Agent Steps" },
  { value: "60s", label: "Avg. Generation" },
  { value: "100%", label: "AI-Powered" },
  { value: "Free", label: "No Sign-up" },
];

const HOW_STEPS = [
  { emoji: "✅", title: "Idea Validation", desc: "Viability score, one-line pitch, target market, and key concerns." },
  { emoji: "📊", title: "Market Research", desc: "TAM, growth rate, competitors, and the gap your idea fills." },
  { emoji: "👤", title: "Customer Personas", desc: "3 detailed buyer profiles with pain points and WTP estimates." },
  { emoji: "📋", title: "Business Plan", desc: "Problem, solution, USP, revenue model, and GTM strategy." },
  { emoji: "💰", title: "Financial Projections", desc: "3-year revenue, burn rate, break-even, and funding needs." },
  { emoji: "🛡", title: "Risk Analysis", desc: "Top risks ranked by severity with mitigation strategies." },
  { emoji: "⚡", title: "SWOT Matrix", desc: "Full SWOT analysis formatted for pitch decks." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="font-sora antialiased" style={{ background: "hsl(240,25%,4%)" }}>
      <Navbar />
      <HeroSection />

      {/* ── About / How It Works Section ──────────────────── */}
      <section
        id="about"
        style={{ background: "hsl(240,18%,5%)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        className="py-24 px-6 md:px-14"
      >
        <div className="max-w-5xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-16">
            <span
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "hsl(258,80%,78%)",
              }}
            >
              ✦ 7-Step AI Agent
            </span>
            <h2
              className="font-bold uppercase leading-tight tracking-[-0.03em] mb-4"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "rgba(255,255,255,0.95)" }}
            >
              Everything your plan needs,{" "}
              <span style={{ color: "hsl(258,85%,74%)" }}>automated.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", maxWidth: "480px", margin: "0 auto", fontSize: "0.95rem" }}>
              One prompt. Seven AI steps. A complete business plan in under 60 seconds.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {ABOUT_STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-5 text-center"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid hsl(240,12%,15%)" }}
              >
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ color: "hsl(258,85%,74%)", textShadow: "0 0 20px rgba(139,92,246,0.4)" }}
                >
                  {s.value}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
            {HOW_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl p-5 transition-colors duration-200"
                style={{
                  background: "hsl(240,15%,8%)",
                  border: "1px solid hsl(240,12%,15%)",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.35)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.borderColor = "hsl(240,12%,15%)")
                }
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{step.emoji}</span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "rgba(124,58,237,0.6)" }}
                  >
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => navigate("/generate")}
              style={{
                background: "hsl(258,85%,64%)",
                color: "#fff",
                padding: "1rem 2.5rem",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "box-shadow 0.25s ease",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(139,92,246,0.45)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.boxShadow = "none")
              }
            >
              Start Generating — Free →
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
