// Production (Vercel): same domain — use relative URLs client-side, absolute server-side
// Development: proxy via Next.js rewrites to localhost:8000

function getApiBase(): string {
  // Server-side in production: need absolute URL; use VERCEL_URL auto-set by Vercel
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    const host = process.env.VERCEL_URL || process.env.FRONTEND_URL || ""
    return host ? `https://${host}` : ""
  }
  // Client-side in production: relative URLs work (same domain)
  if (process.env.NODE_ENV === "production") return ""
  // Development: Next.js rewrites proxy /api/* → localhost:8000
  return ""
}

export const API = {
  generate:       "/api/generate",
  plan:           (id: string)    => `${getApiBase()}/api/plan/${id}`,
  share:          (token: string) => `${getApiBase()}/api/share/${token}`,
  audit:          (id: string)    => `/api/plan/${id}/audit`,
  approvalDecide: (id: string)    => `/api/approval/${id}/decide`,
  plans:          "/api/plans",
  stats:          "/api/stats",
  health:         "/api/health",
  models:         "/api/models",
  observability:  "/api/observability",
}

export type ModelKey =
  | "gemini-3-pro"
  | "gemini-3-flash"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"

export interface ModelOption {
  key: ModelKey
  display: string
  tier: number
}
