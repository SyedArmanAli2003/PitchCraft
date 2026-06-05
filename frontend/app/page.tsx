"use client"
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/HeroSection"

export default function HomePage() {
  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />
    </div>
  )
}
