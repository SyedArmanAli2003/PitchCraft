"""The 7-step PitchCraft agent — Gemini-only, multi-key rotation, model cascade.

Cascade order (user-selectable start point, falls through on error):
  1. gemini-3-pro       → gemini-3-pro-preview
  2. gemini-3-flash     → gemini-3-flash-preview   (default)
  3. gemini-2.5-flash   → gemini-2.5-flash
  4. gemini-2.5-flash-lite → gemini-2.5-flash-lite

Uses the current `google-genai` SDK (the legacy `google-generativeai` package is
end-of-life and is not what the Arize OpenInference instrumentor hooks into).
Every Gemini call runs in forced-JSON mode and is auto-traced to Arize Phoenix
when observability is configured (see observability.py).
"""

import os
import json
import secrets
import asyncio

from google import genai
from google.genai import types
from dotenv import load_dotenv

from mongodb import (
    update_plan, search_market_data, mcp_search_similar_plans, mcp_get_market_benchmarks,
    save_audit_chain, create_approval_request, get_approval_request, resolve_approval,
)
from audit import hash_step, build_audit_chain, genesis_hash
from observability import agent_span

load_dotenv()

# ---------------------------------------------------------------------------
# API key pool — cycles through GEMINI_API_KEY_1 … _N on 429 / quota errors
# ---------------------------------------------------------------------------

def _load_api_keys() -> list[str]:
    keys: list[str] = []
    for i in range(1, 10):
        k = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if k and not k.startswith("<") and not k.lower().startswith("your"):
            keys.append(k)
    # Backwards-compat: bare GEMINI_API_KEY
    bare = os.getenv("GEMINI_API_KEY", "").strip()
    if bare and bare not in keys and not bare.startswith("<"):
        keys.append(bare)
    if not keys:
        raise RuntimeError(
            "No Gemini API key found. Add GEMINI_API_KEY_1 (and optionally _2, _3) to api/.env"
        )
    return keys


# ---------------------------------------------------------------------------
# Model registry — 4 Gemini tiers
# ---------------------------------------------------------------------------

MODEL_CONFIGS: dict[str, dict] = {
    "gemini-3-pro": {
        "display": "Gemini 3 Pro",
        "tier": 1,
        "model_id": "gemini-3-pro-preview",
    },
    "gemini-3-flash": {
        "display": "Gemini 3 Flash",
        "tier": 2,
        "model_id": "gemini-3-flash-preview",
    },
    "gemini-2.5-flash": {
        "display": "Gemini 2.5 Flash",
        "tier": 3,
        "model_id": "gemini-2.5-flash",
    },
    "gemini-2.5-flash-lite": {
        "display": "Gemini 2.5 Flash Lite",
        "tier": 4,
        "model_id": "gemini-2.5-flash-lite",
    },
}

# Strict cascade: if chosen model fails, fall to the next tier down
CASCADE_ORDER = [
    "gemini-3-pro",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]


def get_models_list() -> list[dict]:
    return [
        {"key": k, "display": v["display"], "tier": v["tier"]}
        for k, v in MODEL_CONFIGS.items()
    ]


# ---------------------------------------------------------------------------
# Core call helpers
# ---------------------------------------------------------------------------

def parse_json_response(text: str) -> dict:
    clean = (text or "").replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        # Forced-JSON mode makes this rare; salvage the largest {...} span if a
        # model ever wraps the object in prose.
        start, end = clean.find("{"), clean.rfind("}")
        if 0 <= start < end:
            try:
                return json.loads(clean[start:end + 1])
            except (json.JSONDecodeError, ValueError):
                pass
        return {"raw": text}


# One client per API key (cheap, thread-safe to reuse); created on first use.
_CLIENTS: dict[str, "genai.Client"] = {}


def _client_for(api_key: str) -> "genai.Client":
    client = _CLIENTS.get(api_key)
    if client is None:
        client = genai.Client(api_key=api_key)
        _CLIENTS[api_key] = client
    return client


def _call_single(prompt: str, model_id: str, api_key: str) -> dict:
    client = _client_for(api_key)
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    return parse_json_response(response.text)


