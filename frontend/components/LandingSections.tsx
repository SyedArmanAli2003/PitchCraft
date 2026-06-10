"use client"
import { useRouter } from "next/navigation"

const HOW_IT_WORKS = [
  {
    num: "01",
    icon: "✍️",
    title: "Describe your idea",
    body: "One sentence is enough. What you're building, who it's for, and what problem it solves. That's it.",
  },
  {
    num: "02",
    icon: "⚡",
    title: "Seven specialists collaborate",
    body: "A Strategy Analyst, Market Researcher, Customer Insights Specialist, Business Architect, Financial Modeller, Risk Officer, and Chief of Staff — working in sequence, handing off like a real team.",
  },
  {
    num: "03",
    icon: "🚀",
    title: "Receive your full business plan",
    body: "Viability score, market sizing, personas, full strategy, 3-year financials, SWOT analysis. Cryptographically audited. Ready to share.",
  },
]

const AGENTS = [
  { num: 1, name: "Strategy Analyst",         role: "Validates idea viability, scores 1–10",     badge: "Gemini 3",         accent: "rgba(234,179,8,0.12)" },
  { num: 2, name: "Market Intelligence",       role: "Market size, competitors, growth gaps",       badge: "MongoDB + Gemini", accent: "rgba(34,197,94,0.10)" },
  { num: 3, name: "Customer Insights",         role: "3 detailed customer personas",               badge: "Gemini 3",         accent: "rgba(234,179,8,0.12)" },
  { num: 4, name: "Business Architect",        role: "Full plan + GTM strategy",                   badge: "Gemini 3",         accent: "rgba(234,179,8,0.12)" },
  { num: 5, name: "Financial Modeller",        role: "3-year projections + break-even month",      badge: "MongoDB + Gemini", accent: "rgba(34,197,94,0.10)" },
  { num: 6, name: "Risk & Compliance",         role: "Risk matrix + full SWOT analysis",           badge: "Gemini 3",         accent: "rgba(234,179,8,0.12)" },
  { num: 7, name: "Chief of Staff",            role: "Compiles, seals & saves to MongoDB Atlas",   badge: "MongoDB Atlas",    accent: "rgba(234,179,8,0.10)" },
]

const FEATURES = [
  { icon: "⏸", title: "Human-in-the-loop review",  body: "After market research, the agent pauses. You review, steer the strategy, then approve before it continues." },
  { icon: "🍃", title: "MongoDB grounded",           body: "Real industry data from Atlas feeds every market analysis. Plans are stored, auditable, and searchable." },
  { icon: "🔒", title: "SHA-256 audit chain",        body: "Each generation step is hashed into a tamper-evident chain. The output is verifiable by anyone." },
  { icon: "🔭", title: "Arize traced",               body: "Every Gemini call is traced to Arize Phoenix. Full observability — latency, tokens, model — for every plan." },
  { icon: "⚡", title: "Multi-model cascade",        body: "Gemini 3 Flash → 3.5 Flash → 2.5 Flash → 2.5 Flash Lite. Rotates API keys on quota. Never crashes on one model's limits." },
  { icon: "📤", title: "Share & export",             body: "Shareable URL + print-to-PDF in one click. Send your plan to investors in under 60 seconds." },
]

const FOOTER_PRODUCT = [
  ["Generate Plan", "/generate"],
  ["How It Works",  "/#how-it-works"],
  ["API Docs",      "https://github.com/SyedArmanAli2003/PitchCraft"],
] as const

const FOOTER_BUILT_WITH = [
  ["MongoDB Atlas",         "https://www.mongodb.com/atlas"],
  ["Google Cloud / Gemini", "https://cloud.google.com"],
  ["Google ADK",            "https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview"],
  ["Arize Phoenix",         "https://phoenix.arize.com"],
] as const

