import React, { memo } from "react";

/* ─── Types ────────────────────────────────────────────────────────────────── */
export type StepStatus = "waiting" | "running" | "complete" | "error";

export interface StepState {
  stepNumber: number;
  stepName: string;
  status: StepStatus;
  data?: Record<string, unknown>;
}

interface StepCardProps {
  stepNumber: number;
  stepName: string;
  status: StepStatus;
  data?: Record<string, unknown>;
}

/* ─── Status colours (pure CSS classes / inline styles) ────────────────────── */
const borderStyle: Record<StepStatus, React.CSSProperties> = {
  waiting: { border: "1px solid hsl(240,12%,18%)" },
  running: {
    border: "1px solid hsla(258,90%,66%,0.5)",
    boxShadow: "0 0 20px rgba(139,92,246,0.15)",
  },
  complete: { border: "1px solid hsla(142,71%,45%,0.4)" },
  error: { border: "1px solid hsla(0,84%,60%,0.4)" },
};

const circleStyle: Record<StepStatus, React.CSSProperties> = {
  waiting: {
    background: "hsl(240,12%,18%)",
    color: "hsl(240,8%,55%)",
  },
  running: {
    background: "hsla(258,90%,66%,0.2)",
    color: "hsl(258,90%,66%)",
  },
  complete: {
    background: "hsla(142,71%,45%,0.2)",
    color: "hsl(142,71%,45%)",
  },
  error: {
    background: "hsla(0,84%,60%,0.2)",
    color: "hsl(0,84%,60%)",
  },
};

/* ─── Spinner (CSS-only, no SVG lib) ───────────────────────────────────────── */
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid hsla(258,90%,66%,0.3)",
        borderTopColor: "hsl(258,90%,66%)",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

