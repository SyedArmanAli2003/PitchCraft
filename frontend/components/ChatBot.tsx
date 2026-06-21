"use client"
import { useState, useRef, useEffect } from "react"

interface Model {
  id: string
  label: string
  provider: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm PitchCraft's AI assistant. I can help you with business ideas, startup advice, or explain how PitchCraft works. What can I help you with?",
}

const FREE_MODELS: Model[] = [
  { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B (NVIDIA)", provider: "nvidia-nim" },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B", provider: "openrouter" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B", provider: "openrouter" },
  { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B", provider: "openrouter" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", label: "Qwen3 Next 80B", provider: "openrouter" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B", provider: "openrouter" },
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState(FREE_MODELS[0].id)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          model,
        }),
      })

      if (!res.ok) throw new Error("Failed to get response")

      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.text }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .chat-fade-in { animation: chatFadeIn 0.3s ease-out; }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: chatPulse 1.4s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-90"
        style={{
          background: open ? "hsl(258,85%,55%)" : "hsl(258,85%,64%)",
          boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
          color: "white",
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl flex flex-col chat-fade-in"
          style={{
            height: "540px",
            maxHeight: "calc(100vh - 160px)",
            background: "hsl(240,18%,11%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-t-2xl shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "hsl(240,18%,9%)" }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ color: "hsl(258,90%,66%)", fontSize: "18px" }}>✦</span>
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>PitchCraft AI</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(o => !o)}
                className="text-xs px-2.5 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                {FREE_MODELS.find(m => m.id === model)?.label?.split(" ").slice(0, 2).join(" ") || "Model"}
              </button>
              {showModelPicker && (
                <div
                  className="absolute right-0 top-10 rounded-xl py-1 min-w-[220px] z-10"
                  style={{
                    background: "hsl(240,18%,11%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="px-3 py-2 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Free Models
                  </div>
                  {FREE_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id); setShowModelPicker(false) }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center gap-2"
                      style={{
                        color: m.id === model ? "hsl(258,90%,66%)" : "rgba(255,255,255,0.65)",
                        background: m.id === model ? "rgba(124,58,237,0.1)" : "transparent",
                      }}
                      onMouseEnter={e => { if (m.id !== model) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                      onMouseLeave={e => { if (m.id !== model) e.currentTarget.style.background = "transparent" }}
                    >
                      <span style={{ opacity: m.id === model ? 1 : 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollBehavior: "smooth" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? ""
                      : ""
                  }`}
                  style={{
                    background: msg.role === "user" ? "hsl(258,85%,64%)" : "rgba(255,255,255,0.06)",
                    color: msg.role === "user" ? "white" : "rgba(255,255,255,0.85)",
                    borderBottomRightRadius: msg.role === "user" ? "4px" : "12px",
                    borderBottomLeftRadius: msg.role === "user" ? "12px" : "4px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-3.5 py-3 flex items-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.06)", borderBottomLeftRadius: "4px" }}
                >
                  <span className="typing-dot" style={{ background: "rgba(255,255,255,0.4)" }} />
                  <span className="typing-dot" style={{ background: "rgba(255,255,255,0.4)" }} />
                  <span className="typing-dot" style={{ background: "rgba(255,255,255,0.4)" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your business idea..."
                className="flex-1 text-sm rounded-xl px-3.5 py-2.5 outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.85)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all disabled:opacity-30"
                style={{
                  background: input.trim() ? "hsl(258,85%,64%)" : "rgba(255,255,255,0.06)",
                  color: input.trim() ? "white" : "rgba(255,255,255,0.3)",
                  border: "none",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}