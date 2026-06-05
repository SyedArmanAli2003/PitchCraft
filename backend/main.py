"""PitchCraft FastAPI application."""

import os
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from models import IdeaRequest
from agent import run_pitchcraft_agent
from mongodb import init_db, save_plan, get_plan, get_plan_by_token


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run database connection check + setup on startup."""
    init_db()
    yield


app = FastAPI(title="PitchCraft API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/generate")
async def generate_plan(request: IdeaRequest):
    """Kick off the agent and stream each step back as Server-Sent Events."""
    plan_id = save_plan(request.idea)

    async def event_stream():
        async for step in run_pitchcraft_agent(request.idea, plan_id):
            yield f"data: {json.dumps(step)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "X-Plan-ID": plan_id,
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.get("/api/plan/{plan_id}")
async def get_plan_route(plan_id: str):
    plan = get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan["_id"] = str(plan["_id"])
    return plan


@app.get("/api/share/{token}")
async def get_shared_plan(token: str):
    plan = get_plan_by_token(token)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan["_id"] = str(plan["_id"])
    return plan


@app.get("/health")
async def health():
    return {"status": "ok", "service": "PitchCraft Agent"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
