/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["three"],

  // Self-contained server bundle for the Cloud Run Docker image (frontend/Dockerfile).
  // Vercel ignores this and uses its own output.
  output: "standalone",

  // In development: proxy /api/* to FastAPI running on port 8000
  // In production on Vercel: vercel.json rewrites handle /api/* → api/index.py
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
