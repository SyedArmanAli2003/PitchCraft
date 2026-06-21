"use client"
import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"

// Auth callback — redirects back to the app after any OAuth/SSO flow.
// PitchCraft uses email+password auth so this is mostly a fallback landing page.
function CallbackContent() {
  const router = useRouter()

  useEffect(() => {
    // Simply redirect to generate page after any auth callback
    const redirectTo = sessionStorage.getItem("oauth_redirect") || "/generate"
    sessionStorage.removeItem("oauth_redirect")
    router.replace(redirectTo)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "hsl(240,25%,4%)" }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "hsl(258,85%,64%)" }} />
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
        Completing sign-in…
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "hsl(240,25%,4%)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "hsl(258,85%,64%)" }} />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
