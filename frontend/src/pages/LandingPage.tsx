import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";

export default function LandingPage() {
  return (
    <div
      className="font-sora antialiased min-h-screen"
      style={{ background: "hsl(240,25%,4%)" }}
    >
      <Navbar />
      <HeroSection />
    </div>
  );
}
