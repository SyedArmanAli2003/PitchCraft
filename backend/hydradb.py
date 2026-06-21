"""HydraDB integration for PitchCraft — chat memory & context layer.

HydraDB provides persistent semantic memory for the ChatBot.
Each user (sub_tenant) gets their own isolated memory space.

Architecture:
  - tenant_id = HYDRA_DB_TENANT_ID (org-level, shared across all users)
  - sub_tenant_id = user_id (device-scoped UUID, per-user isolation)

Usage:
  - ingest_chat_memory() — store a user/assistant exchange after each message
  - query_chat_context() — retrieve relevant past context before generating reply
  - hydradb_ready() — health check

The client is initialized lazily and all errors are caught so HydraDB
issues never crash the main chat endpoint.
"""

import json
import os

from dotenv import load_dotenv

load_dotenv()

_CLIENT = None
_TENANT_READY = False


def _get_client():
    """Lazy-initialize the HydraDB client. Returns None if SDK not available."""
    global _CLIENT
    if _CLIENT is not None:
        return _CLIENT
    api_key = os.getenv("HYDRA_DB_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        # pyrefly: ignore [missing-import]
        from hydra_db import HydraDB
        _CLIENT = HydraDB(token=api_key)
    except Exception as exc:
        print(f"[hydradb] SDK init failed: {exc}")
        _CLIENT = None
    return _CLIENT


def hydradb_ready() -> bool:
    """Returns True if HydraDB client is initialized and key is present."""
    return _get_client() is not None


def _tenant_id() -> str:
    return os.getenv("HYDRA_DB_TENANT_ID", "pitchcraft")


def ensure_tenant() -> bool:
    """Create the HydraDB tenant if it doesn't exist. Idempotent — safe to call
    on every startup. Returns True if tenant is ready."""
    global _TENANT_READY
    if _TENANT_READY:
        return True
    client = _get_client()
    if client is None:
        return False
    tid = _tenant_id()
    try:
        # Try to get status first — if it 404s, tenant doesn't exist yet
        status = client.tenants.status(tenant_id=tid)
        if status.data.infra.ready_for_ingestion:
            _TENANT_READY = True
            print(f"[hydradb] Tenant '{tid}' ready.")
            return True
        # Tenant exists but infra not ready yet — poll briefly
        import time
        for _ in range(10):
            status = client.tenants.status(tenant_id=tid)
            if status.data.infra.ready_for_ingestion:
                _TENANT_READY = True
                return True
            time.sleep(3)
        return False
    except Exception:
        # Tenant probably doesn't exist — create it
        pass
    try:
        client.tenants.create(tenant_id=tid)
        import time
        for _ in range(15):
            time.sleep(4)
            try:
                status = client.tenants.status(tenant_id=tid)
                if status.data.infra.ready_for_ingestion:
                    _TENANT_READY = True
                    print(f"[hydradb] Tenant '{tid}' created and ready.")
                    return True
            except Exception:
                pass
        print(f"[hydradb] Tenant '{tid}' creation timed out.")
        return False
    except Exception as exc:
        # 409 TENANT_ALREADY_EXISTS is fine
        if "TENANT_ALREADY_EXISTS" in str(exc) or "409" in str(exc):
            _TENANT_READY = True
            return True
        print(f"[hydradb] Tenant creation error: {exc}")
        return False


def ingest_chat_memory(user_id: str, user_msg: str, assistant_reply: str) -> bool:
    """Store a chat exchange in HydraDB as a memory for this user.
    Uses infer=True so HydraDB extracts durable preferences/facts.
    Returns True on success."""
    client = _get_client()
    if client is None:
        return False
    if not _TENANT_READY:
        ensure_tenant()
    try:
        import uuid
        memory_id = f"chat_{user_id}_{uuid.uuid4().hex[:8]}"
        client.context.ingest(
            type="memory",
            tenant_id=_tenant_id(),
            sub_tenant_id=user_id,
            memories=json.dumps([{
                "id": memory_id,
                "text": f"User: {user_msg}\nAssistant: {assistant_reply}",
                "infer": True,
                "user_name": user_id,
                "additional_metadata": {"source": "pitchcraft_chat"},
            }]),
        )
        return True
    except Exception as exc:
        print(f"[hydradb] ingest_chat_memory error: {exc}")
        return False


def query_chat_context(user_id: str, query: str, max_results: int = 5) -> str:
    """Retrieve relevant past memories for this user to provide chat context.
    Returns a formatted string ready to prepend to the LLM system prompt."""
    client = _get_client()
    if client is None:
        return ""
    if not _TENANT_READY:
        ensure_tenant()
    try:
        result = client.query(
            tenant_id=_tenant_id(),
            sub_tenant_id=user_id,
            query=query,
            type="memory",
            query_by="hybrid",
            mode="fast",
            max_results=max_results,
        )
        chunks = result.data.chunks
        if not chunks:
            return ""
        lines = []
        for c in chunks:
            content = getattr(c, "chunk_content", None) or str(c)
            lines.append(f"- {content}")
        return "Relevant past context from this user:\n" + "\n".join(lines)
    except Exception as exc:
        print(f"[hydradb] query_chat_context error: {exc}")
        return ""


def ingest_plan_as_knowledge(user_id: str, plan_id: str, plan: dict) -> bool:
    """Ingest a completed business plan into HydraDB as durable knowledge.

    This is the MongoDB+HydraDB combo: MongoDB holds the full structured plan
    (persistence, audit chain, admin queries), while HydraDB holds a semantic
    knowledge representation so the ChatBot and future agents can retrieve
    relevant plan context via natural language queries.

    Uses type="knowledge" so chunks are indexed for semantic + keyword retrieval.
    The knowledge is scoped to the user's sub_tenant for isolation.
    """
    client = _get_client()
    if client is None:
        return False
    if not _TENANT_READY:
        ensure_tenant()
    try:
        import uuid

        validation = plan.get("validation") or {}
        market = plan.get("market_research") or {}
        business = plan.get("business_plan") or {}
        financials = plan.get("financials") or {}
        risks = plan.get("risks") or {}

        # Build a rich text representation of the plan for semantic retrieval
        plan_text = f"""Business Plan: {plan.get('idea', 'N/A')}

VALIDATION:
Summary: {validation.get('one_line_summary', 'N/A')}
Viability Score: {validation.get('viability_score', 'N/A')}/10
Core Problem: {validation.get('core_problem_solved', 'N/A')}
Target Market: {validation.get('target_market', 'N/A')}
Innovation: {validation.get('innovation_factor', 'N/A')}
Main Concerns: {', '.join(validation.get('main_concerns', []))}

MARKET RESEARCH:
Market Size: {market.get('market_size', 'N/A')}
Growth Rate: {market.get('growth_rate', 'N/A')}
Market Gap: {market.get('market_gap', 'N/A')}
Opportunity Score: {market.get('opportunity_score', 'N/A')}/10

BUSINESS PLAN:
Problem: {business.get('problem', 'N/A')}
Solution: {business.get('solution', 'N/A')}
USP: {business.get('unique_value_proposition', 'N/A')}
Revenue Model: {business.get('revenue_model', 'N/A')}
Revenue Streams: {', '.join(business.get('revenue_streams', []))}
Go-to-Market: {business.get('go_to_market', 'N/A')}

FINANCIALS:
Year 1 Revenue: {financials.get('year1_revenue', 'N/A')}
Year 2 Revenue: {financials.get('year2_revenue', 'N/A')}
Year 3 Revenue: {financials.get('year3_revenue', 'N/A')}
Startup Cost: {financials.get('startup_cost', 'N/A')}
Monthly Burn: {financials.get('monthly_burn', 'N/A')}
Break-even Month: {financials.get('break_even_month', 'N/A')}
Funding Needed: {financials.get('funding_needed', 'N/A')}

RISKS:
{chr(10).join([f"- {r.get('risk', '')} (Severity: {r.get('severity', '')}): {r.get('mitigation', '')}" for r in (risks.get('risks') or [])])}

SWOT:
Strengths: {', '.join((risks.get('swot') or {}).get('strengths', []))}
Weaknesses: {', '.join((risks.get('swot') or {}).get('weaknesses', []))}
Opportunities: {', '.join((risks.get('swot') or {}).get('opportunities', []))}
Threats: {', '.join((risks.get('swot') or {}).get('threats', []))}
"""

        knowledge_id = f"plan_{plan_id}"
        client.context.ingest(
            type="knowledge",
            tenant_id=_tenant_id(),
            sub_tenant_id=user_id,
            knowledge=json.dumps([{
                "id": knowledge_id,
                "text": plan_text,
                "additional_metadata": {
                    "source": "pitchcraft_plan",
                    "plan_id": plan_id,
                    "idea": plan.get("idea", ""),
                    "status": plan.get("status", "complete"),
                },
            }]),
        )
        print(f"[hydradb] Plan {plan_id} ingested as knowledge for user {user_id}")
        return True
    except Exception as exc:
        print(f"[hydradb] ingest_plan_as_knowledge error: {exc}")
        return False


def query_full_context(user_id: str, query: str, max_results: int = 5) -> str:
    """Combined MongoDB+HydraDB context query for the ChatBot.

    Retrieves BOTH:
    1. Knowledge chunks — semantic retrieval from ingested business plans
    2. Memory chunks — chat history and inferred user preferences

    Returns a formatted string to prepend to the LLM system prompt,
    giving the ChatBot full awareness of the user's business context.
    """
    client = _get_client()
    if client is None:
        return ""
    if not _TENANT_READY:
        ensure_tenant()

    sections = []

    # Query knowledge (business plans)
    try:
        k_result = client.query(
            tenant_id=_tenant_id(),
            sub_tenant_id=user_id,
            query=query,
            type="knowledge",
            query_by="hybrid",
            mode="thinking",   # deep reasoning mode for plan context
            max_results=max_results,
        )
        k_chunks = k_result.data.chunks
        if k_chunks:
            lines = [f"- {getattr(c, 'chunk_content', str(c))}" for c in k_chunks]
            sections.append("User's Business Plan Context:\n" + "\n".join(lines))
    except Exception as exc:
        print(f"[hydradb] knowledge query error: {exc}")

    # Query memory (chat history + inferred facts)
    try:
        m_result = client.query(
            tenant_id=_tenant_id(),
            sub_tenant_id=user_id,
            query=query,
            type="memory",
            query_by="hybrid",
            mode="fast",
            max_results=3,
        )
        m_chunks = m_result.data.chunks
        if m_chunks:
            lines = [f"- {getattr(c, 'chunk_content', str(c))}" for c in m_chunks]
            sections.append("Relevant Past Conversations:\n" + "\n".join(lines))
    except Exception as exc:
        print(f"[hydradb] memory query error: {exc}")

    return "\n\n".join(sections) if sections else ""
