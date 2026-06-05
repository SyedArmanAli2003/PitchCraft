import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";

export default function LandingPage() {
  return (
    <div className="bg-hero-bg min-h-screen">
      <Navbar />
      <HeroSection />
    </div>
  );
}
