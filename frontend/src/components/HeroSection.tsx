import { lazy, Suspense } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

const TECH_PILLS = [
  { icon: "🍃", label: "MongoDB" },
  { icon: "✦", label: "Gemini 3 Flash" },
  { icon: "⚡", label: "FastAPI" },
  { icon: "◈", label: "Google Cloud" },
] as const;

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-end bg-hero-bg overflow-hidden">
      {/* ── Spline 3D background (lazy, non-interactive) ── */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
          <Spline
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* ── Overlay 1: dark scrim ── */}
      <div className="absolute inset-0 z-[1] bg-black/40 pointer-events-none" />

      {/* ── Overlay 2: bottom-fade gradient ── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, hsl(var(--hero-bg)) 0%, transparent 55%, transparent 100%)",
        }}
      />

      {/* ── Hero content (bottom-left) ── */}
      <div className="relative z-10 pointer-events-none w-full max-w-[90%] sm:max-w-md lg:max-w-3xl px-6 md:px-10 pb-12 md:pb-16 pt-32">

        {/* Step indicator pill */}
        <div
          className="opacity-0 animate-fade-up mb-5"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs px-3 py-1 rounded-full">
            <span className="animate-spin-slow inline-block">✦</span>
            7-step AI agent · MongoDB · Gemini 3
          </span>
        </div>

        {/* Heading */}
        <h1
          className="opacity-0 animate-fade-up uppercase tracking-[-0.04em] leading-[1.05] mb-4"
          style={{
            animationDelay: "0.2s",
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
          }}
        >
          <span className="block text-foreground/70 font-light">
            Turn your idea into a
          </span>
          <span
            className="block text-primary font-bold"
            style={{ textShadow: "0 0 60px rgba(139,92,246,0.4)" }}
          >
            Business Plan
          </span>
          <span className="block text-foreground font-bold">in 60 seconds.</span>
        </h1>

        {/* Subheading */}
        <p
          className="opacity-0 animate-fade-up text-foreground/75 font-light mb-5"
          style={{
            animationDelay: "0.4s",
            fontSize: "clamp(1rem, 2vw, 1.5rem)",
          }}
        >
          No MBA required. No consultants. Just describe your idea and our AI
          agent does the rest.
        </p>

        {/* Description */}
        <p
          className="opacity-0 animate-fade-up text-muted-foreground font-light mb-7"
          style={{
            animationDelay: "0.55s",
            fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
          }}
        >
          PitchCraft is a 7-step AI agent built with Gemini 3 and MongoDB. It
          validates your idea, researches the market, creates customer personas,
          writes the full plan, builds financial projections, analyzes risks —
          and saves everything to your dashboard.
        </p>

        {/* CTA buttons */}
        <div
          className="opacity-0 animate-fade-up pointer-events-auto flex flex-wrap gap-3"
          style={{ animationDelay: "0.7s" }}
        >
          <button
            className="
              bg-primary text-white font-semibold
              px-8 py-4 text-sm rounded-sm
              hover:brightness-110 active:scale-[0.97]
              transition-all duration-200 cursor-pointer
            "
          >
            Generate My Plan — Free
          </button>

          <button
            className="
              text-foreground
              border border-white/15 backdrop-blur-sm
              px-8 py-4 text-sm rounded-sm
              hover:bg-white/12 active:scale-[0.97]
              transition-all duration-200 cursor-pointer
            "
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            See Example Plan
          </button>
        </div>

        {/* Tech stack pills */}
        <div
          className="opacity-0 animate-fade-up flex items-center gap-3 mt-6 flex-wrap pointer-events-auto"
          style={{ animationDelay: "0.85s" }}
        >
          <span className="text-muted-foreground/50 text-xs">Powered by</span>
          {TECH_PILLS.map(({ icon, label }) => (
            <span
              key={label}
              className="bg-muted border border-border rounded-full px-3 py-1 text-xs text-muted-foreground"
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          className="opacity-0 animate-fade-up text-muted-foreground/30 text-xs mt-3"
          style={{ animationDelay: "1s" }}
        >
          Rapid Agent Hackathon 2026 · MongoDB Partner Track
        </p>
      </div>
    </section>
  );
}
