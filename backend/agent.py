"""The 7-step PitchCraft agent with multi-model support.

Model tiers (user-selectable; Gemini auto-falls-back to Llama):
  Tier 1 — gemini   : Gemini 3 Flash           (Google AI)
  Tier 2 — llama    : Llama 3.3 70B Instruct (Free)   (OpenRouter)
  Tier 3 — deepseek : DeepSeek V4 Flash                (NVIDIA)
  Tier 4 — minimax  : MiniMax M2.7                     (NVIDIA)
"""

import os
import json
import secrets
import asyncio

import google.generativeai as genai
from openai import OpenAI
from dotenv import load_dotenv

from mongodb import (
    update_plan,
    search_market_data,
    mcp_search_similar_plans,
)

load_dotenv()

# --------------------------------------------------------------------------- #
# Model registry
# --------------------------------------------------------------------------- #

# Gemini client (tier 1) — configured lazily so a missing key doesn't crash import
_gemini_model = None
_gemini_model_name: str | None = None  # track which model was cached


def _get_gemini_model():
    global _gemini_model, _gemini_model_name
    current_name = os.getenv("GEMINI_MODEL", "gemini-3.0-flash")
    # If env changed (e.g. .env reloaded) reset the cache
    if _gemini_model is not None and _gemini_model_name == current_name:
        return _gemini_model
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key.startswith("your") or api_key.startswith("<"):
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Set a real key in backend/.env to use the Gemini model."
        )
    genai.configure(api_key=api_key)
    _gemini_model = genai.GenerativeModel(current_name)
    _gemini_model_name = current_name
    return _gemini_model

MODEL_CONFIGS: dict[str, dict] = {
    "gemini": {
        "display": "Gemini 3 Flash",
        "tier": 1,
        "provider": "gemini",
    },
    "llama": {
        "display": "Llama 3.3 70B Instruct (Free)",
        "tier": 2,
        "provider": "openrouter",
        "model_id": "meta-llama/llama-3.3-70b-instruct:free",
        "base_url": "https://openrouter.ai/api/v1",
        "api_key_env": "OPENROUTER_API_KEY",
    },
    "deepseek": {
        "display": "DeepSeek V4 Flash",
        "tier": 3,
        "provider": "nvidia",
        "model_id": "deepseek-ai/deepseek-v4-flash",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "api_key_env": "NVIDIA_API_KEY_DEEPSEEK",
        "extra_body": {
            "chat_template_kwargs": {"thinking": True, "reasoning_effort": "high"}
        },
        "max_tokens": 16384,
    },
    "minimax": {
        "display": "MiniMax M2.7",
        "tier": 4,
        "provider": "nvidia",
        "model_id": "minimaxai/minimax-m2.7",
        "base_url": "https://integrate.api.nvidia.com/v1",
        "api_key_env": "NVIDIA_API_KEY_MINIMAX",
        "max_tokens": 8192,
    },
}


def get_models_list() -> list[dict]:
    """Return the model registry in a format safe to expose via the API."""
    return [
        {"key": k, "display": v["display"], "tier": v["tier"]}
        for k, v in MODEL_CONFIGS.items()
    ]


# --------------------------------------------------------------------------- #
# Core call helpers
# --------------------------------------------------------------------------- #

def parse_json_response(text: str) -> dict:
    """Strip markdown fences from a model response and parse the JSON."""
    clean = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        return {"raw": text}


def _call_gemini(prompt: str) -> dict:
    model = _get_gemini_model()
    response = model.generate_content(prompt)
    return parse_json_response(response.text)