// ─── Section: How It Works ────────────────────────────────────────────────── //
export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-28 px-6 md:px-14"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
          How it works
        </p>
        <h2
          className="text-center font-bold mb-16 leading-tight"
          style={{ fontSize: "clamp(1.9rem,4vw,3rem)", color: "rgba(255,255,255,0.95)" }}
        >
          From idea to investor pitch
          <br />
          <span style={{ color: "hsl(258,85%,74%)" }}>in three steps.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.num} className="rounded-2xl p-7 relative" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Connector arrow between cards */}
              {i < HOW_IT_WORKS.length - 1 && (
                <span
                  className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-lg z-10 select-none"
                  style={{ color: "rgba(124,58,237,0.35)" }}
                >
                  →
                </span>
              )}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 text-xl"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                {s.icon}
              </div>
              <p className="text-xs font-bold mb-1" style={{ color: "hsl(258,85%,64%)" }}>{s.num}</p>
              <h3 className="text-white font-semibold text-lg mb-3">{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: The Agent Team ──────────────────────────────────────────────── //
export function AgentsSection() {
  return (
    <section
      className="py-24 px-6 md:px-14"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
          The agent team
        </p>
        <h2
          className="text-center font-bold mb-4 leading-tight"
          style={{ fontSize: "clamp(1.9rem,4vw,3rem)", color: "rgba(255,255,255,0.95)" }}
        >
          Seven specialists.
          <br />
          <span style={{ color: "hsl(258,85%,74%)" }}>One consulting firm.</span>
        </h2>
        <p className="text-center text-sm mb-12 max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
          Built on Google ADK — each is a real{" "}
          <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)" }}>
            LlmAgent
          </code>{" "}
          with a name, role, and declared MongoDB tools. They hand off in a sequential pipeline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS.map(agent => (
            <div
              key={agent.num}
              className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
              style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                  style={{ background: agent.accent, color: "hsl(258,80%,80%)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  {agent.num}
                </div>
                <p className="text-white font-semibold text-sm leading-tight">{agent.name}</p>
              </div>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>{agent.role}</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {agent.badge}
              </span>
            </div>
          ))}

          {/* ADK pipeline card */}
          <div
            className="rounded-2xl p-5 flex flex-col justify-center sm:col-span-1"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "hsl(258,80%,72%)" }}>Powered by</p>
            <p className="text-white font-semibold text-sm">Google ADK</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              LlmAgent + SequentialAgent pipeline · Introspectable via{" "}
              <code className="text-xs" style={{ color: "hsl(258,75%,72%)" }}>/api/agent/manifest</code>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Example Plans ──────────────────────────────────────────────── //
const EXAMPLES = [
  {
    idea: "AI tutoring for rural India",
    fullIdea: "An offline-first AI tutoring app for rural India that works in 12 vernacular languages",
    industry: "EdTech",
    score: 8,
    year3: "$5M Year 3",
    blurb: "Offline-first vernacular AI tutor at ₹99/month — grounded in MongoDB EdTech benchmarks.",
    accent: "rgba(234,179,8,0.4)",
  },
  {
    idea: "P2P photography gear rental",
    fullIdea: "A peer-to-peer marketplace where photographers rent out their cameras and lenses to other creators",
    industry: "Marketplace",
    score: 7,
    year3: "$2M Year 3",
    blurb: "Idle camera gear becomes income — insurance-backed rentals between verified creators.",
    accent: "rgba(124,58,237,0.45)",
  },
  {
    idea: "Hyperlocal grocery delivery",
    fullIdea: "A hyperlocal grocery delivery service connecting neighbourhood kirana stores with customers in 15 minutes",
    industry: "Logistics",
    score: 9,
    year3: "$8M Year 3",
    blurb: "Kirana stores as dark stores — 15-minute delivery without burning VC money on warehouses.",
    accent: "rgba(34,197,94,0.4)",
  },
]

export function ExamplesSection() {
  const router = useRouter()
  return (
    <section
      className="py-24 px-6 md:px-14"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
          Example plans
        </p>
        <h2
          className="text-center font-bold mb-12 leading-tight"
          style={{ fontSize: "clamp(1.9rem,4vw,3rem)", color: "rgba(255,255,255,0.95)" }}
        >
          See what the agents
          <br />
          <span style={{ color: "hsl(258,85%,74%)" }}>can build.</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EXAMPLES.map(ex => (
            <div
              key={ex.idea}
              className="rounded-2xl p-6 flex flex-col transition-all duration-200 hover:scale-[1.02]"
              style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)", borderTop: `2px solid ${ex.accent}` }}
            >
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {ex.industry}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.12)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.25)" }}>
                  Score {ex.score}/10
                </span>
              </div>
              <p className="text-white font-semibold mb-2">{ex.idea}</p>
              <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>{ex.blurb}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium" style={{ color: "hsl(258,80%,78%)" }}>{ex.year3}</span>
                <button
                  onClick={() => router.push(`/generate?idea=${encodeURIComponent(ex.fullIdea)}`)}
                  className="text-xs font-semibold cursor-pointer transition-colors bg-transparent border-0 p-0"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
                >
                  Generate this plan →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Features ───────────────────────────────────────────────────── //
export function FeaturesSection() {
  return (
    <section
      className="py-24 px-6 md:px-14"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-widest mb-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
          Why PitchCraft
        </p>
        <h2
          className="text-center font-bold mb-12 leading-tight"
          style={{ fontSize: "clamp(1.9rem,4vw,3rem)", color: "rgba(255,255,255,0.95)" }}
        >
          Not a chatbot wrapper.
          <br />
          <span style={{ color: "hsl(258,85%,74%)" }}>A real agent system.</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-2xl p-6 transition-all duration-200 hover:border-opacity-50"
              style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-2xl mb-4">{f.icon}</p>
              <p className="text-white font-semibold mb-2">{f.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: CTA ────────────────────────────────────────────────────────── //
export function CtaSection() {
  const router = useRouter()
  return (
    <section
      className="py-28 px-6 text-center"
      style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 text-xs font-medium"
          style={{
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "hsl(258,80%,78%)",
          }}
        >
          ✦ Free during the hackathon
        </div>
        <h2
          className="font-bold mb-4 leading-tight"
          style={{ fontSize: "clamp(2rem,5vw,3.5rem)", color: "rgba(255,255,255,0.95)" }}
        >
          Your idea deserves
          <br />
          <span style={{ color: "hsl(258,85%,74%)" }}>a real plan.</span>
        </h2>
        <p className="text-sm mb-8 max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
          No MBA, no consultants, no guesswork. Just describe your startup idea and get an investor-ready plan in under 60 seconds.
        </p>
        <button
          onClick={() => router.push("/generate")}
          className="py-4 px-12 rounded-xl font-semibold text-white text-sm cursor-pointer transition-all duration-200"
          style={{ background: "hsl(258,85%,64%)" }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = "0 0 45px rgba(124,58,237,0.45)"
            e.currentTarget.style.transform = "translateY(-2px)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = "none"
            e.currentTarget.style.transform = "none"
          }}
        >
          Generate My Plan — Free →
        </button>
        <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.18)" }}>No account required to try it</p>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────── //
export function FooterSection() {
  return (
    <footer
      className="py-14 px-6 md:px-14"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: "hsl(258,90%,66%)", fontSize: "1.25rem" }}>✦</span>
            <span className="font-semibold text-white text-lg">
              Pitch<span style={{ color: "hsl(258,90%,66%)" }}>Craft</span>
            </span>
          </div>
          <p className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
            A 7-agent AI business plan engine built for the
            <br />Google Cloud Rapid Agent Hackathon 2026.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {["MongoDB Partner", "Arize Partner", "Google ADK"].map(badge => (
              <span
                key={badge}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-12">
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.22)" }}>
              Product
            </p>
            <div className="space-y-2.5">
              {FOOTER_PRODUCT.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="block text-xs no-underline transition-colors"
                  style={{ color: "rgba(255,255,255,0.42)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.42)")}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.22)" }}>
              Built with
            </p>
            <div className="space-y-2.5">
              {FOOTER_BUILT_WITH.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs no-underline transition-colors"
                  style={{ color: "rgba(255,255,255,0.42)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.42)")}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="max-w-5xl mx-auto mt-10 pt-6 flex flex-wrap justify-between items-center gap-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
          © 2026 PitchCraft · MIT License
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
          Google Cloud Rapid Agent Hackathon 2026 · MongoDB + Arize Partner Tracks
        </p>
      </div>
    </footer>
  )
}
