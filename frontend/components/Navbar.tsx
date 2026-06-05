"use client"
import { useRouter } from "next/navigation"
import { memo } from "react"

const NAV_LINKS = ["How It Works","Examples","API","Pricing","GitHub"]

function Navbar() {
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 lg:px-16 py-5">
      {/* Logo */}
      <span
        className="text-xl font-semibold tracking-tight select-none cursor-pointer"
        onClick={() => router.push("/")}
      >
        <span style={{ color: "hsl(258,90%,66%)" }}>✦</span>
        <span style={{ color: "rgba(255,255,255,0.9)" }}> Pitch</span>
        <span style={{ color: "hsl(258,90%,66%)" }}>Craft</span>
      </span>

      {/* Nav links */}
      <div className="hidden md:flex gap-8">
        {NAV_LINKS.map(link => (
          <span
            key={link}
            className="text-sm uppercase tracking-widest cursor-pointer transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
          >
            {link}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push("/generate")}
        className="hidden md:inline-flex uppercase text-xs tracking-widest font-medium px-6 py-3 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.97]"
        style={{
          background: "hsl(240,12%,14%)",
          color: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "hsl(240,12%,18%)")}
        onMouseLeave={e => (e.currentTarget.style.background = "hsl(240,12%,14%)")}
      >
        Generate Plan
      </button>
    </nav>
  )
}

export default memo(Navbar)