def _call_openai_compat(prompt: str, cfg: dict) -> dict:
    """Shared caller for OpenRouter and NVIDIA (both speak the OpenAI API)."""
    api_key = os.getenv(cfg["api_key_env"], "")
    client = OpenAI(base_url=cfg["base_url"], api_key=api_key)

    kwargs: dict = {
        "model": cfg["model_id"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 1,
        "top_p": 0.95,
        "max_tokens": cfg.get("max_tokens", 8192),
    }

    if cfg["provider"] == "openrouter":
        kwargs["extra_headers"] = {
            "HTTP-Referer": "https://pitchcraft.app",
            "X-Title": "PitchCraft",
        }

    if "extra_body" in cfg:
        kwargs["extra_body"] = cfg["extra_body"]

    completion = client.chat.completions.create(**kwargs)
    content = completion.choices[0].message.content or ""
    return parse_json_response(content)


async def _call_model(prompt: str, model_key: str) -> dict:
    """Dispatch to the right provider, running the sync call off the event loop."""
    cfg = MODEL_CONFIGS[model_key]
    if cfg["provider"] == "gemini":
        return await asyncio.to_thread(_call_gemini, prompt)
    return await asyncio.to_thread(_call_openai_compat, prompt, cfg)


async def _generate(prompt: str, model_key: str = "gemini") -> dict:
    """Call the chosen model.

    When model_key is 'gemini' and the call fails, automatically retries with
    Llama (tier 2) before propagating the error.
    """
    try:
        return await _call_model(prompt, model_key)
    except Exception as primary_err:
        if model_key == "gemini":
            try:
                result = await _call_model(prompt, "llama")
                result["_fallback"] = "llama"
                return result
            except Exception:
                pass  # surface original Gemini error, not the fallback error
        raise primary_err


# --------------------------------------------------------------------------- #
# 7-step agent
# --------------------------------------------------------------------------- #

async def run_pitchcraft_agent(idea: str, plan_id: str, model_key: str = "gemini"):
    """Generate a full business plan, yielding one SSE event per completed step."""
    update_plan(plan_id, "status", "generating")
    update_plan(plan_id, "model", MODEL_CONFIGS[model_key]["display"])

    # convenience wrapper — every step call just passes the current model_key
    async def gen(prompt: str) -> dict:
        return await _generate(prompt, model_key)

    # ----- STEP 1 — Validate idea -------------------------------------- #
    prompt1 = f"""Analyze this startup idea: "{idea}"
Return ONLY valid JSON:
{{
  "viable": true/false,
  "viability_score": 1-10,
  "one_line_summary": "string",
  "core_problem_solved": "string",
  "target_market": "string",
  "innovation_factor": "string",
  "main_concerns": ["concern1", "concern2"]
}}"""
    try:
        validation = await gen(prompt1)
        update_plan(plan_id, "validation", validation)
        yield {"step": 1, "name": "Validation",
               "status": "complete", "data": validation}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 1, "name": "Validation",
               "status": "error", "error": str(e)}
        return

    # ----- STEP 2 — Search MongoDB for market data --------------------- #
    industry = validation.get("target_market", "")
    market = search_market_data(industry)
    mcp_context = mcp_search_similar_plans(
        validation.get("target_market", "technology")
    )

    prompt2 = f"""For startup: "{idea}"
Industry context from MongoDB: {json.dumps(market)}
Similar validated plans from our database (via MCP): {json.dumps(mcp_context)}

Use the MCP data to ground your research in real patterns.
Return ONLY valid JSON:
{{
  "market_size": "string",
  "growth_rate": "string",
  "top_competitors": [
    {{"name": "str", "weakness": "str"}}
  ],
  "market_gap": "string",
  "opportunity_score": 1-10
}}"""
    try:
        market_research = await gen(prompt2)
        update_plan(plan_id, "market_research", market_research)
        yield {"step": 2, "name": "Market Research",
               "status": "complete", "data": market_research}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 2, "name": "Market Research",
               "status": "error", "error": str(e)}
        return

    # ----- STEP 3 — Customer personas ---------------------------------- #
    prompt3 = f"""For startup: "{idea}"
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
        personas = await gen(prompt3)
        update_plan(plan_id, "personas", personas.get("personas", []))
        yield {"step": 3, "name": "Customer Personas",
               "status": "complete", "data": personas}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 3, "name": "Customer Personas",
               "status": "error", "error": str(e)}
        return

    # ----- STEP 4 — Full business plan --------------------------------- #
    prompt4 = f"""Write a business plan for: "{idea}"
Return ONLY valid JSON:
{{
  "problem": "string",
  "solution": "string",
  "unique_value_proposition": "string",
  "revenue_model": "string",
  "revenue_streams": ["stream1", "stream2"],
  "go_to_market": "string",
  "key_milestones": [
    {{"month": 1, "milestone": "string"}}
  ]
}}"""
    try:
        business_plan = await gen(prompt4)
        update_plan(plan_id, "business_plan", business_plan)
        yield {"step": 4, "name": "Business Plan",
               "status": "complete", "data": business_plan}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 4, "name": "Business Plan",
               "status": "error", "error": str(e)}
        return

    # ----- STEP 5 — Financial projections ------------------------------ #
    prompt5 = f"""Create 3-year financial projection for: "{idea}"
Revenue model: {business_plan.get('revenue_model', 'SaaS')}
Return ONLY valid JSON:
{{
  "year1_revenue": "string",
  "year2_revenue": "string",
  "year3_revenue": "string",
  "startup_cost": "string",
  "monthly_burn": "string",
  "break_even_month": number,
  "funding_needed": "string"
}}"""
    try:
        financials = await gen(prompt5)
        update_plan(plan_id, "financials", financials)
        yield {"step": 5, "name": "Financial Projections",
               "status": "complete", "data": financials}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 5, "name": "Financial Projections",
               "status": "error", "error": str(e)}
        return

    # ----- STEP 6 — Risk analysis -------------------------------------- #
    prompt6 = f"""Analyze risks for startup: "{idea}"
Return ONLY valid JSON:
{{
  "risks": [
    {{
      "risk": "string",
      "severity": "High/Medium/Low",
      "mitigation": "string"
    }}
  ],
  "swot": {{
    "strengths": ["str"],
    "weaknesses": ["str"],
    "opportunities": ["str"],
    "threats": ["str"]
  }}
}}"""
    try:
        risks = await gen(prompt6)
        update_plan(plan_id, "risks", risks)
        yield {"step": 6, "name": "Risk Analysis",
               "status": "complete", "data": risks}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 6, "name": "Risk Analysis",
               "status": "error", "error": str(e)}
        return

    # ----- STEP 7 — Finalize + generate share token -------------------- #
    try:
        share_token = secrets.token_urlsafe(6)
        update_plan(plan_id, "share_token", share_token)
        update_plan(plan_id, "status", "complete")
        yield {"step": 7, "name": "Complete",
               "status": "complete",
               "data": {"share_token": share_token, "plan_id": plan_id,
                        "model_used": MODEL_CONFIGS[model_key]["display"]}}
    except Exception as e:
        update_plan(plan_id, "status", "failed")
        yield {"step": 7, "name": "Complete",
               "status": "error", "error": str(e)}
        return
