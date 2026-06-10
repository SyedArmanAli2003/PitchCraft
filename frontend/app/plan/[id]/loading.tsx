// Streaming skeleton shown while the server component fetches the plan.
export default function PlanLoading() {
  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-6 pt-24 pb-20 animate-pulse">
        {/* Header */}
        <div className="h-3 w-24 rounded mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-7 w-3/4 rounded mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-3 w-40 rounded mb-8" style={{ background: "rgba(255,255,255,0.05)" }} />

        {/* Tab bar */}
        <div className="h-11 w-full rounded-xl mb-6" style={{ background: "rgba(255,255,255,0.04)" }} />

        {/* Section cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-6 mb-6"
            style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="h-3 w-28 rounded mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="h-4 w-full rounded mb-2" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-4 w-5/6 rounded mb-2" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="h-4 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
