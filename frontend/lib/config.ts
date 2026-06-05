const BASE = process.env.NODE_ENV === "production"
  ? (process.env.NEXT_PUBLIC_API_URL || "")
  : "http://localhost:8001"

export const API = {
  generate:   `${BASE}/api/generate`,
  plan:       (id: string)    => `${BASE}/api/plan/${id}`,
  share:      (token: string) => `${BASE}/api/share/${token}`,
  plans:      `${BASE}/api/plans`,
  stats:      `${BASE}/api/stats`,
  health:     `${BASE}/health`,
  models:     `${BASE}/api/models`,
}

export type ModelKey = "gemini" | "llama" | "deepseek" | "minimax"

export interface ModelOption {
  key: ModelKey
  display: string
  tier: number
}
