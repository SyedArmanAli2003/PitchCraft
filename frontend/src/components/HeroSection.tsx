import AnimatedBackground from "./AnimatedBackground";

const TECH_PILLS = [
  { icon: "🍃", label: "MongoDB" },
  { icon: "✦", label: "Gemini 3 Flash" },
  { icon: "⚡", label: "FastAPI" },
  { icon: "◈", label: "Google Cloud" },
] as const;

const FADE_UP = "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-end overflow-hidden"
      style={{ backgroundColor: "hsl(240, 25%, 4%)" }}
    >
      {/* ── Pure-CSS animated background (replaces Spline) ── */}
      <AnimatedBackground />

      {/* ── Bottom-fade gradient ── */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, hsl(240,25%,4%) 0%, transparent 55%)",
        }}
      />

      {/* ── Hero content (bottom-left) ── */}
      <div
        className="relative z-10 pointer-events-none w-full max-w-[90%] sm:max-w-md lg:max-w-3xl px-6 md:px-10 pb-12 md:pb-16 pt-32"
        style={{ transform: "translateZ(0)" }}
      >

        {/* Step indicator pill */}
        <div
          style={{ opacity: 0, animation: FADE_UP, animationDelay: "0.1s" }}
          className="mb-5"
        >
          <span
            className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full"
            style={{
              background: "hsla(258,90%,66%,0.12)",
              border: "1px solid hsla(258,90%,66%,0.4)",
              color: "hsl(258,90%,66%)",
            }}
          >
            <span className="animate-spin-slow">✦</span>
            7-step AI agent · MongoDB · Gemini 3
          </span>
        </div>

        {/* Heading */}
        <h1
          className="uppercase tracking-[-0.04em] leading-[1.05] mb-4"
          style={{
            opacity: 0,
            animation: FADE_UP,
            animationDelay: "0.2s",
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            willChange: "transform",
          }}
        >
          <span className="block text-foreground/70 font-light">
            Turn your idea into a
          </span>
          <span
            className="block text-primary font-bold"
            style={{
              textShadow:
                "0 0 80px rgba(139,92,246,0.6), 0 0 160px rgba(139,92,246,0.2)",
            }}
          >
            Business Plan
          </span>
          <span className="block text-foreground font-bold">in 60 seconds.</span>
        </h1>

        {/* Subheading */}
        <p
          className="text-foreground/75 font-light mb-5"
          style={{
            opacity: 0,
            animation: FADE_UP,
            animationDelay: "0.4s",
            fontSize: "clamp(1rem, 2vw, 1.5rem)",
            willChange: "transform",
          }}
        >
          No MBA required. No consultants. Just describe your idea and our AI
          agent does the rest.
        </p>

        {/* Description */}
        <p
          className="text-muted-foreground font-light mb-7"
          style={{
            opacity: 0,
            animation: FADE_UP,
            animationDelay: "0.55s",
            fontSize: "clamp(0.8rem, 1.3vw, 1rem)",
            willChange: "transform",
          }}
        >
          PitchCraft is a 7-step AI agent built with Gemini 3 and MongoDB. It
          validates your idea, researches the market, creates customer personas,
          writes the full plan, builds financial projections, analyzes risks —
          and saves everything to your dashboard.
        </p>

        {/* CTA buttons */}
        <div
          className="pointer-events-auto flex flex-wrap gap-3"
          style={{ opacity: 0, animation: FADE_UP, animationDelay: "0.7s" }}
        >
          <button
            className="text-white font-semibold px-8 py-4 text-sm rounded-sm active:scale-[0.97] cursor-pointer"
            style={{
              backgroundColor: "hsl(258,90%,66%)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 30px rgba(139,92,246,0.35)";
              (e.currentTarget as HTMLButtonElement).style.filter =
                "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.filter = "none";
            }}
          >
            Generate My Plan — Free
          </button>

          <button
            className="text-foreground border border-white/15 px-8 py-4 text-sm rounded-sm active:scale-[0.97] cursor-pointer"
            style={{
              backgroundColor: "rgba(255,255,255,0.10)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.10)";
            }}
          >
            See Example Plan
          </button>
        </div>

        {/* Tech stack pills */}
        <div
          className="pointer-events-auto flex items-center gap-3 mt-6 flex-wrap"
          style={{ opacity: 0, animation: FADE_UP, animationDelay: "0.85s" }}
        >
          <span
            className="text-xs"
            style={{ color: "hsla(240,8%,60%,0.5)" }}
          >
            Powered by
          </span>
          {TECH_PILLS.map(({ icon, label }) => (
            <span
              key={label}
              className="rounded-full px-3 py-1 text-xs"
              style={{
                backgroundColor: "hsl(240,15%,10%)",
                border: "1px solid hsl(240,12%,20%)",
                color: "hsl(240,8%,60%)",
              }}
            >
              {icon} {label}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <p
          className="text-xs mt-3"
          style={{
            opacity: 0,
            animation: FADE_UP,
            animationDelay: "1.0s",
            color: "hsla(240,8%,55%,0.3)",
          }}
        >
          Rapid Agent Hackathon 2026 · MongoDB Partner Track
        </p>
      </div>
    </section>
  );
}
