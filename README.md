<div align="center">

# ✦ PitchCraft

### Turn one sentence into an investor-ready business plan — with a Gemini 3 agent you can actually supervise.

**A multi-step AI agent that plans, researches, and reasons under human oversight — grounded in MongoDB, traced end-to-end in Arize Phoenix, and sealed with a tamper-evident audit chain.**

Built for the [Google Cloud Rapid Agent Hackathon](https://rapid-agent.devpost.com/) · MongoDB & Arize tracks

**🔗 Live demo:** _https://<your-app>.vercel.app_ (set after deploy) · **🎥 Demo video:** _<add YouTube/Loom link>_ · **💻 Repo:** [github.com/SyedArmanAli2003/PitchCraft](https://github.com/SyedArmanAli2003/PitchCraft)

</div>

---

## The problem

Founders, students, and small teams have ideas constantly — but turning an idea into something you can *act on or pitch* (market sizing, personas, financials, risk) takes days of research and a blank-page tax most people never pay. Generic chatbots give you one wall of text with no structure, no grounding in real data, no record of how they reached their conclusions, and **no point at which a human can step in and steer.**

PitchCraft is the opposite of a chatbot. It's an **agent that does the work** — a 7-step pipeline that decomposes the goal, calls tools, pauses for your approval at the decision point, and produces a structured, verifiable plan.

> **One idea in → a full, structured, auditable business plan out — in about a minute.**

---

## Why this fits the hackathon

The challenge asks for an agent that **moves beyond chat**, **handles a multi-step mission while keeping you in control**, and **integrates a partner's technology** to give it superpowers. PitchCraft was designed around exactly those three pillars:

| Hackathon goal | How PitchCraft delivers |
| --- | --- |
| **Move beyond chat** | A 7-step agent that *acts* — it queries a database, grounds its reasoning in stored market data, runs tools, and writes structured artifacts (not prose). |
| **Multi-step mission, human in control** | The agent decomposes the job into 7 reasoning steps and **pauses after market research for a human approval gate** — approve, reject, or *redirect the strategy* before it commits to the full plan. |
| **Partner power** | The agent consumes **MongoDB through a real Model Context Protocol server** — it's its memory, grounding layer, and tamper-evident ledger. **Arize Phoenix** gives full agent observability — every Gemini call and every step is traced. |
| **Built with Gemini 3** | Uses the current `google-genai` SDK with a **Gemini 3 → 2.5 cascade** (`gemini-3-pro-preview`, `gemini-3-flash-preview`, …) and forced-JSON output for reliable structured generation. |

### Judging-criteria fit

- **Technological Implementation** — real Gemini 3 (verified live), forced-JSON structured output, multi-key rotation + model cascade, MongoDB persistence & grounding, OpenInference/Arize tracing, and a SHA-256 audit chain with live verification.
- **Design** — a focused, animated Next.js UI: pick a model, watch the agent work step-by-step, approve at the gate, and read a clean plan with a verifiable audit trail.
- **Potential Impact** — collapses days of founder/student research into ~60s, with guardrails (viability gate + human approval) that keep humans in the loop.
- **Quality of the Idea** — "an agent that drafts *and proves* its own reasoning" — the tamper-evident audit chain is a genuinely novel trust layer for generative output.

---

## What the agent does — the 7 steps

```
Idea ─▶ ① Validate ─▶ ② Market Research ─▶ ⏸ HUMAN APPROVAL GATE ─▶ ③ Personas
                         (MongoDB grounding)   (approve / reject / redirect)        │
                                                                                     ▼
        ⑦ Finalize + seal audit chain ◀─ ⑥ Risk & SWOT ◀─ ⑤ Financials ◀─ ④ Business Plan
                                                            (MongoDB benchmarks)
```

| # | Step | What happens | Tool |
| - | --- | --- | --- |
| 1 | **Validate** | Viability score (1–10), core problem, target market, concerns. A score < 5 triggers a frontend "continue anyway?" gate. | Gemini |
| 2 | **Market Research** | Market size, growth, competitors & weaknesses, the gap. **Grounded in MongoDB** seed data + similar past plans. | Gemini + MongoDB |
| — | **⏸ Approval gate** | The agent **pauses** and streams an approval request. A human approves, rejects, or types a new strategic direction the agent must honor. | Human-in-the-loop |
| 3 | **Personas** | 3 customer personas (job, pain point, willingness to pay, acquisition channel). Honors any redirect. | Gemini |
| 4 | **Business Plan** | Problem, solution, UVP, revenue model & streams, go-to-market, milestones. | Gemini |
| 5 | **Financials** | 3-year revenue, startup cost, burn, break-even, funding — **kept realistic by MongoDB benchmark averages**. | Gemini + MongoDB |
| 6 | **Risk & SWOT** | Ranked risks with mitigations + a full SWOT. | Gemini |
| 7 | **Finalize** | Generates a share token, seals the **tamper-evident audit chain**, persists everything. | System + MongoDB |

Each completed step is **streamed to the browser over SSE** so you watch the agent think in real time.

---

## Headline features

### 🔒 Tamper-evident audit chain (the trust layer)
Every step's output is hashed into a **SHA-256 chain** anchored to a genesis hash derived from the plan ID — each hash folds in the previous one (blockchain-style). If *any* stored field is later modified, re-verification **breaks at the exact step** and the UI flips from "✓ Chain verified" to "⚠ Chain broken." Endpoints `/api/plan/{id}/audit` and `/api/plan/{id}/verify` re-prove integrity on demand.
*Verified: clean chains pass, single-field tampering is detected at the precise step.*

### ⏸ Human-in-the-loop approval gate
The agent doesn't run away with your idea. After market research it **pauses mid-stream**, keeps the connection warm with heartbeats, and waits for a decision — **approve**, **reject & stop**, or **redirect** ("focus on B2B enterprise"). The redirect is injected into the remaining steps. This is the "keeping you in control" requirement, implemented for real.

### 🧠 Gemini 3 model cascade with multi-key rotation
Pick a tier in the UI; on quota/`429` the agent **rotates across your API keys**, and on hard failure it **cascades down the model tiers** (`gemini-3-pro-preview → gemini-3-flash-preview → gemini-2.5-flash → gemini-2.5-flash-lite`) so a plan almost always completes. The UI shows a badge when a fallback was used.

### 📊 Arize Phoenix observability (Arize track)
Startup wires **OpenInference auto-instrumentation** for the `google-genai` SDK into Phoenix. Every Gemini call (prompt, model, tokens, latency) and every agent step appears as a span in your Phoenix project. Status is exposed at `/api/observability`. Fully optional and **self-disabling** if no key is set — it can never crash a run.

### 🗄️ MongoDB as the agent's brain-stem — via a real MCP server
MongoDB stores plans, seeds 10 industries of market data, and holds the audit chains. Critically, the agent doesn't query Mongo directly — it goes through a **genuine Model Context Protocol server** ([`backend/mcp_server.py`](backend/mcp_server.py), built on the official `mcp` SDK) that exposes three tools:

| MCP tool | What it grounds |
| --- | --- |
| `get_industry_market_data` | Step 2 — market size, growth, players, challenges |
| `search_similar_plans` | Step 2 — patterns from past plans in the same market |
| `get_market_benchmarks` | Step 5 — realistic financials from aggregated real plans |

The agent calls these over the real MCP protocol (an in-memory client↔server session), so **MongoDB literally gives the agent its "superpowers" through MCP** — the hackathon's Partner Power requirement, satisfied to the letter. The same server runs over **stdio** for any external MCP client (Claude Desktop, Cursor, MCP Inspector):

```bash
cd backend && python mcp_server.py          # stdio MCP server
```
```jsonc
// Claude Desktop / Cursor config
{ "mcpServers": { "pitchcraft-mongodb": {
    "command": "python", "args": ["/abs/path/to/backend/mcp_server.py"] } } }
```

Inspect or invoke the tools over HTTP too: `GET /api/mcp/tools`, `GET /api/mcp/demo`, `POST /api/mcp/call`.

---

## Architecture

```
┌─────────────────────────────┐         ┌──────────────────────────────────────┐
│  Next.js 14 (frontend/)     │  SSE    │  FastAPI (backend/)                    │
│  • model picker             │ ──────▶ │  • /api/generate  → streams 7 steps    │
│  • live step cards          │ ◀────── │  • run_pitchcraft_agent (google-genai) │
│  • approval gate modal      │         │  • approval + audit + MCP endpoints    │
│  • plan view + audit trail  │         └──────────────┬─────────────────────────┘
└─────────────────────────────┘                        │
                                          ┌─────────────┼───────────────┐
                                          ▼             ▼               ▼
                                    ┌──────────┐  ┌───────────┐  ┌─────────────┐
                                    │ Gemini 3 │  │ MongoDB   │  │ Arize       │
                                    │ (genai)  │  │ Atlas     │  │ Phoenix     │
                                    └──────────┘  └───────────┘  └─────────────┘
```

**Backend** (`backend/`): `index.py` (FastAPI app & routes) · `agent.py` (the 7-step agent) · `mcp_server.py` (the MongoDB MCP server) · `mongodb.py` (persistence, seed data, tools, audit storage) · `audit.py` (SHA-256 chain) · `observability.py` (Arize Phoenix) · `models.py` (Pydantic schemas).

**Frontend** (`frontend/`): App-Router Next.js — `app/generate` (the agent runner + gates), `app/plan/[id]` (the plan + audit trail), `components/StepCard.tsx`, particle hero.

**Tech:** Gemini 3 (`google-genai`) · MongoDB Atlas (`pymongo`, TLS via `certifi`) · Model Context Protocol (`mcp`) · Arize Phoenix (`arize-phoenix-otel` + `openinference-instrumentation-google-genai`) · FastAPI + SSE · Next.js 14 + Tailwind + Three.js.

---

## API reference

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/generate` | Start a run; streams 7 steps + the approval gate as SSE. |
| `GET` | `/api/plan/{id}` | Fetch a stored plan. |
| `GET` | `/api/plan/{id}/audit` | Audit chain + live verification result. |
| `POST` | `/api/plan/{id}/verify` | Re-verify the chain against stored data. |
| `GET` | `/api/approval/{id}` | Approval request status. |
| `POST` | `/api/approval/{id}/decide` | Record a reviewer decision (`approved`, optional `direction_override`). |
| `GET` | `/api/share/{token}` | Public read-only plan by share token. |
| `GET` | `/api/models` | Available Gemini tiers (with `available` flag). |
| `GET` | `/api/agent/info` | Honest agent manifest (framework, models, integrations). |
| `GET` | `/api/observability` | Arize Phoenix tracing status. |
| `GET`·`POST` | `/api/mcp/tools` · `/api/mcp/demo` · `/api/mcp/call` | Real MCP tool manifest, a live protocol demo, and direct tool invocation. |
| `GET` | `/api/stats` · `/api/plans` · `/api/health` | Counts, recent plans, health. |

---

## Run it locally

**Prerequisites:** Node 18+, Python **3.12** (recommended — see note), a MongoDB Atlas URI, and at least one Gemini API key.

```bash
# 1. Configure secrets
cp .env.example backend/.env       # then fill in MONGODB_URI + GEMINI_API_KEY_1
                                   # (optional) PHOENIX_API_KEY for Arize tracing

# 2. Backend  (terminal 1)
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Windows; use bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn index:app --reload --port 8000

# 3. Frontend (terminal 2)
cd frontend
npm install
npm run dev          # http://localhost:3000  (proxies /api/* → :8000)
```

Open **http://localhost:3000/generate**, type an idea, pick a model, and watch the agent work. Set `SKIP_APPROVAL=true` in `.env` to auto-approve the gate during demos/CI.

> **Python version note:** `requirements.txt` is pinned for the Vercel Python 3.12 runtime. On Python 3.13/3.14, prebuilt `pydantic-core` wheels may not yet exist (it would try to compile Rust). If so, either use Python 3.12, or `pip install fastapi pydantic` (unpinned) to grab current wheels — the app code is version-agnostic.

---

## Deploy to Vercel

This repo is a single Vercel project: Next.js frontend + a Python serverless API.

Vercel only serves Python functions from an **`/api` directory at the repo root**, but the code currently lives in `backend/`. One step bridges that:

```bash
# Rename the Python app to the location Vercel expects (moves all modules + history):
git mv backend api
# move the untracked files too, if git mv skipped them:
#   index.py, audit.py, observability.py, .env  →  api/
```

Then:
1. `vercel.json` is already wired for `api/index.py` (function `python3.12`, `maxDuration` 300) with `/api/:path* → /api/index`.
2. In the Vercel dashboard → **Settings → Environment Variables**, add: `MONGODB_URI`, `MONGODB_DB`, `GEMINI_API_KEY_1` (+ `_2/_3`), `FRONTEND_URL` (your deployed URL), and optionally `PHOENIX_API_KEY` / `PHOENIX_COLLECTOR_ENDPOINT` / `PHOENIX_PROJECT`.
3. Deploy. `next.config.mjs` proxies `/api/*` in dev; `vercel.json` handles it in prod.

> **Function duration:** the approval gate holds the SSE stream open. Keep `APPROVAL_TIMEOUT_SECONDS` within your plan's function limit (Vercel Hobby = 60s; Pro = up to 300s), or set `SKIP_APPROVAL=true` for unattended demos.

---

## Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | ✅ | Atlas connection string. Without it the app runs in offline mode (no persistence). |
| `MONGODB_DB` | – | Database name (default `pitchcraft`). |
| `MONGODB_TLS_INSECURE` | – | `true` only if a proxy breaks cert validation. Default = verify via `certifi`. |
| `GEMINI_API_KEY_1..N` | ✅ | One or more keys; rotated on quota errors. |
| `PHOENIX_API_KEY` | – | Enables Arize tracing. Must match the endpoint (Cloud vs self-hosted). |
| `PHOENIX_COLLECTOR_ENDPOINT` | – | Phoenix collector URL (Cloud space URL or self-hosted). |
| `PHOENIX_PROJECT` | – | Project name in Phoenix (default `pitchcraft`). |
| `APPROVAL_TIMEOUT_SECONDS` | – | How long the gate waits before abandoning (default 300). |
| `SKIP_APPROVAL` | – | `true` auto-approves the gate after 3s. |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` | – | Per-IP `/api/generate` limit (default 3 req / 60 s). |
| `FRONTEND_URL` | – | Your deployed URL, for server-side fetches + CORS. |

---

## QA & verification status

This build went through a full QA pass. Fixed and **verified live** in this repo:

- ✅ **Gemini 3 actually runs now.** The previous model IDs (`gemini-3.0-pro/flash`) returned HTTP 404 and silently fell back to 2.5; corrected to `gemini-3-pro-preview` / `gemini-3-flash-preview` and confirmed with a live JSON-mode call.
- ✅ **Approval gate is wired end-to-end.** The frontend previously ignored the `approval_gate` event, so every run hung until timeout. Now there's a full approve / reject / redirect modal, plus robust buffered SSE parsing.
- ✅ **Migrated to the current `google-genai` SDK** (the legacy `google-generativeai` is EOL) with forced-JSON output.
- ✅ **Arize Phoenix tracing** initializes, instruments `google-genai`, and emits spans (verified) — and self-disables safely without a key.
- ✅ **CORS** fixed to match Vercel preview domains via regex (the old `https://*.vercel.app` literal never matched).
- ✅ **Secure MongoDB TLS** via `certifi` (replaced `tlsAllowInvalidCertificates`) — verified it still connects to Atlas.
- ✅ **Real MCP server** — 3 MongoDB tools served over the Model Context Protocol; verified via in-memory client↔server round-trip, the HTTP endpoints, and a clean stdio boot. The agent's grounding now flows through MCP.
- ✅ **Audit chain** build → verify → tamper-detect, all unit-tested.
- ✅ Backend HTTP smoke test (health/models/observability/mcp/stats/404/422) and frontend `tsc` + `eslint` all green.

---

## Roadmap

- **MongoDB's hosted MCP server**: also connect the agent to MongoDB's official `mongodb-mcp-server` (raw `find`/`aggregate`) alongside PitchCraft's domain MCP server.
- **Atlas Vector Search**: embed past plans for true semantic "similar plans" grounding.
- **Phoenix evals**: add automated LLM-as-judge scoring of plan quality on top of the traces.
- **Export**: one-click PDF / pitch-deck export (print-to-PDF exists today).

---

## License

MIT — see [LICENSE](LICENSE).

<div align="center">
<sub>Built with Gemini 3 · MongoDB · Arize Phoenix — for the Google Cloud Rapid Agent Hackathon.</sub>
</div>
