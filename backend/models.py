from pydantic import BaseModel


class IdeaRequest(BaseModel):
    idea: str


class PlanStep(BaseModel):
    step: int
    name: str
    status: str
    data: dict | None = None
