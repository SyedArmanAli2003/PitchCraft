"""PitchCraft FastAPI application — Vercel-ready entry point.

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
from agent import run_pitchcraft_agent, get_models_list, _load_api_keys, get_agent_manifest
from mongodb import (
    init_db, save_plan, get_plan, get_plan_by_token, get_plan_count, get_plans_today,
    get_recent_plans, get_audit_chain, get_approval_request, resolve_approval, _get_db,
    get_all_plans_admin, get_user_stats,
)
from audit import verify_audit_chain, reconstruct_steps_from_plan
from observability import init_observability, observability_status


# ── Simple in-memory per-IP rate limiter for /api/generate ────────────────────
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
    allow_origin_regex=r"https://.*\.(vercel\.app|run\.app|up\.railway\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Plan-ID", "X-Model"],
)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "PitchCraft Agent",
        "gemini": _gemini_ready(),
        "atlas": _get_db() is not None,
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
    never dies on one model's quota — we state this hybrid honestly."""
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
    """Full multi-agent architecture manifest — the 7 named specialists, their
    ADK agent names, declared tools, the MongoDB integration and observability.
    Built from the same agent objects that actually run, so it can't drift."""
    return get_agent_manifest()


@app.get("/api/observability")
async def observability():
    """Arize Phoenix tracing status — shows whether agent traces are streaming."""
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
# Admin endpoints (requires ADMIN_SECRET env var)
# ---------------------------------------------------------------------------

def _check_admin(request: Request) -> None:
    """Raise 401/403 if the request doesn't carry a valid admin secret."""
    secret = os.getenv("ADMIN_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Admin access not configured (set ADMIN_SECRET env var)")
    token = (
        request.headers.get("X-Admin-Secret")
        or request.query_params.get("secret")
        or ""
    )
    if token != secret:
        raise HTTPException(status_code=401, detail="Invalid admin secret")


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
        "mongodb_connected": _get_db() is not None,
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
    """The real tool manifest served by the PitchCraft MongoDB MCP server."""
    from mcp_server import list_tools_manifest
    return {
        "mcp_server": "PitchCraft MongoDB MCP",
        "protocol": "Model Context Protocol",
        "transports": ["stdio", "in-memory (agent)"],
        "tools": await list_tools_manifest(),
    }


@app.get("/api/mcp/demo")
async def mcp_demo():
    """Invoke the MCP tools over the real protocol (in-memory client↔server
    session) — exactly the path the agent uses to ground its reasoning."""
    from agent import call_mcp_tool
    return {
        "demo": "MongoDB powering the agent via the MCP protocol",
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
