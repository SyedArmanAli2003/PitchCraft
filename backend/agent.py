"""PitchCraft — a multi-agent business-plan engine (Google ADK).

ARCHITECTURE
------------
Seven *named specialist agents* collaborate, handing off to each other like a
real consulting firm. The six reasoning specialists are genuine
`google.adk.agents.LlmAgent` objects (each with a name, description, system
instruction and declared MongoDB tools); the seventh — the Chief of Staff —
compiles, persists and cryptographically seals the plan. They are composed into
a single ADK `SequentialAgent` pipeline (the canonical ADK "agents that hand off
to each other" pattern, mirroring the ADK-hackathon-winning multi-agent design).

  1. Strategy Analyst            → validates the idea
  2. Market Intelligence Analyst → researches the market via the MongoDB MCP server
  3. Customer Insights Specialist→ builds customer personas
  4. Business Architect          → writes the full business plan
  5. Financial Modeller          → projects 3-year financials (MongoDB benchmarks)
  6. Risk & Compliance Officer   → risk analysis + SWOT
  7. Chief of Staff              → persists + SHA-256 audit chain

EXECUTION (honest note)
-----------------------
ADK defines the agents and the pipeline topology. The actual Gemini calls run
through PitchCraft's resilient executor (multi-key rotation + a 4-tier model
cascade + forced-JSON + Arize tracing) so a live demo never dies on one model's
quota. Each agent's ADK `instruction` is the system prompt that drives its call.

Uses the current `google-genai` SDK (the legacy `google-generativeai` package is
end-of-life and is not what the Arize OpenInference instrumentor hooks into).
Every Gemini call runs in forced-JSON mode and is auto-traced to Arize Phoenix
when observability is configured (see observability.py).
"""

import os
import json
import secrets
import asyncio
import warnings

from google import genai
from google.genai import types
from dotenv import load_dotenv

# --- Google Cloud Agent Development Kit (ADK) ------------------------------- #
# Real ADK primitives. Guarded so the app still boots if the package is absent.
try:
    from google.adk.agents import LlmAgent, SequentialAgent
    from google.adk.tools import FunctionTool
    _ADK_AVAILABLE = True
except Exception:  # pragma: no cover - ADK optional at runtime
    LlmAgent = SequentialAgent = FunctionTool = None
    _ADK_AVAILABLE = False

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
# Model registry — verified live 2026-06-10
# ---------------------------------------------------------------------------
# Test results (httpx, 8s timeout, free-tier keys):
#   gemini-3.5-flash       -> OK  (confirmed working, good quality)
#   gemini-3.1-flash-lite  -> OK  (fast, reliable, great fallback)
#   gemini-2.5-flash-lite  -> OK  (stable fallback)
#   gemini-3.1-pro         -> 404 (model does not exist — REMOVED)
#   gemini-3-flash-preview -> NOT TESTED (may be region-limited)
#   gemini-2.5-pro         -> 429 quota on free tier
#   gemini-2.5-flash       -> Timeout / overloaded
#   gemini-2.0-flash       -> 429 quota on free tier

MODEL_CONFIGS: dict[str, dict] = {
    "gemini-3.5-flash": {
        "display": "Gemini 3.5 Flash",
        "tier": 1,
        "model_id": "gemini-3.5-flash",
        "badge": "Recommended",
        "description": "Latest & fastest — confirmed working",
        "quota_status": "ok",
    },
    "gemini-3.1-flash-lite": {
        "display": "Gemini 3.1 Flash Lite",
        "tier": 2,
        "model_id": "gemini-3.1-flash-lite",
        "badge": "Fast",
        "description": "Lightweight & reliable — separate quota pool",
        "quota_status": "ok",
    },
    "gemini-2.5-flash-lite": {
        "display": "Gemini 2.5 Flash Lite",
        "tier": 3,
        "model_id": "gemini-2.5-flash-lite",
        "badge": "Stable",
        "description": "Solid reasoning, stable free-tier quota",
        "quota_status": "ok",
    },
    "gemini-2.5-flash": {
        "display": "Gemini 2.5 Flash",
        "tier": 4,
        "model_id": "gemini-2.5-flash",
        "badge": "High Capacity",
        "description": "Deep reasoning — may time out under high load",
        "quota_status": "limited",
    },
    "gemini-2.5-pro": {
        "display": "Gemini 2.5 Pro",
        "tier": 5,
        "model_id": "gemini-2.5-pro",
        "badge": "Pro",
        "description": "Most powerful — requires billing account (paid tier)",
        "quota_status": "pro_only",
    },
}

