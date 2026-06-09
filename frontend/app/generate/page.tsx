"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import StepCard from "@/components/StepCard"
import type { AgentStep } from "@/lib/types"
import { API, type ModelKey, type ModelOption } from "@/lib/config"

// Static fallback — matches api/agent.py MODEL_CONFIGS
const FALLBACK_MODELS: ModelOption[] = [
  { key: "gemini-3-pro",         display: "Gemini 3 Pro",          tier: 1 },
  { key: "gemini-3-flash",       display: "Gemini 3 Flash",        tier: 2 },
  { key: "gemini-2.5-flash",     display: "Gemini 2.5 Flash",      tier: 3 },
  { key: "gemini-2.5-flash-lite", display: "Gemini 2.5 Flash Lite", tier: 4 },
]

const MODEL_ICONS: Record<ModelKey, string> = {
  "gemini-3-pro":         "✦",
  "gemini-3-flash":       "⚡",
  "gemini-2.5-flash":     "◈",
  "gemini-2.5-flash-lite": "◇",
}

const MODEL_BADGES: Record<ModelKey, { label: string; color: string; bg: string; border: string }> = {
  "gemini-3-pro":         { label: "Most Powerful", color: "hsl(258,90%,82%)", bg: "rgba(124,58,237,0.18)", border: "rgba(124,58,237,0.4)"  },
  "gemini-3-flash":       { label: "Recommended",   color: "hsl(258,80%,78%)", bg: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.3)"  },
  "gemini-2.5-flash":     { label: "Balanced",      color: "hsl(239,84%,78%)", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.3)"  },
  "gemini-2.5-flash-lite": { label: "Fastest",      color: "hsl(262,60%,75%)", bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)" },
}

