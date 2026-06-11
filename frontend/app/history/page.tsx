"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { API } from "@/lib/config"
import { getUserId, clearUserId } from "@/lib/user"
import Navbar from "@/components/Navbar"
import type { BusinessPlan } from "@/lib/types"

type PlanSummary = Pick<BusinessPlan, "_id" | "idea" | "created_at" | "status"> & {
  validation?: { viability_score: number; one_line_summary: string }
  model_used?: string
}

function ScoreBadge({ score }: { score: number }) {
  const color  = score >= 7 ? "rgba(34,197,94,0.9)"   : score >= 5 ? "rgba(234,179,8,0.9)"   : "rgba(239,68,68,0.9)"
  const bg     = score >= 7 ? "rgba(34,197,94,0.12)"  : score >= 5 ? "rgba(234,179,8,0.12)"  : "rgba(239,68,68,0.12)"
  const border = score >= 7 ? "rgba(34,197,94,0.3)"   : score >= 5 ? "rgba(234,179,8,0.3)"   : "rgba(239,68,68,0.3)"
  return (
    <span className="text-xl font-bold tabular-nums px-3 py-1 rounded-xl"
      style={{ color, background: bg, border: `1px solid ${border}` }}>
      {score}<span className="text-xs font-normal opacity-60">/10</span>
    </span>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get or create user ID on mount
  useEffect(() => {
    const id = getUserId()
    setUserId(id)
  }, [])

  // Fetch only this user's plans
  useEffect(() => {
    if (!userId) return
    const url = `${API.plans}?user_id=${encodeURIComponent(userId)}`
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: PlanSummary[]) => {
        setPlans(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not load plans. Make sure the backend is running.")
        setLoading(false)
      })
  }, [userId])

  const handleClearHistory = () => {
    if (!confirm("This will clear your local identity and you won't see these plans again. Are you sure?")) return
    clearUserId()
    router.push("/generate")
  }

  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">

        {/* Header */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              My Plans
            </p>
            <h1 className="text-3xl font-bold text-white">Your Generated Plans</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              Plans generated from this browser — stored securely in MongoDB Atlas.
            </p>
            {userId && (
              <p className="text-xs mt-1 font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
                Device ID: {userId.slice(0, 8)}…
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
            <button
              onClick={handleClearHistory}
              className="text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              style={{ background: "rgba(239,68,68,0.08)", color: "rgba(252,165,165,0.7)", border: "1px solid rgba(239,68,68,0.15)" }}>
              Clear Identity
            </button>
            <button
              onClick={() => router.push("/generate")}
              className="text-sm px-4 py-2 rounded-xl font-semibold text-white cursor-pointer"
              style={{ background: "hsl(258,85%,64%)" }}>
              + New Plan
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse"
                style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)", height: "180px" }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-2xl mb-3">⚠️</p>
            <p className="text-white font-semibold mb-1">Failed to load plans</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && plans.length === 0 && (
          <div className="rounded-2xl p-16 text-center"
            style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-4xl mb-4">🚀</p>
            <p className="text-white font-semibold text-lg mb-2">No plans yet from this device</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
              Generate your first AI business plan in under 2 minutes.
            </p>
            <button
              onClick={() => router.push("/generate")}
              className="px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
              style={{ background: "hsl(258,85%,64%)" }}>
              Generate a Plan →
            </button>
          </div>
        )}

        {/* Plan grid */}
        {!loading && !error && plans.length > 0 && (
          <>
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
              {plans.length} plan{plans.length !== 1 ? "s" : ""} from this device · sorted by newest first
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <Link key={plan._id} href={`/plan/${plan._id}`}
                  className="group rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer"
                  style={{
                    background: "hsl(240,15%,8%)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)"
                    ;(e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"
                    ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                  }}>

                  {/* Score + badge row */}
                  <div className="flex items-center justify-between">
                    {plan.validation ? (
                      <ScoreBadge score={plan.validation.viability_score} />
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                        Generating…
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(124,58,237,0.12)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.25)" }}>
                      Mine ✓
                    </span>
                  </div>

                  {/* Idea title */}
                  <p className="text-white font-semibold text-sm leading-snug line-clamp-2 flex-1">
                    {plan.idea}
                  </p>

                  {/* Summary */}
                  {plan.validation?.one_line_summary && (
                    <p className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      {plan.validation.one_line_summary}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(plan.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                    <span className="text-xs font-medium group-hover:text-white transition-colors"
                      style={{ color: "hsl(258,80%,78%)" }}>
                      View Plan →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