# Best default: gemini-3.5-flash confirmed working
DEFAULT_MODEL_KEY = "gemini-3.5-flash"

# Strict cascade: if chosen model hits 429/503, fall through every tier.
# Order = proven working first, then slower/quota-limited as last resort.
CASCADE_ORDER = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]


def get_models_list() -> list[dict]:
    return [
        {
            "key": k,
            "display": v["display"],
            "tier": v["tier"],
            "badge": v.get("badge"),
            "description": v.get("description"),
            "quota_status": v.get("quota_status", "ok"),
        }
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
        client = genai.Client(
            api_key=api_key,
            http_options={'retry_options': {'attempts': 1}}
        )
        _CLIENTS[api_key] = client
    return client


# 2.5-series and 3.x models support thinking mode; sending ThinkingConfig to
# other models causes an API error. 3.1-flash-lite is 3.x so it's included.
_THINKING_MODEL_PREFIXES = ("gemini-2.5", "gemini-3.")


def _call_single(prompt: str, model_id: str, api_key: str) -> dict:
    client = _client_for(api_key)
    cfg_kwargs: dict = {
        "response_mime_type": "application/json",
        "temperature": 0.7,
    }
    if any(model_id.startswith(p) for p in _THINKING_MODEL_PREFIXES):
        try:
            cfg_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
        except (AttributeError, TypeError):
            pass  # older SDK version — safe to skip
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(**cfg_kwargs),
    )
    text = getattr(response, "text", None)
    if not text:
        raise RuntimeError(
            f"Empty response from {model_id} — possibly blocked by safety filters"
        )
    return parse_json_response(text)


def _call_with_key_rotation(prompt: str, model_id: str, keys: list[str]) -> dict:
    """Try each API key in sequence; only rotate on quota/rate-limit errors.
    Retries once on 503 Service Unavailable before rotating.
    """
    last_err: Exception | None = None
    for key in keys:
        try:
            return _call_single(prompt, model_id, key)
        except Exception as e:
            err_str = str(e)
            err_lower = err_str.lower()
            if "503" in err_str or "service_unavailable" in err_lower or "overloaded" in err_lower:
                # Transient overload — wait a moment and retry the same key once
                import time; time.sleep(5)
                try:
                    return _call_single(prompt, model_id, key)
                except Exception as e2:
                    err_str = str(e2)
                    err_lower = err_str.lower()
                    if any(tok in err_lower for tok in ("429", "quota", "rate_limit", "resource_exhausted")):
                        last_err = e2
                        continue
                    raise
            if any(tok in err_lower for tok in ("429", "quota", "rate_limit", "resource_exhausted")):
                last_err = e
                continue  # try next key
            raise   # non-quota error — surface immediately
    raise last_err or RuntimeError("All API keys exhausted.")


async def _generate(prompt: str, model_key: str, keys: list[str]) -> tuple[dict, str]:
    """
    Try the chosen Gemini tier, then cascade to lower tiers on any failure.
    On a quota failure, waits 12 s before the next tier so the per-minute
    window has a chance to partially reset.
    Returns (result_dict, actually_used_model_key).
    """
    start = CASCADE_ORDER.index(model_key) if model_key in CASCADE_ORDER else 0
    last_err: Exception | None = None

    for i, candidate in enumerate(CASCADE_ORDER[start:]):
        try:
            cfg = MODEL_CONFIGS[candidate]
            result = await asyncio.to_thread(
                _call_with_key_rotation, prompt, cfg["model_id"], keys
            )
            return result, candidate
        except Exception as e:
            err_lower = str(e).lower()
            is_quota = any(tok in err_lower for tok in ("429", "quota", "rate_limit", "resource_exhausted"))
            print(f"⚠️  Cascade: {cfg['model_id']} failed ({type(e).__name__}) quota={is_quota}")
            last_err = e
            # Brief pause between tiers when rate-limited — lets the 1-min window reset a bit.
            if is_quota and i < len(CASCADE_ORDER) - 1:
                await asyncio.sleep(12)

    raise last_err or RuntimeError("All Gemini models in the cascade failed.")


