<div align="center">

# ✦ PitchCraft

### Turn one sentence into an investor-ready business plan — with a 7-agent team you can actually supervise.

**A multi-agent AI system (Google ADK) where seven named specialists hand off to each other — grounded in MongoDB over MCP, traced end-to-end in Arize Phoenix, and sealed with a tamper-evident audit chain.**



![Gemini 3](https://img.shields.io/badge/Gemini%203-Flash%20%2B%203.5%20%2F%202.5%20cascade-7c3aed)
![Google ADK](https://img.shields.io/badge/Google%20ADK-LlmAgent%20%2B%20SequentialAgent-4285F4)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20MCP-13aa52)
![Arize Phoenix](https://img.shields.io/badge/Arize-Phoenix%20OpenInference-ff6a00)
![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-ready-4285F4)
![Next.js 14](https://img.shields.io/badge/Next.js-14-000000)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

**🔗 Live demo:** [Click here](https://pitch-craft-web-816922279543.us-central1.run.app/) · **🎥 Demo video:** _<add YouTube/Loom link>_ · **💻 Repo:** [github.com/SyedArmanAli2003/PitchCraft](https://github.com/SyedArmanAli2003/PitchCraft) · **🧩 Architecture:** _/api/agent/manifest_

</div>

---

## The problem

Founders, students, and small teams have ideas constantly — but turning an idea into something you can *act on or pitch* (market sizing, personas, financials, risk) takes days of research and a blank-page tax most people never pay. Generic chatbots give you one wall of text with no structure, no grounding in real data, no record of how they reached their conclusions, and **no point at which a human can step in and steer.**

PitchCraft is the opposite of a chatbot. It's a **team of agents that does the work** — seven named specialists (defined with Google's Agent Development Kit) that hand off to each other, call tools, pause for your approval at the decision point, and produce a structured, verifiable plan.

> **One idea in → a full, structured, auditable business plan out — in about a minute.**

---

## Why this fits the hackathon

The challenge asks for an agent that **moves beyond chat**, **handles a multi-step mission while keeping you in control**, and **integrates a partner's technology** to give it superpowers. PitchCraft was designed around exactly those three pillars:

| Hackathon goal | How PitchCraft delivers |
| --- | --- |
| **Move beyond chat** | A **multi-agent system** that *acts* — seven specialists query a database, ground their reasoning in stored market data, run tools, and write structured artifacts (not prose). |
| **Google Cloud Agent Builder (ADK)** | The 7 specialists are real **`google.adk.agents.LlmAgent`** objects composed into a **`SequentialAgent`** pipeline (`PitchCraftOrchestra`). The full topology is introspectable at **`/api/agent/manifest`**. |
| **Multi-step mission, human in control** | The agents hand off through 7 reasoning stages and **pause after market research for a human approval gate** — approve, reject, or *redirect the strategy* before they commit to the full plan. |
| **Partner power** | The agents consume **MongoDB through a real Model Context Protocol server** — their memory, grounding layer, and tamper-evident ledger. **Arize Phoenix** gives full observability — every Gemini call and every step is traced. |
| **Built with Gemini 3** | Uses the current `google-genai` SDK with a **Gemini 3 → 2.5 cascade** (`gemini-3-flash-preview` default → `gemini-3.5-flash` → `gemini-2.5-flash` → `gemini-2.5-flash-lite`, every ID verified live) and forced-JSON output for reliable structured generation. |

### Judging-criteria fit

- **Technological Implementation** — real Gemini 3 (verified live), forced-JSON structured output, multi-key rotation + model cascade, MongoDB persistence & grounding, OpenInference/Arize tracing, and a SHA-256 audit chain with live verification.
- **Design** — a focused, animated Next.js UI: pick a model, watch the agent work step-by-step, approve at the gate, and read a clean plan with a verifiable audit trail.
- **Potential Impact** — collapses days of founder/student research into ~60s, with guardrails (viability gate + human approval) that keep humans in the loop.
- **Quality of the Idea** — "an agent that drafts *and proves* its own reasoning" — the tamper-evident audit chain is a genuinely novel trust layer for generative output.

---

## Meet the agents (multi-agent architecture)

Seven named specialists, defined with Google ADK and composed into a single
`SequentialAgent` pipeline. They hand off in sequence, sharing a context object —
the canonical ADK "agents that collaborate" pattern.

```
User idea
    │
    ▼
PitchCraftOrchestra  (ADK SequentialAgent: "pitchcraft_orchestra")
    │
    ├─ ①  Strategy Analyst             (LlmAgent)            validate viability
    ├─ ②  Market Intelligence Analyst  (LlmAgent + MongoDB MCP)  ← MongoDB
    │        ⏸  HUMAN APPROVAL GATE — approve / reject / redirect
    ├─ ③  Customer Insights Specialist (LlmAgent)            3 personas
    ├─ ④  Business Architect           (LlmAgent)            full plan
    ├─ ⑤  Financial Modeller           (LlmAgent + MongoDB MCP)  ← MongoDB
    ├─ ⑥  Risk & Compliance Officer    (LlmAgent)            risk + SWOT
    └─ ⑦  Chief of Staff               (compile/persist)     ← MongoDB + SHA-256 audit
    │
    ▼
Plan saved + shareable + audit chain sealed
```

| # | Agent (`adk_name`) | Role | Tools |
| - | --- | --- | --- |
| 1 | **Strategy Analyst** (`strategy_analyst`) | Validates idea viability | Gemini reasoning |
| 2 | **Market Intelligence Analyst** (`market_intelligence_analyst`) | Researches the market | **MongoDB MCP** `get_industry_market_data`, `search_similar_plans` |
| 3 | **Customer Insights Specialist** (`customer_insights_specialist`) | Builds personas | Gemini reasoning |
| 4 | **Business Architect** (`business_architect`) | Writes the plan | Gemini reasoning |
| 5 | **Financial Modeller** (`financial_modeller`) | 3-yr financials | **MongoDB MCP** `get_market_benchmarks` |
| 6 | **Risk & Compliance Officer** (`risk_compliance_officer`) | Risk + SWOT | Gemini reasoning |
| 7 | **Chief of Staff** (`chief_of_staff`) | Compile, persist, seal | `mongodb_persist`, `sha256_audit_chain` |

> **Honest execution note:** ADK defines the agents and the pipeline topology;
> the Gemini calls run through PitchCraft's resilient executor (multi-key
> rotation + 4-tier cascade + forced-JSON + Arize tracing) so a live demo never
> dies on one model's quota. Each agent's ADK `instruction` is the system prompt
> that drives its call. See the live wiring at **`GET /api/agent/manifest`**.

---

## What the agents do — the 7 steps

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

### 🦈 Shark Tank Simulator (investor pitch negotiation)
Every generated plan gets a **Shark Tank** tab powered by real business logic. Set your investment ask and equity %, instantly see your **implied company valuation**, then click "Step Into the Tank" to get reactions from **5 AI Sharks** with distinct personalities:

| Shark | Style | Focus |
|---|---|---|
| Mark C. | Tough skeptic | Traction data + unit economics |
| Sarah K. | Strategic | Defensible moats + brand |
| Raj P. | Tech-focused | AI scalability + recurring revenue |
| Lisa T. | Empathetic | Story + founding team |
| Carlos M. | Operational | Margins + supply chain |

Each shark delivers an **IN / COUNTER / OUT** verdict with a typed dialogue line, and counter-offers include the exact revised equity %. A summary header shows how many sharks are in and whether a deal is likely. The simulation is driven by your actual viability score, valuation multiple, and market data — not random numbers.

### 🔒 Tamper-evident audit chain (the trust layer)
Every step's output is hashed into a **SHA-256 chain** anchored to a genesis hash derived from the plan ID — each hash folds in the previous one (blockchain-style). If *any* stored field is later modified, re-verification **breaks at the exact step** and the UI flips from "✓ Chain verified" to "⚠ Chain broken." Endpoints `/api/plan/{id}/audit` and `/api/plan/{id}/verify` re-prove integrity on demand.
*Verified: clean chains pass, single-field tampering is detected at the precise step.*

### ⏸ Human-in-the-loop approval gate
The agent doesn't run away with your idea. After market research it **pauses mid-stream**, keeps the connection warm with heartbeats, and waits for a decision — **approve**, **reject & stop**, or **redirect** ("focus on B2B enterprise"). The redirect is injected into the remaining steps. This is the "keeping you in control" requirement, implemented for real.

### 🧠 Gemini 3 model cascade with multi-key rotation
Pick a tier in the UI; on quota/`429` the agent **rotates across your API keys**, on `503` it waits and retries, and on hard failure it **cascades down the model tiers** (`gemini-3-flash-preview → gemini-3.5-flash → gemini-2.5-flash → gemini-2.5-flash-lite`) so a plan almost always completes. The UI shows a badge when a fallback was used.

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

**Backend** (`backend/`): `index.py` (FastAPI app & routes) · `agent.py` (the 7 ADK specialists + `PitchCraftOrchestra`) · `mcp_server.py` (the MongoDB MCP server) · `mongodb.py` (persistence, seed data, tools, audit storage) · `audit.py` (SHA-256 chain) · `observability.py` (Arize Phoenix) · `models.py` (Pydantic schemas) · `Dockerfile` + `cloudbuild.yaml` (Cloud Run).

**Frontend** (`frontend/`): App-Router Next.js — `app/generate` (the agent runner + gates), `app/plan/[id]` (the plan + audit trail + **Shark Tank simulator**), `components/StepCard.tsx`, particle hero.

**Tech:** Gemini 3 (`google-genai`) · **Google ADK** (`google-adk`: `LlmAgent` + `SequentialAgent`) · MongoDB Atlas (`pymongo`, TLS via `certifi`) · Model Context Protocol (`mcp`) · Arize Phoenix (`arize-phoenix-otel` + `openinference-instrumentation-google-genai`) · FastAPI + SSE · Next.js 14 + Tailwind + Three.js.

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
| `GET` | `/api/agent/manifest` | **Full multi-agent architecture** — the 7 ADK specialists, their tools, the pipeline, MongoDB & observability wiring. Built from the live agent objects. |
| `GET` | `/api/agent/info` | Agent summary (ADK framework, model cascade, integrations). |
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

## Deploy to Google Cloud Run

The backend ships **Cloud Run-ready** — [`backend/Dockerfile`](backend/Dockerfile) (binds `index:app` to `$PORT`) and [`backend/cloudbuild.yaml`](backend/cloudbuild.yaml) (build → push → deploy). Long-running SSE + the approval gate fit naturally on Cloud Run's request model (no 60s serverless cap).

```bash
# One-shot build + deploy to Cloud Run (us-central1):
gcloud builds submit --config backend/cloudbuild.yaml backend

# Set runtime env on the service (or wire Secret Manager):
gcloud run services update pitchcraft-backend --region=us-central1 \
  --set-env-vars MONGODB_URI=...,GEMINI_API_KEY_1=...,PHOENIX_API_KEY=...
```

Then point the frontend at it: set **`NEXT_PUBLIC_API_BASE=https://pitchcraft-backend-xxxx.run.app`** in the Vercel (frontend) project and redeploy. The frontend talks to Cloud Run directly; CORS already allows `*.vercel.app`.

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
| `NEXT_PUBLIC_API_BASE` | – | **Frontend** build-time var. Absolute backend URL for split deploys (e.g. Vercel + Cloud Run). Blank = same-origin / dev proxy. |
| `USE_OFFICIAL_MONGODB_MCP` | – | `true` also tries the official `@modelcontextprotocol/server-mongodb` over stdio (needs `npx`); falls back automatically. |

---

## QA & verification status

This build went through a full QA pass. Fixed and **verified live** in this repo:

- ✅ **Multi-agent ADK architecture.** Seven real `LlmAgent` specialists composed into a `SequentialAgent` pipeline; `/api/agent/manifest` returns all 7 with their tools. A full generation completes **7/7 steps** with each step tagged by its specialist, and the **SHA-256 audit chain still verifies `True`** against the stored plan.
- ✅ **MongoDB MCP grounding is explicit.** The Market Intelligence Analyst calls the MongoDB MCP tools before reasoning and records a `mongodb_sources` block on its output (`data_grounded: true`) — verified persisted on the stored plan.
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

- **MongoDB's hosted MCP server**: an opt-in path to the official `@modelcontextprotocol/server-mongodb` over stdio already exists (`USE_OFFICIAL_MONGODB_MCP=true`, needs `npx`); next is mapping the domain tools onto its raw `find`/`aggregate`.
- **Atlas Vector Search**: embed past plans for true semantic "similar plans" grounding (today similarity uses indexed text/regex queries).
- ✅ **Live Cloud Run deployment**: deployed on `resqnet-494415` project — backend (`pitch-craft-api`) and frontend (`pitch-craft-web`).
- **Phoenix evals**: add automated LLM-as-judge scoring of plan quality on top of the traces.
- ✅ **Shark Tank Simulator**: 5 AI sharks, equity/valuation calculator, IN/COUNTER/OUT verdicts with counter-offers, all grounded in the plan's actual viability score and financial projections.
- **Export**: one-click PDF / pitch-deck export (print-to-PDF exists today).
- **Real `/api/shark-tank` endpoint**: currently the shark simulation falls back gracefully client-side; next step is a Gemini-powered backend endpoint for fully dynamic shark dialogue.

---

## License

MIT — see [LICENSE](LICENSE).

<div align="center">
<sub>Built with Google ADK · Gemini 3 · MongoDB · Arize Phoenix — for the Google Cloud Rapid Agent Hackathon.</sub>
</div>
