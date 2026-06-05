"use client"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import StepCard from "@/components/StepCard"
import type { AgentStep } from "@/lib/types"
import { API, type ModelKey, type ModelOption } from "@/lib/config"

const INITIAL_STEPS: AgentStep[] = [
  { stepNumber:1, name:"Validate Idea",         status:"waiting", tool:"gemini"  },
  { stepNumber:2, name:"Research Market",       status:"waiting", tool:"mongodb" },
  { stepNumber:3, name:"Define Audience",       status:"waiting", tool:"gemini"  },
  { stepNumber:4, name:"Build Business Plan",   status:"waiting", tool:"gemini"  },
  { stepNumber:5, name:"Financial Projections", status:"waiting", tool:"gemini"  },
  { stepNumber:6, name:"Risk Analysis",         status:"waiting", tool:"gemini"  },
  { stepNumber:7, name:"Save & Export",         status:"waiting", tool:"system"  },
]

// Static fallback — matches backend MODEL_CONFIGS exactly
const FALLBACK_MODELS: ModelOption[] = [
  { key: "gemini",   display: "Gemini Flash-Lite",           tier: 1 },
  { key: "llama",    display: "Llama 3.3 70B (Free)",        tier: 2 },
  { key: "deepseek", display: "DeepSeek V4 Flash",           tier: 3 },
  { key: "minimax",  display: "MiniMax M2.7",                tier: 4 },
]

const MODEL_ICONS: Record<ModelKey, string> = {
  gemini:   "✦",
  llama:    "🦙",
  deepseek: "🔬",
  minimax:  "⚡",
}

const MODEL_BADGES: Record<ModelKey, { label: string; color: string; bg: string; border: string }> = {
  gemini:   { label: "Recommended", color: "hsl(258,80%,78%)", bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.35)" },
  llama:    { label: "Free",        color: "rgb(74,222,128)",  bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)"   },
  deepseek: { label: "Reasoning",   color: "rgb(125,211,252)", bg: "rgba(14,165,233,0.12)", border: "rgba(14,165,233,0.3)"  },
  minimax:  { label: "Fast",        color: "rgb(250,204,21)",  bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)"   },
}

