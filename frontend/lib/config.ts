// API base resolution, in priority order:
//   1. NEXT_PUBLIC_API_BASE  — explicit override (client + server, dev + prod).
//      Use this for SPLIT deployments, e.g. frontend on Vercel + backend on
//      Google Cloud Run:  NEXT_PUBLIC_API_BASE=https://pitchcraft-xxxx.run.app
//   2. Production server-side — absolute URL from VERCEL_URL / FRONTEND_URL.
//   3. Otherwise relative "" — same-origin in prod, Next.js rewrites proxy
//      /api/* -> localhost:8000 in development.

function apiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE
  if (explicit) return explicit.replace(/\/+$/, "")

  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    const host = process.env.VERCEL_URL || process.env.FRONTEND_URL || ""
    return host ? `https://${host}` : ""
  }
  return ""
}

export const API = {
  generate:       `${apiBase()}/api/generate`,
  plan:           (id: string)    => `${apiBase()}/api/plan/${id}`,
  share:          (token: string) => `${apiBase()}/api/share/${token}`,
  audit:          (id: string)    => `${apiBase()}/api/plan/${id}/audit`,
  approvalDecide: (id: string)    => `${apiBase()}/api/approval/${id}/decide`,
  plans:          `${apiBase()}/api/plans`,
  stats:          `${apiBase()}/api/stats`,
  health:         `${apiBase()}/api/health`,
  models:         `${apiBase()}/api/models`,
  manifest:       `${apiBase()}/api/agent/manifest`,
  observability:  `${apiBase()}/api/observability`,
}

export type ModelKey =
  | "gemini-3.5-flash"
  | "gemini-3.1-flash-lite"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"

export interface ModelOption {
  key: ModelKey
  display: string
  tier: number
  badge?: string
  description?: string
  /** quota_status: 'ok' | 'limited' | 'pro_only' — shown to user */
  quota_status?: "ok" | "limited" | "pro_only"
}