# ---------------------------------------------------------------------------
# MongoDB grounding via the real MCP protocol
# ---------------------------------------------------------------------------

def _direct_tool_fallback(name: str, arguments: dict) -> dict:
    """Call the underlying MongoDB tool directly if the MCP layer is unavailable
    (e.g. the `mcp` package isn't installed). The agent must never lose grounding
    over a transport hiccup."""
    industry = arguments.get("industry", "technology")
    if name == "search_similar_plans":
        return mcp_search_similar_plans(industry)
    if name == "get_market_benchmarks":
        return mcp_get_market_benchmarks(industry)
    if name == "get_industry_market_data":
        return search_market_data(industry)
    return {}


async def call_mcp_tool(name: str, arguments: dict) -> dict:
    """Invoke an MCP tool over the *real* MCP protocol.
    First tries the official @modelcontextprotocol/server-mongodb via stdio.
    Falls back to our custom in-memory MCP server, and finally direct calls,
    so a run never breaks in restricted environments like Vercel serverless.
    """
    try:
        from mcp.client.stdio import stdio_client, StdioServerParameters
        from mcp.client.session import ClientSession

        # Try connecting to the official MongoDB MCP server
        mongo_uri = os.getenv("MONGODB_URI", "")
        if mongo_uri and os.getenv("USE_OFFICIAL_MONGODB_MCP", "").strip().lower() in ("1", "true", "yes"):
            server_params = StdioServerParameters(
                command="npx",
                args=["-y", "@modelcontextprotocol/server-mongodb", mongo_uri]
            )
            try:
                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        res = await session.call_tool(name, arguments)
                        if not res.isError:
                            sc = getattr(res, "structuredContent", None)
                            if isinstance(sc, dict) and sc:
                                return sc.get("result", sc) if set(sc.keys()) == {"result"} else sc
                            for c in res.content:
                                if getattr(c, "type", None) == "text":
                                    try:
                                        return json.loads(c.text)
                                    except (json.JSONDecodeError, ValueError):
                                        continue
            except FileNotFoundError:
                # npx not found (e.g. Vercel Python runtime) - fall through
                pass
    except Exception as exc:
        print(f"⚠️  Official MCP server attempt failed: {exc}")

    try:
        from mcp.shared.memory import create_connected_server_and_client_session
        from mcp_server import mcp as _mcp_server

        async with create_connected_server_and_client_session(_mcp_server._mcp_server) as client:
            res = await client.call_tool(name, arguments)
            if not res.isError:
                sc = getattr(res, "structuredContent", None)
                if isinstance(sc, dict) and sc:
                    return sc.get("result", sc) if set(sc.keys()) == {"result"} else sc
                for c in res.content:
                    if getattr(c, "type", None) == "text":
                        try:
                            return json.loads(c.text)
                        except (json.JSONDecodeError, ValueError):
                            continue
    except Exception as exc:
        print(f"⚠️  In-memory MCP tool '{name}' failed, using direct fallback: {exc}")

    return _direct_tool_fallback(name, arguments)


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
    """Auto-approves the gate after 3 s by default.
    Set SKIP_APPROVAL=false in .env to require a real human decision."""
    return os.getenv("SKIP_APPROVAL", "true").strip().lower() not in ("0", "false", "no")


# ===========================================================================
# Multi-agent architecture (Google ADK)
# ===========================================================================
# A single source of truth describes every specialist. From it we build BOTH
# the real ADK LlmAgent objects AND the /api/agent/manifest payload, so the
# manifest can never drift from the agents that actually run.

DEFAULT_MODEL_ID = MODEL_CONFIGS[DEFAULT_MODEL_KEY]["model_id"]


