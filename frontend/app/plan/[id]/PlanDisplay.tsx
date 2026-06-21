/* eslint-disable react/no-unescaped-entities */
"use client"
// eslint-disable-next-line react/no-unescaped-entities
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { BusinessPlan, AuditChain } from "@/lib/types"
import { API, apiBase } from "@/lib/config"
import { getUserId } from "@/lib/user"
import Navbar from "@/components/Navbar"

const STEP_NAMES: Record<number, string> = {
  1: "Strategy Analyst",
  2: "Market Intelligence",
  3: "Customer Insights",
  4: "Business Architect",
  5: "Financial Modeller",
  6: "Risk & Compliance",
  7: "Chief of Staff",
}

// ── User-selectable models for the Shark Tank & Pitch Coach features ─────────
// These map to the backend `_generate` model keys. Nemotron is the default —
// a fast, free, reliable JSON producer; the others let the user pick their pref.
const FEATURE_MODELS: { key: string; label: string }[] = [
  { key: "nvidia-nemotron", label: "Nemotron 3 Super 120B" },
  { key: "nvidia-llama",    label: "Llama 3.3 70B (NVIDIA)" },
  { key: "free-gateway",    label: "Free Gateway (Gemma 4)" },
  { key: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
]

function FeatureModelPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (k: string) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
      <span className="whitespace-nowrap">🤖 Model</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.12)" }}>
        {FEATURE_MODELS.map(m => (
          <option key={m.key} value={m.key} style={{ background: "hsl(240,15%,10%)" }}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ── Gender-heuristic avatar ──────────────────────────────────────────────────
const FEMALE_NAMES = new Set(["priya", "sara", "sarah", "maya", "ananya", "pooja", "neha", "kavya", "divya", "anjali", "shreya", "deepika", "meena", "sunita", "rekha", "geeta", "lata", "sita", "lakshmi", "radha", "gita", "usha", "asha", "nisha", "mona", "sona", "riya", "tanya", "swati", "priti", "rati", "rani", "devi", "lisa", "mary", "emma", "anna", "kate", "jane", "amy", "emily", "jessica", "sophia", "olivia", "ava", "isabella", "mia", "ella", "chloe", "grace", "aisha", "fatima", "zara", "layla", "hana", "nour", "yasmin", "amira"])

function PersonaAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const firstName = name.split(/[,\s]+/)[0].toLowerCase()
  const isFemale = FEMALE_NAMES.has(firstName)
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()
  const id = `grad-${initials}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id={id} cx="40%" cy="30%" r="70%">
          {isFemale ? (
            <>
              <stop offset="0%" stopColor="#f9a8d4" />
              <stop offset="100%" stopColor="#9333ea" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#3730a3" />
            </>
          )}
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${id})`} />
      {/* Silhouette */}
      <circle cx="24" cy="19" r="7" fill="rgba(255,255,255,0.7)" />
      <ellipse cx="24" cy="38" rx="11" ry="8" fill="rgba(255,255,255,0.45)" />
      {/* Initials overlay */}
      <text x="24" y="28" textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="700" fill="white" fontFamily="system-ui,sans-serif">
        {initials}
      </text>
    </svg>
  )
}

function RadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  const cx = 120, cy = 120, r = 90
  const n = scores.length
  const pts = (vals: number[]) =>
    vals.map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const rad = (v / 10) * r
      return [cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)]
    })
  const axes = scores.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  })
  const labelPts = scores.map(({ label }, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const lr = r + 22
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle), label }
  })
  const dataPoints = pts(scores.map(s => s.value))
  const gridLevels = [2, 4, 6, 8, 10]
  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {gridLevels.map(lv => {
        const rpts = pts(Array(n).fill(lv))
        return <polygon key={lv}
          points={rpts.map(p => p.join(",")).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      })}
      {/* Axes */}
      {axes.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <polygon
        points={dataPoints.map(p => p.join(",")).join(" ")}
        fill="rgba(124,58,237,0.2)" stroke="hsl(258,85%,64%)" strokeWidth="2" />
      {/* Data dots */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4"
          fill="hsl(258,85%,64%)" stroke="hsl(240,25%,4%)" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {labelPts.map(({ x, y, label }, i) => (
        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="rgba(255,255,255,0.5)">{label}</text>
      ))}
      {/* Score values */}
      {dataPoints.map(([x, y], i) => (
        <text key={i} x={x} y={y - 8} textAnchor="middle"
          fontSize="8" fill="hsl(258,80%,78%)" fontWeight="bold">
          {scores[i].value}
        </text>
      ))}
    </svg>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block" style={{ verticalAlign: "middle" }}>
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-4 h-4 rounded-full text-xs flex items-center justify-center cursor-default"
        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", lineHeight: 1 }}
        aria-label="Info"
      >i</button>
      {show && (
        <span
          className="absolute bottom-6 left-1/2 z-50 w-64 rounded-xl p-3 text-xs leading-relaxed"
          style={{
            transform: "translateX(-50%)",
            background: "hsl(240,18%,12%)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          {text}
          <span
            className="absolute left-1/2 -bottom-1.5 w-3 h-3 rotate-45"
            style={{ transform: "translateX(-50%) rotate(45deg)", background: "hsl(240,18%,12%)", border: "0 0 1px 1px solid rgba(255,255,255,0.12)" }}
          />
        </span>
      )}
    </span>
  )
}

type Tab = "plan" | "deck" | "roadmap" | "tank" | "coach" | "audit"

// ── Investor Email Generator ─────────────────────────────────────────────────
function InvestorEmailBox({ plan }: { plan: BusinessPlan }) {
  const [copied, setCopied] = useState(false)
  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials
  if (!v || !b) return null
  const email = `Subject: Seed Investment Opportunity — ${plan.idea}

Hi [Investor Name],

I&apos;m building ${plan.idea} — ${v.one_line_summary}.

The Problem: ${b.problem}

Our Solution: ${b.solution}

Market: ${m?.market_size ?? "large and growing"} market, growing at ${m?.growth_rate ?? "double digits"}.

Traction: Early validation with target users. Viability score ${v.viability_score}/10.

Ask: ${f?.funding_needed ?? "Seed funding"} to ${b.go_to_market?.slice(0, 80) ?? "accelerate growth"}.

Happy to share our full deck and model. Would love 20 minutes.

Best,
[Your Name]`

  return (
    <div className="rounded-2xl p-6 mb-6"
      style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          📧 Investor Cold Email
        </p>
        <button
          onClick={() => { navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
          style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
          {copied ? "✓ Copied!" : "Copy Email"}
        </button>
      </div>
      <pre className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl p-4 select-all"
        style={{ background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.05)", fontFamily: "inherit" }}>
        {email}
      </pre>
    </div>
  )
}

// ── Pitch Deck Tab ───────────────────────────────────────────────────────────
function PitchDeckTab({ plan }: { plan: BusinessPlan }) {
  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials
  const slides = [
    {
      num: 1, title: "Executive Summary", color: "hsl(258,85%,64%)",
      content: v ? (
        <div>
          <p className="text-3xl font-bold text-white mb-2">{v.viability_score}<span className="text-lg opacity-50">/10</span></p>
          <p className="text-base font-semibold text-white mb-3">{v.one_line_summary}</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{v.core_problem_solved}</p>
          {v.target_market && <p className="text-xs mt-3 px-3 py-1.5 rounded-full inline-block"
            style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)" }}>🎯 {v.target_market}</p>}
        </div>
      ) : <p className="text-sm opacity-40">Not generated yet</p>,
    },
    {
      num: 2, title: "Problem & Solution", color: "rgba(239,68,68,0.8)",
      content: b ? (
        <div className="space-y-4">
          <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", borderLeft: "3px solid rgba(239,68,68,0.5)" }}>
            <p className="text-xs uppercase tracking-widest mb-1 opacity-50">Problem</p>
            <p className="text-sm text-white">{b.problem}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", borderLeft: "3px solid rgba(34,197,94,0.5)" }}>
            <p className="text-xs uppercase tracking-widest mb-1 opacity-50">Solution</p>
            <p className="text-sm text-white">{b.solution}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", borderLeft: "3px solid rgba(124,58,237,0.5)" }}>
            <p className="text-xs uppercase tracking-widest mb-1 opacity-50">USP</p>
            <p className="text-sm text-white">{b.unique_value_proposition}</p>
          </div>
        </div>
      ) : <p className="text-sm opacity-40">Not generated yet</p>,
    },
    {
      num: 3, title: "Market Opportunity", color: "rgba(59,130,246,0.8)",
      content: m ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: "rgba(59,130,246,0.1)" }}>
              <p className="text-lg font-bold text-white">{m.market_size}</p>
              <p className="text-xs opacity-50">Market Size</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.1)" }}>
              <p className="text-lg font-bold text-white">{m.growth_rate}</p>
              <p className="text-xs opacity-50">Growth Rate</p>
            </div>
          </div>
          <p className="text-sm italic" style={{ color: "rgba(255,255,255,0.6)" }}>{m.market_gap}</p>
        </div>
      ) : <p className="text-sm opacity-40">Not generated yet</p>,
    },
    {
      num: 4, title: "Financial Snapshot", color: "rgba(34,197,94,0.8)",
      content: f ? (
        <div className="space-y-3">
          {[["Year 1 Revenue", f.year1_revenue], ["Year 2 Revenue", f.year2_revenue], ["Year 3 Revenue", f.year3_revenue]].map(([l, v]) => (
            <div key={l} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs opacity-50">{l}</span>
              <span className="text-sm font-semibold text-white">{v}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-sm font-bold text-white">{f.startup_cost}</p>
              <p className="text-xs opacity-40">Startup Cost</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-sm font-bold" style={{ color: "rgb(74,222,128)" }}>{f.funding_needed}</p>
              <p className="text-xs opacity-40">Funding Ask</p>
            </div>
          </div>
        </div>
      ) : <p className="text-sm opacity-40">Not generated yet</p>,
    },
    {
      num: 5, title: "Go-to-Market", color: "rgba(234,179,8,0.8)",
      content: b ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{b.go_to_market}</p>
          {b.revenue_streams && b.revenue_streams.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 opacity-40">Revenue Streams</p>
              <div className="space-y-1">
                {b.revenue_streams.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "rgb(250,204,21)" }}>→</span> {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : <p className="text-sm opacity-40">Not generated yet</p>,
    },
  ]
  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        Investor-ready slides generated from your AI business plan
      </p>
      {slides.map(slide => (
        <div key={slide.num} className="rounded-2xl overflow-hidden"
          style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-6 py-3 flex items-center gap-3"
            style={{ background: `linear-gradient(90deg,${slide.color}22,transparent)`, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: slide.color, color: "white" }}>{slide.num}</span>
            <h3 className="text-sm font-semibold text-white">{slide.title}</h3>
          </div>
          <div className="p-6">{slide.content}</div>
        </div>
      ))}
    </div>
  )
}

// ── 90-Day Roadmap Tab ───────────────────────────────────────────────────────
function RoadmapTab({ plan }: { plan: BusinessPlan }) {
  const b = plan.business_plan
  const f = plan.financials
  const phases = [
    {
      phase: "Phase 1", period: "Days 1–30", title: "Validate & Research",
      color: "rgba(59,130,246,0.8)", bg: "rgba(59,130,246,0.06)",
      tasks: [
        "Talk to 20+ potential customers about the problem",
        "Build a simple landing page to capture interest",
        `Define your MVP scope: ${b?.solution?.slice(0, 60) ?? "core feature set"}…`,
        "Research competitors and identify differentiators",
        "Set up analytics (Mixpanel / PostHog)",
      ],
    },
    {
      phase: "Phase 2", period: "Days 31–60", title: "Build & Launch MVP",
      color: "rgba(234,179,8,0.8)", bg: "rgba(234,179,8,0.06)",
      tasks: [
        "Build the MVP — focus on ONE core user flow",
        "Onboard 10 beta users for feedback",
        `Start Go-to-Market: ${b?.go_to_market?.slice(0, 60) ?? "initial channels"}…`,
        f ? `Control monthly burn to stay within ${f.monthly_burn}` : "Track expenses tightly",
        "Collect testimonials and usage data",
      ],
    },
    {
      phase: "Phase 3", period: "Days 61–90", title: "Scale & Fundraise",
      color: "rgba(34,197,94,0.8)", bg: "rgba(34,197,94,0.06)",
      tasks: [
        "Achieve first paying customers",
        f ? `Target: ${f.year1_revenue} revenue run rate by month 3` : "Set revenue targets",
        "Prepare investor pitch deck",
        f ? `Begin fundraising: ${f.funding_needed} seed round` : "Start angel/seed conversations",
        "Define metrics for Series A readiness",
      ],
    },
  ]
  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        AI-generated execution roadmap based on your business plan
      </p>
      {phases.map((ph, pi) => (
        <div key={pi} className="rounded-2xl overflow-hidden"
          style={{ background: ph.bg, border: `1px solid ${ph.color.replace("0.8", "0.25")}` }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${ph.color.replace("0.8", "0.15")}` }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: ph.color }}>{ph.phase}</p>
              <p className="text-base font-bold text-white">{ph.title}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              {ph.period}
            </span>
          </div>
          <ul className="p-5 space-y-2.5">
            {ph.tasks.map((task, ti) => (
              <li key={ti} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center text-xs"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }}>
                  {ti + 1}
                </span>
                <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{task}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ── Shark Tank Simulator Tab ────────────────────────────────────────────────────
const SHARKS = [
  { name: "Mark C.", icon: "⚡", style: "tough", color: "rgba(239,68,68,0.8)", bg: "rgba(239,68,68,0.07)", trait: "Demands proof of traction and ruthless unit economics. Will negotiate hard." },
  { name: "Sarah K.", icon: "🎯", style: "strategic", color: "rgba(59,130,246,0.8)", bg: "rgba(59,130,246,0.07)", trait: "Looks for defensible moats, brand-building potential, and long-term vision." },
  { name: "Raj P.", icon: "💡", style: "tech-focused", color: "rgba(124,58,237,0.8)", bg: "rgba(124,58,237,0.07)", trait: "Obsessed with AI, scalability, and recurring revenue. Excited by technical differentiation." },
  { name: "Lisa T.", icon: "🌟", style: "empathetic", color: "rgba(234,179,8,0.8)", bg: "rgba(234,179,8,0.07)", trait: "Connects emotionally with the founder story and social impact. Values authenticity." },
  { name: "Carlos M.", icon: "📊", style: "operational", color: "rgba(34,197,94,0.8)", bg: "rgba(34,197,94,0.07)", trait: "Focuses on supply chain, margins, operational efficiency, and unit economics." },
]

type Reaction = { shark: string; verdict: "IN" | "OUT" | "COUNTER"; comment: string; counter_offer?: string }
type SharkQuestions = { shark: string; questions: string[] }

function SharkTankTab({ plan }: { plan: BusinessPlan }) {
  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials

  const [askAmount, setAskAmount] = useState(f?.funding_needed?.replace(/[^0-9]/g, "") || "250000")
  const [equityPct, setEquityPct] = useState("10")
  const [questions, setQuestions] = useState<SharkQuestions[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<"ask" | "qa" | "verdict" | "done">("ask")
  const [sharkError, setSharkError] = useState("")
  const [model, setModel] = useState("nvidia-nemotron")

  const impliedValuation = askAmount && equityPct
    ? `$${(parseFloat(askAmount) / (parseFloat(equityPct) / 100) / 1_000_000).toFixed(2)}M`
    : "?"

  const API_BASE = apiBase()
  const buildCtx = () => ({
    idea: plan.idea,
    viability_score: v?.viability_score,
    summary: v?.one_line_summary,
    problem: b?.problem,
    solution: b?.solution,
    usp: b?.unique_value_proposition,
    market_size: m?.market_size,
    growth_rate: m?.growth_rate,
    revenue_model: b?.revenue_model,
    year1_revenue: f?.year1_revenue,
    funding_needed: `$${Number(askAmount).toLocaleString()} for ${equityPct}% equity`,
    implied_valuation: impliedValuation,
  })

  const sharksPayload = () => SHARKS.map(s => ({ name: s.name, style: s.style, trait: s.trait }))

  const startQa = async () => {
    if (!v || !b) return
    setLoading(true)
    setSharkError("")
    try {
      const res = await fetch(`${API_BASE}/api/shark-tank/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_context: buildCtx(), sharks: sharksPayload(), model }),
      })
      if (res.ok) {
        const data = await res.json()
        const list = (data.questions || []) as SharkQuestions[]
        if (list.length < 3) throw new Error("Incomplete questions")
        setQuestions(list)
        setPhase("qa")
      } else {
        const err = await res.json().catch(() => ({}))
        setSharkError(err.detail || "The AI sharks couldn't prepare questions. Try again.")
      }
    } catch {
      setSharkError("Couldn't reach the AI sharks. Check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const submitAnswers = async () => {
    if (!v || !b) return
    setLoading(true)
    setSharkError("")
    setPhase("verdict")
    // Group answers by shark
    const qaContext: Record<string, string[]> = {}
    for (const q of questions) {
      qaContext[q.shark] = q.questions.map(qq => answers[`${q.shark}:${qq}`] || "(skipped)")
    }
    try {
      const res = await fetch(`${API_BASE}/api/shark-tank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_context: buildCtx(),
          sharks: sharksPayload(),
          qa_context: qaContext,
          model,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const list = (data.reactions || []) as Reaction[]
        if (!list.length) throw new Error("No reactions returned")
        setReactions(list)
        setPhase("done")
      } else {
        const err = await res.json().catch(() => ({}))
        setSharkError(err.detail || "The AI sharks are deliberating — pitch again.")
        setPhase("qa")
      }
    } catch {
      setSharkError("Couldn't reach the AI sharks. Check your connection.")
      setPhase("qa")
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    setQuestions([])
    setAnswers({})
    setReactions([])
    setPhase("ask")
    setSharkError("")
  }

  const inCount = reactions.filter(r => r.verdict === "IN").length
  const counterCount = reactions.filter(r => r.verdict === "COUNTER").length

  return (
    <div className="space-y-6">
      {/* Header - always visible */}
      <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg,rgba(234,179,8,0.12),rgba(239,68,68,0.08))", border: "1px solid rgba(234,179,8,0.3)" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🦈</span>
          <div>
            <h2 className="text-lg font-bold text-white">Shark Tank Simulator</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {phase === "ask" ? "Set your ask, then prepare for a pre-pitch Q&A with the sharks." :
                phase === "qa" ? "The sharks have questions. Answer them before they decide." :
                  phase === "verdict" ? "Sharks are deliberating based on your answers..." :
                    "Final verdicts are in."}
            </p>
          </div>
        </div>
        {v && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {[
              { label: "Viability", val: `${v.viability_score}/10`, ok: v.viability_score >= 6, tip: "Score ≥ 6 needed" },
              { label: "Market", val: m?.market_size?.slice(0, 12) ?? "—", ok: !!m?.market_size, tip: "Market size known" },
              { label: "Revenue Model", val: b?.revenue_model ? "✓ Defined" : "✗ Missing", ok: !!b?.revenue_model, tip: "Needs clear model" },
              { label: "Funding Ask", val: f?.funding_needed ?? "Set below", ok: !!f?.funding_needed, tip: "Need a clear ask" },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-3 text-center"
                style={{ background: item.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${item.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                <p className="text-xs mb-1" style={{ color: item.ok ? "rgb(74,222,128)" : "rgb(252,165,165)" }}>
                  {item.ok ? "✓" : "✗"} {item.label}
                </p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{item.val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 1: Ask + Step Into Tank */}
      {phase === "ask" && (
        <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Your Ask</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Investment Ask ($)</p>
              <input
                type="number" value={askAmount} onChange={e => setAskAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "rgb(250,204,21)" }}
                placeholder="250000"
              />
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Equity Offered (%)</p>
              <input
                type="number" value={equityPct} onChange={e => setEquityPct(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "rgb(250,204,21)" }}
                placeholder="10"
              />
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Implied Valuation</p>
              <div className="px-3 py-2.5 rounded-xl text-sm font-bold" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", color: "rgb(250,204,21)" }}>
                {impliedValuation}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <FeatureModelPicker value={model} onChange={setModel} disabled={loading} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Sharks reason with your chosen model
            </span>
          </div>
          <button
            onClick={startQa}
            disabled={loading || !v || !b}
            className="w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.9),rgba(234,179,8,0.8))", color: "white", boxShadow: "0 0 24px rgba(239,68,68,0.3)" }}
          >
            {loading ? "🧠 Sharks are preparing questions..." : "🎙 Step Into the Tank"}
          </button>
        </div>
      )}

      {/* Phase 2: Q&A - each shark asks questions */}
      {phase === "qa" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-4" style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}>
            <p className="text-xs font-semibold" style={{ color: "rgb(250,204,21)" }}>
              💬 Pre-Pitch Q&A — The sharks want answers before committing
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              Answer each shark's questions honestly. Your answers will influence their final verdict.
            </p>
          </div>
          {questions.map((qGroup, gi) => {
            const shark = SHARKS.find(s => s.name === qGroup.shark) || SHARKS[gi]
            return (
              <div key={gi} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${shark.color}33` }}>
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: shark.bg }}>
                  <span className="text-xl">{shark.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{qGroup.shark}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{shark.trait}</p>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-4" style={{ background: "rgba(255,255,255,0.01)" }}>
                  {qGroup.questions.map((qq, qi) => (
                    <div key={qi}>
                      <p className="text-sm font-medium mb-2" style={{ color: shark.color }}>
                        ❝{qq}❞
                      </p>
                      <textarea
                        value={answers[`${qGroup.shark}:${qq}`] || ""}
                        onChange={e => setAnswers(prev => ({ ...prev, [`${qGroup.shark}:${qq}`]: e.target.value }))}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                        rows={2}
                        placeholder="Your answer..."
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <button
            onClick={submitAnswers}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.9),rgba(59,130,246,0.8))", color: "white", boxShadow: "0 0 24px rgba(124,58,237,0.3)" }}
          >
            {loading ? "🤖 AI sharks are deliberating..." : "📊 Submit Answers & Get Verdict"}
          </button>
        </div>
      )}

      {/* Loading during verdict phase */}
      {phase === "verdict" && loading && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-4xl">🦈🤔</span>
          <p className="text-sm font-semibold text-white">Sharks are reviewing your answers and business plan...</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>This takes 15-30 seconds</p>
        </div>
      )}

      {/* Error */}
      {sharkError && !loading && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "rgb(252,165,165)" }}>Shark Tank Error</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{sharkError}</p>
          </div>
        </div>
      )}

      {/* Phase 3: Results / Verdicts */}
      {(phase === "done" && reactions.length > 0) && (
        <>
          {/* Summary */}
          <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "rgb(74,222,128)" }}>{inCount}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Sharks IN</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "rgb(250,204,21)" }}>{counterCount}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Counter Offers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "rgb(252,165,165)" }}>{reactions.length - inCount - counterCount}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Sharks OUT</p>
            </div>
            <div className="ml-auto">
              {inCount + counterCount >= 3
                ? <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.3)" }}>🎉 Deal Likely!</span>
                : inCount + counterCount >= 1
                  ? <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(234,179,8,0.12)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.3)" }}>⚠️ Negotiate</span>
                  : <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "rgb(252,165,165)", border: "1px solid rgba(239,68,68,0.3)" }}>🚪 All Out</span>
              }
            </div>
          </div>

          {/* Individual shark cards */}
          <div className="space-y-3">
            {reactions.map((reaction, i) => {
              const shark = SHARKS.find(s => s.name === reaction.shark) || SHARKS[i]
              return (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${reaction.verdict === "IN" ? "rgba(34,197,94,0.3)" : reaction.verdict === "COUNTER" ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.2)"}` }}>
                  <div className="px-5 py-3 flex items-center gap-3"
                    style={{ background: reaction.verdict === "IN" ? "rgba(34,197,94,0.08)" : reaction.verdict === "COUNTER" ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.06)" }}>
                    <span className="text-xl">{shark.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{reaction.shark}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{shark.trait}</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                      background: reaction.verdict === "IN" ? "rgba(34,197,94,0.2)" : reaction.verdict === "COUNTER" ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)",
                      color: reaction.verdict === "IN" ? "rgb(74,222,128)" : reaction.verdict === "COUNTER" ? "rgb(250,204,21)" : "rgb(252,165,165)",
                    }}>
                      {reaction.verdict === "IN" ? "✅ I'M IN" : reaction.verdict === "COUNTER" ? "🤝 COUNTER" : "❌ I'M OUT"}
                    </span>
                  </div>
                  <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.01)" }}>
                    <p className="text-sm leading-relaxed italic" style={{ color: "rgba(255,255,255,0.7)" }}>
                      &ldquo;{reaction.comment}&rdquo;
                    </p>
                    {reaction.counter_offer && (
                      <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>Counter Offer</p>
                        <p className="text-sm font-medium" style={{ color: "rgb(250,204,21)" }}>{reaction.counter_offer}</p>
                      </div>
                    )}
                  </div>
                  {/* Show Q&A reference for this shark */}
                  {(() => {
                    const q = questions.find(qg => qg.shark === reaction.shark)
                    if (!q) return null
                    return (
                      <details className="px-5 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <summary className="text-xs cursor-pointer" style={{ color: "rgba(255,255,255,0.35)" }}>
                          📋 Review what you answered
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {q.questions.map((qq, qi) => (
                            <div key={qi}>
                              <p className="text-xs" style={{ color: shark.color }}>Q: {qq}</p>
                              <p className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                                A: {answers[`${q.shark}:${qq}`] || "(skipped)"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )
                  })()}
                </div>
              )
            })}
          </div>

          {/* Negotiation Action Plan */}
          <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                📋 Negotiation Action Plan
              </p>
              <button
                onClick={resetAll}
                className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                🔄 Pitch Again
              </button>
            </div>
            {inCount + counterCount >= 3 ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold" style={{ color: "rgb(74,222,128)" }}>You likely have a deal. Here&apos;s how to close it:</p>
                {[
                  "Prepare a one-page term sheet with clear milestones",
                  "Get a lawyer to review any counter-offer terms",
                  "Schedule individual follow-up calls within 48 hours",
                  "Prepare 3 months of detailed financials to answer due diligence",
                  "Have a clear use-of-funds breakdown ready",
                ].map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: "rgba(34,197,94,0.15)", color: "rgb(74,222,128)" }}>{i + 1}</span>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{action}</p>
                  </div>
                ))}
              </div>
            ) : inCount + counterCount >= 1 ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold" style={{ color: "rgb(250,204,21)" }}>You have counter-offers. Here&apos;s your negotiation playbook:</p>
                {reactions.filter(r => r.verdict === "COUNTER").map((r, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: "rgb(250,204,21)" }}>{r.shark}&apos;s counter: {r.counter_offer}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Tactic: Acknowledge the counter, ask for 48 hours to review with your co-founder, then come back with a structured compromise that splits the difference.
                    </p>
                  </div>
                ))}
                <div className="space-y-2">
                  {[
                    "Never accept a counter in the room — always ask for time to review",
                    "A BATNA (best alternative) makes you stronger at the table",
                    "Counter back with value-adds: board seat, advisory role, milestone-based vesting",
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5" style={{ color: "rgba(250,204,21,0.6)" }}>→</span>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold" style={{ color: "rgb(252,165,165)" }}>All sharks passed. Here&apos;s what to fix:</p>
                {[
                  v && v.viability_score < 7
                    ? `Improve viability: score is ${v.viability_score}/10. Get 5 customer interviews proving willingness to pay.`
                    : null,
                  `Reduce your ask or valuation — ${impliedValuation} may be too early for this stage.`,
                  "Get 3 months of real traction data before pitching again (users, revenue, or letters of intent).",
                  "Revisit your revenue model — make unit economics crystal clear.",
                  "Come back in 90 days with a stronger deck and proof points.",
                ].filter(Boolean).map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: "rgba(239,68,68,0.15)", color: "rgb(252,165,165)" }}>{i + 1}</span>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── AI Pitch Coach Tab ───────────────────────────────────────────────────────
type CoachAction = { action: string; why: string; priority: "High" | "Medium" | "Low" | string }
type Coaching = {
  elevator_pitch: string
  clarity_score: number
  clarity_reason?: string
  strengths: string[]
  weaknesses: string[]
  next_actions: CoachAction[]
  investor_questions: string[]
  model_used?: string
}

function PitchCoachTab({ plan }: { plan: BusinessPlan }) {
  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials
  const [coaching, setCoaching] = useState<Coaching | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pitchCopied, setPitchCopied] = useState(false)
  const [model, setModel] = useState("nvidia-nemotron")

  const runCoach = async () => {
    if (!v || !b) return
    setLoading(true)
    setError("")
    const ctx = {
      idea: plan.idea,
      summary: v.one_line_summary,
      viability_score: v.viability_score,
      problem: b.problem,
      solution: b.solution,
      usp: b.unique_value_proposition,
      market_size: m?.market_size,
      growth_rate: m?.growth_rate,
      revenue_model: b.revenue_model,
      year1_revenue: f?.year1_revenue,
      funding_needed: f?.funding_needed,
    }
    try {
      const API_BASE = apiBase()
      const res = await fetch(`${API_BASE}/api/pitch-coach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_context: ctx, model }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail || "The pitch coach is busy — please try again in a moment.")
        return
      }
      setCoaching(await res.json() as Coaching)
    } catch {
      setError("Couldn't reach the pitch coach. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const priorityColor = (p: string) =>
    p === "High" ? { c: "rgb(252,165,165)", bg: "rgba(239,68,68,0.12)", b: "rgba(239,68,68,0.3)" }
      : p === "Medium" ? { c: "rgb(250,204,21)", bg: "rgba(234,179,8,0.12)", b: "rgba(234,179,8,0.3)" }
        : { c: "rgb(74,222,128)", bg: "rgba(34,197,94,0.12)", b: "rgba(34,197,94,0.3)" }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.14),rgba(59,130,246,0.08))", border: "1px solid rgba(124,58,237,0.3)" }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎓</span>
          <div>
            <h2 className="text-lg font-bold text-white">AI Pitch Coach</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Honest, actionable coaching to sharpen your pitch before you face investors.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3 mb-1 flex-wrap">
          <FeatureModelPicker value={model} onChange={setModel} disabled={loading} />
        </div>
        <button
          onClick={runCoach}
          disabled={loading || !v || !b}
          className="w-full mt-3 py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "hsl(258,85%,64%)", color: "white", boxShadow: "0 0 24px rgba(124,58,237,0.3)" }}>
          {loading ? "🤖 Coaching in progress (10-20s)…" : coaching ? "🔄 Re-run coaching" : "🎓 Coach my pitch"}
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "rgb(252,165,165)" }}>Coaching unavailable</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {coaching && !loading && (
        <>
          {/* Elevator pitch + clarity score */}
          <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>🎤 Your 30-Second Elevator Pitch</p>
              <button
                onClick={() => { navigator.clipboard.writeText(coaching.elevator_pitch); setPitchCopied(true); setTimeout(() => setPitchCopied(false), 2000) }}
                className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
                {pitchCopied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-base leading-relaxed text-white mb-4" style={{ fontStyle: "italic" }}>
              &ldquo;{coaching.elevator_pitch}&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: coaching.clarity_score >= 7 ? "rgb(74,222,128)" : coaching.clarity_score >= 5 ? "rgb(250,204,21)" : "rgb(252,165,165)" }}>
                  {coaching.clarity_score}<span className="text-sm opacity-50">/10</span>
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Clarity</span>
              </div>
              {coaching.clarity_reason && (
                <p className="text-xs flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{coaching.clarity_reason}</p>
              )}
            </div>
          </div>

          {/* Strengths + weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "rgb(74,222,128)" }}>✓ Strengths</p>
              <ul className="space-y-2">
                {coaching.strengths?.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <span style={{ color: "rgb(74,222,128)" }}>·</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "rgb(252,165,165)" }}>⚠ Gaps to Fix</p>
              <ul className="space-y-2">
                {coaching.weaknesses?.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <span style={{ color: "rgb(252,165,165)" }}>·</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next actions */}
          <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>🎯 Prioritised Next Actions</p>
            <div className="space-y-3">
              {coaching.next_actions?.map((a, i) => {
                const pc = priorityColor(a.priority)
                return (
                  <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-white">{a.action}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: pc.bg, color: pc.c, border: `1px solid ${pc.b}` }}>{a.priority}</span>
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{a.why}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Investor questions */}
          {coaching.investor_questions?.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>❓ Tough Questions To Prepare For</p>
              <div className="space-y-2">
                {coaching.investor_questions.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5">
                    <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)" }}>{i + 1}</span>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {coaching.model_used && (
            <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Coaching generated by {coaching.model_used}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function PlanDisplay({ plan: planProp }: { plan: BusinessPlan }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("plan")
  const [copied, setCopied] = useState(false)
  const [hashCopied, setHashCopied] = useState(false)
  const [auditChain, setAuditChain] = useState<AuditChain | null>(null)
  const [auditLoading, setAuditLoading] = useState(true)

  // ── MongoDB change-streams realtime ─────────────────────────────────────────
  // Subscribe to GET /api/plan/:id/stream — an SSE feed driven by a MongoDB
  // change stream scoped to this plan. The backend pushes the FULL document on
  // every write, so this page updates live on any device with no SSE of its own.
  const [livePatch, setLivePatch] = useState<Partial<BusinessPlan>>({})
  const [rtConnected, setRtConnected] = useState(false)
  // Live-merged view: every `plan.*` read below reflects realtime updates.
  const plan: BusinessPlan = { ...planProp, ...livePatch }

  useEffect(() => {
    const id = planProp._id
    if (!id || id === "no-db") return
    let cancelled = false

    // Each event carries the FULL current document, so merging is monotonic.
    const apply = (doc: Record<string, unknown>) => {
      if (cancelled) return
      setLivePatch(prev => ({
        ...prev,
        status: (doc.status as BusinessPlan["status"]) ?? prev.status,
        validation: (doc.validation as BusinessPlan["validation"]) ?? prev.validation,
        market_research: (doc.market_research as BusinessPlan["market_research"]) ?? prev.market_research,
        personas: (doc.personas as BusinessPlan["personas"]) ?? prev.personas,
        business_plan: (doc.business_plan as BusinessPlan["business_plan"]) ?? prev.business_plan,
        financials: (doc.financials as BusinessPlan["financials"]) ?? prev.financials,
        risks: (doc.risks as BusinessPlan["risks"]) ?? prev.risks,
        share_token: (doc.share_token as string) ?? prev.share_token,
      }))
    }

    // The plan is already final when the server rendered it — no need to stream.
    if (planProp.status === "complete" || planProp.status === "failed") return

    const es = new EventSource(API.planStream(id))
    es.onopen = () => { if (!cancelled) setRtConnected(true) }
    es.onmessage = (e) => {
      try { apply(JSON.parse(e.data)) } catch { /* ignore keep-alives */ }
    }
    es.addEventListener("done", () => { es.close(); if (!cancelled) setRtConnected(false) })
    es.onerror = () => {
      // SSE auto-reconnects; surface as "not live" until it recovers. The
      // server-rendered plan still displays regardless.
      if (!cancelled) setRtConnected(false)
    }

    return () => {
      cancelled = true
      setRtConnected(false)
      es.close()
    }
  }, [planProp._id, planProp.status])

  useEffect(() => {
    if (!plan._id || plan._id === "no-db") { setAuditLoading(false); return }
    fetch(API.audit(plan._id))
      .then(res => {
        if (res.status === 404) { setAuditLoading(false); return null }
        if (!res.ok) throw new Error("fetch failed")
        return res.json() as Promise<AuditChain>
      })
      .then(data => { setAuditChain(data); setAuditLoading(false) })
      .catch(() => setAuditLoading(false))
  }, [plan._id])

  // ── HydraDB brain ingest ───────────────────────────────────────────────────────
  // After a plan completes, ingest it into HydraDB as knowledge so the ChatBot
  // and agents can semantically query plan context alongside chat memories.
  // Fire-and-forget so it never blocks the UI.
  const [brainIngested, setBrainIngested] = useState(false)
  useEffect(() => {
    if (brainIngested) return
    if (!plan._id || plan._id === "no-db") return
    if (plan.status !== "complete") return
    const userId = getUserId()
    if (!userId) return

    fetch(API.brainIngest, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: plan._id, user_id: userId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setBrainIngested(true)
      })
      .catch(() => {})
  }, [plan._id, plan.status, brainIngested])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const finalHash = auditChain?.chain?.[auditChain.chain.length - 1]?.hash ?? null

  const handleCopyHash = () => {
    if (!finalHash) return
    navigator.clipboard.writeText(finalHash)
    setHashCopied(true)
    setTimeout(() => setHashCopied(false), 2000)
  }

  // ── Full business-plan PDF export ──────────────────────────────────────────
  // window.print() alone only captures the active tab inside the dark app shell.
  // Instead we render the ENTIRE plan into a clean, print-formatted document in a
  // new window and trigger its print dialog → a proper multi-page PDF with every
  // section (validation, market, personas, plan, financials, risks, audit hash).
  const handleDownloadPdf = () => {
    const esc = (s: unknown) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const list = (items?: unknown[]) =>
      (items && items.length)
        ? `<ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`
        : `<p class="muted">—</p>`
    const generated = new Date(plan.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

    const sections: string[] = []
    if (v) sections.push(`
      <section><h2>1 · Validation</h2>
        <p class="score">${esc(v.viability_score)}<span>/10 viability</span></p>
        <p class="lead">${esc(v.one_line_summary)}</p>
        <p><strong>Core problem:</strong> ${esc(v.core_problem_solved)}</p>
        <p><strong>Target market:</strong> ${esc(v.target_market)}</p>
        <p><strong>Key concerns:</strong></p>${list(v.main_concerns)}
      </section>`)
    if (m) sections.push(`
      <section><h2>2 · Market Research</h2>
        <div class="grid2">
          <div class="box"><span class="lbl">Market size</span><strong>${esc(m.market_size)}</strong></div>
          <div class="box"><span class="lbl">Growth rate</span><strong>${esc(m.growth_rate)}</strong></div>
        </div>
        <p><strong>Market gap:</strong> ${esc(m.market_gap)}</p>
        ${(m.top_competitors && m.top_competitors.length) ? `<table><thead><tr><th>Competitor</th><th>Weakness</th></tr></thead><tbody>${m.top_competitors.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.weakness)}</td></tr>`).join("")}</tbody></table>` : ""}
      </section>`)
    if (plan.personas && plan.personas.length) sections.push(`
      <section><h2>3 · Customer Personas</h2>
        ${plan.personas.map(p => `
          <div class="persona">
            <strong>${esc(p.name)}</strong> <span class="muted">${esc(p.job)}${p.age ? " · " + esc(p.age) : ""}${p.location ? " · " + esc(p.location) : ""}</span>
            <p>"${esc(p.pain_point)}"</p>
            <p class="muted">Willing to pay: ${esc(p.willingness_to_pay)}${p.how_they_find_us ? " · Found via: " + esc(p.how_they_find_us) : ""}</p>
          </div>`).join("")}
      </section>`)
    if (b) sections.push(`
      <section><h2>4 · Business Plan</h2>
        <p><strong>Problem:</strong> ${esc(b.problem)}</p>
        <p><strong>Solution:</strong> ${esc(b.solution)}</p>
        <p><strong>Unique value:</strong> ${esc(b.unique_value_proposition)}</p>
        <p><strong>Revenue model:</strong> ${esc(b.revenue_model)}</p>
        ${(b.revenue_streams && b.revenue_streams.length) ? `<p><strong>Revenue streams:</strong></p>${list(b.revenue_streams)}` : ""}
        <p><strong>Go-to-market:</strong> ${esc(b.go_to_market)}</p>
      </section>`)
    if (f) sections.push(`
      <section><h2>5 · Financial Projections</h2>
        <table><tbody>
          <tr><td>Year 1 revenue</td><td>${esc(f.year1_revenue)}</td></tr>
          <tr><td>Year 2 revenue</td><td>${esc(f.year2_revenue)}</td></tr>
          <tr><td>Year 3 revenue</td><td>${esc(f.year3_revenue)}</td></tr>
          <tr><td>Startup cost</td><td>${esc(f.startup_cost)}</td></tr>
          <tr><td>Monthly burn</td><td>${esc(f.monthly_burn)}</td></tr>
          <tr><td>Break-even</td><td>Month ${esc(f.break_even_month)}</td></tr>
          <tr><td>Funding needed</td><td>${esc(f.funding_needed)}</td></tr>
        </tbody></table>
      </section>`)
    if (r) sections.push(`
      <section><h2>6 · Risk Analysis</h2>
        ${(r.risks && r.risks.length) ? r.risks.map(rk => `<p><strong>[${esc(rk.severity)}]</strong> ${esc(rk.risk)}<br/><span class="muted">Mitigation: ${esc(rk.mitigation)}</span></p>`).join("") : ""}
        ${r.swot ? `<div class="grid2 swot">
          <div class="box"><span class="lbl">Strengths</span>${list(r.swot.strengths)}</div>
          <div class="box"><span class="lbl">Weaknesses</span>${list(r.swot.weaknesses)}</div>
          <div class="box"><span class="lbl">Opportunities</span>${list(r.swot.opportunities)}</div>
          <div class="box"><span class="lbl">Threats</span>${list(r.swot.threats)}</div>
        </div>` : ""}
      </section>`)
    if (finalHash) sections.push(`
      <section><h2>7 · Integrity</h2>
        <p class="muted">SHA-256 tamper-evident audit chain${auditChain?.verified ? " — verified ✓" : ""}.</p>
        <p class="hash">${esc(finalHash)}</p>
      </section>`)

    const html = `<!doctype html><html><head><meta charset="utf-8"/>
      <title>${esc(plan.idea)} — PitchCraft Business Plan</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e; max-width: 820px; margin: 0 auto; padding: 48px 40px; line-height: 1.55; }
        .brand { color: #7c3aed; font-weight: 700; letter-spacing: -0.02em; font-size: 14px; }
        h1 { font-size: 26px; margin: 6px 0 4px; line-height: 1.25; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 28px; }
        h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.06em; color: #7c3aed; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 28px 0 12px; }
        section { page-break-inside: avoid; }
        p { font-size: 13px; margin: 6px 0; }
        .lead { font-size: 15px; font-weight: 600; }
        .score { font-size: 30px; font-weight: 800; color: #7c3aed; margin: 0; }
        .score span { font-size: 13px; font-weight: 500; color: #6b7280; }
        .muted { color: #6b7280; }
        ul { margin: 4px 0 8px; padding-left: 18px; }
        li { font-size: 13px; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
        th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        th { color: #6b7280; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 8px 0; }
        .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
        .box .lbl { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 2px; }
        .box strong { font-size: 14px; }
        .swot ul { margin: 2px 0; }
        .persona { border-left: 2px solid #ddd6fe; padding-left: 12px; margin: 10px 0; }
        .hash { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10px; word-break: break-all; color: #374151; background: #f9fafb; padding: 8px; border-radius: 6px; }
        .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; }
        @media print { body { padding: 0; } @page { margin: 18mm; } }
      </style></head>
      <body>
        <p class="brand">✦ PitchCraft</p>
        <h1>${esc(plan.idea)}</h1>
        <p class="meta">AI-generated business plan · Generated ${esc(generated)}</p>
        ${sections.join("")}
        <p class="footer">Generated by PitchCraft — a 7-agent AI business-plan engine. This document is AI-generated and should be validated before use in fundraising.</p>
        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };<\/script>
      </body></html>`

    const w = window.open("", "_blank")
    if (!w) {
      alert("Please allow pop-ups to download your plan as a PDF.")
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials
  const r = plan.risks

  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-20">

        {/* Header */}
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Business Plan
              {rtConnected && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full normal-case tracking-normal"
                  style={{ background: "rgba(239,68,68,0.12)", color: "rgb(252,165,165)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  Live
                </span>
              )}
            </p>
            <h1 className="text-2xl font-bold text-white leading-snug">{plan.idea}</h1>
            <p className="text-sm mt-1" suppressHydrationWarning style={{ color: "rgba(255,255,255,0.35)" }}>
              Generated {new Date(plan.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <button onClick={handleShare}
              className="text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors"
              style={{ background: "hsl(240,15%,12%)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {copied ? "✓ Copied!" : "Share"}
            </button>
            <button onClick={() => router.push("/generate")}
              className="text-sm px-4 py-2 rounded-lg cursor-pointer"
              style={{ background: "hsl(258,85%,64%)", color: "white" }}>
              New Plan
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([
            { id: "plan", label: "Business Plan", icon: "📄" },
            { id: "deck", label: "Pitch Deck", icon: "🎯" },
            { id: "roadmap", label: "90-Day Plan", icon: "🗺️" },
            { id: "tank", label: "🦈 Shark Tank", icon: "" },
            { id: "coach", label: "Pitch Coach", icon: "🎓" },
            { id: "audit", label: "Audit Trail", icon: "🔒" },
          ] as { id: Tab; label: string; icon: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap"
              style={activeTab === tab.id
                ? { background: "hsl(258,85%,64%)", color: "white", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }
                : { background: "transparent", color: "rgba(255,255,255,0.45)" }
              }
            >
              <span className="mr-1">{tab.icon}</span>{tab.label}
              {tab.id === "audit" && !auditLoading && auditChain && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full inline-block"
                  style={auditChain.verified
                    ? { background: "rgba(34,197,94,0.25)", color: "rgb(74,222,128)" }
                    : { background: "rgba(239,68,68,0.2)", color: "rgb(252,165,165)" }}>
                  {auditChain.verified ? "✓" : "✗"}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── BUSINESS PLAN TAB ── */}
        {activeTab === "plan" && (
          <>
            {v && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "4px solid hsl(258,85%,64%)" }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Validation</p>
                <div className="flex items-end gap-4 mb-4">
                  <p className="font-bold leading-none" style={{ fontSize: "4rem", color: "hsl(258,85%,74%)" }}>{v.viability_score}</p>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Viability Score / 10</p>
                    <p className="text-white font-medium">{v.one_line_summary}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.main_concerns?.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded"
                      style={{ background: "rgba(239,68,68,0.1)", color: "rgb(252,165,165)" }}>⚠ {c}</span>
                  ))}
                </div>
              </div>
            )}

            {m && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Market Research</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>MARKET SIZE</p>
                    <p className="text-white font-semibold text-lg">{m.market_size}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>GROWTH RATE</p>
                    <p className="text-white font-semibold text-lg">{m.growth_rate}</p>
                  </div>
                </div>
                <p className="text-sm mb-4 pl-3" style={{ borderLeft: "2px solid hsl(258,85%,64%)", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>{m.market_gap}</p>
                {/* Competitor table with search links */}
                {m.top_competitors && m.top_competitors.length > 0 && (
                  <>
                    <table className="w-full text-xs mb-3">
                      <thead>
                        <tr style={{ color: "rgba(255,255,255,0.35)" }}>
                          <th className="text-left py-1">Competitor</th>
                          <th className="text-left py-1">Weakness</th>
                          <th className="text-right py-1">Research</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.top_competitors.map((c, i) => (
                          <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <td className="py-1.5 text-white font-medium">{c.name}</td>
                            <td className="py-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.weakness}</td>
                            <td className="py-1.5 text-right">
                              <a
                                href={`https://duckduckgo.com/?q=${encodeURIComponent(c.name + " company startup")}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all"
                                style={{ background: "rgba(59,130,246,0.1)", color: "rgb(147,197,253)", border: "1px solid rgba(59,130,246,0.2)" }}
                              >
                                🔍 Search
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Market industry research link */}
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`https://duckduckgo.com/?q=${encodeURIComponent((m.market_size || plan.idea) + " market size report 2024")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "rgba(124,58,237,0.1)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.25)" }}
                      >
                        📊 Market reports
                      </a>
                      <a
                        href={`https://www.statista.com/search/?q=${encodeURIComponent(plan.idea)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "rgba(34,197,94,0.08)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.2)" }}
                      >
                        📈 Statista
                      </a>
                      <a
                        href={`https://www.crunchbase.com/discover/organization.companies/field/organizations/categories/${encodeURIComponent(plan.idea.split(" ").slice(0, 2).join("-").toLowerCase())}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "rgba(234,179,8,0.08)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.2)" }}
                      >
                        🚀 Crunchbase
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {plan.personas && plan.personas.length > 0 && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Customer Personas</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plan.personas.map((p, i) => (
                    <div key={i} className="rounded-2xl p-5 flex flex-col gap-3"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.2)" }}>
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3">
                        <PersonaAvatar name={p.name} size={48} />
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {p.job}{p.age ? ` · ${p.age}` : ""}
                          </p>
                        </div>
                      </div>
                      {/* Location + income */}
                      {(p.location || p.income_level) && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.location && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(59,130,246,0.12)", color: "rgb(147,197,253)", border: "1px solid rgba(59,130,246,0.25)" }}>
                              Location: {p.location}
                            </span>
                          )}
                          {p.income_level && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.25)" }}>
                              Income: {p.income_level}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Pain point */}
                      <p className="text-xs leading-relaxed italic"
                        style={{ color: "rgba(255,255,255,0.6)", borderLeft: "2px solid rgba(124,58,237,0.4)", paddingLeft: "8px" }}>
                        &quot;{p.pain_point}&quot;
                      </p>
                      {/* Behavior tags */}
                      {p.behavior_patterns && p.behavior_patterns.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.behavior_patterns.slice(0, 3).map((b, bi) => (
                            <span key={bi} className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* How they find us */}
                      {p.how_they_find_us && (
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          <span style={{ color: "rgba(255,255,255,0.2)" }}>Discovery: </span>{p.how_they_find_us}
                        </p>
                      )}
                      {/* WTP */}
                      <div className="mt-auto pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Willingness to Pay</p>
                        <p className="text-xs font-medium" style={{ color: "rgb(74,222,128)" }}>{p.willingness_to_pay}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {b && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Business Plan</p>
                {/* Problem / Solution / USP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {([
                    { label: "Problem", value: b.problem, border: "rgba(239,68,68,0.5)", bg: "rgba(239,68,68,0.04)" },
                    { label: "Solution", value: b.solution, border: "rgba(34,197,94,0.5)", bg: "rgba(34,197,94,0.04)" },
                    { label: "USP", value: b.unique_value_proposition, border: "rgba(124,58,237,0.5)", bg: "rgba(124,58,237,0.04)" },
                  ]).map(({ label, value, border, bg }) => (
                    <div key={label} className="p-4 rounded-xl flex flex-col gap-2"
                      style={{ background: bg, borderTop: `2px solid ${border}` }}>
                      <p className="text-xs uppercase tracking-widest font-semibold"
                        style={{ color: border.replace("0.5)", "0.7)"), fontSize: "0.6rem" }}>{label}</p>
                      {value
                        ? <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>{value}</p>
                        : <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.25)" }}>Not yet generated — regenerate your plan</p>
                      }
                    </div>
                  ))}
                </div>
                {/* Revenue Model */}
                {b.revenue_model && (
                  <div className="rounded-xl p-4 mb-3"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs uppercase tracking-widest mb-2 font-semibold"
                      style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>Revenue Model</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{b.revenue_model}</p>
                    {b.revenue_streams && b.revenue_streams.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {b.revenue_streams.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.2)" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Go-to-Market */}
                {b.go_to_market && (
                  <div className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs uppercase tracking-widest mb-2 font-semibold"
                      style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.6rem" }}>Go-to-Market Strategy</p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{b.go_to_market}</p>
                  </div>
                )}
                {/* Fallback if both revenue model and GTM are missing */}
                {!b.revenue_model && !b.go_to_market && (
                  <p className="text-xs italic text-center py-4" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Revenue model and Go-to-Market details will appear here once the plan is fully generated.
                  </p>
                )}
              </div>
            )}
            {f && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Financial Projections</p>
                {/* Animated revenue bars */}
                <style>{`
                  @keyframes growBar { from { width: 0% } }
                  .fin-bar { animation: growBar 1.2s cubic-bezier(.22,1,.36,1) both; }
                  .fin-bar-y1 { animation-delay: 0.1s; }
                  .fin-bar-y2 { animation-delay: 0.35s; }
                  .fin-bar-y3 { animation-delay: 0.6s; }
                  .fin-stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                  .fin-stat-card:hover { transform: translateY(-5px) scale(1.03); box-shadow: 0 12px 32px rgba(124,58,237,0.25); }
                `}</style>
                <div className="space-y-4 mb-5">
                  {(["Year 1", "Year 2", "Year 3"] as const).map((yr, idx) => {
                    const revs = [f.year1_revenue, f.year2_revenue, f.year3_revenue]
                    const pcts = [40, 65, 100]
                    const delays = ["fin-bar-y1", "fin-bar-y2", "fin-bar-y3"]
                    return (
                      <div key={yr}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{yr}</span>
                          <span className="text-xs font-semibold text-white">{revs[idx]}</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className={`fin-bar ${delays[idx]} h-full rounded-full`}
                            style={{
                              width: `${pcts[idx]}%`,
                              background: `linear-gradient(90deg, hsl(258,85%,54%), hsl(258,85%,74%))`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([["Startup Cost", f.startup_cost, "💼"], ["Monthly Burn", f.monthly_burn, "🔥"], ["Break Even", `Month ${f.break_even_month}`, "📅"], ["Funding", f.funding_needed, "💰"]] as [string, string, string][]).map(([lbl, val, icon]) => (
                    <div key={lbl} className="fin-stat-card text-center rounded-xl p-3 cursor-default" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-lg mb-0.5">{icon}</p>
                      <p className="font-bold text-white text-sm">{val}</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{lbl}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {r && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Risk Analysis</p>
                <div className="space-y-4 mb-6">
                  {r.risks?.map((risk, i) => {
                    const pct = risk.severity === "High" ? 82 : risk.severity === "Medium" ? 50 : 20
                    const clr = risk.severity === "High" ? "rgba(239,68,68,0.85)" : risk.severity === "Medium" ? "rgba(234,179,8,0.85)" : "rgba(34,197,94,0.85)"
                    const bg = risk.severity === "High" ? "rgba(239,68,68,0.15)" : risk.severity === "Medium" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)"
                    const txt = risk.severity === "High" ? "rgb(252,165,165)" : risk.severity === "Medium" ? "rgb(250,204,21)" : "rgb(74,222,128)"
                    return (
                      <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 font-semibold"
                              style={{ background: bg, color: txt }}>
                              {risk.severity}
                            </span>
                            <p className="text-sm text-white leading-snug">{risk.risk}</p>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: txt }}>{pct}%</span>
                        </div>
                        {/* Probability bar */}
                        <div className="h-1 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: clr, transition: "width 1s ease" }}
                          />
                        </div>
                        <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.4)" }}>{risk.mitigation}</p>
                      </div>
                    )
                  })}
                </div>
                {r.swot && (
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: "Strengths", items: r.swot.strengths, bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
                      { label: "Weaknesses", items: r.swot.weaknesses, bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
                      { label: "Opportunities", items: r.swot.opportunities, bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
                      { label: "Threats", items: r.swot.threats, bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
                    ]).map(({ label, items, bg, border }) => (
                      <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                        <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
                        <ul className="space-y-1">
                          {items?.map((item, i) => (
                            <li key={i} className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>· {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Viability Radar */}
            {v && m && (
              <div className="rounded-2xl p-6 mb-6"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Viability Radar</p>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>How your startup scores across 5 key dimensions — larger area = stronger overall viability</p>
                <RadarChart scores={[
                  { label: "Market", value: Math.min(10, Math.max(1, Math.round((m.opportunity_score ?? 7)))) },
                  { label: "Revenue", value: Math.min(10, Math.max(1, Math.round((v.viability_score ?? 7) * 0.9))) },
                  { label: "Innovation", value: Math.min(10, Math.max(1, Math.round((v.viability_score ?? 6) * 0.85))) },
                  { label: "Competition", value: Math.min(10, Math.max(1, 10 - Math.min(9, (m.top_competitors?.length ?? 3) * 2))) },
                  { label: "Execution", value: Math.min(10, Math.max(1, Math.round((v.viability_score ?? 6) * 0.8))) },
                ]} />
                {/* Axis legend */}
                <div className="mt-4 space-y-2">
                  {([
                    { axis: "Market", desc: "Size and growth rate of the target market. High score = large, fast-growing opportunity." },
                    { axis: "Revenue", desc: "Strength of the revenue model and pricing power based on overall viability score." },
                    { axis: "Innovation", desc: "Degree of differentiation vs existing solutions. High = unique, hard-to-copy product." },
                    { axis: "Competition", desc: "Lower competition = higher score. Calculated from number of identified direct competitors." },
                    { axis: "Execution", desc: "Founder / team readiness and operational complexity. Derived from viability assessment." },
                  ]).map(({ axis, desc }) => (
                    <div key={axis} className="flex items-start gap-2">
                      <span className="text-xs font-semibold flex-shrink-0 w-20" style={{ color: "hsl(258,80%,78%)" }}>{axis}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</span>
                    </div>
                  ))}
                </div>
                {/* Score band legend */}
                <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {([{ label: "1–4", sub: "Needs Work", c: "rgb(252,165,165)", bg: "rgba(239,68,68,0.1)" }, { label: "5–7", sub: "Good", c: "rgb(250,204,21)", bg: "rgba(234,179,8,0.1)" }, { label: "8–10", sub: "Excellent", c: "rgb(74,222,128)", bg: "rgba(34,197,94,0.1)" }]).map(b => (
                    <div key={b.label} className="flex-1 text-center rounded-lg py-1.5" style={{ background: b.bg }}>
                      <p className="text-xs font-bold" style={{ color: b.c }}>{b.label}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{b.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investor Email Generator */}
            <InvestorEmailBox plan={plan} />

            <button onClick={handleDownloadPdf}
              className="w-full py-3 rounded-xl text-sm cursor-pointer transition-colors flex items-center justify-center gap-2"
              style={{ background: "rgba(124,58,237,0.12)", color: "hsl(258,80%,80%)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v11m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Download full plan as PDF
            </button>
          </>
        )}

        {/* ── PITCH DECK TAB ── */}
        {activeTab === "deck" && <PitchDeckTab plan={plan} />}

        {/* ── 90-DAY ROADMAP TAB ── */}
        {activeTab === "roadmap" && <RoadmapTab plan={plan} />}

        {/* ── SHARK TANK TAB ── */}
        {activeTab === "tank" && <SharkTankTab plan={plan} />}

        {/* ── AI PITCH COACH TAB ── */}
        {activeTab === "coach" && <PitchCoachTab plan={plan} />}

        {/* ── AUDIT TRAIL TAB ── */}
        {activeTab === "audit" && (
          <div className="rounded-2xl"
            style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>

            {/* Tab header */}
            <div className="p-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                      SHA-256 tamper-evident audit chain
                    </p>
                    <InfoTooltip text="Each agent's output is cryptographically linked. Modifying any step invalidates every hash that follows, making tampering immediately detectable." />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Every agent step is hashed and linked to the previous — a blockchain-style integrity chain.
                  </p>
                </div>
                {!auditLoading && auditChain && (
                  <span
                    className="text-sm px-3 py-1.5 rounded-full font-semibold flex-shrink-0"
                    style={auditChain.verified
                      ? { background: "rgba(34,197,94,0.12)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.3)" }
                      : { background: "rgba(239,68,68,0.12)", color: "rgb(252,165,165)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    {auditChain.verified ? "Chain verified ✓" : "Chain broken ✗"}
                  </span>
                )}
              </div>
            </div>

            {/* Loading skeleton */}
            {auditLoading && (
              <div className="p-6 space-y-4 animate-pulse">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <div className="h-2.5 w-48 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                    </div>
                    <div className="h-2.5 w-28 rounded flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                ))}
              </div>
            )}

            {/* No chain */}
            {!auditLoading && !auditChain && (
              <div className="p-6 text-center py-12">
                <p className="text-3xl mb-3">🔓</p>
                <p className="text-sm font-medium text-white mb-1">Audit chain not available</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  This plan was generated without MongoDB — chain data was not persisted.
                </p>
              </div>
            )}

            {/* Timeline */}
            {!auditLoading && auditChain && (
              <div className="p-6">
                <div className="relative">
                  {/* Vertical connector line */}
                  <div
                    className="absolute left-4 top-4 bottom-4 w-px"
                    style={{ background: "linear-gradient(to bottom, rgba(124,58,237,0.4), rgba(34,197,94,0.3))" }}
                  />

                  <div className="space-y-0">
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const stepNum = idx + 1
                      const step = auditChain.chain.find(s => s.step_number === stepNum)
                      const isPresent = !!step

                      return (
                        <div key={stepNum} className="relative pl-12 pb-6 last:pb-0">
                          {/* Circle node */}
                          <div
                            className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={isPresent
                              ? { background: "rgba(34,197,94,0.12)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.35)" }
                              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.08)" }
                            }
                          >
                            {isPresent ? "✓" : stepNum}
                          </div>

                          {/* Step content */}
                          <div className="rounded-xl p-4"
                            style={isPresent
                              ? { background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }
                              : { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }
                            }>
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    Step {stepNum}
                                  </span>
                                  <span className="text-sm font-semibold text-white">
                                    {step?.step_name ?? STEP_NAMES[stepNum] ?? `Step ${stepNum}`}
                                  </span>
                                </div>

                                {isPresent && (
                                  <div className="flex items-center gap-3 flex-wrap mt-1">
                                    {/* Hash */}
                                    <span className="font-mono text-xs"
                                      style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
                                      {step.hash.slice(0, 12)}…
                                    </span>
                                    {/* Previous hash link */}
                                    {stepNum > 1 && (
                                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                                        ← prev: {step.previous_hash.slice(0, 8)}…
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Timestamp */}
                              {isPresent && (
                                <span className="text-xs flex-shrink-0 tabular-nums" suppressHydrationWarning
                                  style={{ color: "rgba(255,255,255,0.3)" }}>
                                  {new Date(step.timestamp_utc).toLocaleTimeString("en", {
                                    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "UTC",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Final hash + copy */}
                {finalHash && (
                  <div className="mt-6 pt-5 rounded-xl p-4"
                    style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(74,222,128,0.6)" }}>
                      Final chain hash
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs flex-1 min-w-0 break-all select-all"
                        style={{ color: "rgba(255,255,255,0.55)" }}>
                        {finalHash}
                      </span>
                      <button onClick={handleCopyHash}
                        className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                        style={{ background: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.25)" }}>
                        {hashCopied ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    {auditChain.generated_at && (
                      <p className="text-xs mt-2" suppressHydrationWarning style={{ color: "rgba(255,255,255,0.25)" }}>
                        Chain sealed: {new Date(auditChain.generated_at).toLocaleString("en-IN", { timeZone: "UTC" })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