const MODEL_DESC: Record<ModelKey, string> = {
  gemini:   "Google's Gemini Flash model. Auto-falls back to Llama if quota exceeded.",
  llama:    "Meta's open-source 70B model via OpenRouter. Completely free, no quota limits.",
  deepseek: "DeepSeek's reasoning model via NVIDIA. High quality, step-by-step thinking.",
  minimax:  "MiniMax M2.7 via NVIDIA. Fast generation for quick iteration.",
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
        Choose AI Model
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
              {/* Selection ring */}
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
  const [steps, setSteps]            = useState<AgentStep[]>(INITIAL_STEPS)
  const [planId, setPlanId]          = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showGate, setShowGate]      = useState(false)
  const [gateData, setGateData]      = useState<Record<string,unknown> | null>(null)
  const [models, setModels]          = useState<ModelOption[]>(FALLBACK_MODELS)
  const [selectedModel, setSelectedModel] = useState<ModelKey>("gemini")
  const [usedModel, setUsedModel]    = useState<string>("")
  const [modelError, setModelError]  = useState<string | null>(null)
  const ideaRef = useRef(idea)
  ideaRef.current = idea

  // Fetch available models from backend
  useEffect(() => {
    fetch(API.models)
      .then(r => r.json())
      .then(d => {
        if (d.models?.length) setModels(d.models)
      })
      .catch(() => { /* use fallback */ })
  }, [])

  // Demo mode
  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      const demoIdea = "A medicine delivery app for rural villages in India"
      setIdea(demoIdea)
      setTimeout(() => startGeneration(demoIdea, "llama"), 1500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build steps with the correct tool badge for the chosen model
  const freshSteps = (modelKey: ModelKey = selectedModel): AgentStep[] => [
    { stepNumber:1, name:"Validate Idea",         status:"waiting", tool: modelKey },
    { stepNumber:2, name:"Research Market",       status:"waiting", tool:"mongodb"  },
    { stepNumber:3, name:"Define Audience",       status:"waiting", tool: modelKey },
    { stepNumber:4, name:"Build Business Plan",   status:"waiting", tool: modelKey },
    { stepNumber:5, name:"Financial Projections", status:"waiting", tool: modelKey },
    { stepNumber:6, name:"Risk Analysis",         status:"waiting", tool: modelKey },
    { stepNumber:7, name:"Save & Export",         status:"waiting", tool:"system"  },
  ]

  const updateStep = (stepNum: number, patch: Partial<AgentStep>) => {
    setSteps(prev => prev.map(s =>
      s.stepNumber === stepNum ? { ...s, ...patch } : s
    ))
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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue
          if (line.includes("heartbeat")) continue
          try {
            const event = JSON.parse(line.slice(6))
            const { step, status, data } = event

            // Track which model was actually used (may be fallback)
            if (data?._fallback) {
              const fallbackKey = data._fallback as string
              setUsedModel(`${fallbackKey} (auto-fallback from ${modelKey})`)
              // Update all remaining step tool badges to show the fallback model
              setSteps(prev => prev.map(s =>
                s.status === "waiting" || s.status === "running"
                  ? { ...s, tool: fallbackKey as AgentStep["tool"] }
                  : s
              ))
            } else if (step === 7 && data?.model_used) {
              setUsedModel(data.model_used)
            }

            // Mark step done/failed
            updateStep(step, {
              status,
              data,
              completedAt: status === "complete" ? Date.now() : undefined,
            })

            // Human-in-loop gate for low viability
            if (step === 1 && status === "complete" && (data?.viability_score as number) < 5) {
              setGateData(data)
              setShowGate(true)
              setIsStreaming(false)
              return
            }

            // If step failed, show a helpful message pointing to other models
            if (status === "error") {
              setModelError(
                `${models.find(m => m.key === modelKey)?.display ?? modelKey} failed at step ${step}. Try a different model below.`
              )
            }

            // Advance next step
            if (status === "complete" && step < 7) {
              updateStep(step + 1, { status: "running", startedAt: Date.now() })
            }

            // Navigate to plan on final step
            if (step === 7 && status === "complete") {
              const pid = event.data?.plan_id || id
              if (pid) setTimeout(() => router.push(`/plan/${pid}`), 1200)
            }
          } catch { /* malformed line */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setModelError(`${models.find(m => m.key === modelKey)?.display ?? modelKey} encountered an error: ${msg}. Try a different model.`)
      setSteps(prev => prev.map(s =>
        s.status === "running" ? { ...s, status: "error" } : s
      ))
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
  }

  const completedCount = steps.filter(s => s.status === "complete").length
  const hasFailed = steps.some(s => s.status === "error")

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
              This idea may face significant challenges. Do you want to continue anyway?
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

            {/* Model selector */}
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
            {/* Header with model used */}
            <div className="mb-8">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">&quot;{idea}&quot;</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: MODEL_BADGES[selectedModel]?.bg ?? "rgba(124,58,237,0.12)",
                        color: MODEL_BADGES[selectedModel]?.color ?? "hsl(258,80%,78%)",
                        border: `1px solid ${MODEL_BADGES[selectedModel]?.border ?? "rgba(124,58,237,0.3)"}`,
                      }}>
                      {MODEL_ICONS[selectedModel]} {models.find(m => m.key === selectedModel)?.display ?? selectedModel}
                    </span>
                    {usedModel && usedModel.includes("fallback") && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(234,179,8,0.12)", color: "rgb(250,204,21)", border: "1px solid rgba(234,179,8,0.3)" }}>
                        ⚠ Fell back to {usedModel.split("(")[0].trim()}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs flex-shrink-0 ml-4 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {completedCount}/7
                </p>
              </div>
              <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(completedCount/7)*100}%`, background: "hsl(258,85%,64%)" }}
                />
              </div>
            </div>

            {/* Step cards */}
            {steps.map(step => (
              <StepCard key={step.stepNumber} step={step} />
            ))}

            {/* Model error banner — suggests switching model */}
            {modelError && !isStreaming && (
              <div className="mt-4 p-4 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <p className="text-sm mb-3" style={{ color: "rgb(252,165,165)" }}>
                  ⚠ {modelError}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {models.filter(m => m.key !== selectedModel).map(m => (
                    <button
                      key={m.key}
                      onClick={() => { reset(); setSelectedModel(m.key); setTimeout(() => startGeneration(idea, m.key), 50) }}
                      className="py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background: MODEL_BADGES[m.key].bg,
                        color: MODEL_BADGES[m.key].color,
                        border: `1px solid ${MODEL_BADGES[m.key].border}`,
                      }}
                    >
                      {MODEL_ICONS[m.key]} Retry with {m.display}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View plan / success */}
            {planId && completedCount === 7 && (
              <button
                onClick={() => router.push(`/plan/${planId}`)}
                className="w-full mt-4 py-4 rounded-xl font-semibold text-white text-sm cursor-pointer"
                style={{ background: "hsl(142,71%,35%)" }}
              >
                View Full Business Plan →
              </button>
            )}

            {/* Reset button — always show when not actively streaming */}
            {!isStreaming && completedCount < 7 && !modelError && (
              <button onClick={reset}
                className="w-full mt-3 py-3 rounded-xl font-medium text-sm cursor-pointer"
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
