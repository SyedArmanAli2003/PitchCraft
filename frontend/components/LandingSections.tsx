"use client"
import { useRouter } from "next/navigation"
import { LogoMark } from "@/components/GradientLogo"

function IdeaIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="idea-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(258,85%,64%)" />
          <stop offset="1" stopColor="hsl(280,80%,72%)" />
        </linearGradient>
      </defs>
      {/* Lightbulb shape */}
      <path d="M12 2a7 7 0 0 1 4.9 11.95c-.65.65-1.1 1.45-1.25 2.3H8.35c-.15-.85-.6-1.65-1.25-2.3A7 7 0 0 1 12 2Z" stroke="url(#idea-grad)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 20h6M10 22h4" stroke="url(#idea-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 6v3M10.2 7.8l2.12 2.12" stroke="url(#idea-grad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="team-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(195,90%,60%)" />
          <stop offset="1" stopColor="hsl(258,85%,64%)" />
        </linearGradient>
      </defs>
      {/* Central node */}
      <circle cx="12" cy="12" r="2.2" fill="url(#team-grad)" />
      {/* Outer agent nodes */}
      <circle cx="12" cy="4" r="1.7" stroke="url(#team-grad)" strokeWidth="1.3" />
      <circle cx="19.5" cy="8" r="1.7" stroke="url(#team-grad)" strokeWidth="1.3" />
      <circle cx="19.5" cy="16" r="1.7" stroke="url(#team-grad)" strokeWidth="1.3" />
      <circle cx="12" cy="20" r="1.7" stroke="url(#team-grad)" strokeWidth="1.3" />
      <circle cx="4.5" cy="16" r="1.7" stroke="url(#team-grad)" strokeWidth="1.3" />
      <circle cx="4.5" cy="8" r="1.7" stroke="url(#team-grad)" strokeWidth="1.3" />
      {/* Connecting lines */}
      <line x1="12" y1="5.7" x2="12" y2="9.8" stroke="url(#team-grad)" strokeWidth="1" opacity="0.5" />
      <line x1="18.1" y1="8.8" x2="14.1" y2="10.9" stroke="url(#team-grad)" strokeWidth="1" opacity="0.5" />
      <line x1="18.1" y1="15.2" x2="14.1" y2="13.1" stroke="url(#team-grad)" strokeWidth="1" opacity="0.5" />
      <line x1="12" y1="18.3" x2="12" y2="14.2" stroke="url(#team-grad)" strokeWidth="1" opacity="0.5" />
      <line x1="5.9" y1="15.2" x2="9.9" y2="13.1" stroke="url(#team-grad)" strokeWidth="1" opacity="0.5" />
      <line x1="5.9" y1="8.8" x2="9.9" y2="10.9" stroke="url(#team-grad)" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

function PlanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="plan-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(142,71%,48%)" />
          <stop offset="1" stopColor="hsl(195,90%,55%)" />
        </linearGradient>
      </defs>
      {/* Document outline */}
      <rect x="4" y="2" width="13" height="17" rx="2" stroke="url(#plan-grad)" strokeWidth="1.5" />
      <path d="M14 2v5h3" stroke="url(#plan-grad)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Chart bars inside document */}
      <rect x="7" y="13" width="2" height="3" rx="0.5" fill="url(#plan-grad)" opacity="0.75" />
      <rect x="10.5" y="11" width="2" height="5" rx="0.5" fill="url(#plan-grad)" opacity="0.9" />
      {/* Tick mark / checkmark */}
      <path d="M7 9l1.5 1.5L12 7" stroke="url(#plan-grad)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const HOW_IT_WORKS = [
  {
    num: "01",
    icon: <IdeaIcon />,
    title: "Describe your idea",
    body: "One sentence is enough. What you're building, who it's for, and what problem it solves. That's it.",
  },
  {
    num: "02",
    icon: <TeamIcon />,
    title: "Seven specialists collaborate",
    body: "A Strategy Analyst, Market Researcher, Customer Insights Specialist, Business Architect, Financial Modeller, Risk Officer, and Chief of Staff — working in sequence, handing off like a real team.",
  },
  {
    num: "03",
    icon: <PlanIcon />,
    title: "Receive your full business plan",
    body: "Viability score, market sizing, personas, full strategy, 3-year financials, SWOT analysis. Cryptographically audited. Ready to share.",
  },
]

