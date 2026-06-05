import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StepCard, { type StepState, type StepStatus } from "../components/StepCard";
import { useIdea } from "../context/IdeaContext";

/* ─── Initial steps ─────────────────────────────────────────────────────────── */
const STEP_NAMES = [
  "Idea Validation",
  "Market Research",
  "Customer Personas",
  "Business Plan",
  "Financial Projections",
  "Risk Analysis",
  "Finalizing Plan",
];

function makeInitialSteps(): StepState[] {
  return STEP_NAMES.map((name, i) => ({
    stepNumber: i + 1,
    stepName: name,
    status: "waiting" as StepStatus,
  }));
}

/* ─── Streaming hook ────────────────────────────────────────────────────────── */
function useGenerateStream() {
  const [steps, setSteps] = useState<StepState[]>(makeInitialSteps);
  const [planId, setPlanId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startGeneration = async (idea: string) => {
    setSteps(makeInitialSteps());
    setIsStreaming(true);
    setPlanId(null);

    // Mark step 1 as running immediately
    setSteps((s) =>
      s.map((step) =>
        step.stepNumber === 1 ? { ...step, status: "running" } : step
      )
    );

    try {
      const response = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const id = response.headers.get("X-Plan-ID");
      if (id) setPlanId(id);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            // Update completed step
            setSteps((s) =>
              s.map((step) =>
                step.stepNumber === event.step
                  ? { ...step, status: event.status, data: event.data }
                  : step
              )
            );
            // Mark next step as running
            if (event.status === "complete" && event.step < 7) {
              setSteps((s) =>
                s.map((step) =>
                  step.stepNumber === event.step + 1
                    ? { ...step, status: "running" }
                    : step
                )
              );
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err) {
      console.error("Generation stream error:", err);
      // Mark current running step as error
      setSteps((s) =>
        s.map((step) =>
          step.status === "running" ? { ...step, status: "error" } : step
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return { steps, planId, isStreaming, startGeneration };
}

/* ─── Running step index (1-based) ─────────────────────────────────────────── */
function currentStepIndex(steps: StepState[]): number {
  const running = steps.find((s) => s.status === "running");
  if (running) return running.stepNumber;
  const lastComplete = [...steps].reverse().find((s) => s.status === "complete");
  if (lastComplete) return lastComplete.stepNumber;
  return 1;
}

/* ─── Idea Input ─────────────────────────────────────────────────────────────── */
interface IdeaInputProps {
  initialValue: string;
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

function IdeaInput({ initialValue, onSubmit, isLoading }: IdeaInputProps) {
  const [value, setValue] = useState(initialValue);
  const MAX = 200;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  };

  return (
    <div style={{ animation: "fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      <h1
        style={{
          fontSize: "clamp(2rem,5vw,3.5rem)",
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.1,
          marginBottom: 12,
          letterSpacing: "-0.03em",
        }}
      >
        What's your startup idea?
      </h1>
      <p
        style={{
          color: "hsl(240,8%,55%)",
          fontSize: 16,
          marginBottom: 24,
        }}
      >
        Describe it in one sentence. Be specific.
      </p>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX))}
          placeholder="e.g. A mobile app that connects local farmers with urban restaurants for same-day produce delivery…"
          rows={4}
          style={{
            width: "100%",
            minHeight: 120,
            background: "hsl(240,15%,8%)",
            border: "1px solid hsl(240,12%,18%)",
            borderRadius: 12,
            padding: "18px 20px",
            color: "#fff",
            fontSize: 16,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.55,
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor =
              "hsl(258,90%,66%)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLTextAreaElement).style.borderColor =
              "hsl(240,12%,18%)";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
        }}
      >
        <span style={{ color: "hsl(240,8%,45%)", fontSize: 13 }}>
          {value.length} / {MAX}
        </span>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        style={{
          width: "100%",
          padding: "16px",
          background:
            !value.trim() || isLoading
              ? "hsl(240,12%,20%)"
              : "hsl(258,90%,66%)",
          color: !value.trim() || isLoading ? "hsl(240,8%,40%)" : "#fff",
          border: "none",
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 16,
          cursor: !value.trim() || isLoading ? "not-allowed" : "pointer",
          transition: "background 0.2s ease, filter 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          if (!value.trim() || isLoading) return;
          (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.filter = "none";
        }}
      >
        {isLoading ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                animation: "spin 0.7s linear infinite",
                flexShrink: 0,
              }}
            />
            Analyzing your idea…
          </>
        ) : (
          "Analyze My Idea →"
        )}
      </button>

      <p
        style={{
          textAlign: "center",
          color: "hsl(240,8%,40%)",
          fontSize: 12,
          marginTop: 12,
        }}
      >
        Press ⌘+Enter to submit · No sign-up required
      </p>
    </div>
  );
}

/* ─── Top Bar ────────────────────────────────────────────────────────────────── */
interface TopBarProps {
  currentStep: number;
  totalSteps: number;
  isStreaming: boolean;
  hasStarted: boolean;
  allComplete: boolean;
  hasError: boolean;
}

function TopBar({ currentStep, totalSteps, isStreaming, hasStarted, allComplete, hasError }: TopBarProps) {
  const navigate = useNavigate();

  const badgeContent = () => {
    if (isStreaming) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "hsla(258,90%,66%,0.12)",
            border: "1px solid hsla(258,90%,66%,0.35)",
            color: "hsl(258,90%,75%)",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "hsl(258,90%,66%)",
              display: "inline-block",
              animation: "pulse 1.4s ease-in-out infinite",
            }}
          />
          Generating…
        </span>
      );
    }
    if (!hasStarted) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "hsla(240,12%,18%,0.8)",
            border: "1px solid hsl(240,12%,22%)",
            color: "hsl(240,8%,55%)",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Ready
        </span>
      );
    }
    if (hasError) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "hsla(0,84%,60%,0.1)",
            border: "1px solid hsla(0,84%,60%,0.35)",
            color: "hsl(0,84%,70%)",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 10 }}>✗</span>
          Failed
        </span>
      );
    }
    if (allComplete) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "hsla(142,71%,45%,0.1)",
            border: "1px solid hsla(142,71%,45%,0.35)",
            color: "hsl(142,71%,55%)",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 10 }}>✓</span>
          Complete
        </span>
      );
    }
    // started but stopped early without error (e.g. partial)
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "hsla(38,92%,55%,0.1)",
          border: "1px solid hsla(38,92%,55%,0.35)",
          color: "hsl(38,92%,65%)",
          borderRadius: 999,
          padding: "4px 14px",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Stopped
      </span>
    );
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background:
          "linear-gradient(to bottom, hsl(240,25%,4%) 0%, transparent 100%)",
      }}
    >
      {/* Logo */}
      <a
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
          cursor: "pointer",
        }}
        onClick={(e) => { e.preventDefault(); navigate("/"); }}
      >
        <span style={{ color: "hsl(258,90%,66%)", marginRight: 2, fontSize: 16 }}>✦</span>
        <span style={{ fontSize: 18, fontWeight: 600, color: "hsl(0,0%,96%)" }}>
          Pitch<span style={{ color: "hsl(258,90%,66%)" }}>Craft</span>
        </span>
      </a>

      {/* Step counter */}
      {hasStarted && (
        <span style={{ color: "hsl(240,8%,60%)", fontSize: 13, fontWeight: 500 }}>
          Step {Math.min(currentStep, totalSteps)} of {totalSteps}
        </span>
      )}

      {/* Status badge */}
      <div>{badgeContent()}</div>
    </nav>
  );
}

