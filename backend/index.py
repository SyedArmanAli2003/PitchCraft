"""PitchCraft FastAPI application â€” Vercel-ready entry point.

Local dev:  cd api && uvicorn index:app --reload --port 8000
Vercel:     Automatically invoked via api/index.py serverless function.
"""

import os
import sys
import json
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from models import IdeaRequest, ApprovalDecision
from pydantic import BaseModel
from agent import (
    run_pitchcraft_agent, get_models_list, _load_api_keys, get_agent_manifest,
    free_gateway_ready,
)
from mongodb import (
    init_db, save_plan, get_plan, get_plan_by_token, get_plan_count, get_plans_today,
    get_recent_plans, get_audit_chain, get_approval_request, resolve_approval, _get_db,
    get_all_plans_admin, get_user_stats,
)
from audit import verify_audit_chain, reconstruct_steps_from_plan
from observability import init_observability, observability_status


# â”€â”€ Simple in-memory per-IP rate limiter for /api/generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Process-local (no Redis): on Vercel it's per-instance, which is enough to stop
# a single client hammering the Gemini quota during a demo.
_RATE_HITS: dict[str, list[float]] = defaultdict(list)
_RATE_MAX = int(os.getenv("RATE_LIMIT_MAX", "3"))
_RATE_WINDOW = float(os.getenv("RATE_LIMIT_WINDOW", "60"))


def _rate_limited(ip: str) -> bool:
    now = time.time()
    hits = [t for t in _RATE_HITS[ip] if now - t < _RATE_WINDOW]
    if len(hits) >= _RATE_MAX:
        _RATE_HITS[ip] = hits
        return True
    hits.append(now)
    _RATE_HITS[ip] = hits
    return False


def _gemini_ready() -> bool:
    try:
        return len(_load_api_keys()) > 0
    except Exception:
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_observability()   # Arize Phoenix tracing (no-op if unconfigured)
    init_db()
    yield


app = FastAPI(title="PitchCraft API", lifespan=lifespan)

# Starlette's allow_origins only does exact matches, so Vercel preview domains
# (https://<branch>-<proj>.vercel.app) and Cloud Run frontends (*.run.app) need
# a regex. Keep explicit localhost + any configured FRONTEND_URL for
# credentialed requests.
_explicit_origins = [
    o for o in (
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", ""),
    ) if o
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_explicit_origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|run\.app|up\.railway\.app|insforge\.site|fly\.dev)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Plan-ID", "X-Model"],
)


@app.get("/api/health")
async def health():
    from agent import free_gateway_ready, _nvidia_nim_client
    return {
        "status": "ok",
        "service": "PitchCraft Agent",
        "gemini": _gemini_ready(),
        "mongodb": _get_db() is not None,
        "free_gateway": free_gateway_ready(),
        "nvidia_nim": _nvidia_nim_client() is not None,
    }


# Legacy /health kept for backward compat
@app.get("/health")
async def health_legacy():
    return await health()


@app.get("/api/stats")
async def get_stats():
    return {"total_plans": get_plan_count(), "plans_today": get_plans_today()}


@app.get("/api/models")
async def list_models():
    available = _gemini_ready()
    return {"models": [{**m, "available": available} for m in get_models_list()]}


