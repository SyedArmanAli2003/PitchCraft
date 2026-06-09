from typing import Literal
from pydantic import BaseModel, field_validator

ModelKey = Literal[
    "gemini-3.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


class IdeaRequest(BaseModel):
    idea: str
    model: ModelKey = "gemini-3.5-flash"

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
