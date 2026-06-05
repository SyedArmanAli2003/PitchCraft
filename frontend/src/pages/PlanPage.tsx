import { memo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../config";

/* ─────────────────────────── TYPES ─────────────────────────────────────── */
interface Competitor { name: string; stage?: string; weakness?: string }
// API returns { job, ... } — note: NOT job_title
interface Persona { name: string; age?: string; job?: string; job_title?: string; pain_point?: string; willingness_to_pay?: string; how_they_find_us?: string }
interface Risk { risk?: string; name?: string; severity?: string; mitigation?: string }
interface SwotItem { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] }
interface MarketResearch { market_size?: string; growth_rate?: string; market_gap?: string; top_competitors?: Competitor[]; opportunity_score?: number }
interface PlanData {
  idea?: string
  validation?: { viability_score?: number; one_line_summary?: string; target_market?: string; innovation_factor?: string; main_concerns?: string[] }
  // API key is market_research (not market)
  market_research?: MarketResearch
  // API returns personas as a top-level array
  personas?: Persona[]
  business_plan?: { problem?: string; solution?: string; unique_value_proposition?: string; usp?: string; revenue_model?: string; revenue_streams?: string[]; go_to_market?: string; key_milestones?: {month: number; milestone: string}[] }
  financials?: { year1_revenue?: string; year2_revenue?: string; year3_revenue?: string; startup_cost?: string; monthly_burn?: string; break_even_month?: number; funding_needed?: string }
  // API returns { risks: [...], swot: {...} } nested under this key
  risks?: { risks?: Risk[]; swot?: SwotItem }
}

/* ─────────────────────────── SHARED CARD ───────────────────────────────── */
const Card = memo(({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div
    className={`rounded-2xl p-6 bg-[hsl(240,15%,8%)] border border-[hsl(240,12%,18%)] hover:border-[hsl(240,12%,25%)] transition-colors duration-200 mb-6 ${className}`}
    style={style}
  >
    {children}
  </div>
));

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{children}</p>
);