/* ─── Step data renderers ───────────────────────────────────────────────────── */
function Step1Content({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const score = data.viability_score as number | undefined;
  const summary = data.one_line_summary as string | undefined;
  const concerns = (data.main_concerns as string[]) ?? [];

  const scoreColor =
    score !== undefined
      ? score >= 7
        ? "hsl(142,71%,45%)"
        : score >= 4
        ? "hsl(38,92%,55%)"
        : "hsl(0,84%,60%)"
      : "hsl(240,8%,55%)";

  return (
    <div style={{ padding: "12px 0 4px" }}>
      {score !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span
            style={{
              background: `${scoreColor}22`,
              border: `1px solid ${scoreColor}66`,
              color: scoreColor,
              borderRadius: 999,
              padding: "2px 14px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Viability: {score}/10
          </span>
        </div>
      )}
      {summary && (
        <p style={{ color: "hsl(0,0%,90%)", fontSize: 14, marginBottom: 10 }}>
          {summary}
        </p>
      )}
      {concerns.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {concerns.map((c, i) => (
            <span
              key={i}
              style={{
                background: "hsla(0,84%,60%,0.08)",
                border: "1px solid hsla(0,84%,60%,0.25)",
                color: "hsl(0,84%,70%)",
                borderRadius: 6,
                padding: "2px 10px",
                fontSize: 12,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Step2Content({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const marketSize = data.market_size as string | undefined;
  const growthRate = data.growth_rate as string | undefined;
  const competitors = (data.top_competitors as { name: string; share?: string }[]) ?? [];

  return (
    <div style={{ padding: "12px 0 4px" }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        {marketSize && (
          <div style={{ flex: 1, background: "hsl(240,12%,12%)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "hsl(240,8%,55%)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Market Size</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "hsl(258,90%,75%)" }}>{marketSize}</div>
          </div>
        )}
        {growthRate && (
          <div style={{ flex: 1, background: "hsl(240,12%,12%)", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "hsl(240,8%,55%)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Growth Rate</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "hsl(142,71%,50%)" }}>{growthRate}</div>
          </div>
        )}
      </div>
      {competitors.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "hsl(240,8%,50%)", textAlign: "left" }}>
              <th style={{ padding: "4px 8px", fontWeight: 600 }}>Competitor</th>
              <th style={{ padding: "4px 8px", fontWeight: 600 }}>Market Share</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr
                key={i}
                style={{
                  borderTop: "1px solid hsl(240,12%,14%)",
                  color: "hsl(0,0%,85%)",
                }}
              >
                <td style={{ padding: "6px 8px" }}>{c.name}</td>
                <td style={{ padding: "6px 8px", color: "hsl(240,8%,55%)" }}>
                  {c.share ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Step3Content({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const personas = (data.personas as { name: string; age?: string; role?: string; pain?: string }[]) ?? [];

  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 0 4px", flexWrap: "wrap" }}>
      {personas.map((p, i) => (
        <div
          key={i}
          style={{
            flex: "1 1 140px",
            background: "hsl(240,12%,11%)",
            border: "1px solid hsl(240,12%,18%)",
            borderRadius: 12,
            padding: "12px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `hsla(${258 + i * 40},80%,60%,0.15)`,
              border: `1px solid hsla(${258 + i * 40},80%,60%,0.3)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            {["👤", "👩‍💼", "🧑‍💻"][i] ?? "👤"}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(0,0%,92%)", marginBottom: 2 }}>
            {p.name}
          </div>
          {p.age && (
            <div style={{ fontSize: 11, color: "hsl(240,8%,55%)", marginBottom: 4 }}>
              {p.age} · {p.role}
            </div>
          )}
          {p.pain && (
            <div style={{ fontSize: 12, color: "hsl(240,8%,65%)", fontStyle: "italic" }}>
              "{p.pain}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Step4Content({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const cols = [
    { label: "Problem", icon: "⚡", value: data.problem as string | undefined, color: "hsl(0,84%,65%)" },
    { label: "Solution", icon: "✦", value: data.solution as string | undefined, color: "hsl(258,90%,70%)" },
    { label: "USP", icon: "🎯", value: data.usp as string | undefined, color: "hsl(142,71%,50%)" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 0 4px", flexWrap: "wrap" }}>
      {cols.map((col) => (
        <div
          key={col.label}
          style={{
            flex: "1 1 140px",
            background: "hsl(240,12%,11%)",
            border: "1px solid hsl(240,12%,18%)",
            borderRadius: 12,
            padding: "12px",
          }}
        >
          <div style={{ fontSize: 11, color: col.color, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            {col.icon} {col.label}
          </div>
          <p style={{ fontSize: 13, color: "hsl(0,0%,85%)", lineHeight: 1.5 }}>
            {col.value ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

function Step5Content({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const years = [
    { label: "Year 1", value: data.year1 as number | undefined },
    { label: "Year 2", value: data.year2 as number | undefined },
    { label: "Year 3", value: data.year3 as number | undefined },
  ].filter((y) => y.value !== undefined) as { label: string; value: number }[];

  if (years.length === 0) return null;
  const max = Math.max(...years.map((y) => y.value));

  return (
    <div style={{ padding: "12px 0 4px" }}>
      <div style={{ fontSize: 11, color: "hsl(240,8%,50%)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Projected Revenue
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {years.map((y) => (
          <div key={y.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 44, fontSize: 12, color: "hsl(240,8%,55%)", flexShrink: 0 }}>
              {y.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 20,
                background: "hsl(240,12%,12%)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(y.value / max) * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, hsl(258,90%,55%), hsl(258,90%,72%))",
                  borderRadius: 6,
                  transition: "width 0.8s ease-out",
                }}
              />
            </div>
            <span style={{ width: 70, fontSize: 12, color: "hsl(258,90%,75%)", textAlign: "right", flexShrink: 0, fontWeight: 700 }}>
              ${y.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step6Content({ data }: { data?: Record<string, unknown> }) {
  if (!data) return null;
  const risks = (data.risks as { label: string; severity?: "high" | "medium" | "low" }[]) ?? [];

  const severityStyle: Record<string, React.CSSProperties> = {
    high: { background: "hsla(0,84%,60%,0.1)", border: "1px solid hsla(0,84%,60%,0.35)", color: "hsl(0,84%,70%)" },
    medium: { background: "hsla(38,92%,55%,0.1)", border: "1px solid hsla(38,92%,55%,0.35)", color: "hsl(38,92%,65%)" },
    low: { background: "hsla(142,71%,45%,0.1)", border: "1px solid hsla(142,71%,45%,0.35)", color: "hsl(142,71%,60%)" },
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 0 4px" }}>
      {risks.map((r, i) => (
        <span
          key={i}
          style={{
            ...(severityStyle[r.severity ?? "medium"]),
            borderRadius: 8,
            padding: "4px 12px",
            fontSize: 12,
          }}
        >
          {r.label}
        </span>
      ))}
    </div>
  );
}

function Step7Content({ planId }: { planId?: string | null }) {
  return (
    <div style={{ padding: "12px 0 4px", textAlign: "center" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
      <p style={{ color: "hsl(142,71%,60%)", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
        Your business plan is ready!
      </p>
      <p style={{ color: "hsl(240,8%,55%)", fontSize: 13, marginBottom: 16 }}>
        All 7 steps completed successfully.
      </p>
      {planId && (
        <a
          href={`/plan/${planId}`}
          style={{
            display: "inline-block",
            background: "hsl(258,90%,66%)",
            color: "#fff",
            padding: "10px 28px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            transition: "filter 0.2s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.12)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.filter = "none")}
        >
          View Full Plan →
        </a>
      )}
    </div>
  );
}

/* ─── Main Card ─────────────────────────────────────────────────────────────── */
function StepCardInner({
  stepNumber,
  stepName,
  status,
  data,
  planId,
}: StepCardProps & { planId?: string | null }) {
  const isExpanded = status === "complete";

  return (
    <div
      style={{
        background: "hsl(240,15%,8%)",
        borderRadius: 16,
        padding: "18px 20px",
        marginBottom: 10,
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        ...borderStyle[status],
        opacity: status === "waiting" ? 0.5 : 1,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Number circle */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
              ...(status === "running"
                ? { ...circleStyle.running, animation: "pulse 1.4s ease-in-out infinite" }
                : circleStyle[status]),
            }}
          >
            {stepNumber}
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "hsl(0,0%,92%)" }}>
            {stepName}
          </span>
        </div>

        {/* Right status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {status === "waiting" && (
            <span style={{ color: "hsl(240,8%,45%)", fontSize: 13 }}>—</span>
          )}
          {status === "running" && <Spinner />}
          {status === "complete" && (
            <span style={{ color: "hsl(142,71%,50%)", fontSize: 13, fontWeight: 600 }}>✓ Done</span>
          )}
          {status === "error" && (
            <span style={{ color: "hsl(0,84%,60%)", fontSize: 13, fontWeight: 600 }}>✗ Failed</span>
          )}
        </div>
      </div>

      {/* Expandable content */}
      <div
        style={{
          maxHeight: isExpanded ? 500 : 0,
          overflow: "hidden",
          transition: "max-height 0.5s ease-out",
        }}
      >
        {stepNumber === 1 && <Step1Content data={data} />}
        {stepNumber === 2 && <Step2Content data={data} />}
        {stepNumber === 3 && <Step3Content data={data} />}
        {stepNumber === 4 && <Step4Content data={data} />}
        {stepNumber === 5 && <Step5Content data={data} />}
        {stepNumber === 6 && <Step6Content data={data} />}
        {stepNumber === 7 && <Step7Content planId={planId} />}
      </div>
    </div>
  );
}

const StepCard = memo(StepCardInner);
export default StepCard;
