import ParticleBackground from "./ParticleBackground";
import { useNavigate } from "react-router-dom";

const TECH_PILLS = ["🍃 MongoDB", "✦ Gemini 3 Flash", "⚡ FastAPI", "◈ Google Cloud"] as const;

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      className="relative flex items-end overflow-hidden"
      style={{
        background: "hsl(240,25%,4%)",
        /* Ensure section is always tall enough so the pill never collides with the fixed navbar */
        minHeight: "max(100dvh, 760px)",
      }}
    >
      {/* ── Interactive Three.js background ─────────────────── */}
      <ParticleBackground />

      {/* ── Gradient overlays for content readability ──────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 80% 60% at 70% 30%, rgba(109,40,217,0.12) 0%, transparent 70%)",
            "linear-gradient(to top, hsl(240,25%,4%) 0%, hsla(240,25%,4%,0.75) 35%, transparent 65%)",
          ].join(", "),
          zIndex: 1,
        }}
      />

      {/* ── Hero content — bottom-left anchored ─────────────── */}
      <div
        className="relative w-full px-8 md:px-14 pb-14 md:pb-20"
        style={{
          maxWidth: "min(90%, 740px)",
          transform: "translateZ(0)",
          zIndex: 2,
          /* Enough top clearance so content never starts behind the navbar */
          paddingTop: "clamp(6rem, 14vh, 10rem)",
        }}
      >
        {/* Pill badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-xs font-medium select-none"
          style={{
            animationDelay: "0.1s",
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "hsl(258,80%,78%)",
          }}
        >
          <span className="animate-spin-slow inline-block leading-none">✦</span>
          7-step AI agent · MongoDB · Gemini 3 Flash
        </div>

        {/* Heading */}
        <h1
          className="animate-fade-up font-bold uppercase leading-[1.07] tracking-[-0.03em] mb-5"
          style={{ fontSize: "clamp(2.2rem, 5.5vw, 4.8rem)", animationDelay: "0.2s" }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300, display: "block" }}>
            Turn your idea into a
          </span>
          <span
            style={{
              color: "hsl(258,85%,74%)",
              fontWeight: 700,
              display: "block",
              textShadow: "0 0 55px rgba(139,92,246,0.55), 0 0 110px rgba(139,92,246,0.2)",
            }}
          >
            Business Plan
          </span>
          <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, display: "block" }}>
            in 60 seconds.
          </span>
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-up font-light mb-3"
          style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)", color: "rgba(255,255,255,0.65)", animationDelay: "0.38s" }}
        >
          No MBA required. No consultants. Just describe your idea.
        </p>

        {/* Description */}
        <p
          className="animate-fade-up font-light mb-8"
          style={{
            fontSize: "clamp(0.78rem, 1.1vw, 0.93rem)",
            color: "rgba(255,255,255,0.32)",
            lineHeight: "1.8",
            maxWidth: "500px",
            animationDelay: "0.5s",
          }}
        >
          A 7-step AI agent powered by Gemini 3 and MongoDB. Validates your idea,
          researches the market, builds personas, writes the full plan,
          projects financials, and analyzes risk — all under 60 seconds.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up flex flex-wrap gap-3" style={{ animationDelay: "0.62s" }}>
          <button
            id="hero-generate-btn"
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
              transition: "box-shadow 0.25s ease, transform 0.15s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 32px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.18)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            Generate My Plan — Free →
          </button>

          <button
            onClick={() => navigate("/examples")}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "0.9rem 2rem",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "background 0.2s ease, border-color 0.2s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            See Example Plans
          </button>
        </div>

        {/* Tech pills */}
        <div
          className="animate-fade-up flex items-center flex-wrap gap-2 mt-7"
          style={{ animationDelay: "0.78s" }}
        >
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem" }}>Powered by</span>
          {TECH_PILLS.map((label) => (
            <span
              key={label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(255,255,255,0.38)",
                fontSize: "0.7rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <p
          className="animate-fade-up mt-3"
          style={{ color: "rgba(255,255,255,0.13)", fontSize: "0.68rem", animationDelay: "0.9s" }}
        >
          Rapid Agent Hackathon 2026 · MongoDB Partner Track
        </p>
      </div>
    </section>
  );
}
