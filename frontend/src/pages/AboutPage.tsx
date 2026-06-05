import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STATS = [
  { value: "7",      label: "AI Steps" },
  { value: "< 60s",  label: "Generation Time" },
  { value: "100%",   label: "AI-Powered" },
  { value: "Free",   label: "No Sign-up Needed" },
];

const FEATURES = [
  { emoji: "🧠", title: "Gemini 3 Flash", desc: "Google's fastest multi-modal model powers all 7 generation steps." },
  { emoji: "🍃", title: "MongoDB Atlas", desc: "Every plan is persisted to Atlas — retrieve it any time by ID." },
  { emoji: "⚡", title: "FastAPI + SSE", desc: "Real-time streaming via Server-Sent Events gives step-by-step live feedback." },
  { emoji: "◈",  title: "Open Source", desc: "Full source code on GitHub. Fork it, extend it, deploy it yourself." },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="font-sora antialiased min-h-screen" style={{ background: "hsl(240,25%,4%)" }}>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 md:px-14 pt-36 pb-24">
        {/* Header */}
        <div className="mb-14">
          <span
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "hsl(258,80%,78%)",
            }}
          >
            ✦ Rapid Agent Hackathon 2026
          </span>
          <h1
            className="font-bold uppercase leading-tight tracking-[-0.03em] mb-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "rgba(255,255,255,0.95)" }}
          >
            About{" "}
            <span style={{ color: "hsl(258,85%,74%)", textShadow: "0 0 40px rgba(139,92,246,0.45)" }}>
              PitchCraft
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: "1.85", fontSize: "1rem", maxWidth: "540px" }}>
            PitchCraft was built for the <strong style={{ color: "rgba(255,255,255,0.75)" }}>Rapid Agent Hackathon 2026</strong>,
            MongoDB Partner Track. The challenge: build a meaningful agentic AI application
            using MongoDB Atlas and Google Gemini within 72 hours.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 text-center"
              style={{ background: "hsl(240,15%,8%)", border: "1px solid hsl(240,12%,16%)" }}
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

        {/* Mission */}
        <div
          className="rounded-2xl p-7 mb-10"
          style={{
            background: "hsl(240,15%,8%)",
            border: "1px solid hsl(240,12%,16%)",
            borderLeft: "4px solid hsl(258,90%,66%)",
          }}
        >
          <h2 className="text-base font-semibold mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
            The Problem We Solve
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Most startup ideas die before they're ever shared — not because they're bad,
            but because the founder doesn't know how to frame them. Writing a business plan
            takes days of research, MBA-level financial modeling, and expensive consultants.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            PitchCraft collapses this from days to seconds. Describe your idea in plain English,
            and the 7-step AI agent hands you a complete, investor-grade plan with validation scores,
            market data, personas, financials, and risk analysis — ready to share.
          </p>
        </div>

        {/* Features */}
        <h2 className="text-sm uppercase tracking-widest font-semibold mb-5" style={{ color: "rgba(255,255,255,0.3)" }}>
          How It's Built
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-5 transition-colors duration-200"
              style={{ background: "hsl(240,15%,8%)", border: "1px solid hsl(240,12%,16%)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.35)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "hsl(240,12%,16%)")
              }
            >
              <span className="text-2xl block mb-3">{f.emoji}</span>
              <p className="text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                {f.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
            Try it yourself — no sign-up, no credit card.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate("/generate")}
              style={{
                background: "hsl(258,85%,64%)",
                color: "#fff",
                padding: "0.9rem 2rem",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.875rem",
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
              Generate My Plan →
            </button>
            <a
              href="https://github.com/SyedArmanAli2003/PitchCraft"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.9rem 2rem",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
                transition: "background 0.2s ease",
              }}
            >
              View on GitHub ↗
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