@app.get("/api/agent/info")
async def agent_info():
    """Description of the agent for hackathon reviewers.

    The 7 specialists and the pipeline topology are defined with Google ADK
    (LlmAgent + SequentialAgent). The Gemini calls themselves run through a
    resilient multi-key, 4-tier cascade with forced-JSON output so a live demo
    never dies on one model's quota â€” we state this hybrid honestly."""
    from agent import MODEL_CONFIGS, CASCADE_ORDER, _ADK_AVAILABLE
    return {
        "agent": "PitchCraft",
        "framework": "Google ADK (LlmAgent + SequentialAgent)" if _ADK_AVAILABLE
                     else "PitchCraft orchestrator (ADK not installed in this runtime)",
        "adk_available": _ADK_AVAILABLE,
        "architecture": "7 named specialist agents handing off in a sequential pipeline",
        "execution": "ADK defines the agents & topology; Gemini calls run through a "
                     "resilient multi-key 4-tier cascade with forced-JSON + Arize tracing",
        "model_provider": "Google Gemini 3 via the google-genai SDK",
        "model_cascade": [MODEL_CONFIGS[k]["model_id"] for k in CASCADE_ORDER],
        "human_in_the_loop": "approval gate after Step 2 (market research)",
        "mcp_integration": "PitchCraft MongoDB MCP server (Model Context Protocol)",
        "observability": "Arize Phoenix (OpenInference auto-instrumentation)",
        "trust": "SHA-256 tamper-evident audit chain per plan",
        "manifest": "/api/agent/manifest",
        "hackathon": "Google Cloud Rapid Agent Hackathon 2026 — MongoDB & Arize tracks",
    }


@app.get("/api/agent/manifest")
async def agent_manifest():
    """Full multi-agent architecture manifest â€” the 7 named specialists, their
    ADK agent names, declared tools, the InsForge integration and observability.
    Built from the same agent objects that actually run, so it can't drift."""
    return get_agent_manifest()


@app.get("/api/observability")
async def observability():
    """Arize Phoenix tracing status â€” shows whether agent traces are streaming."""
    return observability_status()


@app.post("/api/generate")
async def generate_plan(request: IdeaRequest, http_request: Request):
    client_ip = http_request.client.host if http_request.client else "unknown"
    if _rate_limited(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests", "retry_after": int(_RATE_WINDOW)},
            headers={"Retry-After": str(int(_RATE_WINDOW))},
        )

    plan_id = save_plan(request.idea, user_id=request.user_id)
    model_key = request.model

    async def event_stream():
        try:
            async for step in run_pitchcraft_agent(request.idea, plan_id, model_key):
                yield f"data: {json.dumps(step)}\n\n"
                yield ": heartbeat\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "X-Plan-ID": plan_id,
            "X-Model": model_key,
            "Cache-Control": "no-cache, no-store",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Expose-Headers": "X-Plan-ID, X-Model",
        },
    )


@app.get("/api/plan/{plan_id}")
async def get_plan_route(plan_id: str):
    plan = get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan["_id"] = str(plan["_id"])
    return plan


