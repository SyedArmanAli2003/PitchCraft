"""SHA-256 tamper-evident audit chain for PitchCraft.  (utility module)

Each completed agent step is hashed; every hash folds in the previous step's
hash, forming a chain anchored to a genesis hash derived from the plan_id.
If any step's stored output is later mutated, its recomputed hash diverges
from the recorded one — the chain "breaks", proving the plan was tampered.

Deterministic: identical inputs always yield identical hashes. Timestamps are
metadata only and never enter a hash, so re-building never changes a hash.

NOTE on signatures: build_/verify_audit_chain take an explicit `plan_id`
because the genesis hash (the anchor for step 1) is SHA-256 of the plan_id.
"""

import hashlib
import json
from datetime import datetime, timezone


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def genesis_hash(plan_id: str) -> str:
    """Anchor hash for step 1 — SHA-256 of the plan_id."""
    return _sha256(str(plan_id))


def hash_step(step_number: int, step_name: str, data, previous_hash: str) -> str:
    """SHA-256 of step_number + step_name + canonical-JSON(data) + previous_hash.

    `sort_keys=True` makes the JSON canonical so key ordering can never change
    the hash; `|` delimiters keep the concatenated fields unambiguous.
    """
    canonical = json.dumps(data, sort_keys=True, default=str, separators=(",", ":"))
    return _sha256(f"{step_number}|{step_name}|{canonical}|{previous_hash}")


def build_audit_chain(steps: list[dict], plan_id: str) -> list[dict]:
    """Fold an ordered list of {step, name, data} into a hash chain.

    Returns one record per step:
    {step_number, step_name, hash, previous_hash, timestamp_utc}.
    """
    chain: list[dict] = []
    prev = genesis_hash(plan_id)
    now = datetime.now(timezone.utc).isoformat()
    for s in steps:
        number = s.get("step", s.get("step_number"))
        name = s.get("name", s.get("step_name", ""))
        h = hash_step(number, name, s.get("data"), prev)
        chain.append({
            "step_number": number,
            "step_name": name,
            "hash": h,
            "previous_hash": prev,
            "timestamp_utc": now,
        })
        prev = h
    return chain


def verify_audit_chain(chain: list[dict], steps: list[dict], plan_id: str) -> dict:
    """Re-fold `steps` and confirm every hash matches the recorded `chain`.

    Returns {valid: bool, broken_at_step: int | None, message: str}.
    """
    if len(chain) != len(steps):
        return {"valid": False, "broken_at_step": None,
                "message": f"Chain length {len(chain)} does not match steps {len(steps)}."}
    prev = genesis_hash(plan_id)
    for entry, s in zip(chain, steps):
        number = entry.get("step_number")
        name = entry.get("step_name", "")
        expected = hash_step(number, name, s.get("data"), prev)
        if entry.get("previous_hash") != prev or entry.get("hash") != expected:
            return {"valid": False, "broken_at_step": number,
                    "message": f"Tamper detected at step {number} — output was modified after signing."}
        prev = entry["hash"]
    return {"valid": True, "broken_at_step": None,
            "message": "Audit chain verified — every step is authentic and unmodified."}


def reconstruct_steps_from_plan(plan: dict) -> list[dict]:
    """Rebuild the ordered step list from a stored plan document, matching
    exactly what was hashed during generation (used to verify after the fact)."""
    return [
        {"step": 1, "name": "Validation", "data": plan.get("validation", {})},
        {"step": 2, "name": "Market Research", "data": plan.get("market_research", {})},
        {"step": 3, "name": "Customer Personas", "data": plan.get("personas", [])},
        {"step": 4, "name": "Business Plan", "data": plan.get("business_plan", {})},
        {"step": 5, "name": "Financial Projections", "data": plan.get("financials", {})},
        {"step": 6, "name": "Risk Analysis", "data": plan.get("risks", {})},
        {"step": 7, "name": "Complete",
         "data": {"share_token": plan.get("share_token"), "status": "complete"}},
    ]
