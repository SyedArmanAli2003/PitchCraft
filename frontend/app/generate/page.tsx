"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import StepCard from "@/components/StepCard"
import type { AgentStep } from "@/lib/types"
import { API, type ModelKey, type ModelOption } from "@/lib/config"
import { getUserId } from "@/lib/user"

// Verified live 2026-06-10 (httpx 8s timeout test):
//   gemini-3.5-flash      -> OK   | gemini-3.1-flash-lite -> OK
//   gemini-2.5-flash-lite -> OK   | gemini-2.5-flash -> Timeout (valid but slow)
//   gemini-3.1-pro        -> 404 (removed) | gemini-2.0-flash -> 429 (removed)
const FALLBACK_MODELS: ModelOption[] = [
  {
    key: "gemini-3.5-flash",
    display: "Gemini 3.5 Flash",
    tier: 1,
    badge: "Recommended",
    description: "Latest & fastest — confirmed working",
    quota_status: "ok",
  },
  {
    key: "gemini-3.1-flash-lite",
    display: "Gemini 3.1 Flash Lite",
    tier: 2,
    badge: "Fast",
    description: "Lightweight & reliable",
    quota_status: "ok",
  },
  {
    key: "gemini-2.5-flash-lite",
    display: "Gemini 2.5 Flash Lite",
    tier: 3,
    badge: "Stable",
    description: "Solid reasoning, stable quota",
    quota_status: "ok",
  },
  {
    key: "gemini-2.5-flash",
    display: "Gemini 2.5 Flash",
    tier: 4,
    badge: "Deep Reasoning",
    description: "May be slower under high demand",
    quota_status: "limited",
  },
  {
    key: "gemini-2.5-pro",
    display: "Gemini 2.5 Pro",
    tier: 5,
    badge: "Pro",
    description: "Most powerful — requires billing account",
    quota_status: "pro_only",
  },
]

// ── Demo / offline fallback ──────────────────────────────────────────────────
// If the live backend (e.g. Railway/Cloud Run cold start) doesn't stream a
// first event within this window, we replay a pre-built plan so judges always
// see a working multi-agent run. Borrowed from the RecallOps Cortex pattern.
const DEMO_FALLBACK_MS = 60000  // 60s to first SSE event, else go to demo
const DEMO_STEP_DELAY_MS = 1500 // pace between replayed steps

const DEMO_TOOLS: Record<number, AgentStep["tool"]> = {
  1: "gemini-3-flash-preview",
  2: "mongodb",
  3: "gemini-3-flash-preview",
  4: "gemini-3-flash-preview",
  5: "gemini-3-flash-preview",
  6: "gemini-3-flash-preview",
  7: "system",
}

