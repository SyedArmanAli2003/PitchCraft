"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { BusinessPlan, AuditChain } from "@/lib/types"
import { API } from "@/lib/config"
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

// ── Viability Radar Chart ────────────────────────────────────────────────────
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

type Tab = "plan" | "deck" | "roadmap" | "tank" | "audit"

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

I'm building ${plan.idea} — ${v.one_line_summary}.

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
  { name: "Mark C.",   icon: "👆", style: "tough",        color: "rgba(239,68,68,0.8)",   bg: "rgba(239,68,68,0.07)",   trait: "Demands proof of traction and ruthless unit economics." },
  { name: "Sarah K.",  icon: "🦌", style: "strategic",   color: "rgba(59,130,246,0.8)",  bg: "rgba(59,130,246,0.07)",  trait: "Looks for defensible moats and brand-building potential." },
  { name: "Raj P.",    icon: "🥁", style: "tech-focused", color: "rgba(124,58,237,0.8)",  bg: "rgba(124,58,237,0.07)",  trait: "Obsessed with AI, scalability and recurring revenue." },
  { name: "Lisa T.",   icon: "🌟", style: "empathetic",   color: "rgba(234,179,8,0.8)",   bg: "rgba(234,179,8,0.07)",   trait: "Connects emotionally with the story and founding team." },
  { name: "Carlos M.", icon: "💼", style: "operational",  color: "rgba(34,197,94,0.8)",   bg: "rgba(34,197,94,0.07)",   trait: "Focuses on supply chain, operations and margins." },
]

type Reaction = { shark: string; verdict: "IN" | "OUT" | "COUNTER"; comment: string; counter_offer?: string }

