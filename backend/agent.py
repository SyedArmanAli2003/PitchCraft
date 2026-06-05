"""The 7-step PitchCraft agent.

Each step calls Gemini, parses the JSON result, persists it to MongoDB and
yields a progress event so the API can stream the plan as it is built.
"""

import os
import json
import secrets
import asyncio

import google.generativeai as genai
from dotenv import load_dotenv

from mongodb import (
    update_plan,
    search_market_data,
)

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Model is configurable so it's easy to switch as new versions ship.
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.0-flash")
model = genai.GenerativeModel(MODEL_NAME)


def parse_json_response(text: str) -> dict:
    """Strip markdown code fences from a model response and parse the JSON.

    Falls back to {"raw": text} when the model returns something that isn't
    valid JSON, so the pipeline never crashes on a malformed step.
    """
    clean = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        return {"raw": text}


async def _generate(prompt: str) -> dict:
    """Run the (synchronous) Gemini call off the event loop and parse it."""
    response = await asyncio.to_thread(model.generate_content, prompt)
    return parse_json_response(response.text)


async def run_pitchcraft_agent(idea: str, plan_id: str):
    """Generate a full business plan, yielding one event per completed step."""
    try:
        # ----- STEP 1 — Validate idea -------------------------------------- #
        update_plan(plan_id, "status", "generating")

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

        validation = await _generate(prompt1)
        update_plan(plan_id, "validation", validation)
        yield {"step": 1, "name": "Validation",
               "status": "complete", "data": validation}

        # ----- STEP 2 — Search MongoDB for market data --------------------- #
        industry = validation.get("target_market", "")
        market = search_market_data(industry)

        prompt2 = f"""For this startup: "{idea}"
Industry context: {json.dumps(market)}
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

        market_research = await _generate(prompt2)
        update_plan(plan_id, "market_research", market_research)
        yield {"step": 2, "name": "Market Research",
               "status": "complete", "data": market_research}

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

        personas = await _generate(prompt3)
        update_plan(plan_id, "personas", personas.get("personas", []))
        yield {"step": 3, "name": "Customer Personas",
               "status": "complete", "data": personas}

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

        business_plan = await _generate(prompt4)
        update_plan(plan_id, "business_plan", business_plan)
        yield {"step": 4, "name": "Business Plan",
               "status": "complete", "data": business_plan}

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

        financials = await _generate(prompt5)
        update_plan(plan_id, "financials", financials)
        yield {"step": 5, "name": "Financial Projections",
               "status": "complete", "data": financials}

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

        risks = await _generate(prompt6)
        update_plan(plan_id, "risks", risks)
        yield {"step": 6, "name": "Risk Analysis",
               "status": "complete", "data": risks}

        # ----- STEP 7 — Finalize + generate share token -------------------- #
        share_token = secrets.token_urlsafe(6)
        update_plan(plan_id, "share_token", share_token)
        update_plan(plan_id, "status", "complete")
        yield {"step": 7, "name": "Complete",
               "status": "complete",
               "data": {"share_token": share_token, "plan_id": plan_id}}

    except Exception as exc:  # noqa: BLE001 - surface any step failure to client
        update_plan(plan_id, "status", "failed")
        yield {"step": 0, "name": "Error",
               "status": "failed", "data": {"error": str(exc)}}
