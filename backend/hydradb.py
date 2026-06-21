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