def _call_with_key_rotation(prompt: str, model_id: str, keys: list[str]) -> dict:
    """Try each API key in sequence; only rotate on quota/rate-limit errors."""
    last_err: Exception | None = None
    for key in keys:
        try:
            return _call_single(prompt, model_id, key)
        except Exception as e:
            err_lower = str(e).lower()
            if any(tok in err_lower for tok in ("429", "quota", "rate_limit", "resource_exhausted")):
                last_err = e
                continue  # try next key
            raise   # non-quota error — surface immediately
    raise last_err or RuntimeError("All API keys exhausted.")


async def _generate(prompt: str, model_key: str, keys: list[str]) -> tuple[dict, str]:
    """
    Try the chosen Gemini tier, then cascade to lower tiers on any failure.
    Returns (result_dict, actually_used_model_key).
    """
    start = CASCADE_ORDER.index(model_key) if model_key in CASCADE_ORDER else 0
    last_err: Exception | None = None

    for candidate in CASCADE_ORDER[start:]:
        try:
            cfg = MODEL_CONFIGS[candidate]
            result = await asyncio.to_thread(
                _call_with_key_rotation, prompt, cfg["model_id"], keys
            )
            return result, candidate
        except Exception as e:
            last_err = e

    raise last_err or RuntimeError("All Gemini models in the cascade failed.")


# ---------------------------------------------------------------------------
# Tamper-evident audit chain (additive — must never break the pipeline)
# ---------------------------------------------------------------------------

def _record_step_audit(plan_id, audit_steps, prev_hash, step_number, step_name, data) -> str:
    """Hash one completed step into the running chain and persist its per-step
    hash on the plan document. Swallows every error so audit can never crash
    generation. Returns the new running hash (or the old one on failure).

    The data is snapshotted via a JSON round-trip so a later in-place mutation
    (e.g. the `_fallback` marker) cannot retroactively change a recorded hash.
    """
    try:
        snapshot = json.loads(json.dumps(data, default=str))
        h = hash_step(step_number, step_name, snapshot, prev_hash)
        audit_steps.append({"step": step_number, "name": step_name, "data": snapshot})
        update_plan(plan_id, f"audit_hashes.step_{step_number}", h)
        return h
    except Exception as exc:
        print(f"⚠️  audit hashing failed at step {step_number}: {exc}")
        return prev_hash


# ---------------------------------------------------------------------------
# Human-in-the-loop approval gate config
# ---------------------------------------------------------------------------

def _approval_timeout_seconds() -> float:
    """How long to wait for a human decision before abandoning (default 300s)."""
    try:
        return float(os.getenv("APPROVAL_TIMEOUT_SECONDS", "300"))
    except ValueError:
        return 300.0


def _skip_approval_enabled() -> bool:
    """SKIP_APPROVAL=true auto-approves after 3s — for tests/demos."""
    return os.getenv("SKIP_APPROVAL", "").strip().lower() in ("1", "true", "yes")


# ---------------------------------------------------------------------------
# 7-step agent
# ---------------------------------------------------------------------------