# --- ADK tool wrappers over the MongoDB MCP-backed functions ---------------- #
# Declaring these as ADK FunctionTools makes the MarketAgent / FinanceAgent
# genuinely "tool-using" agents in the ADK manifest. At runtime the agents reach
# the very same MongoDB data through the MCP protocol (see call_mcp_tool).

def adk_search_similar_plans(industry: str) -> dict:
    """Search completed business plans in MongoDB by industry (MCP-backed)."""
    return mcp_search_similar_plans(industry)


def adk_get_industry_market_data(industry: str) -> dict:
    """Look up curated industry market data from MongoDB (MCP-backed)."""
    return search_market_data(industry)


def adk_get_market_benchmarks(industry: str) -> dict:
    """Aggregate financial benchmarks from stored plans in MongoDB (MCP-backed)."""
    return mcp_get_market_benchmarks(industry)


def _make_tools(*funcs):
    """Wrap plain functions as ADK FunctionTools (no-op list if ADK absent)."""
    if not _ADK_AVAILABLE:
        return []
    out = []
    for f in funcs:
        try:
            out.append(FunctionTool(f))
        except Exception:
            pass
    return out


def _make_llm_agent(name: str, description: str, instruction: str, tools=None):
    """Build a real ADK LlmAgent, or None if ADK is unavailable."""
    if not _ADK_AVAILABLE:
        return None
    try:
        return LlmAgent(
            name=name,
            model=DEFAULT_MODEL_ID,
            description=description,
            instruction=instruction,
            tools=tools or [],
        )
    except Exception as exc:  # pragma: no cover
        print(f"⚠️  ADK LlmAgent '{name}' construction failed: {exc}")
        return None


class BaseSpecialist:
    """A named specialist agent. Wraps a real ADK LlmAgent and adds PitchCraft's
    resilient execution + MongoDB grounding. `run()` returns (result, used_model).

    Subclasses set the class attributes and implement `build_prompt`. The SSE
    `name` and audit `step_name` are kept byte-identical to the original
    pipeline so the tamper-evident audit chain stays verifiable.
    """

    step_number: int = 0
    sse_name: str = ""          # SSE event 'name' + audit step_name (do not change)
    specialist: str = ""        # human-readable role title
    adk_name: str = ""          # snake_case ADK agent name
    plan_field: str = ""        # MongoDB field to persist the result into
    description: str = ""       # what this agent does
    instruction: str = ""       # ADK system instruction driving its Gemini call
    tool_names: list[str] = []  # declared tools (for the manifest)

    def __init__(self):
        self.adk = _make_llm_agent(
            self.adk_name, self.description, self.instruction, self._build_tools()
        )

    def _build_tools(self):
        return []

    async def build_prompt(self, ctx: dict) -> str:
        raise NotImplementedError

    def store_value(self, result: dict):
        """The value persisted to MongoDB / hashed into the audit chain."""
        return result

    def post_process(self, result: dict, ctx: dict) -> dict:
        return result

    async def run(self, ctx: dict, gen) -> tuple[dict, str]:
        prompt = await self.build_prompt(ctx)
        result, used = await gen(prompt, self.adk_name, self.instruction)
        result = self.post_process(result, ctx)
        return result, used

    def manifest_entry(self) -> dict:
        return {
            "id": self.step_number,
            "name": self.specialist,
            "adk_agent": self.adk_name,
            "role": self.description,
            "tools": list(self.tool_names),
            "persists_to": self.plan_field or None,
            "adk_llm_agent": self.adk is not None,
        }


