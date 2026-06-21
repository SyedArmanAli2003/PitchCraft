"use client"
import { useEffect } from "react"

// App-wide last-resort error boundary. Catches errors in the root layout and
// anything not caught by a nested boundary, so users never see a blank screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body style={{ background: "hsl(240,25%,4%)", margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ textAlign: "center", maxWidth: "420px" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px" }}>⚠️</p>
            <h1 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 24px" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{ padding: "10px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: "white", background: "hsl(258,85%,64%)", border: "none", cursor: "pointer" }}>
              ↻ Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