async def run_pitchcraft_agent(
    idea: str, plan_id: str, model_key: str = "gemini-3-flash"
):
    """Yield one SSE-ready dict per completed step."""
    keys = _load_api_keys()
    update_plan(plan_id, "status", "generating")
    update_plan(plan_id, "model", MODEL_CONFIGS.get(model_key, {}).get("display", model_key))

    # Tamper-evident audit chain — accumulates one hashed entry per step.
    audit_steps: list[dict] = []
    audit_prev = genesis_hash(plan_id)

    async def gen(prompt: str, step_label: str = "") -> tuple[dict, str]:
        with agent_span(
            f"pitchcraft.step.{step_label}" if step_label else "pitchcraft.gemini",
            {"plan_id": plan_id, "model": model_key, "step": step_label},
        ):
            return await _generate(prompt, model_key, keys)

    # ----- STEP 1 — Validate idea ---------------------------------------- #
    prompt1 = f"""Analyze this startup idea: "{idea}"
Return ONLY valid JSON:
{{
  "viable": true,
  "viability_score": 1-10,
  "one_line_summary": "string",
  "core_problem_solved": "string",
  "target_market": "string",
  "innovation_factor": "string",
  "main_concerns": ["concern1", "concern2"]
}}"""
    try:
        validation, used = await gen(prompt1, "Validation")
        update_plan(plan_id, "validation", validation)
        audit_prev = _record_step_audit(plan_id, audit_steps, audit_prev, 1, "Validation", validation)
        payload: dict = {"step": 1, "name": "Validation", "status": "complete", "data": validation}
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 1, "name": "Validation", "status": "error", "error": str(e)}
        return

    # ----- STEP 2 — Market research (MongoDB MCP) ------------------------ #
    industry = validation.get("target_market", "")
    market = search_market_data(industry)
    mcp_context = mcp_search_similar_plans(validation.get("target_market", "technology"))

    prompt2 = f"""For startup: "{idea}"
Industry context from MongoDB: {json.dumps(market)}
Similar validated plans from our database (via MCP): {json.dumps(mcp_context)}

Use the MCP data to ground your research in real patterns.
Return ONLY valid JSON:
{{
  "market_size": "string",
  "growth_rate": "string",
  "top_competitors": [{{"name": "str", "weakness": "str"}}],
  "market_gap": "string",
  "opportunity_score": 1-10
}}"""
    try:
        market_research, used = await gen(prompt2, "Market Research")
        update_plan(plan_id, "market_research", market_research)
        audit_prev = _record_step_audit(plan_id, audit_steps, audit_prev, 2, "Market Research", market_research)
        payload = {"step": 2, "name": "Market Research", "status": "complete", "data": market_research}
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 2, "name": "Market Research", "status": "error", "error": str(e)}
        return

    # ----- APPROVAL GATE — human approves before Steps 3-7 --------------- #
    # Pause after market research and wait for a human decision. The polling
    # loop keeps the SSE generator (and the connection) alive without ever
    # blocking the event loop. Honors SKIP_APPROVAL / APPROVAL_TIMEOUT_SECONDS.
    direction_override: str | None = None
    approval_id = create_approval_request(plan_id, market_research)
    update_plan(plan_id, "approval_id", approval_id)
    update_plan(plan_id, "approval_status", "pending")
    yield {
        "step": "approval_gate",
        "status": "waiting",
        "approval_id": approval_id,
        "message": "Review market research — approve to continue",
        "data": market_research,
    }

    timeout_s = _approval_timeout_seconds()
    if _skip_approval_enabled():
        await asyncio.sleep(3)
        resolve_approval(approval_id, True, None)

    decision: dict | None = None
    elapsed = 0.0
    while elapsed < timeout_s:
        request = get_approval_request(approval_id)
        if request and request.get("status") != "pending":
            decision = request
            break
        await asyncio.sleep(2)
        elapsed += 2
        # Keep the SSE connection warm during long waits (~every 10s).
        if int(elapsed) % 10 == 0:
            yield {
                "step": "approval_gate",
                "status": "waiting",
                "approval_id": approval_id,
                "ping": int(elapsed),
                "remaining": max(0, int(timeout_s - elapsed)),
            }

    if not decision or decision.get("status") != "approved":
        reason = (decision or {}).get("status") or "timeout"
        message = (
            "Plan rejected by reviewer — generation stopped."
            if reason == "rejected"
            else f"Approval timed out after {int(timeout_s)}s — plan abandoned."
        )
        update_plan(plan_id, "status", "abandoned")
        update_plan(plan_id, "approval_status", reason)
        yield {
            "step": "approval_gate",
            "status": reason,
            "approval_id": approval_id,
            "message": message,
        }
        return

    direction_override = decision.get("direction_override")
    update_plan(plan_id, "approval_status", "approved")
    yield {
        "step": "approval_gate",
        "status": "approved",
        "approval_id": approval_id,
        "direction_override": direction_override,
    }

    # ----- STEP 3 — Customer personas ------------------------------------ #
    direction_note = (
        f'\nThe reviewer redirected the strategy: "{direction_override}". '
        "Reflect this new direction in the personas."
        if direction_override else ""
    )
    prompt3 = f"""For startup: "{idea}"{direction_note}
Create 3 customer personas. Return ONLY valid JSON:
{{
  "personas": [
    {{
      "name": "string",
      "age": "string",
      "job": "string",
      "pain_point": "string",
      "willingness_to_pay": "string",
      "how_they_find_us": "string"
    }}
  ]
}}"""
    try:
        personas, used = await gen(prompt3, "Customer Personas")
        update_plan(plan_id, "personas", personas.get("personas", []))
        audit_prev = _record_step_audit(plan_id, audit_steps, audit_prev, 3, "Customer Personas", personas.get("personas", []))
        payload = {"step": 3, "name": "Customer Personas", "status": "complete", "data": personas}
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 3, "name": "Customer Personas", "status": "error", "error": str(e)}
        return

    # ----- STEP 4 — Full business plan ----------------------------------- #
    prompt4 = f"""Write a business plan for: "{idea}"
Return ONLY valid JSON:
{{
  "problem": "string",
  "solution": "string",
  "unique_value_proposition": "string",
  "revenue_model": "string",
  "revenue_streams": ["stream1", "stream2"],
  "go_to_market": "string",
  "key_milestones": [{{"month": 1, "milestone": "string"}}]
}}"""
    try:
        business_plan, used = await gen(prompt4, "Business Plan")
        update_plan(plan_id, "business_plan", business_plan)
        audit_prev = _record_step_audit(plan_id, audit_steps, audit_prev, 4, "Business Plan", business_plan)
        payload = {"step": 4, "name": "Business Plan", "status": "complete", "data": business_plan}
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 4, "name": "Business Plan", "status": "error", "error": str(e)}
        return

    # ----- STEP 5 — Financial projections (grounded in MongoDB benchmarks) - #
    benchmarks = mcp_get_market_benchmarks(validation.get("target_market", "technology"))
    prompt5 = f"""Create 3-year financial projection for: "{idea}"
Revenue model: {business_plan.get('revenue_model', 'SaaS')}
Benchmarks from our MongoDB (via MCP): {json.dumps(benchmarks)}
Use the benchmark averages to keep your numbers realistic.
Return ONLY valid JSON:
{{
  "year1_revenue": "string",
  "year2_revenue": "string",
  "year3_revenue": "string",
  "startup_cost": "string",
  "monthly_burn": "string",
  "break_even_month": 12,
  "funding_needed": "string"
}}"""
    try:
        financials, used = await gen(prompt5, "Financial Projections")
        update_plan(plan_id, "financials", financials)
        audit_prev = _record_step_audit(plan_id, audit_steps, audit_prev, 5, "Financial Projections", financials)
        payload = {"step": 5, "name": "Financial Projections", "status": "complete", "data": financials}
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 5, "name": "Financial Projections", "status": "error", "error": str(e)}
        return

    # ----- STEP 6 — Risk analysis ---------------------------------------- #
    prompt6 = f"""Analyze risks for startup: "{idea}"
Return ONLY valid JSON:
{{
  "risks": [
    {{"risk": "string", "severity": "High", "mitigation": "string"}}
  ],
  "swot": {{
    "strengths": ["str"],
    "weaknesses": ["str"],
    "opportunities": ["str"],
    "threats": ["str"]
  }}
}}"""
    try:
        risks, used = await gen(prompt6, "Risk Analysis")
        update_plan(plan_id, "risks", risks)
        audit_prev = _record_step_audit(plan_id, audit_steps, audit_prev, 6, "Risk Analysis", risks)
        payload = {"step": 6, "name": "Risk Analysis", "status": "complete", "data": risks}
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 6, "name": "Risk Analysis", "status": "error", "error": str(e)}
        return

    # ----- STEP 7 — Finalize + share token ------------------------------- #
    try:
        share_token = secrets.token_urlsafe(6)
        update_plan(plan_id, "share_token", share_token)
        update_plan(plan_id, "status", "complete")

        # Seal the audit chain: hash step 7, then build + persist the full chain.
        audit_prev = _record_step_audit(
            plan_id, audit_steps, audit_prev, 7, "Complete",
            {"share_token": share_token, "status": "complete"},
        )
        audit_chain_hash = None
        try:
            chain = build_audit_chain(audit_steps, plan_id)
            save_audit_chain(plan_id, chain)
            if chain:
                audit_chain_hash = chain[-1]["hash"]
                update_plan(plan_id, "audit_chain_hash", audit_chain_hash)
        except Exception as exc:
            print(f"⚠️  audit chain build/save failed: {exc}")

        yield {
            "step": 7,
            "name": "Complete",
            "status": "complete",
            "data": {
                "share_token": share_token,
                "plan_id": plan_id,
                "model_used": MODEL_CONFIGS.get(model_key, {}).get("display", model_key),
                "audit_chain_hash": audit_chain_hash,
            },
        }
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 7, "name": "Complete", "status": "error", "error": str(e)}