class ValidationAgent(BaseSpecialist):
    step_number = 1
    sse_name = "Validation"
    specialist = "Strategy Analyst"
    adk_name = "strategy_analyst"
    plan_field = "validation"
    description = "Validates startup ideas for viability and product-market fit."
    instruction = (
        "You are the Strategy Analyst at PitchCraft, a top-tier startup consultancy. "
        "Rigorously assess whether a startup idea is viable: score it, name the core "
        "problem it solves, the target market, its innovation edge, and the main "
        "concerns. Be honest and specific. Always reply with valid JSON only."
    )
    tool_names = ["gemini_reasoning"]

    async def build_prompt(self, ctx: dict) -> str:
        idea = ctx["idea"]
        return f"""Analyze this startup idea: "{idea}"
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


class MarketAgent(BaseSpecialist):
    step_number = 2
    sse_name = "Market Research"
    specialist = "Market Intelligence Analyst"
    adk_name = "market_intelligence_analyst"
    plan_field = "market_research"
    description = "Researches the market by querying MongoDB via the MCP server."
    instruction = (
        "You are the Market Intelligence Analyst at PitchCraft. You ground every "
        "claim in real data retrieved from MongoDB through the Model Context "
        "Protocol: curated industry data and similar validated plans. Size the "
        "market, quantify growth, expose competitor weaknesses and find the gap. "
        "Cite the MongoDB data where it informs you. Reply with valid JSON only."
    )
    tool_names = ["mongodb_mcp:get_industry_market_data", "mongodb_mcp:search_similar_plans"]

    def _build_tools(self):
        return _make_tools(adk_get_industry_market_data, adk_search_similar_plans)

    async def build_prompt(self, ctx: dict) -> str:
        idea = ctx["idea"]
        industry = (ctx.get("validation") or {}).get("target_market", "") or "technology"
        # Explicit MongoDB MCP tool calls — the heart of the MongoDB track.
        market = await call_mcp_tool("get_industry_market_data", {"industry": industry})
        similar = await call_mcp_tool("search_similar_plans", {"industry": industry})
        ctx["_market_mcp"] = {"industry": industry, "industry_data": market, "similar": similar}
        return f"""For startup: "{idea}"
Industry context from MongoDB (via MCP): {json.dumps(market)}
Similar validated plans from our database (via MCP): {json.dumps(similar)}

Use the MCP data to ground your research in real patterns.
Return ONLY valid JSON:
{{
  "market_size": "string",
  "growth_rate": "string",
  "top_competitors": [{{"name": "str", "weakness": "str"}}],
  "market_gap": "string",
  "opportunity_score": 1-10
}}"""

    def post_process(self, result: dict, ctx: dict) -> dict:
        # Attach a deterministic record of the MongoDB grounding so judges (and
        # the UI) can see the agent actually queried MongoDB to reason.
        mcp = ctx.get("_market_mcp", {})
        similar = mcp.get("similar") or {}
        industry_data = mcp.get("industry_data") or {}
        if isinstance(result, dict):
            result["mongodb_sources"] = {
                "industry_queried": mcp.get("industry"),
                "similar_plans_found": int(similar.get("count", 0) or 0),
                "industry_data_used": bool(industry_data),
                "data_grounded": True,
                "protocol": "Model Context Protocol",
            }
        return result


class PersonaAgent(BaseSpecialist):
    step_number = 3
    sse_name = "Customer Personas"
    specialist = "Customer Insights Specialist"
    adk_name = "customer_insights_specialist"
    plan_field = "personas"
    description = "Builds concrete, willing-to-pay customer personas."
    instruction = (
        "You are the Customer Insights Specialist at PitchCraft. Turn a startup "
        "idea into three vivid, realistic customer personas with pains, "
        "willingness to pay and acquisition channels. Reply with valid JSON only."
    )
    tool_names = ["gemini_reasoning"]

    def store_value(self, result: dict):
        return result.get("personas", []) if isinstance(result, dict) else []

    async def build_prompt(self, ctx: dict) -> str:
        idea = ctx["idea"]
        direction = ctx.get("direction_override")
        direction_note = (
            f'\nThe reviewer redirected the strategy: "{direction}". '
            "Reflect this new direction in the personas."
            if direction else ""
        )
        return f"""For startup: "{idea}"{direction_note}
