"use client"
import dynamic from "next/dynamic"

const ParticleBackground = dynamic(
  () => import("./ParticleBackground"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0" style={{ background: "hsl(240,25%,4%)" }} />
    ),
  }
)

export default ParticleBackground
