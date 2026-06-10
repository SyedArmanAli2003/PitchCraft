# PitchCraft — Multi-Agent Business Plan Engine

> Paste-ready Devpost copy. Replace the `[...]` links before submitting.
> Every technical claim below matches what the code actually does.

---

## The Problem

Hundreds of millions of people have a startup idea; the vast majority never
move on it. Professional business-plan consultants cost thousands of dollars,
and first-time founders — especially in emerging markets — have the ideas but
not the resources to validate them. The gap between "I have an idea" and "I have
a plan I can act on" is where most ventures die.

## What It Does

PitchCraft is a **7-agent AI system** — not a single chatbot prompt. Seven named
specialist agents collaborate, handing off to each other like a real consulting
firm, to turn one sentence into an investor-ready business plan in about a
minute:

1. **Strategy Analyst** — validates the idea (viability score, market fit, concerns)
2. **Market Intelligence Analyst** — researches the market by querying **MongoDB via the Model Context Protocol (MCP)**
3. **Customer Insights Specialist** — builds three concrete customer personas
4. **Business Architect** — writes the full plan (problem, solution, UVP, revenue model, GTM)
5. **Financial Modeller** — projects 3-year financials, grounded in **MongoDB benchmark aggregations**
6. **Risk & Compliance Officer** — risk register + SWOT
7. **Chief of Staff** — compiles, persists to MongoDB, and seals a **SHA-256 tamper-evident audit chain**

The agents are defined with **Google's Agent Development Kit (ADK)** —
`LlmAgent` specialists composed into a `SequentialAgent` pipeline. You can see
the whole architecture live at `/api/agent/manifest`.

## How MongoDB Powers It

MongoDB Atlas is not just storage — it is the agents' shared memory and grounding
source, reached over a **real MCP server**:

- **PitchCraft MongoDB MCP server** (built on the official `mcp` SDK) exposes
  three tools — `get_industry_market_data`, `search_similar_plans`,
  `get_market_benchmarks`. The agent invokes them over the genuine MCP protocol
  (in-process client↔server session) — and the same server runs over **stdio**
  for Claude Desktop / Cursor / MCP Inspector.
- **Market grounding**: the Market Intelligence Analyst queries `market_data`
  and prior `business_plans` before it reasons, and records exactly what it used
  in a `mongodb_sources` field on its output.
- **Benchmark aggregation**: the Financial Modeller pulls averaged viability and
  break-even figures aggregated from completed plans so projections stay
  realistic.
- **Tamper-evident audit chain**: every agent's output is SHA-256-hashed and
  chained, anchored to the plan id, and stored in the `audit_chains` collection.
  Mutate any stored field and verification reports exactly which step broke.

Collections: `business_plans`, `market_data`, `audit_chains`, `approval_requests`.

## Human Oversight (Human-in-the-Loop)

After market research (Step 2), the pipeline **pauses** and asks the human to
approve the direction before the remaining agents run. The reviewer can approve,
reject, or **redirect the strategy** mid-generation (e.g. "focus on B2B
enterprise"). Nothing past Step 2 executes without a human decision.

## Observability

Every Gemini call and every agent step is instrumented for **Arize Phoenix**
using OpenInference auto-instrumentation (`arize-phoenix-otel` +
`openinference-instrumentation-google-genai`). Each agent step opens an
OpenInference CHAIN span, so the Phoenix project shows the full agent trace tree.
Tracing is fully guarded — the app runs with or without a Phoenix key.

## Reliability

A live demo can't die on a quota error. PitchCraft runs a **4-tier Gemini
cascade** (Gemini 3 Flash → Gemini 3.5 Flash → Gemini 2.5 Flash → 2.5 Flash-Lite,
every model ID verified live) with **multi-key rotation** on rate limits, 503
retry with backoff, **forced-JSON** output, a per-IP rate limiter, and input
validation. The UI shows when a step cascaded to a lower tier. If the backend is
unreachable entirely, the frontend replays a clearly-labelled demo run so the
product never dead-ends.

## Tech Stack

- **AI**: Google Gemini 3 Flash (default) with a 3.5/2.5 fallback cascade, via the `google-genai` SDK
- **Agent framework**: Google ADK (`LlmAgent` + `SequentialAgent`) orchestrated by `PitchCraftOrchestra`
- **Database**: MongoDB Atlas via a real MCP server (queries + aggregation + audit chain)
- **Observability**: Arize Phoenix (OpenInference)
- **Backend**: FastAPI + Python, SSE streaming
- **Frontend**: Next.js 14 (App Router) + Three.js
- **Deployment**: Google Cloud Run (frontend + backend Cloud Build pipelines included) — also deployable as Vercel frontend + Railway backend

## What's Real vs. Roadmap

We keep our claims honest for the judges:

- **Real today**: ADK multi-agent pipeline, MongoDB MCP grounding, human-in-the-loop
  gate, SHA-256 audit chain, Arize instrumentation, Gemini-3 cascade, Cloud Run config.
- **Roadmap**: MongoDB Atlas **Vector Search** for semantic plan similarity
  (today similarity uses indexed text/regex queries), Change Streams for a live
  cross-platform feed, and a live Cloud Run deployment.

## Impact

PitchCraft puts a seven-person strategy team in the pocket of any founder who
can describe their idea in a sentence — democratizing startup validation for the
people who need it most and can afford it least.

---

**Links**

- Live demo: `[your Vercel URL]`
- Architecture manifest: `[your URL]/api/agent/manifest`
- MCP tools: `[your URL]/api/mcp/tools`
- Arize / Phoenix dashboard: `[your Phoenix space URL]`
- Repo: https://github.com/SyedArmanAli2003/PitchCraft

**Hackathon**: Google Cloud Rapid Agent Hackathon 2026 — MongoDB & Arize partner tracks
**License**: MIT
