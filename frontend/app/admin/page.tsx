"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""

interface UserStat {
  user_id: string
  total_plans: number
  complete_plans: number
  last_active: string
}

interface PlanRow {
  _id: string
  idea: string
  created_at: string
  status: string
  user_id: string
  validation?: { viability_score: number; one_line_summary?: string }
}

interface AdminStats {
  total_plans: number
  plans_today: number
  unique_users: number
  users: UserStat[]
  gemini_ready: boolean
  mongodb_connected: boolean
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "hsl(240,15%,8%)", border: `1px solid ${color}33` }}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "plans" | "users">("overview")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchData = useCallback(async (s: string) => {
    setLoading(true)
    setError("")
    try {
      const [statsRes, plansRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { headers: { "X-Admin-Secret": s } }),
        fetch(`${API_BASE}/api/admin/plans?limit=100`, { headers: { "X-Admin-Secret": s } }),
      ])
      if (!statsRes.ok) {
        if (statsRes.status === 401) { setError("Invalid admin secret"); setAuthed(false); return }
        if (statsRes.status === 503) { setError("Admin not configured — set ADMIN_SECRET on the backend"); return }
        throw new Error(`Stats fetch failed: ${statsRes.status}`)
      }
      const statsData: AdminStats = await statsRes.json()
      const plansData: PlanRow[] = plansRes.ok ? await plansRes.json() : []
      setStats(statsData)
      setPlans(plansData)
      setAuthed(true)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetchData(secret)
  }

  // Auto-refresh every 30s when authed
  useEffect(() => {
    if (!authed) return
    const interval = setInterval(() => fetchData(secret), 30_000)
    return () => clearInterval(interval)
  }, [authed, secret, fetchData])

  const displayedPlans = statusFilter === "all" ? plans : plans.filter(p => p.status === statusFilter)

  if (!authed) {
    return (
      <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <p className="text-4xl mb-4">🛡️</p>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Supervisor access — enter the admin secret to continue
              </p>
            </div>
            <form onSubmit={handleLogin}
              className="rounded-2xl p-8"
              style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Admin Secret
              </label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Enter ADMIN_SECRET…"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none mb-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                required
              />
              {error && (
                <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <p className="text-sm" style={{ color: "rgb(252,165,165)" }}>{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer disabled:opacity-50"
                style={{ background: "hsl(258,85%,64%)" }}>
                {loading ? "Authenticating…" : "Access Dashboard →"}
              </button>
            </form>
            <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
              Set <code className="px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>ADMIN_SECRET</code> env var on the backend to enable this
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(124,58,237,0.2)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
                Supervisor
              </span>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Real-time platform monitoring — auto-refreshes every 30 seconds
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(secret)}
              className="text-sm px-4 py-2 rounded-xl cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
              ↻ Refresh
            </button>
            <button
              onClick={() => { setAuthed(false); setSecret("") }}
              className="text-sm px-4 py-2 rounded-xl cursor-pointer"
              style={{ background: "rgba(239,68,68,0.1)", color: "rgb(252,165,165)", border: "1px solid rgba(239,68,68,0.2)" }}>
              Logout
            </button>
          </div>
        </div>

        {/* System Status Banner */}
        {stats && (
          <div className="rounded-2xl p-4 mb-6 flex flex-wrap gap-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <span className={stats.mongodb_connected ? "text-green-400" : "text-red-400"}>●</span>
              <p className="text-sm text-white">MongoDB</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stats.mongodb_connected ? "Connected" : "Disconnected"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={stats.gemini_ready ? "text-green-400" : "text-yellow-400"}>●</span>
              <p className="text-sm text-white">Gemini API</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stats.gemini_ready ? "Keys loaded" : "No keys"}</p>
            </div>
            <div className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Last updated: {new Date().toLocaleTimeString("en-IN")}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Plans" value={stats.total_plans} icon="📄" color="hsl(258,85%,64%)" />
            <StatCard label="Plans Today" value={stats.plans_today} icon="📅" color="rgb(74,222,128)" />
            <StatCard label="Unique Users" value={stats.unique_users} icon="👥" color="rgb(147,197,253)" />
            <StatCard label="Complete Plans" value={plans.filter(p => p.status === "complete").length} icon="✅" color="rgb(250,204,21)" />
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([
            { id: "overview", label: "Overview",   icon: "📊" },
            { id: "plans",    label: "All Plans",   icon: "📋" },
            { id: "users",    label: "Users",       icon: "👥" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={activeTab === tab.id
                ? { background: "hsl(258,85%,64%)", color: "white" }
                : { background: "transparent", color: "rgba(255,255,255,0.45)" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-4">
            {/* Top users */}
            <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Most Active Users</p>
              {stats.users.slice(0, 5).map((u, i) => (
                <div key={i} className="flex items-center gap-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(124,58,237,0.2)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-white truncate">{u.user_id || "anonymous"}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Last active: {u.last_active ? new Date(u.last_active).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-white">{u.total_plans}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>plans</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "rgb(74,222,128)" }}>{u.complete_plans}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>complete</p>
                  </div>
                </div>
              ))}
              {stats.users.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>No users yet</p>
              )}
            </div>

            {/* Recent plans preview */}
            <div className="rounded-2xl p-6" style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Recent Plans (last 10)</p>
              <div className="space-y-2">
                {plans.slice(0, 10).map(p => (
                  <div key={p._id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "complete" ? "bg-green-400" : p.status === "generating" ? "bg-yellow-400" : "bg-red-400"}`} />
                    <Link href={`/plan/${p._id}`} className="text-sm text-white hover:text-purple-300 flex-1 truncate transition-colors">
                      {p.idea}
                    </Link>
                    {p.validation?.viability_score && (
                      <span className="text-xs font-bold" style={{ color: "hsl(258,80%,78%)" }}>{p.validation.viability_score}/10</span>
                    )}
                    <span className="text-xs flex-shrink-0 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {p.user_id?.slice(0, 8) || "anon"}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Plans Tab */}
        {activeTab === "plans" && (
          <div>
            {/* Filter bar */}
            <div className="flex gap-2 mb-4">
              {["all", "complete", "generating", "failed"].map(s => (
                <button key={s}
                  onClick={() => setStatusFilter(s)}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                  style={statusFilter === s
                    ? { background: "hsl(258,85%,64%)", color: "white" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  <span className="ml-1 opacity-60">
                    ({s === "all" ? plans.length : plans.filter(p => p.status === s).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Idea</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Score</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Status</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>User ID</th>
                    <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Date</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPlans.map((p, i) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td className="p-4 max-w-xs">
                        <p className="text-sm text-white truncate">{p.idea}</p>
                        <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{p._id.slice(-8)}</p>
                      </td>
                      <td className="p-4">
                        {p.validation?.viability_score ? (
                          <span className="text-sm font-bold" style={{
                            color: p.validation.viability_score >= 7 ? "rgb(74,222,128)" : p.validation.viability_score >= 5 ? "rgb(250,204,21)" : "rgb(252,165,165)"
                          }}>{p.validation.viability_score}/10</span>
                        ) : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                      </td>
                      <td className="p-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: p.status === "complete" ? "rgba(34,197,94,0.12)" : p.status === "generating" ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)",
                          color: p.status === "complete" ? "rgb(74,222,128)" : p.status === "generating" ? "rgb(250,204,21)" : "rgb(252,165,165)",
                          border: `1px solid ${p.status === "complete" ? "rgba(34,197,94,0.3)" : p.status === "generating" ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {(p.user_id || "anonymous").slice(0, 12)}…
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </td>
                      <td className="p-4">
                        <Link href={`/plan/${p._id}`}
                          className="text-xs px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                          style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)" }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {displayedPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                        No plans found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && stats && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Device ID</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Total Plans</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Complete</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Success Rate</th>
                  <th className="text-left p-4 text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {stats.users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td className="p-4">
                      <p className="text-xs font-mono text-white">{u.user_id || "anonymous"}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-white">{u.total_plans}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold" style={{ color: "rgb(74,222,128)" }}>{u.complete_plans}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", maxWidth: "80px" }}>
                          <div className="h-full rounded-full" style={{
                            width: `${u.total_plans > 0 ? Math.round((u.complete_plans / u.total_plans) * 100) : 0}%`,
                            background: "hsl(258,85%,64%)"
                          }} />
                        </div>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {u.total_plans > 0 ? Math.round((u.complete_plans / u.total_plans) * 100) : 0}%
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {u.last_active ? new Date(u.last_active).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </p>
                    </td>
                  </tr>
                ))}
                {stats.users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
