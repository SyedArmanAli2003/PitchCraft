"use client"
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/HeroSection"
import {
  HowItWorksSection,
  AgentsSection,
  ExamplesSection,
  FeaturesSection,
  CtaSection,
  FooterSection,
} from "@/components/LandingSections"

export default function HomePage() {
  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <AgentsSection />
      <ExamplesSection />
      <FeaturesSection />
      <CtaSection />
      <FooterSection />
    </div>
  )
}
