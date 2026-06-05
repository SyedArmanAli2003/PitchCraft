"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { BusinessPlan } from "@/lib/types"
import Navbar from "@/components/Navbar"

export default function PlanDisplay({ plan }: { plan: BusinessPlan }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const v = plan.validation
  const m = plan.market_research
  const b = plan.business_plan
  const f = plan.financials
  const r = plan.risks

  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">

        {/* Header */}
        <div className="flex justify-between items-start mb-8 gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Business Plan
            </p>
            <h1 className="text-2xl font-bold text-white leading-snug">
              {plan.idea}
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Generated {new Date(plan.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
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

        {/* Validation */}
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

        {/* Market Research */}
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

        {/* Personas */}
        {plan.personas && plan.personas.length > 0 && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Customer Personas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plan.personas.map((p, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 font-bold"
                    style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)" }}>
                    {p.name.slice(0,2).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{p.job} · {p.age}</p>
                  <p className="text-xs mt-2 italic" style={{ color: "rgba(255,255,255,0.5)" }}>&quot;{p.pain_point}&quot;</p>
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.12)", color: "rgb(74,222,128)" }}>
                    {p.willingness_to_pay}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Plan */}
        {b && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Business Plan</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[
                { label:"Problem", key:"problem", border:"rgba(239,68,68,0.5)" },
                { label:"Solution", key:"solution", border:"rgba(34,197,94,0.5)" },
                { label:"USP", key:"unique_value_proposition", border:"rgba(124,58,237,0.5)" },
              ].map(({ label, key, border }) => (
                <div key={key} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", borderTop: `2px solid ${border}` }}>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" }}>{label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{b[key as keyof typeof b] as string}</p>
                </div>
              ))}
            </div>
            <details className="mb-2">
              <summary className="text-sm cursor-pointer font-medium py-2" style={{ color: "hsl(258,80%,78%)" }}>Revenue Model ›</summary>
              <p className="text-sm mt-1 pl-4" style={{ color: "rgba(255,255,255,0.6)" }}>{b.revenue_model}</p>
            </details>
            <details>
              <summary className="text-sm cursor-pointer font-medium py-2" style={{ color: "hsl(258,80%,78%)" }}>Go-to-Market Strategy ›</summary>
              <p className="text-sm mt-1 pl-4" style={{ color: "rgba(255,255,255,0.6)" }}>{b.go_to_market}</p>
            </details>
          </div>
        )}

        {/* Financials */}
        {f && (
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Financial Projections</p>
            <div className="space-y-3 mb-4">
              {([["Year 1", f.year1_revenue, 40],["Year 2", f.year2_revenue, 65],["Year 3", f.year3_revenue, 100]] as [string,string,number][]).map(([yr, rev, pct]) => (
                <div key={yr} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-right text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{yr}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: "hsl(258,85%,64%)" }} />
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

        {/* Risks */}
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

        <button onClick={() => window.print()}
          className="w-full py-3 rounded-xl text-sm cursor-pointer transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
          Print / Save as PDF
        </button>
      </div>
    </div>
  )
}
