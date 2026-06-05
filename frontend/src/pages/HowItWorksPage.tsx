import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STEPS = [
  {
    number: "01",
    emoji: "✅",
    title: "Idea Validation",
    description:
      "The agent scores your idea from 1–10, identifies your target market, and flags the top concerns investors would raise. You get a one-line pitch you can use instantly.",
    highlight: "Viability Score + One-Line Pitch",
  },
  {
    number: "02",
    emoji: "📊",
    title: "Market Research",
    description:
      "Using live AI inference, PitchCraft estimates total addressable market size, annual growth rate, identifies the market gap your idea fills, and names your top 3 competitors with their weaknesses.",
    highlight: "TAM · Growth Rate · Competitor Analysis",
  },
  {
    number: "03",
    emoji: "👤",
    title: "Customer Personas",
    description:
      "Generates 3 detailed customer personas — complete with job title, core pain point, and realistic willingness-to-pay estimate. Know your buyers before you write a line of code.",
    highlight: "3 Personas · Pain Points · WTP",
  },
  {
    number: "04",
    emoji: "📋",
    title: "Business Plan",
    description:
      "The AI writes your complete business plan: problem statement, proposed solution, unique selling proposition, revenue model, and a go-to-market strategy tailored to your target segment.",
    highlight: "Problem → Solution → Revenue → GTM",
  },
  {
    number: "05",
    emoji: "💰",
    title: "Financial Projections",
    description:
      "Generates realistic Year 1–3 revenue projections, estimated startup cost, monthly burn rate, expected break-even month, and funding requirements. No spreadsheet required.",
    highlight: "3-Year Projection · Break-Even · Burn Rate",
  },
  {
    number: "06",
    emoji: "🛡",
    title: "Risk Analysis",
    description:
      "Identifies the top risks for your business — categorized by severity (high/medium/low) — with specific mitigation strategies for each. Investor-ready risk disclosure in seconds.",
    highlight: "Severity Tiers · Mitigation Strategies",
  },
  {
    number: "07",
    emoji: "⚡",
    title: "SWOT Analysis",
    description:
      "A full SWOT matrix built specifically for your idea — Strengths, Weaknesses, Opportunities, and Threats — formatted and ready to drop into any pitch deck or investor brief.",
    highlight: "Full SWOT Matrix · Pitch-Ready",
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="font-sora antialiased min-h-screen" style={{ background: "hsl(240,25%,4%)" }}>
      <Navbar />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 md:px-14 pt-36 pb-16 text-center">
        <span
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
          style={{
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "hsl(258,80%,78%)",
          }}
        >
          ✦ 7 Steps · Under 60 Seconds
        </span>
        <h1
          className="font-bold uppercase leading-tight tracking-[-0.03em] mb-5"
          style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", color: "rgba(255,255,255,0.95)" }}
        >
          How{" "}
          <span style={{ color: "hsl(258,85%,74%)", textShadow: "0 0 40px rgba(139,92,246,0.45)" }}>
            PitchCraft
          </span>{" "}
          Works
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", maxWidth: "560px", margin: "0 auto" }}>
          A sequential 7-step AI agent that transforms a raw idea into a
          complete, investor-ready business plan.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-6 md:px-14 pb-24">
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[2.35rem] top-0 bottom-0 w-px hidden md:block"
            style={{ background: "rgba(124,58,237,0.2)" }}
          />

          <div className="flex flex-col gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-6 md:gap-8 items-start">
                {/* Step circle */}
                <div
                  className="shrink-0 w-[4.7rem] h-[4.7rem] rounded-full flex flex-col items-center justify-center text-center relative z-10"
                  style={{
                    background: "hsl(240,18%,8%)",
                    border: "1px solid rgba(124,58,237,0.35)",
                    animationDelay: `${i * 0.08}s`,
                  }}
                >
                  <span style={{ fontSize: "1.3rem" }}>{step.emoji}</span>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.6rem", letterSpacing: "0.1em" }}>
                    {step.number}
                  </span>
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl p-5 transition-colors duration-200"
                  style={{
                    background: "hsl(240,15%,8%)",
                    border: "1px solid hsl(240,12%,16%)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(124,58,237,0.4)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.borderColor =
                      "hsl(240,12%,16%)")
                  }
                >
                  <h2 className="font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
                    {step.title}
                  </h2>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {step.description}
                  </p>
                  <span
                    className="inline-block text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(124,58,237,0.1)",
                      border: "1px solid rgba(124,58,237,0.25)",
                      color: "hsl(258,80%,75%)",
                    }}
                  >
                    {step.highlight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: "1.25rem", fontSize: "0.9rem" }}>
            Ready to run all 7 steps on your idea?
          </p>
          <button
            onClick={() => navigate("/generate")}
            style={{
              background: "hsl(258,85%,64%)",
              color: "#fff",
              padding: "0.9rem 2.25rem",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 28px rgba(139,92,246,0.45)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.boxShadow = "none")
            }
          >
            Generate My Plan — Free →
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
