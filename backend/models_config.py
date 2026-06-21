"""Unified model configuration for PitchCraft - shared between frontend and backend."""

from typing import TypedDict


class ModelOption(TypedDict):
    key: str
    display: str
    tier: int
    badge: str | None
    description: str | None
    quota_status: str  # "ok" | "limited" | "pro_only"
    provider: str  # "gemini" | "nvidia-nim" | "openrouter"


# Single source of truth for all models used in the application
ALL_MODELS: list[ModelOption] = [
    # Gemini models (primary cascade)
    {
        "key": "gemini-3.5-flash",
        "display": "Gemini 3.5 Flash",
        "tier": 1,
        "badge": "Recommended",
        "description": "Latest & fastest — confirmed working",
        "quota_status": "ok",
        "provider": "gemini",
    },
    {
        "key": "gemini-3.1-flash-lite",
        "display": "Gemini 3.1 Flash Lite",
        "tier": 2,
        "badge": "Fast",
        "description": "Lightweight & reliable — separate quota pool",
        "quota_status": "ok",
        "provider": "gemini",
    },
    {
        "key": "gemini-2.5-flash-lite",
        "display": "Gemini 2.5 Flash Lite",
        "tier": 3,
        "badge": "Stable",
        "description": "Solid reasoning, stable free-tier quota",
        "quota_status": "ok",
        "provider": "gemini",
    },
    {
        "key": "gemini-2.5-flash",
        "display": "Gemini 2.5 Flash",
        "tier": 4,
        "badge": "Deep Reasoning",
        "description": "May be slower under high demand",
        "quota_status": "limited",
        "provider": "gemini",
    },
    # NVIDIA NIM models (dedicated free endpoints)
    {
        "key": "nvidia-nemotron",
        "display": "NVIDIA Nemotron 3 Super 120B",
        "tier": 5,
        "badge": "Reasoning",
        "description": "120B MoE reasoning model via NVIDIA — deepest analysis, fast",
        "quota_status": "ok",
        "provider": "nvidia-nim",
    },
    {
        "key": "nvidia-llama",
        "display": "NVIDIA Llama 3.3 70B",
        "tier": 6,
        "badge": "NVIDIA NIM Free",
        "description": "Dedicated free endpoint — no quota limits",
        "quota_status": "ok",
        "provider": "nvidia-nim",
    },
    # OpenRouter free gateway models
    {
        "key": "free-gateway",
        "display": "Free Gateway AI (Gemma 4 31B)",
        "tier": 7,
        "badge": "Free Gateway",
        "description": "Gemma 4 31B via OpenRouter — always free",
        "quota_status": "ok",
        "provider": "openrouter",
    },
]


def get_gemini_models() -> list[ModelOption]:
    """Models that use the Gemini cascade."""
    return [m for m in ALL_MODELS if m["provider"] == "gemini"]


def get_nvidia_models() -> list[ModelOption]:
    """Models that use NVIDIA NIM endpoints."""
    return [m for m in ALL_MODELS if m["provider"] == "nvidia-nim"]


def get_openrouter_models() -> list[ModelOption]:
    """Models that use OpenRouter free gateway."""
    return [m for m in ALL_MODELS if m["provider"] == "openrouter"]


def get_model_by_key(key: str) -> ModelOption | None:
    """Look up a model by its key."""
    for m in ALL_MODELS:
        if m["key"] == key:
            return m
    return None


def get_models_for_frontend() -> list[dict]:
    """Return models formatted for frontend consumption."""
    return [
        {
            "key": m["key"],
            "display": m["display"],
            "tier": m["tier"],
            "badge": m["badge"],
            "description": m["description"],
            "quota_status": m["quota_status"],
        }
        for m in ALL_MODELS
    ]


# Cascade order for Gemini models (used by backend agent)
GEMINI_CASCADE_ORDER = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

# Default model key - Nemotron 3 Super 120B for best reasoning
DEFAULT_MODEL_KEY = "nvidia-nemotron"