@app.get("/api/plan/{plan_id}/audit")
async def get_plan_audit(plan_id: str):
    """Return the tamper-evident audit chain for a plan, plus a live
    verification of that chain against the currently stored plan data."""
    record = get_audit_chain(plan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Audit chain not found for this plan")
    chain = record.get("chain", [])
    plan = get_plan(plan_id)
    verified = False
    if plan:
        plan["_id"] = str(plan["_id"])
        result = verify_audit_chain(chain, reconstruct_steps_from_plan(plan), plan_id)
        verified = result.get("valid", False)
    return {
        "plan_id": plan_id,
        "chain": chain,
        "verified": verified,
        "generated_at": record.get("generated_at"),
    }


@app.post("/api/plan/{plan_id}/verify")
async def verify_plan_audit(plan_id: str):
    """Re-run the chain verification against the stored plan and report
    whether the business plan is intact or where it was tampered."""
    record = get_audit_chain(plan_id)
    if not record:
        raise HTTPException(status_code=404, detail="Audit chain not found for this plan")
    plan = get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan["_id"] = str(plan["_id"])
    return verify_audit_chain(record.get("chain", []), reconstruct_steps_from_plan(plan), plan_id)


@app.get("/api/approvals")
async def list_approvals(status: str | None = None):
    """List approval requests. Optional query param `status` filters by status."""
    from mongodb import list_approval_requests

    approvals = list_approval_requests(status)
    return approvals


@app.get("/api/approval/{approval_id}")
async def get_approval(approval_id: str):
    """Current status of a human-in-the-loop approval request."""
    request = get_approval_request(approval_id)
    if not request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return request


@app.post("/api/approval/{approval_id}/decide")
async def decide_approval(approval_id: str, decision: ApprovalDecision):
    """Record a reviewer's decision. The waiting agent picks this up via its
    polling loop and either continues (Steps 3-7) or abandons the plan."""
    request = get_approval_request(approval_id)
    if not request:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if request.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Already {request.get('status')}")
    ok = resolve_approval(approval_id, decision.approved, decision.direction_override)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to record decision")
    return {"success": True}


@app.get("/api/share/{token}")
async def get_shared_plan(token: str):
    plan = get_plan_by_token(token)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan["_id"] = str(plan["_id"])
    return plan


@app.get("/api/plans")
async def get_plans(user_id: str | None = None):
    """Return plans for a specific user (device-scoped UUID) or all plans if no user_id.
    Pass ?user_id=<uuid> to get only that user's plans.
    """
    plans = get_recent_plans(limit=50, user_id=user_id)
    return plans


# ---------------------------------------------------------------------------
# Admin endpoints â€” email + password login (no OAuth for admin)
# ---------------------------------------------------------------------------
# Admin authenticates with email + password (POST /api/admin/login), which
# returns a session token used as the X-Admin-Secret header on later calls.
# Credentials come from env (ADMIN_EMAIL / ADMIN_PASSWORD); sensible defaults
# let the dashboard work out of the box. CHANGE THESE in production.

_DEFAULT_ADMIN_EMAIL = "admin@pitchcraft.app"
_DEFAULT_ADMIN_PASSWORD = "PitchCraft@2026"


def _admin_creds() -> tuple[str, str]:
    """The configured admin (email, password), falling back to defaults."""
    email = (os.getenv("ADMIN_EMAIL") or _DEFAULT_ADMIN_EMAIL).strip().lower()
    password = (os.getenv("ADMIN_PASSWORD") or _DEFAULT_ADMIN_PASSWORD).strip()
    return email, password


def _admin_token() -> str:
    """The token that grants admin access. Uses ADMIN_SECRET if set; otherwise
    a stable token derived from the admin credentials so login still works."""
    explicit = os.getenv("ADMIN_SECRET", "").strip()
    if explicit:
        return explicit
    import hashlib
    email, password = _admin_creds()
    return "adm_" + hashlib.sha256(f"{email}:{password}".encode("utf-8")).hexdigest()[:40]


def _check_admin(request: Request) -> None:
    """Raise 401 if the request doesn't carry a valid admin session token."""
    token = (
        request.headers.get("X-Admin-Secret")
        or request.query_params.get("secret")
        or ""
    )
    if not token or token != _admin_token():
        raise HTTPException(status_code=401, detail="Unauthorized â€” admin login required")


@app.post("/api/admin/login")
async def admin_login(request: Request):
    """Validate admin email + password; return a session token on success.
    Uses a constant-time comparison to avoid leaking timing information."""
    import secrets as _secrets
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request body")
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    exp_email, exp_password = _admin_creds()
    ok = _secrets.compare_digest(email, exp_email) and _secrets.compare_digest(password, exp_password)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"token": _admin_token(), "email": exp_email}


@app.get("/api/admin/stats")
async def admin_stats(request: Request):
    """Admin: overall system statistics."""
    _check_admin(request)
    total = get_plan_count()
    today = get_plans_today()
    users = get_user_stats()
    return {
        "total_plans": total,
        "plans_today": today,
        "unique_users": len(users),
        "users": users,
        "gemini_ready": _gemini_ready(),
        "insforge_connected": _get_db() is not None,
    }


@app.get("/api/admin/plans")
async def admin_plans(request: Request, status: str | None = None, limit: int = 100):
    """Admin: all plans across all users, with user_id visible."""
    _check_admin(request)
    return get_all_plans_admin(limit=limit, status=status)


