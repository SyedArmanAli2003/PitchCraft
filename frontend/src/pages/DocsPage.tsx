import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ENDPOINTS = [
  { method: "POST", path: "/api/generate", desc: "Start plan generation — returns an SSE stream of 7 step events" },
  { method: "GET",  path: "/api/plan/:id", desc: "Fetch a completed plan JSON by its MongoDB document ID" },
  { method: "GET",  path: "/api/health",   desc: "Health check — returns { status: 'ok' }" },
];

const STACK = [
  { name: "React 19 + Vite",    role: "Frontend SPA",           color: "hsl(195,100%,50%)" },
  { name: "TypeScript",          role: "Type safety",             color: "hsl(220,80%,60%)" },
  { name: "Tailwind CSS",        role: "Utility styling",         color: "hsl(195,80%,55%)" },
  { name: "Three.js",            role: "3D particle background",  color: "hsl(258,80%,70%)" },
  { name: "FastAPI (Python)",    role: "Backend / API layer",     color: "hsl(142,71%,45%)" },
  { name: "Google Gemini 3",     role: "AI generation engine",    color: "hsl(38,92%,55%)"  },
  { name: "MongoDB Atlas",       role: "Plan data persistence",   color: "hsl(142,71%,40%)" },
  { name: "Server-Sent Events",  role: "Real-time streaming",     color: "hsl(258,90%,66%)" },
];

const ENV_VARS = [
  { key: "GEMINI_API_KEY", desc: "Google AI Studio API key",              required: true  },
  { key: "MONGODB_URI",    desc: "MongoDB Atlas connection string",        required: true  },
  { key: "MONGODB_DB",     desc: "Database name (default: pitchcraft)",   required: false },
  { key: "GEMINI_MODEL",   desc: "Model ID (default: gemini-3.0-flash)", required: false },
  { key: "PORT",           desc: "Backend port (default: 8000)",          required: false },
];

const card = {
  background: "hsl(240,15%,8%)",
  border: "1px solid hsl(240,12%,16%)",
};

function SectionHead({ title }: { title: string }) {
  return (
    <h2
      className="font-bold uppercase tracking-widest text-xs mb-5"
      style={{ color: "rgba(139,92,246,0.8)" }}
    >
      {title}
    </h2>
  );
}

export default function DocsPage() {
  return (
    <div className="font-sora antialiased min-h-screen" style={{ background: "hsl(240,25%,4%)" }}>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 md:px-14 pt-36 pb-24">
        {/* Header */}
        <div className="mb-14">
          <span
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "hsl(258,80%,78%)" }}
          >
            ✦ Project Documentation
          </span>
          <h1
            className="font-bold uppercase tracking-[-0.03em] mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "rgba(255,255,255,0.95)" }}
          >
            Docs
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", lineHeight: "1.75", maxWidth: "500px" }}>
            PitchCraft is a full-stack AI application built for the Rapid Agent Hackathon 2026.
            This page covers architecture, API reference, and local setup instructions.
          </p>
        </div>

        {/* Architecture */}
        <section className="mb-12">
          <SectionHead title="Architecture" />
          <div className="rounded-2xl p-6" style={card}>
            <pre style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem", lineHeight: "1.9", fontFamily: "monospace", overflowX: "auto" }}>
{`Browser (React SPA)
  │  POST /api/generate  ←── idea text
  │  SSE stream ←─────────── 7 step events
  │  GET  /api/plan/:id  ←── full plan JSON
  ▼
FastAPI Backend (Python)
  │  agent.py   — orchestrates 7 Gemini calls
  │  mongodb.py — stores + retrieves plans
  ├─► Google Gemini 3 Flash  (AI inference)
  └─► MongoDB Atlas           (data storage)`}
            </pre>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-12">
          <SectionHead title="Tech Stack" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STACK.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-xl p-4" style={card}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <SectionHead title="API Reference — Base URL: http://localhost:8000" />
          <div className="flex flex-col gap-3">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="rounded-xl p-4 flex items-start gap-4" style={card}>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5"
                  style={{
                    background: ep.method === "POST" ? "rgba(124,58,237,0.15)" : "rgba(74,222,128,0.12)",
                    color: ep.method === "POST" ? "hsl(258,80%,75%)" : "hsl(142,71%,55%)",
                    border: `1px solid ${ep.method === "POST" ? "rgba(124,58,237,0.3)" : "rgba(74,222,128,0.3)"}`,
                  }}
                >
                  {ep.method}
                </span>
                <div>
                  <code className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>
                    {ep.path}
                  </code>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{ep.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Setup */}
        <section className="mb-12">
          <SectionHead title="Local Setup" />
          <div className="rounded-2xl p-6" style={card}>
            <pre style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", lineHeight: "2", fontFamily: "monospace", overflowX: "auto" }}>
{`# 1. Clone
git clone https://github.com/SyedArmanAli2003/PitchCraft
cd PitchCraft

# 2. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env    # fill GEMINI_API_KEY + MONGODB_URI
python main.py          # → http://localhost:8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev             # → http://localhost:5173`}
            </pre>
          </div>
        </section>

        {/* Env vars */}
        <section className="mb-12">
          <SectionHead title="Environment Variables (backend/.env)" />
          <div className="flex flex-col gap-2">
            {ENV_VARS.map((v) => (
              <div key={v.key} className="rounded-xl p-4 flex items-start gap-4" style={card}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-bold" style={{ color: "hsl(258,80%,75%)", fontFamily: "monospace" }}>
                      {v.key}
                    </code>
                    {v.required ? (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.12)", color: "rgb(248,113,113)", border: "1px solid rgba(248,113,113,0.25)" }}>required</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>optional</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
