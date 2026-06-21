"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { memo } from "react"

interface AuthUser {
  name: string
  email: string
  initials: string
}

function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pitchcraft_user")
      if (stored) setUser(JSON.parse(stored))
    } catch { /* ignore */ }

    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const logout = () => {
    localStorage.removeItem("pitchcraft_user")
    setUser(null)
    setDropdownOpen(false)
    router.push("/")
  }

  const NAV_LINKS = [
    { label: "How It Works", href: "/#how-it-works" },
    { label: "History",      href: "/history" },
    { label: "Examples",     href: "/generate?demo=true" },
    { label: "GitHub",       href: "https://github.com/SyedArmanAli2003/PitchCraft", external: true },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 lg:px-16 transition-all duration-300"
      style={{
        height: "64px",
        background: scrolled
          ? "rgba(6,5,15,0.92)"
          : "rgba(6,5,15,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid rgba(255,255,255,0.03)",
      }}
    >
      {/* Logo */}
      <span
        className="text-xl font-semibold tracking-tight select-none cursor-pointer flex-shrink-0"
        onClick={() => router.push("/")}
      >
        <span style={{ color: "hsl(258,90%,66%)" }}>✦</span>
        <span style={{ color: "rgba(255,255,255,0.9)" }}> Pitch</span>
        <span style={{ color: "hsl(258,90%,66%)" }}>Craft</span>
      </span>

      {/* Nav links — desktop */}
      <div className="hidden md:flex gap-7">
        {NAV_LINKS.map(link => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="text-xs uppercase tracking-widest transition-colors duration-200"
            style={{
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right: auth + CTA */}
      <div className="flex items-center gap-2.5">
        {user ? (
          <>
            <button
              onClick={() => router.push("/generate")}
              className="hidden md:inline-flex uppercase text-xs tracking-widest font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "hsl(258,85%,64%)",
                color: "white",
                border: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(124,58,237,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              Generate Plan
            </button>
            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer select-none transition-all"
                style={{
                  background: "hsl(258,85%,64%)",
                  color: "white",
                  boxShadow: dropdownOpen ? "0 0 0 2px rgba(124,58,237,0.5)" : "none",
                }}
              >
                {user.initials}
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-12 rounded-xl py-1 min-w-[180px]"
                  style={{
                    background: "hsl(240,18%,11%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.38)" }}>{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/generate") }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: "rgba(255,255,255,0.72)", background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    New Plan
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/history") }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: "rgba(255,255,255,0.72)", background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    My Plans
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer"
                    style={{ color: "rgba(239,68,68,0.75)", background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="hidden md:inline-flex text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-all duration-200"
              style={{
                background: "transparent",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "white"
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.6)"
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"
              }}
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/generate")}
              className="hidden md:inline-flex uppercase text-xs tracking-widest font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "hsl(240,12%,16%)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "hsl(240,12%,20%)")}
              onMouseLeave={e => (e.currentTarget.style.background = "hsl(240,12%,16%)")}
            >
              Generate Plan
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default memo(Navbar)