function SharkTankTab({ plan }: { plan: BusinessPlan }) {
  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials

  const [askAmount, setAskAmount] = useState(f?.funding_needed?.replace(/[^0-9]/g, "") || "250000")
  const [equityPct, setEquityPct] = useState("10")
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [loading, setLoading] = useState(false)
  const [pitched, setPitched] = useState(false)

  const impliedValuation = askAmount && equityPct
    ? `$${(parseFloat(askAmount) / (parseFloat(equityPct) / 100) / 1_000_000).toFixed(2)}M`
    : "?"

  const runSimulation = async () => {
    if (!v || !b) return
    setLoading(true)
    setPitched(false)
    // Build context for each shark
    const ctx = {
      idea: plan.idea,
      viability_score: v.viability_score,
      summary: v.one_line_summary,
      problem: b.problem,
      solution: b.solution,
      usp: b.unique_value_proposition,
      market_size: m?.market_size,
      growth_rate: m?.growth_rate,
      revenue_model: b.revenue_model,
      year1_revenue: f?.year1_revenue,
      funding_needed: `$${Number(askAmount).toLocaleString()} for ${equityPct}% equity`,
      implied_valuation: impliedValuation,
    }
    // Simulate each shark via the backend
    try {
      const res = await fetch(`/api/shark-tank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_context: ctx, sharks: SHARKS.map(s => ({ name: s.name, style: s.style, trait: s.trait })) }),
      })
      if (res.ok) {
        const data = await res.json()
        setReactions(data.reactions || [])
      } else {
        // Client-side fallback simulation
        setReactions(simulateLocally(ctx))
      }
    } catch {
      setReactions(simulateLocally(ctx))
    }
    setLoading(false)
    setPitched(true)
  }

  function simulateLocally(ctx: Record<string, unknown>): Reaction[] {
    const score = Number(ctx.viability_score ?? 6)
    const valM = parseFloat(impliedValuation.replace(/[$M]/g, "")) || 2.5
    return SHARKS.map(shark => {
      let verdict: "IN" | "OUT" | "COUNTER" = "OUT"
      let comment = ""
      let counter_offer: string | undefined
      if (shark.style === "tough") {
        verdict = score >= 7 ? "COUNTER" : "OUT"
        comment = score >= 7
          ? `The viability score of ${score}/10 is acceptable, but I need traction data before I commit. $${Number(askAmount).toLocaleString()} at ${impliedValuation} is aggressive.`
          : `A score of ${score}/10 tells me this isn\'t ready. Come back when you have revenue. I\'m out.`
        if (verdict === "COUNTER") counter_offer = `I\'ll do the deal at ${Math.round(parseFloat(equityPct) * 1.5)}% equity — take it or leave it.`
      } else if (shark.style === "tech-focused") {
        verdict = score >= 6 ? "IN" : "COUNTER"
        comment = score >= 6
          ? `The AI angle is compelling. ${impliedValuation} valuation for this stage is fair if you hit ${String(ctx.year1_revenue ?? "Year 1 targets")}.`
          : `I like the tech but the valuation scares me. Let\'s talk about a note structure instead.`
        if (verdict === "COUNTER") counter_offer = `Convertible note at $${Math.round(parseFloat(askAmount) * 0.9).toLocaleString()} with a ${Math.round(parseFloat(equityPct) + 2)}% cap.`
      } else if (shark.style === "strategic") {
        verdict = valM <= 5 ? "IN" : "COUNTER"
        comment = valM <= 5
          ? `Smart positioning in a fragmented market. The moat is defensible and ${impliedValuation} is reasonable.`
          : `${impliedValuation} is too rich for me at this stage. I need to see more market penetration.`
        if (verdict === "COUNTER") counter_offer = `Same investment for ${Math.round(parseFloat(equityPct) + 3)}% — that values you at ${`$${((parseFloat(askAmount) / ((parseFloat(equityPct) + 3) / 100)) / 1_000_000).toFixed(1)}M`}.`
      } else if (shark.style === "empathetic") {
        verdict = score >= 5 ? "IN" : "OUT"
        comment = score >= 5
          ? `I love the story and mission. The customer pain is real. I\'m in — let\'s build this together.`
          : `The passion is there but the numbers aren\'t compelling enough for me to risk my money. I\'m out.`
      } else {
        verdict = score >= 6 && valM <= 6 ? "IN" : "OUT"
        comment = verdict === "IN"
          ? `The operational model is lean. ${String(ctx.revenue_model ?? "Revenue model")} can scale. Let\'s do it.`
          : `Margins worry me. Until you demonstrate unit economics work at scale, I\'m out.`
      }
      return { shark: shark.name, verdict, comment, counter_offer }
    })
  }

  const inCount    = reactions.filter(r => r.verdict === "IN").length
  const counterCount = reactions.filter(r => r.verdict === "COUNTER").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg,rgba(234,179,8,0.12),rgba(239,68,68,0.08))", border: "1px solid rgba(234,179,8,0.3)" }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🦈</span>
          <div>
            <h2 className="text-lg font-bold text-white">Shark Tank Simulator</h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Pitch your startup to 5 AI Sharks. Get a deal or go home.</p>
          </div>
        </div>
      </div>

      {/* Pitch Setup */}
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
        <button
          onClick={runSimulation}
          disabled={loading || !v || !b}
          className="w-full py-3.5 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.9),rgba(234,179,8,0.8))", color: "white", boxShadow: "0 0 24px rgba(239,68,68,0.3)" }}
        >
          {loading ? "⏳ Sharks are deliberating..." : pitched ? "🔄 Pitch Again" : "🎙 Step Into the Tank"}
        </button>
      </div>

      {/* Results */}
      {pitched && reactions.length > 0 && (
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
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      reaction.verdict === "IN" ? "" : reaction.verdict === "COUNTER" ? "" : ""
                    }`} style={{
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
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default function PlanDisplay({ plan }: { plan: BusinessPlan }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("plan")
  const [copied, setCopied] = useState(false)
  const [hashCopied, setHashCopied] = useState(false)
  const [auditChain, setAuditChain] = useState<AuditChain | null>(null)
  const [auditLoading, setAuditLoading] = useState(true)

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
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Business Plan
            </p>
            <h1 className="text-2xl font-bold text-white leading-snug">{plan.idea}</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Generated {new Date(plan.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
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
            { id: "plan",    label: "Business Plan",  icon: "📄" },
            { id: "deck",    label: "Pitch Deck",      icon: "🎯" },
            { id: "roadmap", label: "90-Day Plan",     icon: "🗺️" },
            { id: "tank",    label: "🦈 Shark Tank",    icon: "" },
            { id: "audit",   label: "Audit Trail",     icon: "🔒" },
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
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color: "rgba(255,255,255,0.35)" }}>
                      <th className="text-left py-1">Competitor</th>
                      <th className="text-left py-1">Weakness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.top_competitors?.map((c, i) => (
                      <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <td className="py-1.5 text-white">{c.name}</td>
                        <td className="py-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{c.weakness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.4),rgba(59,130,246,0.3))", color: "white", border: "2px solid rgba(124,58,237,0.4)" }}>
                          {p.name.slice(0,2).toUpperCase()}
                        </div>
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
                              📍 {p.location}
                            </span>
                          )}
                          {p.income_level && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.25)" }}>
                              💰 {p.income_level}
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
                    { label: "Problem",  value: b.problem,                    border: "rgba(239,68,68,0.5)",    bg: "rgba(239,68,68,0.04)"    },
                    { label: "Solution", value: b.solution,                   border: "rgba(34,197,94,0.5)",    bg: "rgba(34,197,94,0.04)"    },
                    { label: "USP",      value: b.unique_value_proposition,   border: "rgba(124,58,237,0.5)",   bg: "rgba(124,58,237,0.04)"   },
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
                <div className="space-y-3 mb-4">
                  {([["Year 1", f.year1_revenue, 40],["Year 2", f.year2_revenue, 65],["Year 3", f.year3_revenue, 100]] as [string,string,number][]).map(([yr, rev, pct]) => (
                    <div key={yr} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-right text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{yr}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: "hsl(258,85%,64%)" }} />
                      </div>
                      <span className="text-white font-medium w-28 text-right text-xs flex-shrink-0">{rev}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([["Startup Cost", f.startup_cost],["Monthly Burn", f.monthly_burn],["Break Even", `Month ${f.break_even_month}`],["Funding", f.funding_needed]] as [string,string][]).map(([lbl, val]) => (
                    <div key={lbl} className="text-center rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
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
                <div className="space-y-3 mb-6">
                  {r.risks?.map((risk, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                        style={{
                          background: risk.severity==="High" ? "rgba(239,68,68,0.15)" : risk.severity==="Medium" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
                          color: risk.severity==="High" ? "rgb(252,165,165)" : risk.severity==="Medium" ? "rgb(250,204,21)" : "rgb(74,222,128)",
                        }}>
                        {risk.severity}
                      </span>
                      <div>
                        <p className="text-sm text-white">{risk.risk}</p>
                        <p className="text-xs italic mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{risk.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {r.swot && (
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label:"Strengths", items: r.swot.strengths, bg:"rgba(34,197,94,0.08)", border:"rgba(34,197,94,0.2)" },
                      { label:"Weaknesses", items: r.swot.weaknesses, bg:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.2)" },
                      { label:"Opportunities", items: r.swot.opportunities, bg:"rgba(59,130,246,0.08)", border:"rgba(59,130,246,0.2)" },
                      { label:"Threats", items: r.swot.threats, bg:"rgba(234,179,8,0.08)", border:"rgba(234,179,8,0.2)" },
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
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Viability Radar</p>
                <RadarChart scores={[
                  { label: "Market",      value: Math.min(10, Math.max(1, Math.round((m.opportunity_score ?? 7)))) },
                  { label: "Revenue",     value: Math.min(10, Math.max(1, Math.round((v.viability_score ?? 7) * 0.9))) },
                  { label: "Innovation",  value: Math.min(10, Math.max(1, Math.round((v.viability_score ?? 6) * 0.85))) },
                  { label: "Competition", value: Math.min(10, Math.max(1, 10 - Math.min(9, (m.top_competitors?.length ?? 3) * 2))) },
                  { label: "Execution",   value: Math.min(10, Math.max(1, Math.round((v.viability_score ?? 6) * 0.8))) },
                ]} />
              </div>
            )}

            {/* Investor Email Generator */}
            <InvestorEmailBox plan={plan} />

            <button onClick={() => window.print()}
              className="w-full py-3 rounded-xl text-sm cursor-pointer transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              🖨 Print / Save as PDF
            </button>
          </>
        )}

        {/* ── PITCH DECK TAB ── */}
        {activeTab === "deck" && <PitchDeckTab plan={plan} />}

        {/* ── 90-DAY ROADMAP TAB ── */}
        {activeTab === "roadmap" && <RoadmapTab plan={plan} />}

        {/* ── SHARK TANK TAB ── */}
        {activeTab === "tank" && <SharkTankTab plan={plan} />}

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
                                <span className="text-xs flex-shrink-0 tabular-nums"
                                  style={{ color: "rgba(255,255,255,0.3)" }}>
                                  {new Date(step.timestamp_utc).toLocaleTimeString("en", {
                                    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
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
                      <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                        Chain sealed: {new Date(auditChain.generated_at).toLocaleString("en-IN")}
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