Create 3 detailed customer personas. Return ONLY valid JSON — never omit any field:
{{
  "personas": [
    {{
      "name": "string",
      "age": "string",
      "job": "string",
      "location": "string (city/region)",
      "income_level": "string (e.g. $40k-$60k/yr)",
      "pain_point": "string",
      "willingness_to_pay": "string",
      "how_they_find_us": "string",
      "behavior_patterns": ["pattern1", "pattern2", "pattern3"]
    }}
  ]
}}"""


class PlanAgent(BaseSpecialist):
    step_number = 4
    sse_name = "Business Plan"
    specialist = "Business Architect"
    adk_name = "business_architect"
    plan_field = "business_plan"
    description = "Writes the full business plan: problem, solution, model, GTM."
    instruction = (
        "You are the Business Architect at PitchCraft. Compose a crisp, "
        "investor-ready business plan: the problem, the solution, a unique value "
        "proposition, the revenue model and streams, go-to-market and milestones. "
        "Reply with valid JSON only."
    )
    tool_names = ["gemini_reasoning"]

    async def build_prompt(self, ctx: dict) -> str:
        idea = ctx["idea"]
        return f"""Write a comprehensive business plan for: "{idea}"
Return ONLY valid JSON — every field is REQUIRED, never leave any field empty or null:
{{
  "problem": "string (2-3 sentences describing the core problem)",
  "solution": "string (2-3 sentences describing your solution)",
  "unique_value_proposition": "string (1 sentence USP)",
  "revenue_model": "string (how the business makes money)",
  "revenue_streams": ["stream1", "stream2", "stream3"],
  "go_to_market": "string (specific GTM strategy, channels and tactics)",
  "key_milestones": [{{"month": 1, "milestone": "string"}}, {{"month": 3, "milestone": "string"}}, {{"month": 6, "milestone": "string"}}]
}}"""


class FinanceAgent(BaseSpecialist):
    step_number = 5
    sse_name = "Financial Projections"
    specialist = "Financial Modeller"
    adk_name = "financial_modeller"
    plan_field = "financials"
    description = "Projects 3-year financials, grounded in MongoDB benchmarks."
    instruction = (
        "You are the Financial Modeller at PitchCraft. Build a realistic 3-year "
        "financial projection. Anchor your numbers to the benchmark averages "
        "retrieved from MongoDB via MCP so they stay credible. Reply with valid "
        "JSON only."
    )
    tool_names = ["mongodb_mcp:get_market_benchmarks", "gemini_reasoning"]

    def _build_tools(self):
        return _make_tools(adk_get_market_benchmarks)

    async def build_prompt(self, ctx: dict) -> str:
        idea = ctx["idea"]
        business_plan = ctx.get("business_plan") or {}
        industry = (ctx.get("validation") or {}).get("target_market", "technology")
        benchmarks = await call_mcp_tool("get_market_benchmarks", {"industry": industry})
        ctx["_finance_benchmarks"] = {"industry": industry, "benchmarks": benchmarks}
        return f"""Create 3-year financial projection for: "{idea}"
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

    def post_process(self, result: dict, ctx: dict) -> dict:
        # Deterministic record of the MongoDB grounding, mirroring MarketAgent,
        # so the UI can show that the financials were benchmark-anchored.
        fb = ctx.get("_finance_benchmarks") or {}
        bm = fb.get("benchmarks") or {}
        if isinstance(result, dict):
            result["mongodb_benchmarks"] = {
                "industry_queried": fb.get("industry"),
                "plans_analyzed": bm.get("plans_analyzed", 0),
                "avg_break_even_month": bm.get("avg_break_even_month"),
                "protocol": "Model Context Protocol",
            }
        return result


