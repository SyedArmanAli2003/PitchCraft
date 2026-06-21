"use client"
import { useEffect } from "react"
import Link from "next/link"

// Route-level error boundary for a single plan page. Catches render/fetch
// errors in the plan view (e.g. a malformed plan document or a transient
// backend failure) so the user gets a recoverable screen instead of a crash.
export default function PlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Plan page error:", error)
  }, [error])

  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center" style={{ maxWidth: "440px" }}>
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-white mb-2">
            Couldn&apos;t load this plan
          </h1>
          <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            The plan failed to load — it may still be generating, or the backend
            hit a temporary hiccup. Try again in a moment.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
              style={{ background: "hsl(258,85%,64%)" }}>
              ↻ Try again
            </button>
            <Link
              href="/history"
              className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
              My Plans
            </Link>
            <Link
              href="/generate"
              className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Generate New →
            </Link>
          </div>
          {error?.digest && (
            <p className="text-xs mt-6 font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              ref: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