/* ─── Progress bar ────────────────────────────────────────────────────────────── */
function ProgressBar({ steps }: { steps: StepState[] }) {
  const completed = steps.filter((s) => s.status === "complete").length;
  const pct = (completed / steps.length) * 100;

  return (
    <div
      style={{
        width: "100%",
        height: 2,
        background: "hsl(240,12%,14%)",
        borderRadius: 2,
        marginBottom: 32,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, hsl(258,90%,55%), hsl(258,90%,72%))",
          borderRadius: 2,
          transition: "width 0.6s ease-out",
        }}
      />
    </div>
  );
}

/* ─── GeneratePage ───────────────────────────────────────────────────────────── */
export default function GeneratePage() {
  const { idea, setIdea } = useIdea();
  const { steps, planId, isStreaming, startGeneration } = useGenerateStream();
  const [hasStarted, setHasStarted] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Auto-start if idea came from landing page context
  useEffect(() => {
    if (idea && !hasStarted) {
      handleSubmit(idea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (value: string) => {
    setIdea(value);
    setHasStarted(true);
    startGeneration(value);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const stepIndex = currentStepIndex(steps);
  const allComplete = steps.every((s) => s.status === "complete");
  const hasError = steps.some((s) => s.status === "error");

  return (
    <>
      {/* Global keyframes injected once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        ref={topRef}
        style={{
          minHeight: "100vh",
          backgroundColor: "hsl(240,25%,4%)",
          fontFamily: "Sora, sans-serif",
        }}
      >
        <TopBar
          currentStep={stepIndex}
          totalSteps={7}
          isStreaming={isStreaming}
          hasStarted={hasStarted}
          allComplete={allComplete}
          hasError={hasError}
        />

        {/* Main content */}
        <main
          style={{
            maxWidth: 672,
            margin: "0 auto",
            padding: "96px 24px 80px",
          }}
        >
          {!hasStarted ? (
            /* ── Idea input ── */
            <IdeaInput
              initialValue={idea}
              onSubmit={handleSubmit}
              isLoading={isStreaming}
            />
          ) : (
            /* ── Steps list ── */
            <>
              {/* Re-state the idea */}
              <div
                style={{
                  marginBottom: 24,
                  animation: "fadeUp 0.4s ease-out forwards",
                }}
              >
                <p style={{ color: "hsl(240,8%,50%)", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Analyzing
                </p>
                <p
                  style={{
                    color: "hsl(0,0%,90%)",
                    fontSize: 18,
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  "{idea}"
                </p>
              </div>

              {/* Progress */}
              <ProgressBar steps={steps} />

              {/* Step cards */}
              {steps.map((step) => (
                <StepCard
                  key={step.stepNumber}
                  stepNumber={step.stepNumber}
                  stepName={step.stepName}
                  status={step.status}
                  data={step.data}
                  planId={planId}
                />
              ))}

              {/* New idea link */}
              {!isStreaming && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button
                    onClick={() => {
                      setHasStarted(false);
                      setIdea("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "hsl(240,8%,45%)",
                      fontSize: 13,
                      cursor: "pointer",
                      textDecoration: "underline",
                      textDecorationColor: "transparent",
                      transition: "color 0.2s ease, text-decoration-color 0.2s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "hsl(240,8%,70%)";
                      (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "hsl(240,8%,70%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "hsl(240,8%,45%)";
                      (e.currentTarget as HTMLButtonElement).style.textDecorationColor = "transparent";
                    }}
                  >
                    ← Try a different idea
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            paddingBottom: 32,
            color: "hsla(240,8%,45%,0.45)",
            fontSize: 11,
          }}
        >
          Powered by MongoDB MCP + Gemini 3
        </footer>
      </div>
    </>
  );
}