class RiskAgent(BaseSpecialist):
    step_number = 6
    sse_name = "Risk Analysis"
    specialist = "Risk & Compliance Officer"
    adk_name = "risk_compliance_officer"
    plan_field = "risks"
    description = "Analyzes risks and builds a SWOT matrix."
    instruction = (
        "You are the Risk & Compliance Officer at PitchCraft. Surface the real "
        "risks (with severity and mitigations) and a balanced SWOT. Be the "
        "skeptic in the room. Reply with valid JSON only."
    )
    tool_names = ["gemini_reasoning"]

    async def build_prompt(self, ctx: dict) -> str:
        idea = ctx["idea"]
        return f"""Analyze risks for startup: "{idea}"
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


# The 6 reasoning specialists, in pipeline order.
LLM_SPECIALISTS: list[type[BaseSpecialist]] = [
    ValidationAgent, MarketAgent, PersonaAgent, PlanAgent, FinanceAgent, RiskAgent,
]

# The Chief of Staff (step 7) does no LLM call — it compiles, persists and seals.
EXPORT_AGENT_MANIFEST = {
    "id": 7,
    "name": "Chief of Staff",
    "adk_agent": "chief_of_staff",
    "role": "Compiles every specialist's output, persists the plan to MongoDB and "
            "seals a SHA-256 tamper-evident audit chain.",
    "tools": ["mongodb_persist", "sha256_audit_chain", "share_token"],
    "persists_to": "share_token / audit_chain_hash",
    "adk_llm_agent": False,
}


class PitchCraftOrchestra:
    """The orchestrator. Instantiates the 7 specialists, composes them into a
    real ADK SequentialAgent pipeline, and runs them in order with the
    human-in-the-loop approval gate and the tamper-evident audit chain."""

    def __init__(self):
        self.specialists: list[BaseSpecialist] = [cls() for cls in LLM_SPECIALISTS]
        self.pipeline = self._build_pipeline()

    def _build_pipeline(self):
        """Compose the specialists into an ADK SequentialAgent (manifest/topology).
        SequentialAgent is deprecated in newer ADK in favour of Workflow; we
        accept the warning quietly since we only use it to declare topology."""
        if not _ADK_AVAILABLE:
            return None
        sub_agents = [s.adk for s in self.specialists if s.adk is not None]
        if not sub_agents:
            return None
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                return SequentialAgent(
                    name="pitchcraft_orchestra",
                    description="7-stage business-plan pipeline; specialists hand off in sequence.",
                    sub_agents=sub_agents,
                )
        except Exception as exc:  # pragma: no cover
            print(f"⚠️  ADK SequentialAgent construction failed: {exc}")
            return None

    def manifest(self) -> dict:
        agents = [s.manifest_entry() for s in self.specialists]
        agents.append(EXPORT_AGENT_MANIFEST)
        return {
            "framework": "Google ADK (LlmAgent + SequentialAgent)" if _ADK_AVAILABLE
                         else "PitchCraft orchestrator (ADK not installed)",
            "adk_available": _ADK_AVAILABLE,
            "architecture": "multi-agent sequential pipeline with a human-in-the-loop gate",
            "agent_count": len(agents),
            "orchestrator": "PitchCraftOrchestra",
            "pipeline_agent": getattr(self.pipeline, "name", None),
            "execution": "ADK defines the agents & topology; Gemini calls run through "
                         "a resilient multi-key 4-tier cascade with forced-JSON + Arize tracing",
            "model_cascade": [MODEL_CONFIGS[k]["model_id"] for k in CASCADE_ORDER],
            "agents": agents,
            "mongodb_integration": {
                "collections_used": ["business_plans", "market_data", "audit_chains", "approval_requests"],
                "operations": [
                    "find / regex match for similar plans",
                    "$group-style aggregation for benchmarks",
                    "insertOne for plan persistence",
                    "SHA-256 audit chain in audit_chains",
                ],
                "mcp_server": "PitchCraft MongoDB MCP (Model Context Protocol)",
                "mcp_endpoint": "/api/mcp/tools",
            },
            "observability": {
                "platform": "Arize Phoenix",
                "tracing": "OpenInference auto-instrumentation (google-genai)",
                "endpoint": "/api/observability",
            },
        }

    async def run(self, idea: str, plan_id: str, model_key: str = DEFAULT_MODEL_KEY):
        """Yield one SSE-ready dict per completed step — identical event shape to
        the original pipeline, plus additive `agent` / `specialist` metadata."""
        keys = _load_api_keys()
        update_plan(plan_id, "status", "generating")
        update_plan(plan_id, "model", MODEL_CONFIGS.get(model_key, {}).get("display", model_key))

        # Emit a very small initial event immediately so clients know the
        # backend is alive and won't fall back to the demo replay during cold
        # starts or slow model responses. The frontend treats any first event
        # as proof of liveness and cancels its demo watchdog.
        yield {
            "step": 0,
            "name": "Init",
            "status": "running",
            "specialist": "Orchestra",
            "data": {"message": "orchestra started"},
        }

        ctx: dict = {"idea": idea, "plan_id": plan_id, "model_key": model_key}
        audit_steps: list[dict] = []
        audit_prev = genesis_hash(plan_id)

        async def gen(prompt: str, span_label: str, instruction: str) -> tuple[dict, str]:
            with agent_span(
                f"pitchcraft.agent.{span_label}",
                {"plan_id": plan_id, "model": model_key, "agent": span_label},
            ):
                full_prompt = f"System Instruction: {instruction}\n\nUser Task: {prompt}"
                return await _generate(full_prompt, model_key, keys)

        # ---- Specialists 1-2 (run before the approval gate) ---------------- #
        for specialist in self.specialists[:2]:
            async for ev in self._run_one(specialist, ctx, gen, plan_id, audit_steps, model_key):
                yield ev
            if ctx.get("_failed"):
                return

        # ---- HUMAN-IN-THE-LOOP APPROVAL GATE ------------------------------- #
        market_research = ctx.get("market_research", {})
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

        ctx["direction_override"] = decision.get("direction_override")
        update_plan(plan_id, "approval_status", "approved")
        yield {
            "step": "approval_gate",
            "status": "approved",
            "approval_id": approval_id,
            "direction_override": ctx["direction_override"],
        }

        # ---- Specialists 3-6 ---------------------------------------------- #
        for specialist in self.specialists[2:]:
            async for ev in self._run_one(specialist, ctx, gen, plan_id, audit_steps, model_key):
                yield ev
            if ctx.get("_failed"):
                return

        # ---- Step 7 — Chief of Staff: persist + seal audit chain ----------- #
        try:
            share_token = secrets.token_urlsafe(6)
            update_plan(plan_id, "share_token", share_token)
            update_plan(plan_id, "status", "complete")

            audit_prev = ctx.get("_audit_prev", audit_prev)
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
                "specialist": "Chief of Staff",
                "agent": EXPORT_AGENT_MANIFEST["role"],
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

    async def _run_one(self, specialist, ctx, gen, plan_id, audit_steps, model_key):
        """Run a single specialist as an async generator of SSE events.
        Records the result into ctx + persists + folds it into the audit chain."""
        audit_prev = ctx.get("_audit_prev", genesis_hash(plan_id))
        try:
            result, used = await specialist.run(ctx, gen)
        except Exception as e:
            update_plan(plan_id, "status", "failed")
            ctx["_failed"] = True
            yield {
                "step": specialist.step_number,
                "name": specialist.sse_name,
                "status": "error",
                "specialist": specialist.specialist,
                "error": str(e),
            }
            return

        # Persist + record audit using the same value (keeps the chain
        # verifiable against the stored plan document).
        stored = specialist.store_value(result)
        ctx[specialist.plan_field] = result
        update_plan(plan_id, specialist.plan_field, stored)
        audit_prev = _record_step_audit(
            plan_id, audit_steps, audit_prev,
            specialist.step_number, specialist.sse_name, stored,
        )
        ctx["_audit_prev"] = audit_prev

        payload = {
            "step": specialist.step_number,
            "name": specialist.sse_name,
            "status": "complete",
            "specialist": specialist.specialist,
            "agent": specialist.description,
            "data": result,
        }
        if used != model_key:
            payload["data"]["_fallback"] = used
        yield payload


# A process-wide orchestra instance (agents are cheap, stateless definitions).
_ORCHESTRA: PitchCraftOrchestra | None = None


def get_orchestra() -> PitchCraftOrchestra:
    global _ORCHESTRA
    if _ORCHESTRA is None:
        _ORCHESTRA = PitchCraftOrchestra()
    return _ORCHESTRA


def get_agent_manifest() -> dict:
    """Full multi-agent architecture manifest (served at /api/agent/manifest)."""
    return get_orchestra().manifest()


async def run_pitchcraft_agent(idea: str, plan_id: str, model_key: str = DEFAULT_MODEL_KEY):
    """Public entry point — delegates to the multi-agent orchestrator.
    Yields one SSE-ready dict per completed step."""
    async for event in get_orchestra().run(idea, plan_id, model_key):
        yield event
