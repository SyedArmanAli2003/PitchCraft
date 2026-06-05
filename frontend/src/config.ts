const isDev = import.meta.env.DEV

export const API_URL = isDev
  ? "http://localhost:8000"
  : import.meta.env.VITE_API_URL || "https://your-railway-url.up.railway.app"

export const ENDPOINTS = {
  generate: `${API_URL}/api/generate`,
  getPlan:  (id: string) => `${API_URL}/api/plan/${id}`,
  getShare: (token: string) => `${API_URL}/api/share/${token}`,
  health:   `${API_URL}/health`,
  mcpTools: `${API_URL}/api/mcp/tools`,
}