@app.get("/api/admin/users")
async def admin_users(request: Request):
    """Admin: per-user activity summary."""
    _check_admin(request)
    return get_user_stats()


@app.get("/api/mcp/tools")
async def get_mcp_tools():
    """The real tool manifest served by the PitchCraft InsForge MCP server."""
    from mcp_server import list_tools_manifest
    return {
        "mcp_server": "PitchCraft MongoDB MCP",
        "protocol": "Model Context Protocol",
        "transports": ["stdio", "in-memory (agent)"],
        "tools": await list_tools_manifest(),
    }


@app.get("/api/mcp/demo")
async def mcp_demo():
    """Invoke the MCP tools over the real protocol (in-memory clientâ†”server
    session) â€” exactly the path the agent uses to ground its reasoning."""
    from agent import call_mcp_tool
    return {
        "demo": "MongoDB Atlas powering the agent via the MCP protocol",
        "get_industry_market_data": await call_mcp_tool("get_industry_market_data", {"industry": "technology"}),
        "search_similar_plans": await call_mcp_tool("search_similar_plans", {"industry": "technology"}),
        "get_market_benchmarks": await call_mcp_tool("get_market_benchmarks", {"industry": "technology"}),
    }


@app.post("/api/mcp/call")
async def mcp_call(req: dict):
    """Invoke a named MCP tool over the protocol. Body: {"tool": str, "arguments": {...}}."""
    from agent import call_mcp_tool
    tool = (req or {}).get("tool")
    if not tool:
        raise HTTPException(status_code=400, detail="Provide a 'tool' name")
    return {"tool": tool, "result": await call_mcp_tool(tool, (req or {}).get("arguments") or {})}


# ---------------------------------------------------------------------------
# Shark Tank Simulator endpoint
# ---------------------------------------------------------------------------

class SharkTankRequest(BaseModel):
    plan_context: dict
    sharks: list[dict]
    qa_context: dict | None = None  # {"shark_name": ["answer1", "answer2", ...], ...}


class SharkQuestionsRequest(BaseModel):
    plan_context: dict
    sharks: list[dict]


