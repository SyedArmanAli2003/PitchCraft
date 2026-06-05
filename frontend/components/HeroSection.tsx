"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ParticleBackground from "@/components/ParticleBackgroundWrapper"
import { API } from "@/lib/config"

export default function HeroSection() {
  const router = useRouter()
  const [planCount, setPlanCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(API.stats)
      .then(r => r.json())
      .then(d => setPlanCount(d.total_plans))
      .catch(() => {})
  }, [])

  return (
    <section
      className="relative min-h-screen flex items-end overflow-hidden"
      style={{ background: "hsl(240,25%,4%)" }}
    >
      <ParticleBackground />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, hsl(240,25%,4%) 0%, rgba(10,8,20,0.75) 35%, transparent 65%)",
          zIndex: 1,
        }}
      />

      {/* Hero content — bottom-left */}
      <div
        className="relative w-full px-8 md:px-14 pb-14 md:pb-20 pt-28"
        style={{ maxWidth: "min(90%, 740px)", transform: "translateZ(0)", zIndex: 2 }}
      >
        {/* Spinning pill badge */}
        <div
          className="animate-fade-up inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7 text-xs font-medium select-none"
          style={{
            animationDelay: "0.1s",
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "hsl(258,80%,78%)",
          }}
        >
          <span className="animate-spin-slow inline-block leading-none">✦</span>
          7-step AI agent · MongoDB · Gemini Flash
        </div>

        {/* Heading */}
        <h1
          className="animate-fade-up font-bold uppercase leading-[1.07] tracking-[-0.03em] mb-5"
          style={{ fontSize: "clamp(2.4rem,5.8vw,4.8rem)", animationDelay: "0.2s" }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300, display: "block" }}>
            Turn your idea into a
          </span>
          <span style={{
            color: "hsl(258,85%,74%)", fontWeight: 700, display: "block",
            textShadow: "0 0 55px rgba(139,92,246,0.55), 0 0 110px rgba(139,92,246,0.2)",
          }}>
            Business Plan
          </span>
          <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, display: "block" }}>
            in 60 seconds.
          </span>
        </h1>

        <p
          className="animate-fade-up font-light mb-3"
          style={{ fontSize: "clamp(1rem,1.8vw,1.3rem)", color: "rgba(255,255,255,0.65)", animationDelay: "0.38s" }}
        >
          No MBA required. No consultants. Just describe your idea.
        </p>

        <p
          className="animate-fade-up font-light mb-8"
          style={{
            fontSize: "clamp(0.78rem,1.1vw,0.93rem)",
            color: "rgba(255,255,255,0.32)",
            lineHeight: "1.8", maxWidth: "500px",
            animationDelay: "0.5s",
          }}
        >
          A 7-step AI agent powered by Gemini and MongoDB. Validates your idea,
          researches the market, builds personas, writes the full plan,
          projects financials, and analyzes risk — all under 60 seconds.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-up flex flex-wrap gap-3" style={{ animationDelay: "0.62s" }}>
          <button
            onClick={() => router.push("/generate")}
            style={{
              background: "hsl(258,85%,64%)", color: "#fff",
              padding: "0.9rem 2rem", borderRadius: "6px",
              fontWeight: 600, fontSize: "0.875rem",
              border: "none", cursor: "pointer",
              transition: "box-shadow 0.25s ease, transform 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 0 32px rgba(139,92,246,0.5)"
              e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "none"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            Generate My Plan — Free →
          </button>

          <button
            onClick={() => router.push("/generate?demo=true")}
            style={{
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "0.9rem 2rem", borderRadius: "6px",
              fontWeight: 500, fontSize: "0.875rem", cursor: "pointer",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.09)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
            }}
          >
            See Example Plan
          </button>
        </div>

        {/* Tech pills */}
        <div className="animate-fade-up flex items-center flex-wrap gap-2 mt-7" style={{ animationDelay: "0.78s" }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem" }}>Powered by</span>
          {["🍃 MongoDB","✦ Gemini Flash","⚡ FastAPI","◈ Google Cloud"].map(l => (
            <span key={l} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.38)",
              fontSize: "0.7rem", padding: "0.25rem 0.75rem", borderRadius: "999px",
            }}>
              {l}
            </span>
          ))}
        </div>

        {/* Live counter */}
        <p className="animate-fade-up mt-3" style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", animationDelay: "0.9s" }}>
          {planCount !== null ? `${planCount} business plans generated · ` : ""}
          Rapid Agent Hackathon 2026 · MongoDB Partner Track
        </p>
      </div>
    </section>
  )
}
