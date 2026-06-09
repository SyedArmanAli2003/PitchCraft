"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

function saveUser(name: string, email: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  localStorage.setItem(
    "pitchcraft_user",
    JSON.stringify({ name: name.trim(), email: email.trim(), initials })
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]         = useState<"signin" | "signup">("signin")
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  // Redirect if already logged in
  useEffect(() => {
    try {
      if (localStorage.getItem("pitchcraft_user")) router.replace("/generate")
    } catch { /* ignore */ }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.includes("@")) { setError("Enter a valid email address."); return }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return }
    if (mode === "signup" && !name.trim()) { setError("Please enter your name."); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const displayName = mode === "signup" ? name : email.split("@")[0]
    saveUser(displayName, email)
    setLoading(false)
    router.push("/generate")
  }

  const handleGoogle = () => {
    setError("Google sign-in is coming soon. Please use email for now.")
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "hsl(240,25%,4%)" }}
    >
      {/* Back link */}
      <a
        href="/"
        className="fixed top-5 left-8 text-sm no-underline transition-colors"
        style={{ color: "rgba(255,255,255,0.32)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.32)")}
      >
        ← PitchCraft
      </a>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 mb-6 cursor-pointer" onClick={() => router.push("/")}>
            <span style={{ color: "hsl(258,90%,66%)", fontSize: "1.5rem" }}>✦</span>
            <span className="text-2xl font-semibold" style={{ color: "white" }}>
              Pitch<span style={{ color: "hsl(258,90%,66%)" }}>Craft</span>
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white mb-1.5">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
            {mode === "signin"
              ? "Sign in to generate business plans"
              : "Free during the Google Cloud Hackathon"}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: "hsl(240,15%,8%)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all mb-5"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              {mode === "signup" && (
                <FieldGroup label="Full name">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    autoComplete="name"
                    className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                    style={{ background: "hsl(240,15%,6%)", border: "1px solid rgba(255,255,255,0.08)", caretColor: "hsl(258,90%,66%)" }}
                    onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </FieldGroup>
              )}

              <FieldGroup label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                  style={{ background: "hsl(240,15%,6%)", border: "1px solid rgba(255,255,255,0.08)", caretColor: "hsl(258,90%,66%)" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </FieldGroup>

              <FieldGroup label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                  style={{ background: "hsl(240,15%,6%)", border: "1px solid rgba(255,255,255,0.08)", caretColor: "hsl(258,90%,66%)" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </FieldGroup>
            </div>

            {error && (
              <p className="text-xs mt-3" style={{ color: "rgb(252,165,165)" }}>
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 py-3.5 rounded-xl font-semibold text-white text-sm cursor-pointer transition-all disabled:opacity-55 disabled:cursor-not-allowed"
              style={{ background: "hsl(258,85%,64%)" }}
              onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = "0 0 24px rgba(124,58,237,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              {loading
                ? "Just a moment…"
                : mode === "signin"
                ? "Sign in →"
                : "Create account →"}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm mt-5" style={{ color: "rgba(255,255,255,0.38)" }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError("") }}
            className="cursor-pointer font-medium"
            style={{ color: "hsl(258,80%,78%)", background: "none", border: "none" }}
          >
            {mode === "signin" ? "Sign up free" : "Sign in"}
          </button>
        </p>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.18)" }}>
          No credit card · No verification · Built for Google Cloud Hackathon 2026
        </p>
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.42)" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
