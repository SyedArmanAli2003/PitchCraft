"use client"
import { memo } from "react"
import type { AgentStep } from "@/lib/types"

const SPECIALISTS: Record<number, string> = {
  1: "Strategy Analyst",
  2: "Market Research · MongoDB",
  3: "Customer Insights",
  4: "Business Architect",
  5: "Financial Modeller",
  6: "Risk & Compliance",
  7: "Chief of Staff",
}

interface StepCardProps {
  step: AgentStep
  demo?: boolean
}

type ToolKey = AgentStep["tool"]

const TOOL_BADGE: Record<ToolKey, { label: string; bg: string; color: string; border: string }> = {
  "gemini-3-flash-preview": { label: "G3 FLASH",     bg: "rgba(234,179,8,0.15)",  color: "hsl(38,95%,72%)",    border: "rgba(234,179,8,0.4)"   },
  "gemini-3.1-flash-lite":  { label: "G3.1 LITE",    bg: "rgba(16,185,129,0.15)", color: "hsl(160,90%,72%)",   border: "rgba(16,185,129,0.4)"  },
  "gemini-3.5-flash":       { label: "G3.5 FLASH",   bg: "rgba(168,85,247,0.18)", color: "hsl(280,90%,82%)",   border: "rgba(168,85,247,0.4)"  },
  "gemini-2.5-flash":       { label: "G2.5 FLASH",   bg: "rgba(124,58,237,0.12)", color: "hsl(258,80%,78%)",   border: "rgba(124,58,237,0.28)" },
  "gemini-2.5-flash-lite":  { label: "G2.5 LITE",    bg: "rgba(99,102,241,0.12)", color: "hsl(239,84%,78%)",   border: "rgba(99,102,241,0.28)" },
  "gemini-3.1-pro":         { label: "G3.1 PRO",     bg: "rgba(168,85,247,0.18)", color: "hsl(280,90%,82%)",   border: "rgba(168,85,247,0.4)"  },
  "gemini-2.5-pro":         { label: "G2.5 PRO",   bg: "rgba(124,58,237,0.18)", color: "hsl(258,90%,82%)",   border: "rgba(124,58,237,0.4)"  },
  "gemini-2.0-flash":       { label: "G2.0",       bg: "rgba(99,102,241,0.12)", color: "hsl(239,84%,78%)",   border: "rgba(99,102,241,0.28)" },
  "gemini-1.5-flash":       { label: "G1.5",       bg: "rgba(139,92,246,0.1)",  color: "hsl(262,60%,75%)",   border: "rgba(139,92,246,0.22)" },
  mongodb:                  { label: "MONGODB",    bg: "rgba(34,197,94,0.12)",  color: "rgb(74,222,128)",    border: "rgba(34,197,94,0.25)"  },
  system:                   { label: "SYSTEM",     bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "rgba(255,255,255,0.12)" },
}

function ToolBadge({ tool }: { tool: ToolKey }) {
  const b = TOOL_BADGE[tool] ?? TOOL_BADGE["gemini-3-flash-preview"]
  return (
    <span className="text-xs px-2 py-0.5 rounded-full"
      style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
      {b.label}
    </span>
  )
}

