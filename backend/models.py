from typing import Literal
from pydantic import BaseModel

ModelKey = Literal[
    "gemini-3-pro",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]


class IdeaRequest(BaseModel):
    idea: str
    model: ModelKey = "gemini-3-flash"


class PlanStep(BaseModel):
    step: int
    name: str
    status: str
    data: dict | None = None


class ApprovalDecision(BaseModel):
    approved: bool
    direction_override: str | None = None