/* ─────────────────────────── SECTION 1: VALIDATION ─────────────────────── */
const ValidationSection = memo(({ data }: { data: PlanData["validation"] }) => {
  if (!data) return null;
  const score = data.viability_score ?? 0;
  const scoreColor = score >= 7 ? "hsl(142,71%,50%)" : score >= 4 ? "hsl(38,92%,55%)" : "hsl(0,84%,60%)";

  return (
    <div className="rounded-2xl p-6 border-l-4 border-[hsl(258,90%,66%)] bg-[hsl(240,15%,10%)] border border-[hsl(240,12%,18%)] hover:border-[hsl(240,12%,25%)] transition-colors duration-200 mb-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <SectionLabel>Viability Score</SectionLabel>
          <div className="text-[4rem] font-bold leading-none" style={{ color: scoreColor }}>
            {score}<span className="text-2xl text-muted-foreground">/10</span>
          </div>
          {data.one_line_summary && (
            <p className="text-xl text-foreground mt-3 leading-snug max-w-lg">{data.one_line_summary}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-[180px]">
          {data.target_market && (
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[hsla(258,90%,66%,0.1)] border border-[hsla(258,90%,66%,0.25)] text-[hsl(258,90%,75%)]">
              🎯 {data.target_market}
            </span>
          )}
          {data.innovation_factor && (
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[hsla(195,100%,50%,0.1)] border border-[hsla(195,100%,50%,0.25)] text-[hsl(195,100%,65%)]">
              ⚡ {data.innovation_factor}
            </span>
          )}
        </div>
      </div>
      {data.main_concerns && data.main_concerns.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[hsl(240,12%,16%)] flex flex-wrap gap-2">
          {data.main_concerns.map((c, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full bg-[hsla(38,92%,55%,0.1)] border border-[hsla(38,92%,55%,0.3)] text-[hsl(38,92%,65%)]">
              ⚠ {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────── SECTION 2: MARKET ─────────────────────────── */
const MarketSection = memo(({ data }: { data: PlanData["market_research"] }) => {
  if (!data) return null;
  return (
    <Card>
      <h2 className="text-base font-semibold text-foreground mb-4">📊 Market Research</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        <div className="flex flex-col gap-4">
          {data.market_size && (
            <div>
              <SectionLabel>Market Size</SectionLabel>
              <p className="text-3xl font-bold text-white">{data.market_size}</p>
            </div>
          )}
          {data.growth_rate && (
            <div>
              <SectionLabel>Annual Growth Rate</SectionLabel>
              <p className="text-3xl font-bold text-[hsl(142,71%,50%)]">{data.growth_rate}</p>
            </div>
          )}
        </div>
        {data.market_gap && (
          <blockquote className="border-l-4 border-[hsl(258,90%,66%)] pl-4 py-1 bg-[hsla(258,90%,66%,0.05)] rounded-r-xl">
            <SectionLabel>Market Gap</SectionLabel>
            <p className="text-sm text-foreground/90 leading-relaxed italic">{data.market_gap}</p>
          </blockquote>
        )}
      </div>
      {data.top_competitors && data.top_competitors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {["Competitor", "Stage", "Weakness"].map(h => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-[hsl(240,8%,55%)] pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.top_competitors.map((c, i) => (
                <tr key={i} className="border-t border-[hsl(240,12%,16%)] hover:bg-[hsl(240,15%,10%)] transition-colors">
                  <td className="text-white py-2.5 pr-4 font-medium">{c.name}</td>
                  <td className="text-muted-foreground py-2.5 pr-4">{c.stage ?? "—"}</td>
                  <td className="text-muted-foreground py-2.5">{c.weakness ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
});

/* ─────────────────────────── SECTION 3: PERSONAS ───────────────────────── */
const PersonasSection = memo(({ personas }: { personas?: Persona[] }) => {
  if (!personas || personas.length === 0) return null;
  const initials = (name: string) => name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const avatarHues = [258, 195, 142];

  return (
    <Card>
      <h2 className="text-base font-semibold text-foreground mb-4">👤 Customer Personas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personas.map((p, i) => (
          <div key={i} className="rounded-xl p-4 bg-[hsl(240,12%,10%)] border border-[hsl(240,12%,16%)]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3"
              style={{ background: `hsla(${avatarHues[i % 3]},80%,60%,0.15)`, color: `hsl(${avatarHues[i % 3]},80%,70%)` }}
            >
              {initials(p.name)}
            </div>
            <p className="text-sm font-semibold text-white">{p.name}</p>
            {/* API returns 'job' field; fallback to job_title for compat */}
            {(p.job ?? p.job_title) && <p className="text-xs text-muted-foreground mt-0.5">{p.job ?? p.job_title}</p>}
            {p.pain_point && <p className="text-xs text-muted-foreground italic mt-2 leading-relaxed">"{p.pain_point}"</p>}
            {p.willingness_to_pay && (
              <span className="mt-3 inline-block text-xs px-2 py-0.5 rounded-full bg-[hsla(142,71%,45%,0.12)] border border-[hsla(142,71%,45%,0.3)] text-[hsl(142,71%,55%)]">
                {p.willingness_to_pay}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
});

/* ─────────────────────────── SECTION 4: BUSINESS PLAN ──────────────────── */
const BusinessPlanSection = memo(({ data }: { data: PlanData["business_plan"] }) => {
  if (!data) return null;
  const cols = [
    { key: "problem", label: "Problem", value: data.problem, borderColor: "rgba(248,113,113,0.5)" },
    { key: "solution", label: "Solution", value: data.solution, borderColor: "rgba(74,222,128,0.5)" },
    // API returns unique_value_proposition; fallback to usp for compat
    { key: "usp", label: "Unique Value Proposition", value: data.unique_value_proposition ?? data.usp, borderColor: "rgba(167,139,250,0.5)" },
  ];

  return (
    <Card>
      <h2 className="text-base font-semibold text-foreground mb-4">📋 Business Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {cols.map(col => col.value ? (
          <div key={col.key} className="rounded-xl p-4 bg-[hsl(240,12%,10%)] border-t-2" style={{ borderTopColor: col.borderColor, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "transparent", borderStyle: "solid" }}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{col.label}</p>
            <p className="text-sm text-white leading-relaxed">{col.value}</p>
          </div>
        ) : null)}
      </div>
      <div className="flex flex-col gap-3">
        {data.revenue_model && (
          <details className="group rounded-xl bg-[hsl(240,12%,10%)] border border-[hsl(240,12%,16%)]">
            <summary className="cursor-pointer px-4 py-3 text-[hsl(258,90%,75%)] text-sm font-medium list-none flex items-center justify-between select-none">
              Revenue Model
              <span className="text-muted-foreground group-open:rotate-90 transition-transform duration-200 inline-block">›</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-foreground/85 leading-relaxed">{data.revenue_model}</p>
          </details>
        )}
        {data.go_to_market && (
          <details className="group rounded-xl bg-[hsl(240,12%,10%)] border border-[hsl(240,12%,16%)]">
            <summary className="cursor-pointer px-4 py-3 text-[hsl(258,90%,75%)] text-sm font-medium list-none flex items-center justify-between select-none">
              Go-to-Market Strategy
              <span className="text-muted-foreground group-open:rotate-90 transition-transform duration-200 inline-block">›</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-foreground/85 leading-relaxed">{data.go_to_market}</p>
          </details>
        )}
      </div>
    </Card>
  );
});

/* ─────────────────────────── SECTION 5: FINANCIALS ─────────────────────── */
const FinancialsSection = memo(({ data }: { data: PlanData["financials"] }) => {
  if (!data) return null;
  // API returns year1_revenue etc. as strings like "$250,000" — display as-is
  const yearStrings = [
    { label: "Year 1", value: data.year1_revenue },
    { label: "Year 2", value: data.year2_revenue },
    { label: "Year 3", value: data.year3_revenue },
  ].filter(y => y.value);

  const stats = [
    { label: "Startup Cost", value: data.startup_cost },
    { label: "Monthly Burn", value: data.monthly_burn },
    { label: "Break-even Month", value: data.break_even_month != null ? `Month ${data.break_even_month}` : undefined },
    { label: "Funding Needed", value: data.funding_needed },
  ].filter(s => s.value);

  return (
    <Card>
      <h2 className="text-base font-semibold text-foreground mb-5">💰 Financial Projections</h2>
      {yearStrings.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {yearStrings.map((y, idx) => (
            <div key={y.label} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-12 shrink-0">{y.label}</span>
              <div className="flex-1 h-3 rounded-full bg-[hsl(240,12%,12%)] overflow-hidden">
                <div
                  className="finance-bar h-3 rounded-full bg-[hsl(258,90%,66%)]"
                  style={{ "--target-width": `${(idx + 1) * 33}%` } as React.CSSProperties}
                />
              </div>
              <span className="text-sm font-bold text-[hsl(258,90%,75%)] w-32 text-right shrink-0">
                {y.value}
              </span>
            </div>
          ))}
        </div>
      )}
      {stats.length > 0 && (
        <div className={`grid gap-3 grid-cols-2 md:grid-cols-${Math.min(stats.length, 4)}`}>
          {stats.map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center bg-[hsl(240,12%,6%)]">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

/* ─────────────────────────── SECTION 6: RISKS + SWOT ───────────────────── */
const severityMap = {
  high:   { bg: "bg-red-500/15",   text: "text-red-400",   border: "border-red-500/30" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  low:    { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" },
};

const swotQuadrants = [
  { key: "strengths",    label: "Strengths",    emoji: "💪", cls: "bg-green-950/50 border-green-800/30" },
  { key: "weaknesses",   label: "Weaknesses",   emoji: "⚠",  cls: "bg-red-950/50 border-red-800/30" },
  { key: "opportunities",label: "Opportunities",emoji: "🚀", cls: "bg-blue-950/50 border-blue-800/30" },
  { key: "threats",      label: "Threats",      emoji: "⚡", cls: "bg-amber-950/50 border-amber-800/30" },
];

const RiskSwotSection = memo(({ risksData }: { risksData?: PlanData["risks"] }) => {
  const risks = risksData?.risks;
  const swot = risksData?.swot;
  if (!risks && !swot) return null;
  return (
    <Card>
      <h2 className="text-base font-semibold text-foreground mb-5">🛡 Risks &amp; SWOT</h2>
      {risks && risks.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {risks.map((r, i) => {
            const sevRaw = (r.severity ?? "medium").toLowerCase();
            const sev = (sevRaw === "high" || sevRaw === "medium" || sevRaw === "low") ? sevRaw : "medium";
            const s = severityMap[sev];
            // API returns 'risk' field; fallback to 'name'
            const label = r.risk ?? r.name ?? "Unknown risk";
            return (
              <div key={i} className="flex items-start gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${s.bg} ${s.text} ${s.border}`}>
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </span>
                <div>
                  <p className="text-sm text-white font-medium">{label}</p>
                  {r.mitigation && <p className="text-xs text-muted-foreground italic mt-0.5">{r.mitigation}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {swot && (
        <div className="grid grid-cols-2 gap-3">
          {swotQuadrants.map(q => {
            const items = swot[q.key as keyof SwotItem];
            return (
              <div key={q.key} className={`p-4 rounded-xl border ${q.cls}`}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{q.emoji} {q.label}</p>
                <ul className="flex flex-col gap-1">
                  {(items ?? []).map((item, i) => (
                    <li key={i} className="text-sm text-foreground/85 flex gap-1.5">
                      <span className="text-muted-foreground shrink-0">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
});

/* ─────────────────────────── SKELETON ──────────────────────────────────── */
function Skeleton() {
  return (
    <div className="min-h-screen font-sora" style={{ backgroundColor: "hsl(240,25%,4%)" }}>
      <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-4">
        <div className="text-primary text-5xl animate-pulse">✦</div>
        <p className="text-muted-foreground text-sm">Loading your plan…</p>
      </div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen font-sora flex items-center justify-center" style={{ backgroundColor: "hsl(240,25%,4%)" }}>
      <div className="text-center max-w-sm px-6">
        <p className="text-4xl mb-4">⚠</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Couldn't load plan</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <button onClick={() => navigate("/")} className="text-sm text-[hsl(258,90%,70%)] underline underline-offset-4">
          ← Back to home
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── STICKY HEADER ─────────────────────────────── */
const StickyHeader = memo(({ title, onShare, onPrint }: { title: string; onShare: () => void; onPrint: () => void }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    onShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header
      className="no-print sticky top-0 z-50 flex items-center justify-between gap-4 px-6 py-3 border-b border-[hsl(240,12%,14%)]"
      style={{ backgroundColor: "hsl(240,25%,4%)" }}
    >
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 shrink-0 select-none cursor-pointer"
      >
        <span className="text-[hsl(258,90%,66%)] text-base">✦</span>
        <span className="text-base font-semibold text-foreground hidden sm:block">
          Pitch<span className="text-[hsl(258,90%,66%)]">Craft</span>
        </span>
      </button>

      <p className="text-sm text-muted-foreground truncate flex-1 text-center hidden md:block" title={title}>
        {title}
      </p>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleShare}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[hsl(240,12%,22%)] text-[hsl(258,90%,75%)] bg-[hsla(258,90%,66%,0.08)] hover:bg-[hsla(258,90%,66%,0.15)] transition-colors duration-150 cursor-pointer"
        >
          {copied ? "✓ Copied!" : "Share"}
        </button>
        <button
          onClick={onPrint}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[hsl(240,12%,22%)] text-muted-foreground hover:text-foreground hover:bg-[hsl(240,12%,14%)] transition-colors duration-150 cursor-pointer"
        >
          Print
        </button>
        <button
          onClick={() => navigate("/generate")}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[hsl(258,90%,66%)] text-white hover:brightness-110 transition-all duration-150 cursor-pointer"
        >
          New Plan
        </button>
      </div>
    </header>
  );
});

/* ─────────────────────────── PAGE ──────────────────────────────────────── */
export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setError("No plan ID provided."); setLoading(false); return; }
    fetch(ENDPOINTS.getPlan(id))
      .then(r => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then((data: PlanData) => { setPlan(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }, []);

  const handlePrint = useCallback(() => window.print(), []);

  if (loading) return <Skeleton />;
  if (error || !plan) return <ErrorView message={error ?? "Plan not found."} />;

  const title = plan.idea ?? `Plan ${id}`;

  return (
    <div className="min-h-screen font-sora" style={{ backgroundColor: "hsl(240,25%,4%)" }}>
      <StickyHeader title={title} onShare={handleShare} onPrint={handlePrint} />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Plan title */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Business Plan</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug">{title}</h1>
        </div>

        <ValidationSection data={plan.validation} />
        <MarketSection data={plan.market_research} />
        <PersonasSection personas={plan.personas} />
        <BusinessPlanSection data={plan.business_plan} />
        <FinancialsSection data={plan.financials} />
        <RiskSwotSection risksData={plan.risks} />

        <footer className="text-center text-xs text-muted-foreground/40 mt-8 pb-8">
          Powered by MongoDB MCP + Gemini 3 · PitchCraft
        </footer>
      </main>
    </div>
  );
}
