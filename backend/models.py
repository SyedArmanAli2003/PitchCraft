from typing import Literal
from pydantic import BaseModel, field_validator

# Current cascade tiers first; older keys kept so stale clients don't 422 —
# agent.py maps unknown keys to the top of the cascade.
ModelKey = Literal[
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-pro",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


class IdeaRequest(BaseModel):
    idea: str
    model: ModelKey = "gemini-3-flash-preview"

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
