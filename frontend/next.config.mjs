/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["three"],
  async rewrites() {
    if (process.env.NODE_ENV === "development") {
      return [
        { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
        { source: "/health", destination: "http://localhost:8000/health" },
      ]
    }
    return []
  },
}

export default config