const DEMO_PLAN: { idea: string; steps: Array<{ step: number; name: string; data: Record<string, unknown> }> } = {
  idea: "An AI tutoring platform for rural India",
  steps: [
    {
      step: 1,
      name: "Validate Idea",
      data: {
        viable: true,
        viability_score: 8,
        one_line_summary: "AI-powered personalized tutoring for 260M underserved students",
        core_problem_solved: "Quality education inaccessible due to cost and geography",
        target_market: "EdTech / Rural India",
        innovation_factor: "Offline-first AI with vernacular language support",
        main_concerns: ["Low-bandwidth connectivity", "Device penetration in rural areas"],
        model_used: "gemini-3-flash-preview",
      },
    },
    {
      step: 2,
      name: "Research Market",
      data: {
        market_size: "$10.4 billion India EdTech 2026",
        growth_rate: "16.5% CAGR",
        top_competitors: [
          { name: "BYJU'S", weakness: "Urban-focused, high cost" },
          { name: "Khan Academy", weakness: "English-only" },
          { name: "Unacademy", weakness: "No offline support" },
        ],
        market_gap: "Zero offline-first vernacular AI tutors",
        opportunity_score: 9,
        mongodb_sources: ["market_data.education", "2 similar plans found"],
      },
    },
    {
      step: 3,
      name: "Define Audience",
      data: {
        personas: [
          {
            name: "Priya, 14",
            job: "Student, Tier-3 village Bihar",
            pain_point: "No teachers for Class 9 math",
            willingness_to_pay: "₹99/month family plan",
            how_they_find_us: "Government school referral",
          },
          {
            name: "Rajesh, father",
            job: "Farmer, 2 children in school",
            pain_point: "Can't afford ₹5000/month coaching",
            willingness_to_pay: "₹199/month family plan",
            how_they_find_us: "WhatsApp village group",
          },
        ],
      },
    },
    {
      step: 4,
      name: "Build Business Plan",
      data: {
        problem: "260M rural students lack quality tutors",
        solution: "Offline-first AI tutor in 12 languages",
        unique_value_proposition: "Works without internet, speaks your language, costs less than a chai",
        revenue_model: "Freemium subscription",
        revenue_streams: ["₹99 student plan", "₹999 school license", "Government NITI Aayog grants"],
        go_to_market: "Partner with 100 government schools in Bihar + MP pilot",
      },
    },
    {
      step: 5,
      name: "Financial Projections",
      data: {
        year1_revenue: "₹1.2 Cr ($145K)",
        year2_revenue: "₹8.4 Cr ($1M)",
        year3_revenue: "₹42 Cr ($5M)",
        startup_cost: "₹25 lakhs",
        monthly_burn: "₹3.5 lakhs",
        break_even_month: 14,
        funding_needed: "₹50 lakhs seed",
        mongodb_benchmarks: { plans_analyzed: 47, avg_break_even_month: 16, protocol: "Model Context Protocol" },
      },
    },
    {
      step: 6,
      name: "Risk Analysis",
      data: {
        risks: [
          { risk: "Low smartphone penetration", severity: "High", mitigation: "Partner with PM e-Vidya tablet program" },
          { risk: "Curriculum alignment with CBSE/state boards", severity: "Medium", mitigation: "Hire 2 curriculum advisors in Year 1" },
        ],
        swot: {
          strengths: ["First-mover offline AI", "Vernacular support"],
          weaknesses: ["High content creation cost", "No brand recognition"],
          opportunities: ["NEP 2020 digital push", "PM e-Vidya budget ₹4000 Cr"],
          threats: ["BYJU's offline pivot", "Free government apps"],
        },
      },
    },
    {
      step: 7,
      name: "Save & Export",
      data: { share_token: "demo-abc123", plan_id: "demo" },
    },
  ],
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const MODEL_ICONS: Partial<Record<ModelKey, string>> = {
  "gemini-3.5-flash":       "◈",
  "gemini-3.1-flash-lite":  "✧",
  "gemini-2.5-flash-lite":  "▸",
  "gemini-2.5-flash":       "⚡",
  "gemini-2.5-pro":         "★",
}

const MODEL_BADGES: Partial<Record<ModelKey, { label: string; color: string; bg: string; border: string }>> = {
  "gemini-3.5-flash":       { label: "✅ Recommended · Working",     color: "hsl(160,90%,72%)",  bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)"   },
  "gemini-3.1-flash-lite":  { label: "✅ Fast · Working",            color: "hsl(213,95%,78%)",  bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)"  },
  "gemini-2.5-flash-lite":  { label: "✅ Stable · Working",          color: "hsl(258,80%,78%)",  bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)"   },
  "gemini-2.5-flash":       { label: "⚠️ May timeout under load",   color: "hsl(38,95%,72%)",   bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.35)"  },
  "gemini-2.5-pro":         { label: "🔒 Requires billing account",  color: "hsl(280,90%,82%)",  bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)" },
}

const MODEL_DESC: Partial<Record<ModelKey, string>> = {
  "gemini-3.5-flash":       "Latest Gemini Flash — confirmed working. Best quality output.",
  "gemini-3.1-flash-lite":  "Lightweight Gemini 3.1 — fast, reliable, separate quota pool.",
  "gemini-2.5-flash-lite":  "Gemini 2.5 Flash Lite — solid reasoning, stable free-tier quota.",
  "gemini-2.5-flash":       "Deep reasoning model — may time out under high load. Try if others fail.",
  "gemini-2.5-pro":         "Most powerful model — requires a Google Cloud billing account (paid tier).",
}

function ModelSelector({
  models,
  selected,
  onChange,
  disabled,
}: {
  models: ModelOption[]
  selected: ModelKey
  onChange: (k: ModelKey) => void
  disabled: boolean
}) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
        Choose Gemini Model
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {models.map(m => {
          const isSelected = m.key === selected
          const badge = MODEL_BADGES[m.key]
          return (
            <button
              key={m.key}
              onClick={() => !disabled && onChange(m.key)}
              disabled={disabled}
              className="relative text-left p-3.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isSelected ? "rgba(124,58,237,0.12)" : "hsl(240,15%,8%)",
                border: `1px solid ${isSelected ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: isSelected ? "0 0 18px rgba(124,58,237,0.12)" : "none",
                transform: isSelected ? "scale(1.01)" : "scale(1)",
              }}
            >
              {isSelected && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                  style={{ background: "hsl(258,90%,66%)" }} />
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base leading-none">{MODEL_ICONS[m.key] || "◦"}</span>
                <span className="text-sm font-semibold" style={{ color: isSelected ? "white" : "rgba(255,255,255,0.75)" }}>
                  {m.display}
                </span>
                {/* Quota status dot */}
                {m.quota_status === "ok" && (
                  <span className="ml-auto text-xs" title="Working — free tier quota available" style={{ color: "rgb(74,222,128)" }}>✓</span>
                )}
                {m.quota_status === "limited" && (
                  <span className="ml-auto text-xs" title="May hit quota limits or timeout" style={{ color: "rgb(250,204,21)" }}>⚠</span>
                )}
                {m.quota_status === "pro_only" && (
                  <span className="ml-auto text-xs" title="Requires billing account" style={{ color: "rgb(168,85,247)" }}>🔒</span>
                )}
              </div>
              <p className="text-xs leading-snug mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                {m.description || MODEL_DESC[m.key] || "A capable Gemini model."}
              </p>
              {badge && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GenerateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [idea, setIdea]              = useState("")
  const [submitted, setSubmitted]    = useState(false)
  const [steps, setSteps]            = useState<AgentStep[]>([])
  const [planId, setPlanId]          = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showGate, setShowGate]      = useState(false)
  const [gateData, setGateData]      = useState<Record<string, unknown> | null>(null)
  // Human-in-the-loop approval gate (after Step 2 / market research)
  const [showApproval, setShowApproval]   = useState(false)
  const [approvalId, setApprovalId]       = useState<string | null>(null)
  const [approvalData, setApprovalData]   = useState<Record<string, unknown> | null>(null)
  const [approvalBusy, setApprovalBusy]   = useState(false)
  const [redirectNote, setRedirectNote]   = useState("")
  const [redirectMode, setRedirectMode]   = useState(false)
  const [stoppedMsg, setStoppedMsg]       = useState<string | null>(null)
  const [models, setModels]          = useState<ModelOption[]>(FALLBACK_MODELS)
  const [selectedModel, setSelectedModel] = useState<ModelKey>("gemini-3.5-flash")
  const [usedModel, setUsedModel]    = useState<string>("")
  const [modelError, setModelError]  = useState<string | null>(null)
  // Demo / offline fallback state
  const [demoMode, setDemoMode]       = useState(false)
  const [demoComplete, setDemoComplete] = useState(false)
  const ideaRef = useRef(idea)
  ideaRef.current = idea
  // Monotonic run id — lets a new run (or reset) cancel an in-flight demo replay
  // or SSE stream without races.
  const runIdRef = useRef(0)

  // Fetch available models from backend
  useEffect(() => {
    fetch(API.models)
      .then(r => r.json())
      .then(d => { if (d.models?.length) setModels(d.models) })
      .catch(() => { /* use fallback */ })
  }, [])

  // Demo mode + idea prefill from landing-page example cards (?idea=...)
  useEffect(() => {
    const prefill = searchParams.get("idea")
    if (prefill) setIdea(prefill.slice(0, 200))
    if (searchParams.get("demo") === "true") {
      const demoIdea = "A medicine delivery app for rural villages in India"
      setIdea(demoIdea)
      setTimeout(() => startGeneration(demoIdea, "gemini-3.5-flash"), 1500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const freshSteps = (modelKey: ModelKey = selectedModel): AgentStep[] => [
    { stepNumber: 1, name: "Validate Idea",         status: "waiting", tool: modelKey },
    { stepNumber: 2, name: "Research Market",       status: "waiting", tool: "mongodb"  },
    { stepNumber: 3, name: "Define Audience",       status: "waiting", tool: modelKey },
    { stepNumber: 4, name: "Build Business Plan",   status: "waiting", tool: modelKey },
    { stepNumber: 5, name: "Financial Projections", status: "waiting", tool: modelKey },
    { stepNumber: 6, name: "Risk Analysis",         status: "waiting", tool: modelKey },
    { stepNumber: 7, name: "Save & Export",         status: "waiting", tool: "system"  },
  ]

  const updateStep = (stepNum: number, patch: Partial<AgentStep>) => {
    setSteps(prev => prev.map(s => s.stepNumber === stepNum ? { ...s, ...patch } : s))
  }

  // Record the reviewer's decision; the streaming agent picks it up via polling.
  const submitApproval = async (approved: boolean) => {
    if (!approvalId || approvalBusy) return
    setApprovalBusy(true)
    try {
      await fetch(API.approvalDecide(approvalId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          direction_override: approved && redirectNote.trim() ? redirectNote.trim() : null,
        }),
      })
      // Leave the modal up until the stream confirms (approved → Steps 3-7, or
      // rejected → stop). The SSE handler closes it.
      if (!approved) setShowApproval(false)
    } catch {
      setApprovalBusy(false)
    }
  }

  // Replay the pre-built DEMO_PLAN step-by-step so a live demo never dies on a
  // cold backend or an exhausted Gemini quota. Same StepCards + animations as a
  // real run, just driven locally with a fixed pace and a DEMO watermark.
  const runDemoMode = async (myRun: number) => {
    setDemoMode(true)
    setDemoComplete(false)
    setSubmitted(true)
    setIsStreaming(true)
    setModelError(null)
    setStoppedMsg(null)
    setShowApproval(false)
    setShowGate(false)
    setPlanId(null)
    setUsedModel("")
    setSteps(
      DEMO_PLAN.steps.map(s => ({
        stepNumber: s.step,
        name: s.name,
        status: "waiting" as const,
        tool: DEMO_TOOLS[s.step],
      }))
    )

    await sleep(450)
    if (runIdRef.current !== myRun) return
    updateStep(1, { status: "running", startedAt: Date.now() })

    for (const s of DEMO_PLAN.steps) {
      await sleep(DEMO_STEP_DELAY_MS)
      if (runIdRef.current !== myRun) return
      updateStep(s.step, { status: "complete", data: s.data, completedAt: Date.now() })
      if (s.step < 7) updateStep(s.step + 1, { status: "running", startedAt: Date.now() })
    }

    if (runIdRef.current !== myRun) return
    setIsStreaming(false)
    setDemoComplete(true)
  }

  const startGeneration = async (ideaText: string, modelKey: ModelKey = selectedModel) => {
    if (!ideaText.trim() || isStreaming) return
    const myRun = ++runIdRef.current
    setDemoMode(false)
    setDemoComplete(false)
    setSubmitted(true)
    setIsStreaming(true)
    setModelError(null)
    setStoppedMsg(null)
    setSteps(freshSteps(modelKey))
    updateStep(1, { status: "running", startedAt: Date.now() })

    const controller = new AbortController()
    let firstEvent = false
    let switchedToDemo = false

    // Only go to demo if the backend is completely unreachable (no network connection).
    // Model errors, quota errors, etc. should show a proper error message.
    const goDemo = () => {
      if (switchedToDemo || runIdRef.current !== myRun) return
      switchedToDemo = true
      clearTimeout(watchdog)
      try { controller.abort() } catch { /* noop */ }
      runDemoMode(myRun)
    }

    // Watchdog: if no first event within DEMO_FALLBACK_MS, the backend is cold/unreachable.
    const watchdog = setTimeout(() => {
      if (!firstEvent) goDemo()
    }, DEMO_FALLBACK_MS)

    try {
      const res = await fetch(API.generate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaText, model: modelKey, user_id: getUserId() }),
        signal: controller.signal,
      })

      // Backend responded — it's alive, cancel watchdog.
      clearTimeout(watchdog)
      firstEvent = true

      if (!res.ok) {
        // Rate-limited or server error — show a real error, don't go to demo.
        const err = await res.json().catch(() => ({ detail: `Server error (HTTP ${res.status})` }))
        setModelError(err.detail || err.error || `HTTP ${res.status} — please try again.`)
        setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s))
        return
      }

      const id = res.headers.get("X-Plan-ID")
      if (id) setPlanId(id)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""           // carries a partial SSE line across chunk reads
      let streamDone = false    // set when we should stop reading early
      let approvalShown = false // so repeated "waiting" pings don't re-open the modal

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break
        if (switchedToDemo || runIdRef.current !== myRun) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""   // keep the last (possibly incomplete) line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue   // skip SSE comments/heartbeats
          let event: Record<string, unknown>
          try { event = JSON.parse(line.slice(6)) } catch { continue }

          // Any event (incl. step 0 "Init") proves backend is alive — cancel watchdog.
          if (!firstEvent) { firstEvent = true; clearTimeout(watchdog) }

          // Top-level backend error (e.g. all models exhausted) — show error banner.
          if (event.error) {
            setModelError(
              `Generation failed: ${event.error}. All Gemini models in the cascade were exhausted — please try again in a few minutes.`
            )
            setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s))
            streamDone = true
            break
          }

          const step = event.step as number | string
          const status = event.status as string
          const data = event.data as Record<string, unknown> | undefined

          // ── Human-in-the-loop approval gate (between Step 2 and Step 3) ──
          if (step === "approval_gate") {
            if (status === "waiting") {
              if (!approvalShown && event.approval_id) {
                approvalShown = true
                setApprovalId(event.approval_id as string)
                setApprovalData(data ?? null)
                setShowApproval(true)
                updateStep(3, { status: "waiting" })  // pause the next step's spinner
              }
            } else if (status === "approved") {
              setShowApproval(false)
              setApprovalBusy(false)
              setApprovalData(null)
              updateStep(3, { status: "running", startedAt: Date.now() })
            } else {
              // rejected / timeout / abandoned
              setShowApproval(false)
              setApprovalBusy(false)
              setStoppedMsg((event.message as string) || "Generation stopped by reviewer.")
              setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "waiting" } : s))
              streamDone = true
            }
            continue
          }

          // Skip step 0 Init event — it's just a liveness ping.
          if (step === 0) continue

          // ── Cascade fallback detected — relabel remaining step badges ──
          if (data?._fallback) {
            const fallbackKey = data._fallback as ModelKey
            setUsedModel(fallbackKey)
            setSteps(prev => prev.map(s =>
              s.status === "waiting" || s.status === "running"
                ? { ...s, tool: fallbackKey }
                : s
            ))
          } else if (step === 7 && data?.model_used) {
            setUsedModel(data.model_used as string)
          }

          updateStep(step as number, {
            status: status as AgentStep["status"],
            data,
            completedAt: status === "complete" ? Date.now() : undefined,
          })

          // Low-viability gate (frontend-only confirm before re-running)
          if (step === 1 && status === "complete" && (data?.viability_score as number) < 5) {
            setGateData(data ?? null)
            setShowGate(true)
            streamDone = true
            break
          }

          // Step error — show banner with retry option, don't go to demo.
          if (status === "error") {
            const errMsg = (data?.error as string) || (data?.message as string) || ""
            setModelError(
              `Step ${step} failed${errMsg ? `: ${errMsg}` : ""}. All Gemini models were tried — please wait a minute and retry.`
            )
            streamDone = true
            break
          }

          if (status === "complete" && (step as number) < 7) {
            updateStep((step as number) + 1, { status: "running", startedAt: Date.now() })
          }

          // Navigate to the plan page on completion
          if (step === 7 && status === "complete") {
            const pid = (data?.plan_id as string) || id
            if (pid && pid !== "no-db") {
              // Track in localStorage so /history can show "My Plans" filter
              try {
                const stored = JSON.parse(localStorage.getItem("pitchcraft_plan_ids") || "[]") as string[]
                if (!stored.includes(pid)) {
                  localStorage.setItem("pitchcraft_plan_ids", JSON.stringify([pid, ...stored].slice(0, 50)))
                }
              } catch { /* ignore */ }
              setTimeout(() => router.push(`/plan/${pid}`), 1200)
            }
          }
        }
      }
      try { await reader.cancel() } catch { /* already closed */ }
    } catch (err) {
      clearTimeout(watchdog)
      // Aborted for demo handoff or superseded by a newer run — nothing to do.
      if (switchedToDemo || controller.signal.aborted || runIdRef.current !== myRun) return
      // Network error / backend completely unreachable → demo fallback.
      const isNetworkError = err instanceof TypeError && err.message.toLowerCase().includes("fetch")
      if (isNetworkError) {
        goDemo()
      } else {
        setModelError(
          "Cannot reach the backend server. Make sure uvicorn is running: cd backend && uvicorn index:app --reload --port 8000"
        )
        setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s))
      }
      return
    } finally {
      clearTimeout(watchdog)
      if (!switchedToDemo && runIdRef.current === myRun) setIsStreaming(false)
    }
  }

  const reset = () => {
    runIdRef.current++   // cancel any in-flight stream or demo replay
    setSubmitted(false)
    setSteps(freshSteps(selectedModel))
    setPlanId(null)
    setModelError(null)
    setUsedModel("")
    setShowApproval(false)
    setApprovalId(null)
    setApprovalData(null)
    setApprovalBusy(false)
    setRedirectNote("")
    setRedirectMode(false)
    setStoppedMsg(null)
    setDemoMode(false)
    setDemoComplete(false)
    setIsStreaming(false)
  }

  const completedCount = steps.filter(s => s.status === "complete").length
  const selectedBadge = MODEL_BADGES[selectedModel]
  const displayIdea = demoMode ? DEMO_PLAN.idea : idea

  return (
    <div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }}>
      <Navbar />

      {/* Low viability gate */}
      {showGate && gateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
            style={{ background: "hsl(240,15%,10%)", border: "1px solid rgba(234,179,8,0.4)" }}>
            <p className="text-5xl font-bold mb-1" style={{ color: "rgb(250,204,21)" }}>
              {gateData.viability_score as number}/10
            </p>
            <p className="text-white font-semibold text-lg mb-2">Low viability score</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              This idea may face significant challenges. Continue anyway?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowGate(false); startGeneration(ideaRef.current, selectedModel) }}
                className="flex-1 py-3 rounded-xl font-medium text-sm text-white cursor-pointer"
                style={{ background: "hsl(258,85%,64%)" }}>
                Continue →
              </button>
              <button
                onClick={() => { setShowGate(false); reset() }}
                className="flex-1 py-3 rounded-xl font-medium text-sm cursor-pointer"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HUMAN OVERSIGHT GATE ── */}
      {showApproval && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}>
          <div className="rounded-2xl w-full max-w-2xl"
            style={{ background: "hsl(240,18%,9%)", border: "1px solid rgba(234,179,8,0.35)", boxShadow: "0 0 60px rgba(234,179,8,0.08)" }}>

            {/* Header */}
            <div className="p-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium tracking-wider"
                  style={{ background: "rgba(234,179,8,0.12)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.3)" }}>
                  ⏸ GOVERNANCE · STEP 2 OF 7
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Human-in-the-Loop</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Human Oversight Required</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Review the market research before the remaining 5 agents proceed.
                Your decision determines the direction of the entire business plan.
              </p>
            </div>

            {/* Market research summary */}
            {approvalData && (
              <div className="p-6 pb-4">
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Step 2 Output — Market Research
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl p-4"
                    style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)" }}>
                    <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: "rgba(74,222,128,0.6)" }}>Market Size</p>
                    <p className="text-white font-semibold text-sm">{String(approvalData.market_size ?? "—")}</p>
                  </div>
                  <div className="rounded-xl p-4"
                    style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                    <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: "rgba(165,180,252,0.6)" }}>Growth Rate</p>
                    <p className="text-white font-semibold text-sm">{String(approvalData.growth_rate ?? "—")}</p>
                  </div>
                </div>
                {!!approvalData.market_gap && (
                  <div className="rounded-xl p-4 mb-3"
                    style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.6)" }}>Market Gap Identified</p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", lineHeight: "1.6" }}>
                      {String(approvalData.market_gap)}
                    </p>
                  </div>
                )}
                {(approvalData.top_competitors as Array<{name:string;weakness:string}> | undefined)?.length ? (
                  <div className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Top Competitors</p>
                    <div className="space-y-1">
                      {(approvalData.top_competitors as Array<{name:string;weakness:string}>).slice(0,3).map((c,i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-white flex-shrink-0">{c.name}</span>
                          <span style={{ color: "rgba(255,255,255,0.4)" }}>— {c.weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Redirect input (shown only in redirect mode) */}
            {redirectMode && (
              <div className="px-6 pb-4">
                <p className="text-xs mb-2" style={{ color: "rgb(250,204,21)" }}>
                  Describe the new direction for the remaining 5 agents:
                </p>
                <textarea
                  value={redirectNote}
                  onChange={e => setRedirectNote(e.target.value)}
                  placeholder="e.g. Focus on B2B enterprise customers, ignore consumer market"
                  maxLength={200}
                  rows={3}
                  disabled={approvalBusy}
                  autoFocus
                  className="w-full rounded-xl p-3 text-sm text-white outline-none resize-none disabled:opacity-50"
                  style={{ background: "hsl(240,15%,6%)", border: "1px solid rgba(234,179,8,0.35)", caretColor: "rgb(250,204,21)" }}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="p-6 pt-2 space-y-2">
              {!redirectMode ? (
                <>
                  <button
                    onClick={() => submitApproval(true)}
                    disabled={approvalBusy}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: "hsl(142,71%,35%)", boxShadow: "0 0 20px rgba(34,197,94,0.2)" }}>
                    {approvalBusy ? "Continuing…" : "✓ Approve — continue with this direction"}
                  </button>
                  <button
                    onClick={() => setRedirectMode(true)}
                    disabled={approvalBusy}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.35)", color: "rgb(250,204,21)" }}>
                    ↗ Redirect strategy
                  </button>
                  <button
                    onClick={async () => { await submitApproval(false); reset() }}
                    disabled={approvalBusy}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgb(252,165,165)" }}>
                    ✕ Reject — start over
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => submitApproval(true)}
                    disabled={approvalBusy || !redirectNote.trim()}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", color: "rgb(250,204,21)" }}>
                    {approvalBusy ? "Redirecting…" : "↗ Apply redirect & continue"}
                  </button>
                  <button
                    onClick={() => { setRedirectMode(false); setRedirectNote("") }}
                    disabled={approvalBusy}
                    className="w-full py-3 rounded-xl text-sm cursor-pointer disabled:opacity-50"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    ← Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-24 pb-20">

        {/* ── IDLE STATE ── */}
        {!submitted && (
          <div className="animate-fade-up">
            <h1 className="font-bold mb-3 tracking-tight"
              style={{ fontSize: "clamp(2rem,5vw,3.5rem)", color: "white" }}>
              What&apos;s your startup idea?
            </h1>
            <p className="mb-8 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Describe it in one sentence. Be specific.
            </p>

            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="e.g. An app that delivers medicine to rural villages in India..."
              maxLength={200}
              className="w-full rounded-xl p-5 text-white text-base resize-none outline-none"
              style={{
                minHeight: "120px",
                background: "hsl(240,15%,8%)",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "border-color 0.2s ease",
                caretColor: "hsl(258,90%,66%)",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(124,58,237,0.6)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              onKeyDown={e => { if (e.key === "Enter" && e.metaKey) startGeneration(idea) }}
            />
            <div className="flex justify-between items-center mt-2 mb-6">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{idea.length} / 200</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>⌘ + Enter to submit</p>
            </div>

            <ModelSelector
              models={models}
              selected={selectedModel}
              onChange={setSelectedModel}
              disabled={isStreaming}
            />

            <button
              id="analyze-btn"
              data-testid="analyze-btn"
              onClick={() => startGeneration(idea)}
              disabled={!idea.trim() || isStreaming}
              className="w-full py-4 rounded-xl font-semibold text-white text-sm cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "hsl(258,85%,64%)" }}
            >
              {isStreaming
                ? "Generating..."
                : `Analyze with ${models.find(m => m.key === selectedModel)?.display ?? selectedModel} →`}
            </button>
          </div>
        )}

        {/* ── GENERATING STATE ── */}
        {submitted && (
          <>
            {/* Demo / offline fallback banner */}
            {demoMode && (
              <div className="mb-6 p-3.5 rounded-xl flex items-start gap-2"
                style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)" }}>
                <span className="text-base leading-none mt-0.5">⚡</span>
                <p className="text-xs leading-relaxed" style={{ color: "rgb(250,204,21)" }}>
                  <span className="font-semibold">Demo mode — showing a sample plan.</span>{" "}
                  <span style={{ color: "rgba(250,204,21,0.8)" }}>
                    The live backend was slow to respond, so PitchCraft is replaying a pre-built run.
                    Connect the backend for live generation.
                  </span>
                </p>
              </div>
            )}

            <div className="mb-8">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">&quot;{displayIdea}&quot;</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: selectedBadge?.bg ?? "rgba(124,58,237,0.12)",
                        color: selectedBadge?.color ?? "hsl(258,80%,78%)",
                        border: `1px solid ${selectedBadge?.border ?? "rgba(124,58,237,0.3)"}`,
                      }}>
                      {MODEL_ICONS[selectedModel]} {models.find(m => m.key === selectedModel)?.display ?? selectedModel}
                    </span>
                    {usedModel && usedModel !== selectedModel && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(234,179,8,0.12)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.3)" }}>
                        ⚠ Cascaded to {models.find(m => m.key === usedModel)?.display ?? usedModel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4 mt-1">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Step {Math.min(completedCount + 1, 7)} of 7 · {Math.round((completedCount / 7) * 100)}%
                  </p>
                  {isStreaming && completedCount < 7 && (
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      ~{(7 - completedCount) * 8}s remaining
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount / 7) * 100}%`, background: "hsl(258,85%,64%)" }} />
              </div>
            </div>

            {steps.map(step => <StepCard key={step.stepNumber} step={step} demo={demoMode} />)}

            {/* Demo complete — offer to retry the real backend with the user's own idea */}
            {demoMode && demoComplete && (
              <div className="mt-4 p-5 rounded-xl"
                style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "rgb(250,204,21)" }}>
                  ✓ Sample plan complete
                </p>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                  That was a pre-built demo so you could see the full 7-agent pipeline. Run it live on your own idea once the backend is reachable.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => idea.trim() ? startGeneration(idea, selectedModel) : reset()}
                    className="py-2.5 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all"
                    style={{ background: "hsl(258,85%,64%)" }}>
                    ⚡ Try with your idea →
                  </button>
                  <button
                    onClick={reset}
                    className="py-2.5 px-4 rounded-lg text-xs font-medium cursor-pointer transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    ← Start over
                  </button>
                </div>
              </div>
            )}

            {/* Approval rejected / timed out */}
            {stoppedMsg && !showApproval && (
              <div className="mt-4 p-4 rounded-xl"
                style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
                <p className="text-sm mb-3" style={{ color: "rgb(250,204,21)" }}>⏸ {stoppedMsg}</p>
                <button
                  onClick={() => { reset(); setTimeout(() => startGeneration(idea, selectedModel), 50) }}
                  className="py-2 px-4 rounded-lg text-xs font-medium cursor-pointer transition-all"
                  style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  ↺ Start over
                </button>
              </div>
            )}

            {/* Error banner — quota-aware */}
            {modelError && !isStreaming && (() => {
              const isQuota = /429|quota|exhausted|resource/i.test(modelError)
              const isTimeout = /timeout|503|overload/i.test(modelError)
              return (
                <div className="mt-4 rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${isQuota ? "rgba(234,179,8,0.35)" : "rgba(239,68,68,0.25)"}` }}>
                  {/* Header */}
                  <div className="px-5 py-3.5 flex items-center gap-3"
                    style={{ background: isQuota ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.08)" }}>
                    <span className="text-lg">{isQuota ? "⏱" : isTimeout ? "🔄" : "⚠️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: isQuota ? "rgb(250,204,21)" : "rgb(252,165,165)" }}>
                        {isQuota ? "Quota limit reached for this model" : isTimeout ? "Model is overloaded — try again or switch" : "Generation failed"}
                      </p>
                    </div>
                  </div>
                  {/* Detail */}
                  <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    {isQuota ? (
                      <>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                          <strong className="text-white">What happened:</strong> The Google AI Studio free tier allows a limited number of requests per day per project.
                          You&apos;ve hit that limit for <strong className="text-white">{models.find(m => m.key === selectedModel)?.display ?? selectedModel}</strong>.
                        </p>
                        <div className="rounded-xl p-3 mb-3 space-y-1.5"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-xs font-semibold text-white mb-2">📊 Free Tier Quota Details</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>• Resets at <strong className="text-white">midnight Pacific Time</strong> every day</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>• Limit shared across all API keys in the same Google project</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>• To remove limits: add a billing account at <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline" style={{ color: "rgb(147,197,253)" }}>console.cloud.google.com</a></p>
                        </div>
                        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                          💡 <strong className="text-white">Quick fix:</strong> Switch to <strong className="text-white">Gemini 3.1 Flash Lite</strong> or <strong className="text-white">Gemini 2.5 Flash Lite</strong> — both have separate quota pools and are currently working.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {modelError}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => { reset(); setTimeout(() => startGeneration(idea, selectedModel), 50) }}
                        className="py-2 px-4 rounded-lg text-xs font-medium cursor-pointer transition-all"
                        style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
                        ↺ Retry same model
                      </button>
                      {isQuota && (
                        <>
                          <button
                            onClick={() => { setSelectedModel("gemini-3.1-flash-lite"); reset(); setTimeout(() => startGeneration(idea, "gemini-3.1-flash-lite"), 50) }}
                            className="py-2 px-4 rounded-lg text-xs font-medium cursor-pointer transition-all"
                            style={{ background: "rgba(34,197,94,0.12)", color: "rgb(74,222,128)", border: "1px solid rgba(34,197,94,0.3)" }}>
                            ⚡ Try Gemini 3.1 Flash Lite
                          </button>
                          <button
                            onClick={() => { setSelectedModel("gemini-2.5-flash-lite"); reset(); setTimeout(() => startGeneration(idea, "gemini-2.5-flash-lite"), 50) }}
                            className="py-2 px-4 rounded-lg text-xs font-medium cursor-pointer transition-all"
                            style={{ background: "rgba(59,130,246,0.12)", color: "rgb(147,197,253)", border: "1px solid rgba(59,130,246,0.3)" }}>
                            🔄 Try Gemini 2.5 Flash Lite
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* View plan button */}
            {planId && completedCount === 7 && planId !== "no-db" && (
              <button
                onClick={() => router.push(`/plan/${planId}`)}
                className="w-full mt-4 py-4 rounded-xl font-semibold text-white text-sm cursor-pointer"
                style={{ background: "hsl(142,71%,35%)" }}
              >
                View Full Business Plan →
              </button>
            )}

            {/* Offline success */}
            {planId === "no-db" && completedCount === 7 && (
              <div className="w-full mt-4 p-4 rounded-xl text-center"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "rgb(74,222,128)" }}>
                  Plan generated successfully!
                </p>
                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  MongoDB offline — plan not saved. Start the backend with a valid MongoDB URI to enable persistence.
                </p>
                <button onClick={reset} className="text-xs px-4 py-2 rounded-lg cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  Generate Another Plan
                </button>
              </div>
            )}

            {!isStreaming && completedCount < 7 && !modelError && (
              <button onClick={reset} className="w-full mt-3 py-3 rounded-xl font-medium text-sm cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                ← Try a different idea
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div style={{ background: "hsl(240,25%,4%)", minHeight: "100vh" }} />}>
      <GenerateContent />
    </Suspense>
  )
}
