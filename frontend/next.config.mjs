/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["three"],

  // Public env vars baked into the bundle at build time.
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || "",
  },

  // Self-contained server bundle — only for Docker/Cloud Run (set BUILD_STANDALONE=true).
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" } : {}),

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Dev proxy: /api/* → FastAPI on port 8000
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
        { source: "/health",     destination: "http://localhost:8000/health" },
      ]
    }
    return []
  },
}

export default config