const AGENTS = [
  { num: 1, name: "Strategy Analyst", role: "Validates idea viability, scores 1–10", badge: "Gemini 3", accent: "rgba(234,179,8,0.12)" },
  { num: 2, name: "Market Intelligence", role: "Market size, competitors, growth gaps", badge: "InsForge + Gemini", accent: "rgba(16,185,129,0.10)" },
  { num: 3, name: "Customer Insights", role: "3 detailed customer personas", badge: "Gemini 3", accent: "rgba(234,179,8,0.12)" },
  { num: 4, name: "Business Architect", role: "Full plan + GTM strategy", badge: "Gemini 3", accent: "rgba(234,179,8,0.12)" },
  { num: 5, name: "Financial Modeller", role: "3-year projections + break-even month", badge: "InsForge + Gemini", accent: "rgba(16,185,129,0.10)" },
  { num: 6, name: "Risk & Compliance", role: "Risk matrix + full SWOT analysis", badge: "Gemini 3", accent: "rgba(234,179,8,0.12)" },
  { num: 7, name: "Chief of Staff", role: "Compiles, seals & saves to InsForge", badge: "InsForge", accent: "rgba(16,185,129,0.10)" },
]

// ─── Feature card icons (gradient SVGs, synced with the violet UI) ───────────
function FeatureIcon({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(258,85%,66%)" />
          <stop offset="1" stopColor="hsl(280,82%,74%)" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  )
}

function ReviewIcon() {
  return (
    <FeatureIcon id="ft-review">
      {/* pause-and-review: shield with pause bars */}
      <path d="M12 2.5l7 2.5v5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V5l7-2.5Z" stroke="url(#ft-review)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10.3 9v4.2M13.7 9v4.2" stroke="url(#ft-review)" strokeWidth="1.5" strokeLinecap="round" />
    </FeatureIcon>
  )
}
function DatabaseIcon() {
  return (
    <FeatureIcon id="ft-db">
      <ellipse cx="12" cy="5.5" rx="7" ry="2.8" stroke="url(#ft-db)" strokeWidth="1.5" />
      <path d="M5 5.5v6c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-6" stroke="url(#ft-db)" strokeWidth="1.5" />
      <path d="M5 11.5v6c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-6" stroke="url(#ft-db)" strokeWidth="1.5" />
    </FeatureIcon>
  )
}
function BoltIcon() {
  return (
    <FeatureIcon id="ft-bolt">
      <path d="M13 2L4.5 13.2c-.4.5 0 1.3.7 1.3H11l-1 8.5 8.5-11.2c.4-.5 0-1.3-.7-1.3H12l1-8.5Z" stroke="url(#ft-bolt)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(124,58,237,0.12)" />
    </FeatureIcon>
  )
}
function ChainIcon() {
  return (
    <FeatureIcon id="ft-chain">
      <path d="M9.5 14.5l5-5" stroke="url(#ft-chain)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 12L6 14a3.2 3.2 0 0 0 4.5 4.5l2-2" stroke="url(#ft-chain)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 12l2-2a3.2 3.2 0 0 0-4.5-4.5l-2 2" stroke="url(#ft-chain)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </FeatureIcon>
  )
}
function TraceIcon() {
  return (
    <FeatureIcon id="ft-trace">
      <circle cx="11" cy="11" r="6.5" stroke="url(#ft-trace)" strokeWidth="1.5" />
      <path d="M16 16l4 4" stroke="url(#ft-trace)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 11.5l2 2 3.5-4" stroke="url(#ft-trace)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </FeatureIcon>
  )
}
function CascadeIcon() {
  return (
    <FeatureIcon id="ft-cascade">
      <path d="M12 3l8 4-8 4-8-4 8-4Z" stroke="url(#ft-cascade)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 12l8 4 8-4" stroke="url(#ft-cascade)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.5l8 4 8-4" stroke="url(#ft-cascade)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </FeatureIcon>
  )
}
function ShareIcon() {
  return (
    <FeatureIcon id="ft-share">
      <circle cx="6" cy="12" r="2.4" stroke="url(#ft-share)" strokeWidth="1.5" />
      <circle cx="17.5" cy="6" r="2.4" stroke="url(#ft-share)" strokeWidth="1.5" />
      <circle cx="17.5" cy="18" r="2.4" stroke="url(#ft-share)" strokeWidth="1.5" />
      <path d="M8.1 10.9l7.3-3.8M8.1 13.1l7.3 3.8" stroke="url(#ft-share)" strokeWidth="1.5" strokeLinecap="round" />
    </FeatureIcon>
  )
}

