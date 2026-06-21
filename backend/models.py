from typing import Literal
from pydantic import BaseModel, field_validator

# Literals must match MODEL_CONFIGS keys in agent.py — verified live 2026-06-10.
# Old entries kept so stale clients don't 422; agent maps them to the cascade top.
ModelKey = Literal[
    "gemini-3.5-flash",        # OK — default, confirmed working
    "gemini-3.1-flash-lite",   # OK — fast & reliable
    "gemini-2.5-flash-lite",   # OK — stable fallback
    "gemini-2.5-flash",        # Timeout under load but valid model
    "free-gateway",            # Free model gateway (OpenRouter free models)
    "nvidia-llama",            # NVIDIA NIM dedicated free endpoint
    "nvidia-nemotron",         # NVIDIA Nemotron 3 Super 120B (reasoning model)
    # Legacy / dead entries (preserved so old requests don't break):
    "gemini-2.5-pro",
    "deepseek-v4",
    "gemini-3-flash-preview",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "insforge-gateway",        # alias for free-gateway (backward compat)
]


class IdeaRequest(BaseModel):
    idea: str
    model: ModelKey = "gemini-3.5-flash"
    user_id: str | None = None      # device-scoped UUID from localStorage

    @field_validator("idea")
    @classmethod
    def idea_min_length(cls, v: str) -> str:
        cleaned = (v or "").strip()
        if len(cleaned) < 10:
            raise ValueError("Please describe your idea in at least 10 characters")
        if len(cleaned) > 200:
            raise ValueError("Please keep your idea under 200 characters")
        return cleaned


class PlanStep(BaseModel):
    step: int
    name: str
    status: str
    data: dict | None = None


class ApprovalDecision(BaseModel):
    approved: bool
    direction_override: str | None = None
