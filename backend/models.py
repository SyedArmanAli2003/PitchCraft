from typing import Literal
from pydantic import BaseModel

# Valid model keys the user can choose from the frontend.
ModelKey = Literal["gemini", "llama", "deepseek", "minimax"]


class IdeaRequest(BaseModel):
    idea: str
    model: ModelKey = "gemini"


class PlanStep(BaseModel):
    step: int
    name: str
    status: str
    data: dict | None = None