const FEATURES = [
  { icon: <ReviewIcon />,   title: "Human-in-the-loop review", body: "After market research, the agent pauses. You review, steer the strategy, then approve before it continues." },
  { icon: <DatabaseIcon />, title: "InsForge grounded", body: "Real industry data from InsForge Postgres feeds every market analysis. Plans are stored, auditable, and searchable." },
  { icon: <BoltIcon />,     title: "InsForge Realtime", body: "A Postgres trigger broadcasts every step over WebSockets. Open a shared plan on a second device and watch it build live — no refresh." },
  { icon: <ChainIcon />,    title: "SHA-256 audit chain", body: "Each generation step is hashed into a tamper-evident chain. The output is verifiable by anyone." },
  { icon: <TraceIcon />,    title: "Fully traced", body: "Every model call is traced and monitored. Full observability — latency, tokens, and logic steps — for every plan." },
  { icon: <CascadeIcon />,  title: "Multi-model cascade", body: "Gemini 3 Flash → 3.5 Flash → 2.5 Flash, then a free InsForge Model Gateway fallback. Rotates keys on quota. Never crashes on one model's limits." },
  { icon: <ShareIcon />,    title: "Share & export", body: "Shareable URL + a polished PDF export in one click. Send your full plan to investors in under 60 seconds." },
]

const FOOTER_PRODUCT = [
  ["Generate Plan", "/generate"],
  ["How It Works", "/#how-it-works"],
  ["API Docs", "https://github.com/SyedArmanAli2003/PitchCraft"],
] as const

const FOOTER_BUILT_WITH = [
  ["InsForge", "https://insforge.dev"],
  ["Google Cloud / Gemini", "https://cloud.google.com"],
  ["Google ADK", "https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview"],
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
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
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
          with a name, role, and declared InsForge tools. They hand off in a sequential pipeline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGENTS.map(agent => (
            <div
              key={agent.num}
              className="rounded-2xl p-5 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-[2px]"
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
    blurb: "Offline-first vernacular AI tutor at ₹99/month — grounded in InsForge EdTech benchmarks.",
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
              className="rounded-2xl p-6 flex flex-col transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-[2px]"
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
                  className="text-xs font-semibold cursor-pointer transition-colors bg-transparent border-0 p-0 hover:text-white"
                  style={{ color: "rgba(255,255,255,0.55)" }}
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
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
                  aria-hidden="true"
                >
                  {f.icon}
                </span>
                <p className="text-white font-semibold">{f.title}</p>
              </div>
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
          Free during the hackathon
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
          className="py-4 px-12 rounded-xl font-semibold text-white text-sm cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_45px_rgba(124,58,237,0.45)]"
          style={{ background: "hsl(258,85%,64%)" }}
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
            <span className="text-xl select-none" style={{ color: "hsl(258,90%,66%)" }}>✦</span>
            <span className="font-semibold text-white text-lg">
              Pitch<span style={{ color: "hsl(258,90%,66%)" }}>Craft</span>
            </span>
          </div>
          <p className="text-xs max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
            A 7-agent AI business plan engine built for the
            <br />Google Cloud Rapid Agent Hackathon 2026.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {["InsForge", "Google ADK"].map(badge => (
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
                  className="block text-xs no-underline transition-colors duration-200 hover:text-white/80"
                  style={{ color: "rgba(255,255,255,0.42)" }}
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
                  className="block text-xs no-underline transition-colors duration-200 hover:text-white/80"
                  style={{ color: "rgba(255,255,255,0.42)" }}
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
          InsForge Launch Week 2 Hackathon 2026 · Realtime · Model Gateway · Auth · Postgres
        </p>
        <a
          href="/admin"
          className="text-xs mt-2 inline-flex items-center gap-2 transition-colors duration-200 hover:text-white/35"
          style={{ color: "rgba(255,255,255,0.1)" }}
        >
          <LogoMark size={14} />
          Admin
        </a>
      </div>
    </footer>
  )
}
