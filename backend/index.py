"""PitchCraft FastAPI application — Vercel-ready entry point.

Local dev:  cd api && uvicorn index:app --reload --port 8000
Vercel:     Automatically invoked via api/index.py serverless function.
"""

import os
import sys
import json
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from models import IdeaRequest, ApprovalDecision
from agent import run_pitchcraft_agent, get_models_list
from mongodb import (
    init_db, save_plan, get_plan, get_plan_by_token, get_plan_count,
    get_recent_plans, get_audit_chain, get_approval_request, resolve_approval,
)
from audit import verify_audit_chain, reconstruct_steps_from_plan
from observability import init_observability, observability_status


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_observability()   # Arize Phoenix tracing (no-op if unconfigured)
    init_db()
    yield


app = FastAPI(title="PitchCraft API", lifespan=lifespan)

# Starlette's allow_origins only does exact matches, so Vercel preview domains
# (https://<branch>-<proj>.vercel.app) need a regex. Keep explicit localhost +
# any configured FRONTEND_URL for credentialed requests.
_explicit_origins = [o for o in ("http://localhost:3000", os.getenv("FRONTEND_URL", "")) if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_explicit_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Plan-ID", "X-Model"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "PitchCraft Agent"}


# Legacy /health kept for backward compat
@app.get("/health")
async def health_legacy():
    return {"status": "ok", "service": "PitchCraft Agent"}


@app.get("/api/stats")
async def get_stats():
    return {"total_plans": get_plan_count()}


@app.get("/api/models")
async def list_models():
    return {"models": get_models_list()}


@app.get("/api/observability")
async def observability():
    """Arize Phoenix tracing status — shows whether agent traces are streaming."""
    return observability_status()


@app.post("/api/generate")
async def generate_plan(request: IdeaRequest):
    plan_id = save_plan(request.idea)
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
async def get_plans():
    plans = get_recent_plans(limit=10)
    return plans


@app.get("/api/mcp/tools")
async def get_mcp_tools():
    from mongodb import mcp_get_tools_manifest
    return {
        "mcp_server": "PitchCraft MongoDB MCP",
        "version": "1.0.0",
        "tools": mcp_get_tools_manifest(),
    }


@app.get("/api/mcp/demo")
async def mcp_demo():
    from mongodb import mcp_search_similar_plans, mcp_get_market_benchmarks
    return {
        "demo": "MongoDB MCP giving the agent market intelligence",
        "tool_1_result": mcp_search_similar_plans("technology"),
        "tool_2_result": mcp_get_market_benchmarks("technology"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
