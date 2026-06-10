"""Arize Phoenix observability for PitchCraft (the Arize partner track).

Every Gemini call the agent makes is auto-traced to Arize Phoenix using
OpenInference's `google-genai` instrumentor, and each of the 7 agent steps is
wrapped in its own span (see `agent_span`). Open the Phoenix project to see the
full agent trace tree: one parent span per step, each with the child LLM call,
its prompt, the model actually used, token counts and latency.

EVERYTHING here is best-effort and defensive:
  * If the Phoenix / OpenInference packages are not installed, or no
    PHOENIX_API_KEY is set, observability silently disables itself.
  * `init_observability()` never raises; `agent_span()` always yields, tracing
    or not. Telemetry can never crash plan generation.

Configure via .env:
  PHOENIX_API_KEY        Phoenix Cloud API key (required to enable tracing)
  PHOENIX_COLLECTOR_ENDPOINT / PHOENIX_BASE_URL   collector URL
                         (default https://app.phoenix.arize.com)
  PHOENIX_PROJECT        project name shown in Phoenix (default "pitchcraft")
"""

import os
from contextlib import contextmanager

from dotenv import load_dotenv

load_dotenv()

_STATE: dict = {"enabled": False, "project": None, "endpoint": None, "error": None}
_TRACER = None


def _log(msg: str) -> None:
    """Print without ever raising on consoles that can't encode the text
    (e.g. Windows cp1252). Logging must never take the app down."""
    try:
        print(msg)
    except Exception:
        try:
            print(msg.encode("ascii", "replace").decode("ascii"))
        except Exception:
            pass


def init_observability() -> dict:
    """Wire up Phoenix tracing + the google-genai instrumentor. Idempotent.

    Returns a status dict (also retrievable later via `observability_status()`).
    """
    global _TRACER

    if _STATE["enabled"]:
        return observability_status()

    api_key = os.getenv("PHOENIX_API_KEY", "").strip()
    if not api_key or api_key.startswith("<") or api_key.lower().startswith("your"):
        _STATE["error"] = "PHOENIX_API_KEY not set — Arize tracing disabled."
        return observability_status()

    endpoint = (
        os.getenv("PHOENIX_COLLECTOR_ENDPOINT", "").strip()
        or os.getenv("PHOENIX_BASE_URL", "").strip()
        or "https://app.phoenix.arize.com"
    )
    project = os.getenv("PHOENIX_PROJECT", "").strip() or "pitchcraft"

    try:
        # Phoenix's register() reads these env vars to authenticate + route spans.
        os.environ.setdefault("PHOENIX_COLLECTOR_ENDPOINT", endpoint)
        os.environ["PHOENIX_API_KEY"] = api_key

        from phoenix.otel import register

        tracer_provider = register(
            project_name=project,
            auto_instrument=True,   # picks up openinference-instrumentation-google-genai
            set_global_tracer_provider=True,
            # BatchSpanProcessor exports spans on a background thread. The default
            # SimpleSpanProcessor exports synchronously and blocks the agent
            # pipeline for the full OTLP retry window when the collector is slow
            # (measured: +80 s on step 1).
            batch=True,
        )

        # Belt-and-suspenders: instrument the google-genai client explicitly too,
        # in case auto-instrumentation didn't detect it. (Harmless if already done.)
        try:
            from openinference.instrumentation.google_genai import GoogleGenAIInstrumentor

            instr = GoogleGenAIInstrumentor()
            if not instr.is_instrumented_by_opentelemetry:
                instr.instrument(tracer_provider=tracer_provider, skip_dep_check=True)
        except Exception:
            pass

        _TRACER = tracer_provider.get_tracer("pitchcraft.agent")
        _STATE.update({"enabled": True, "project": project, "endpoint": endpoint, "error": None})
    except Exception as exc:  # missing packages, bad endpoint, etc. — never fatal
        _STATE["error"] = f"{type(exc).__name__}: {exc}"

    if _STATE["enabled"]:
        _log(f"[phoenix] Arize tracing enabled - project '{project}' -> {endpoint}")
    else:
        _log(f"[phoenix] Arize tracing unavailable ({_STATE['error']}). Continuing without it.")

    return observability_status()


def observability_status() -> dict:
    """Snapshot of the current tracing state — surfaced at /api/observability."""
    return {
        "provider": "arize-phoenix",
        "enabled": _STATE["enabled"],
        "project": _STATE["project"],
        "endpoint": _STATE["endpoint"],
        "detail": _STATE["error"],
    }


@contextmanager
def agent_span(name: str, attributes: dict | None = None):
    """Open an OpenInference CHAIN span around an agent step. No-op if tracing
    is disabled. Always yields so callers can wrap work unconditionally."""
    if _TRACER is None:
        yield None
        return
    try:
        with _TRACER.start_as_current_span(name) as span:
            try:
                span.set_attribute("openinference.span.kind", "CHAIN")
                for k, v in (attributes or {}).items():
                    if v is not None:
                        span.set_attribute(str(k), v if isinstance(v, (str, int, float, bool)) else str(v))
            except Exception:
                pass
            yield span
    except Exception:
        raise