function StepCard({ step, demo = false }: StepCardProps) {
  const { stepNumber, name, status, data, startedAt, completedAt } = step
  const duration = startedAt && completedAt
    ? ((completedAt - startedAt) / 1000).toFixed(1) + "s"
    : null

  const borderColor = {
    waiting:  "rgba(255,255,255,0.06)",
    running:  "rgba(124,58,237,0.5)",
    complete: "rgba(34,197,94,0.4)",
    error:    "rgba(239,68,68,0.4)",
  }[status]

  const circleStyle = {
    waiting:  { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" },
    running:  { background: "rgba(124,58,237,0.2)",   color: "hsl(258,90%,75%)" },
    complete: { background: "rgba(34,197,94,0.15)",   color: "rgb(74,222,128)" },
    error:    { background: "rgba(239,68,68,0.15)",   color: "rgb(252,165,165)" },
  }[status]

  return (
    <div
      className="w-full rounded-2xl p-5 mb-3 transition-all duration-300"
      style={{
        position: "relative",
        overflow: "hidden",
        background: "hsl(240,15%,8%)",
        border: `1px solid ${demo ? "rgba(234,179,8,0.28)" : borderColor}`,
        opacity: status === "waiting" ? 0.5 : 1,
        boxShadow: status === "running" ? "0 0 20px rgba(124,58,237,0.12)" : "none",
      }}
    >
      {demo && (
        <span
          aria-hidden
          className="pointer-events-none select-none font-extrabold"
          style={{
            position: "absolute",
            top: "50%",
            right: "1.25rem",
            transform: "translateY(-50%) rotate(-14deg)",
            fontSize: "2.4rem",
            letterSpacing: "0.18em",
            color: "rgba(234,179,8,0.08)",
            zIndex: 0,
          }}
        >
          DEMO
        </span>
      )}
      <div className="flex justify-between items-center" style={{ position: "relative", zIndex: 1 }}>
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${status === "running" ? "animate-pulse" : ""}`}
            style={circleStyle}
          >
            {status === "complete" ? "✓" : stepNumber}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{name}</p>
            {status === "running" && (
              <p className="text-xs mt-0.5" style={{ color: "hsl(258,80%,72%)" }}>
                ⚡ {SPECIALISTS[stepNumber]} is working...
              </p>
            )}
            {status === "complete" && duration && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(74,222,128,0.8)" }}>
                ✓ {SPECIALISTS[stepNumber]} · done in {duration}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== "waiting" && <ToolBadge tool={step.tool} />}
          {status === "running" && (
            <div className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "hsl(258,90%,66%)", borderTopColor: "transparent" }} />
          )}
          {status === "complete" && <span className="text-xs" style={{ color: "rgb(74,222,128)" }}>Done</span>}
          {status === "error" && <span className="text-xs text-red-400">Failed</span>}
        </div>
      </div>

      <div className={`step-content ${status === "complete" && data ? "open" : ""}`} style={{ position: "relative", zIndex: 1 }}>
        {status === "complete" && data && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <StepData stepNumber={stepNumber} data={data} />
          </div>
        )}
      </div>
    </div>
  )
}

function StepData({ stepNumber, data }: { stepNumber: number; data: Record<string, unknown> }) {
  const val = (key: string) => data[key] as string | undefined

  if (stepNumber === 1) return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs px-2 py-1 rounded-full"
        style={{ background: (data.viability_score as number) >= 7 ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)", color: (data.viability_score as number) >= 7 ? "rgb(74,222,128)" : "rgb(250,204,21)" }}>
        Score: {data.viability_score as number}/10
      </span>
      <p className="text-sm w-full" style={{ color: "rgba(255,255,255,0.7)" }}>{val("one_line_summary")}</p>
      {(data.main_concerns as string[] | undefined)?.map((c, i) => (
        <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "rgb(252,165,165)" }}>⚠ {c}</span>
      ))}
    </div>
  )

  if (stepNumber === 2) {
    // Live backend sends a dict ({ industry_queried, similar_plans_found, ... });
    // the demo replay uses a plain string array. Render either.
    const raw = data.mongodb_sources
    const industry = !Array.isArray(raw) && typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>).industry_queried as string | undefined
      : undefined
    const sourcesLine = Array.isArray(raw)
      ? raw.join(" · ")
      : raw && typeof raw === "object"
        ? `market_data.${industry ?? "industry"} · ${(raw as Record<string, unknown>).similar_plans_found ?? 0} similar plans matched in Atlas`
        : "MongoDB MCP: 1 query executed"
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>MARKET SIZE</p><p className="text-white font-medium">{val("market_size")}</p></div>
          <div><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>GROWTH RATE</p><p className="text-white font-medium">{val("growth_rate")}</p></div>
          <div className="sm:col-span-2"><p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>MARKET GAP</p><p style={{ color: "rgba(255,255,255,0.7)" }}>{val("market_gap")}</p></div>
        </div>
        {/* MongoDB MCP visibility panel — the agent queried Atlas over the real MCP protocol */}
        <div className="mt-3 rounded-xl p-3"
          style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "rgb(74,222,128)" }}>
            🍃 MongoDB MCP — market data retrieved
          </p>
          <p className="text-xs font-mono mb-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tool: get_industry_market_data(&quot;{industry ?? "industry"}&quot;)
          </p>
          <p className="text-xs font-mono mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tool: search_similar_plans(&quot;{industry ?? "idea keywords"}&quot;)
          </p>
          <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Sources: {sourcesLine}
          </p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "rgba(74,222,128,0.7)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgb(74,222,128)" }} />
            Connected via Model Context Protocol
          </p>
        </div>
      </div>
    )
  }

  if (stepNumber === 3) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {(data.personas as Array<{ name: string; job: string; willingness_to_pay: string }> | undefined)?.map((p, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-bold"
            style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)" }}>
            {p.name.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs font-medium text-white">{p.name}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{p.job}</p>
          <p className="text-xs mt-1" style={{ color: "rgb(74,222,128)" }}>{p.willingness_to_pay}</p>
        </div>
      ))}
    </div>
  )

  if (stepNumber === 4) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      {["problem", "solution", "unique_value_proposition"].map((key, i) => (
        <div key={key} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", borderTop: `2px solid ${["rgba(239,68,68,0.5)", "rgba(34,197,94,0.5)", "rgba(124,58,237,0.5)"][i]}` }}>
          <p className="uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem" }}>{["Problem", "Solution", "USP"][i]}</p>
          <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: "1.6" }}>{val(key)}</p>
        </div>
      ))}
    </div>
  )

  if (stepNumber === 5) return (
    <div className="space-y-2">
      {[["Year 1", val("year1_revenue"), 40], ["Year 2", val("year2_revenue"), 65], ["Year 3", val("year3_revenue"), 90]].map(([yr, rev, pct]) => (
        <div key={String(yr)} className="flex items-center gap-3 text-xs">
          <span className="w-12 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>{yr}</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ background: "hsl(258,85%,64%)", width: `${pct}%` }} />
          </div>
          <span className="text-white font-medium w-24 text-right">{rev}</span>
        </div>
      ))}
      <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        Break-even: month {data.break_even_month as number} · Funding: {val("funding_needed")}
      </p>
      {!!data.mongodb_benchmarks && (
        <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "rgba(74,222,128,0.75)" }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "rgb(74,222,128)" }} />
          🍃 Anchored to MongoDB benchmarks via MCP
          {(() => {
            const bm = data.mongodb_benchmarks as Record<string, unknown>
            const n = bm.plans_analyzed as number | undefined
            return n ? ` — ${n} stored plans analyzed` : ""
          })()}
        </p>
      )}
    </div>
  )

  if (stepNumber === 6) return (
    <div className="space-y-2">
      {(data.risks as Array<{ risk: string; severity: string }> | undefined)?.slice(0, 3).map((r, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{
            background: r.severity === "High" ? "rgba(239,68,68,0.15)" : r.severity === "Medium" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
            color: r.severity === "High" ? "rgb(252,165,165)" : r.severity === "Medium" ? "rgb(250,204,21)" : "rgb(74,222,128)",
          }}>{r.severity}</span>
          <p style={{ color: "rgba(255,255,255,0.7)" }}>{r.risk}</p>
        </div>
      ))}
    </div>
  )

  if (stepNumber === 7) return (
    <div className="text-center py-2">
      <p className="text-2xl mb-2">🎉</p>
      <p className="text-sm font-medium text-white">Business plan complete!</p>
      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Saved to MongoDB · Share link ready</p>
    </div>
  )

  return null
}

export default memo(StepCard)