@app.post("/api/shark-tank")
async def shark_tank_sim(req: SharkTankRequest):
    """Run AI-powered shark tank simulation using the free model cascade."""
    try:
        keys = _load_api_keys()
    except Exception:
        keys = []

    ctx = req.plan_context
    ask_str = ctx.get('funding_needed', '$250,000 for 10% equity')
    valuation = ctx.get('implied_valuation', 'N/A')
    score = ctx.get('viability_score', 7)

    # Build Q&A context section if provided
    qa_section = ""
    if req.qa_context:
        qa_lines = ["PRE-PITCH Q&A (founder answered each shark's questions):"]
        for shark_name, answers in req.qa_context.items():
            if answers:
                qa_lines.append(f"\n{shark_name} asked:")
                for i, ans in enumerate(answers, 1):
                    qa_lines.append(f"  Q{i}: {ans}")
        qa_section = "\n".join(qa_lines) + "\n"

    prompt = f"""You are directing a Shark Tank / Dragons Den pitch session. Give realistic, specific reactions with genuine investor logic.

STARTUP PITCH:
Idea: {ctx.get('idea', 'N/A')}
Problem: {ctx.get('problem', 'N/A')}
Solution: {ctx.get('solution', 'N/A')}
USP: {ctx.get('usp', 'N/A')}
Viability Score: {score}/10
Market Size: {ctx.get('market_size', 'N/A')} growing at {ctx.get('growth_rate', 'N/A')}
Revenue Model: {ctx.get('revenue_model', 'N/A')}
Year 1 Revenue Target: {ctx.get('year1_revenue', 'N/A')}
The Ask: {ask_str}
Implied Valuation: {valuation}

{qa_section}SHARKS (5 investors, each with distinct personality):
{chr(10).join(f"{i+1}. {s['name']} ({s['style']}): {s['trait']}" for i, s in enumerate(req.sharks))}

Rules for generating realistic reactions:
- Score < 5 = most sharks OUT (too early/risky)
- Score 5-6 = mixed reactions, sharks want proof
- Score 7-8 = positive interest, reasonable counter-offers likely
- Score 9-10 = strong interest, bidding war possible
- Valuation > $10M at pre-revenue = most sharks skeptical
- Revenue model unclear = operational/strategic sharks OUT
- Strong tech angle = tech-focused shark excited
- Each shark MUST stay in character per their trait description
- Comments must be 1-3 sentences max, specific to THIS pitch (mention numbers/details from the pitch)
- Counter offers must include specific percentage and dollar amounts

Return ONLY valid JSON:
{{
  "reactions": [
    {{
      "shark": "exact shark name",
      "verdict": "IN",
      "comment": "specific in-character reaction mentioning details from this pitch",
      "counter_offer": null
    }},
    {{
      "shark": "exact shark name",
      "verdict": "COUNTER",
      "comment": "specific reaction",
      "counter_offer": "I'll invest $X for Y% â€” that values you at $Z. My final offer."
    }},
    {{
      "shark": "exact shark name",
      "verdict": "OUT",
      "comment": "specific reason for passing, mentioning details",
      "counter_offer": null
    }}
  ]
}}"""

    from agent import _generate
    try:
        result, _ = await _generate(prompt, "nvidia-nemotron", keys)
        reactions = result.get("reactions", [])
        if not reactions or len(reactions) < 3:
            raise ValueError("Incomplete reactions")
        return {"reactions": reactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/shark-tank/questions")
async def shark_tank_questions(req: SharkQuestionsRequest):
    """Generate clarifying questions from each shark based on the business plan.
    This is the pre-pitch Q&A phase where sharks dig into specifics before committing."""
    try:
        keys = _load_api_keys()
    except Exception:
        keys = []

    ctx = req.plan_context
    ask_str = ctx.get('funding_needed', '$250,000 for 10% equity')
    valuation = ctx.get('implied_valuation', 'N/A')
    score = ctx.get('viability_score', 7)

    prompt = f"""You are 5 Shark Tank investors preparing for a pitch. Each shark writes 2-3 sharp, specific questions they NEED answered before they'd consider investing. Questions must be in character and reference actual numbers/details from the plan.

STARTUP PITCH:
Idea: {ctx.get('idea', 'N/A')}
Problem: {ctx.get('problem', 'N/A')}
Solution: {ctx.get('solution', 'N/A')}
USP: {ctx.get('usp', 'N/A')}
Viability Score: {score}/10
Market Size: {ctx.get('market_size', 'N/A')} growing at {ctx.get('growth_rate', 'N/A')}
Revenue Model: {ctx.get('revenue_model', 'N/A')}
Year 1 Revenue Target: {ctx.get('year1_revenue', 'N/A')}
The Ask: {ask_str}
Implied Valuation: {valuation}

SHARKS (5 investors, each with distinct personality):
{chr(10).join(f"{i+1}. {s['name']} ({s['style']}): {s['trait']}" for i, s in enumerate(req.sharks))}

Each shark writes 2-3 questions tailored to their focus:
- Mark C. (tough): Traction, unit economics, CAC/LTV, churn, real revenue proof
- Sarah K. (strategic): Moat, defensibility, brand, network effects, 10-year vision
- Raj P. (tech): AI differentiation, scalability, technical moat, IP, architecture
- Lisa T. (empathetic): Founder story, mission, team, culture, social impact, customer love
- Carlos M. (operational): Margins, supply chain, ops efficiency, burn, path to profitability

Return ONLY valid JSON:
{{
  "questions": [
    {{"shark": "exact shark name", "questions": ["question 1", "question 2", "question 3"]}},
    ...
  ]
}}"""

    from agent import _generate
    try:
        result, _ = await _generate(prompt, "nvidia-nemotron", keys)
        questions = result.get("questions", [])
        if not questions or len(questions) < 3:
            raise ValueError("Incomplete questions")
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# AI Pitch Coach endpoint
# ---------------------------------------------------------------------------
# Distinct from Shark Tank (which simulates investor *reactions*). The Pitch
# Coach acts as a founder's advisor: it rewrites a tight elevator pitch, scores
# pitch clarity, and gives concrete, prioritised next actions plus the tough
# questions investors will likely ask â€” so the founder can prepare.

class PitchCoachRequest(BaseModel):
    plan_context: dict
    model: str | None = None


@app.post("/api/pitch-coach")
async def pitch_coach(req: PitchCoachRequest):
    """AI Pitch Coach â€” actionable founder feedback from the free model cascade."""
    try:
        keys = _load_api_keys()
    except Exception:
        keys = []

    ctx = req.plan_context
    prompt = f"""You are an experienced startup pitch coach and former VC. Coach this founder
honestly and concretely. Be specific to THIS business â€” reference its real numbers and details.

BUSINESS PLAN:
Idea: {ctx.get('idea', 'N/A')}
One-line summary: {ctx.get('summary', 'N/A')}
Problem: {ctx.get('problem', 'N/A')}
Solution: {ctx.get('solution', 'N/A')}
Unique value: {ctx.get('usp', 'N/A')}
Market size: {ctx.get('market_size', 'N/A')} growing at {ctx.get('growth_rate', 'N/A')}
Revenue model: {ctx.get('revenue_model', 'N/A')}
Year 1 revenue target: {ctx.get('year1_revenue', 'N/A')}
Funding ask: {ctx.get('funding_needed', 'N/A')}
Viability score: {ctx.get('viability_score', 'N/A')}/10

Coach the founder. Return ONLY valid JSON in EXACTLY this shape:
{{
  "elevator_pitch": "A tight, compelling 2-3 sentence elevator pitch rewrite they can say in 30 seconds.",
  "clarity_score": 7,
  "clarity_reason": "One sentence on why the pitch scores this on clarity/persuasiveness (1-10).",
  "strengths": ["2-4 specific strengths investors will respond to"],
  "weaknesses": ["2-4 specific gaps or red flags to fix before pitching"],
  "next_actions": [
    {{"action": "Concrete next step", "why": "Why it matters", "priority": "High"}}
  ],
  "investor_questions": ["3-5 tough questions investors are likely to ask, specific to this business"]
}}

Rules: be concrete and reference this business's actual details/numbers. priority must be one of High/Medium/Low.
Keep each list item to one or two sentences."""

    from agent import _generate
    # Default to NVIDIA Nemotron â€” a reliable, fast, free JSON producer. Gemini
    # free-tier quota is easily exhausted, and the smaller gateway fallbacks
    # mangle this structured prompt; Nemotron handles it consistently.
    model_key = req.model or "nvidia-nemotron"
    try:
        result, used = await _generate(prompt, model_key, keys)
        if not isinstance(result, dict) or not result.get("elevator_pitch"):
            raise ValueError("Coach did not return a usable pitch")
        # Normalise so the UI always has the expected shape, even if a fallback
        # model omitted a field. We never fabricate content â€” missing lists are
        # simply empty rather than invented.
        normalised = {
            "elevator_pitch": str(result.get("elevator_pitch", "")),
            "clarity_score": result.get("clarity_score", 0),
            "clarity_reason": result.get("clarity_reason", ""),
            "strengths": result.get("strengths") or [],
            "weaknesses": result.get("weaknesses") or [],
            "next_actions": result.get("next_actions") or [],
            "investor_questions": result.get("investor_questions") or [],
            "model_used": used,
        }
        return normalised
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# ChatBot endpoint — NVIDIA NIM / OpenRouter with HydraDB memory
# ---------------------------------------------------------------------------

FREE_CHAT_MODELS = [
    {"id": "meta/llama-3.3-70b-instruct", "label": "Llama 3.3 70B (NVIDIA NIM)", "provider": "nvidia-nim"},
    {"id": "google/gemma-4-31b-it:free", "label": "Gemma 4 31B", "provider": "openrouter"},
    {"id": "nvidia/nemotron-3-super-120b-a12b:free", "label": "Nemotron 3 Super 120B", "provider": "openrouter"},
    {"id": "openai/gpt-oss-120b:free", "label": "GPT-OSS 120B", "provider": "openrouter"},
    {"id": "meta-llama/llama-3.3-70b-instruct:free", "label": "Llama 3.3 70B (OpenRouter)", "provider": "openrouter"},
    {"id": "qwen/qwen3-next-80b-a3b-instruct:free", "label": "Qwen3 Next 80B", "provider": "openrouter"},
]

CHAT_SYSTEM_PROMPT = """You are PitchCraft's AI assistant — a helpful, knowledgeable guide for entrepreneurs and startup founders. You help users with:

1. **Business idea validation & refinement** — critique ideas, suggest pivots, identify target markets
2. **Platform guidance** — explain how PitchCraft works (7-step AI agent pipeline, business plan generation, approval gates, audit chains)
3. **Startup advice** — market research, financial modeling, go-to-market strategy, fundraising
4. **Technical questions** — about the multi-agent architecture, MongoDB backend, model cascade, MCP integration

Be concise, actionable, and encouraging. If a user wants a full business plan, direct them to the "Generate Plan" feature. Keep responses under 300 words unless they ask for depth."""


@app.get("/api/chat")
async def get_chat_models():
    """List available free chat models."""
    from hydradb import hydradb_ready
    return {
        "models": FREE_CHAT_MODELS,
        "hydradb_memory": hydradb_ready(),
    }


class ChatRequest(BaseModel):
    messages: list[dict]
    model: str | None = None
    user_id: str | None = None   # device-scoped UUID for HydraDB memory isolation


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """ChatBot endpoint — calls NVIDIA NIM or OpenRouter with HydraDB memory context."""
    from openai import OpenAI as OpenAIClient
    from hydradb import query_chat_context, ingest_chat_memory, hydradb_ready

    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages array required")

    selected_model = req.model or FREE_CHAT_MODELS[0]["id"]
    is_nvidia = selected_model == "meta/llama-3.3-70b-instruct"

    nvidia_key = os.getenv("NVIDIA_NIM_API_KEY", "")
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

    if is_nvidia and nvidia_key:
        client = OpenAIClient(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=nvidia_key,
        )
    elif openrouter_key:
        client = OpenAIClient(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            default_headers={
                "HTTP-Referer": "https://pitchcraft.app",
                "X-Title": "PitchCraft",
            },
        )
    else:
        raise HTTPException(status_code=503, detail="No chat API key configured")

    # Build system prompt — prepend HydraDB memory context if user_id given
    system_content = CHAT_SYSTEM_PROMPT
    if req.user_id and hydradb_ready():
        last_query = next(
            (m["content"] for m in reversed(req.messages) if m.get("role") == "user"),
            "",
        )
        memory_ctx = query_chat_context(req.user_id, last_query)
        if memory_ctx:
            system_content = f"{CHAT_SYSTEM_PROMPT}\n\n{memory_ctx}"

    messages_payload = [{"role": "system", "content": system_content}] + [
        {"role": m["role"], "content": m["content"]}
        for m in req.messages
        if m.get("role") in ("user", "assistant")
    ]

    try:
        completion = client.chat.completions.create(
            model=selected_model,
            messages=messages_payload,
            temperature=0.7,
            max_tokens=2048,
        )
        reply_text = completion.choices[0].message.content or ""

        # Persist exchange to HydraDB memory (async, best-effort)
        if req.user_id and hydradb_ready():
            last_user_msg = next(
                (m["content"] for m in reversed(req.messages) if m.get("role") == "user"),
                "",
            )
            ingest_chat_memory(req.user_id, last_user_msg, reply_text)

        return {"text": reply_text, "model": selected_model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