const MODEL_DESC: Record<ModelKey, string> = {
  "gemini-3-pro":         "Google's most capable Gemini model. Best quality for complex ideas, uses more quota.",
  "gemini-3-flash":       "Gemini 3 Flash — ideal balance of speed and quality. Recommended for most plans.",
  "gemini-2.5-flash":     "Gemini 2.5 Flash — solid fallback. Great for quick iterations.",
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite — fastest option. Use if other tiers hit rate limits.",
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
      <div className="grid grid-cols-2 gap-2">
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
                <span className="text-base leading-none">{MODEL_ICONS[m.key]}</span>
                <span className="text-sm font-semibold" style={{ color: isSelected ? "white" : "rgba(255,255,255,0.75)" }}>
                  {m.display}
                </span>
              </div>
              <p className="text-xs leading-snug mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                {MODEL_DESC[m.key]}
              </p>
              <span className="inline-block text-xs px-2 py-0.5 rounded-full"
                style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                {badge.label}
              </span>
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
  const [stoppedMsg, setStoppedMsg]       = useState<string | null>(null)
  const [models, setModels]          = useState<ModelOption[]>(FALLBACK_MODELS)
  const [selectedModel, setSelectedModel] = useState<ModelKey>("gemini-3-flash")
  const [usedModel, setUsedModel]    = useState<string>("")
  const [modelError, setModelError]  = useState<string | null>(null)
  const ideaRef = useRef(idea)
  ideaRef.current = idea

  // Fetch available models from backend
  useEffect(() => {
    fetch(API.models)
      .then(r => r.json())
      .then(d => { if (d.models?.length) setModels(d.models) })
      .catch(() => { /* use fallback */ })
  }, [])

  // Demo mode
  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      const demoIdea = "A medicine delivery app for rural villages in India"
      setIdea(demoIdea)
      setTimeout(() => startGeneration(demoIdea, "gemini-3-flash"), 1500)
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

  const startGeneration = async (ideaText: string, modelKey: ModelKey = selectedModel) => {
    if (!ideaText.trim() || isStreaming) return
    setSubmitted(true)
    setIsStreaming(true)
    setModelError(null)
    setSteps(freshSteps(modelKey))
    updateStep(1, { status: "running", startedAt: Date.now() })

    try {
      const res = await fetch(API.generate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaText, model: modelKey }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error" }))
        throw new Error(err.detail || `HTTP ${res.status}`)
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

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""   // keep the last (possibly incomplete) line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue   // skip SSE comments/heartbeats
          let event: Record<string, unknown>
          try { event = JSON.parse(line.slice(6)) } catch { continue }

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

          if (status === "error") {
            setModelError(
              `${models.find(m => m.key === modelKey)?.display ?? modelKey} failed at step ${step}. The cascade tried all Gemini tiers — please try again.`
            )
          }

          if (status === "complete" && (step as number) < 7) {
            updateStep((step as number) + 1, { status: "running", startedAt: Date.now() })
          }

          // Navigate to the plan page on completion
          if (step === 7 && status === "complete") {
            const pid = (data?.plan_id as string) || id
            if (pid && pid !== "no-db") {
              setTimeout(() => router.push(`/plan/${pid}`), 1200)
            }
          }
        }
      }
      try { await reader.cancel() } catch { /* already closed */ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setModelError(`Error: ${msg}. Please try again.`)
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s))
    } finally {
      setIsStreaming(false)
    }
  }

  const reset = () => {
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
    setStoppedMsg(null)
  }

  const completedCount = steps.filter(s => s.status === "complete").length
  const selectedBadge = MODEL_BADGES[selectedModel]

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

      {/* ── HUMAN-IN-THE-LOOP APPROVAL GATE ── */}
      {showApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-7 max-w-lg w-full"
            style={{ background: "hsl(240,15%,10%)", border: "1px solid rgba(124,58,237,0.4)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}>
                ⏸ Awaiting your approval
              </span>
            </div>
            <p className="text-white font-semibold text-lg mb-1 mt-2">Review the market research</p>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              The agent paused after Step 2. Approve to let it build the full plan (Steps 3–7),
              or steer it in a new direction.
            </p>

            {approvalData && (
              <div className="rounded-xl p-4 mb-4 space-y-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>MARKET SIZE</p>
                    <p className="text-white font-medium">{String(approvalData.market_size ?? "—")}</p>
                  </div>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>GROWTH</p>
                    <p className="text-white font-medium">{String(approvalData.growth_rate ?? "—")}</p>
                  </div>
                </div>
                {approvalData.market_gap ? (
                  <p className="text-xs pl-3" style={{ borderLeft: "2px solid hsl(258,85%,64%)", color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                    {String(approvalData.market_gap)}
                  </p>
                ) : null}
              </div>
            )}

            <input
              value={redirectNote}
              onChange={e => setRedirectNote(e.target.value)}
              placeholder="Optional: redirect the strategy (e.g. 'focus on B2B enterprise')"
              maxLength={160}
              disabled={approvalBusy}
              className="w-full rounded-lg p-3 text-sm text-white outline-none mb-4 disabled:opacity-50"
              style={{ background: "hsl(240,15%,7%)", border: "1px solid rgba(255,255,255,0.08)" }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => submitApproval(true)}
                disabled={approvalBusy}
                className="flex-1 py-3 rounded-xl font-medium text-sm text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "hsl(258,85%,64%)" }}>
                {approvalBusy ? "Continuing…" : "Approve & continue →"}
              </button>
              <button
                onClick={() => submitApproval(false)}
                disabled={approvalBusy}
                className="flex-1 py-3 rounded-xl font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "rgb(252,165,165)" }}>
                Reject & stop
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-20">

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
            <div className="mb-8">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">&quot;{idea}&quot;</p>
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
                <p className="text-xs flex-shrink-0 ml-4 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {completedCount}/7
                </p>
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount / 7) * 100}%`, background: "hsl(258,85%,64%)" }} />
              </div>
            </div>

            {steps.map(step => <StepCard key={step.stepNumber} step={step} />)}

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

            {/* Error banner */}
            {modelError && !isStreaming && (
              <div className="mt-4 p-4 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p className="text-sm mb-3" style={{ color: "rgb(252,165,165)" }}>⚠ {modelError}</p>
                <button
                  onClick={() => { reset(); setTimeout(() => startGeneration(idea, selectedModel), 50) }}
                  className="py-2 px-4 rounded-lg text-xs font-medium cursor-pointer transition-all"
                  style={{ background: "rgba(124,58,237,0.15)", color: "hsl(258,80%,78%)", border: "1px solid rgba(124,58,237,0.3)" }}
                >
                  ↺ Retry
                </button>
              </div>
            )}

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
