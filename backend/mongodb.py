"""MongoDB connection, queries, and seed data for PitchCraft."""

import os
import re
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, TEXT
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB", "pitchcraft")

# ---------------------------------------------------------------------------
# Lazy client
# ---------------------------------------------------------------------------

_client: MongoClient | None = None
_db = None
_mongo_available = False


def _get_db():
    global _client, _db, _mongo_available
    if _db is not None:
        return _db
    uri = MONGODB_URI.strip()
    if not uri or "<" in uri or "your" in uri.lower():
        return None
    try:
        kwargs: dict = {"serverSelectionTimeoutMS": 5000, "tls": True}
        # Secure by default: ship a known-good CA bundle via certifi (fixes the
        # common Windows "CERTIFICATE_VERIFY_FAILED" against Atlas). Opt into
        # insecure verification only if MONGODB_TLS_INSECURE is truthy.
        if os.getenv("MONGODB_TLS_INSECURE", "").strip().lower() in ("1", "true", "yes"):
            kwargs["tlsAllowInvalidCertificates"] = True
        else:
            try:
                import certifi
                kwargs["tlsCAFile"] = certifi.where()
            except Exception:
                pass
        _client = MongoClient(uri, **kwargs)
        _client.admin.command("ping")
        _db = _client[DB_NAME]
        _mongo_available = True
        return _db
    except Exception as exc:
        print(f"❌ MongoDB connection failed: {exc}")
        _client = None
        return None


def _collections():
    db = _get_db()
    if db is None:
        return None, None
    return db["business_plans"], db["market_data"]


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

SEED_MARKET_DATA = [
    {
        "industry": "Technology",
        "market_size": "$5.3 trillion globally (2024)",
        "growth_rate": "8% CAGR",
        "key_players": ["Apple", "Microsoft", "Google", "Amazon", "NVIDIA"],
        "avg_revenue": "$50M for mid-stage startups",
        "challenges": ["Rapid obsolescence", "High talent costs", "Intense competition", "Security and privacy compliance"],
    },
    {
        "industry": "Healthcare",
        "market_size": "$12 trillion globally",
        "growth_rate": "9% CAGR",
        "key_players": ["UnitedHealth", "Johnson & Johnson", "Pfizer", "Roche"],
        "avg_revenue": "$30M for mid-stage startups",
        "challenges": ["Strict regulation (FDA/HIPAA)", "Long sales cycles", "Reimbursement complexity", "Clinical validation costs"],
    },
    {
        "industry": "Education",
        "market_size": "$7 trillion globally",
        "growth_rate": "10% CAGR (EdTech)",
        "key_players": ["Coursera", "Duolingo", "Chegg", "Byju's", "Khan Academy"],
        "avg_revenue": "$15M for mid-stage startups",
        "challenges": ["Low willingness to pay", "High churn", "Slow institutional adoption", "Measuring learning outcomes"],
    },
    {
        "industry": "Food & Beverage",
        "market_size": "$8 trillion globally",
        "growth_rate": "6% CAGR",
        "key_players": ["Nestle", "PepsiCo", "Coca-Cola", "Unilever", "DoorDash"],
        "avg_revenue": "$20M for mid-stage startups",
        "challenges": ["Thin margins", "Perishability and logistics", "Food safety regulation", "Brand differentiation"],
    },
    {
        "industry": "E-commerce",
        "market_size": "$6.3 trillion globally",
        "growth_rate": "11% CAGR",
        "key_players": ["Amazon", "Alibaba", "Shopify", "eBay", "Walmart"],
        "avg_revenue": "$25M for mid-stage startups",
        "challenges": ["Customer acquisition cost", "Logistics and fulfillment", "Razor-thin margins", "Platform dependency"],
    },
    {
        "industry": "Finance",
        "market_size": "$26 trillion globally",
        "growth_rate": "7% CAGR (FinTech)",
        "key_players": ["JPMorgan", "Visa", "Stripe", "PayPal", "Mastercard"],
        "avg_revenue": "$40M for mid-stage startups",
        "challenges": ["Heavy regulation and licensing", "Trust and security", "Fraud risk", "Incumbent competition"],
    },
    {
        "industry": "Real Estate",
        "market_size": "$3.7 trillion (PropTech adjacent)",
        "growth_rate": "5% CAGR",
        "key_players": ["Zillow", "CBRE", "Compass", "Opendoor", "Redfin"],
        "avg_revenue": "$22M for mid-stage startups",
        "challenges": ["High capital intensity", "Market cyclicality", "Fragmented data", "Long transaction cycles"],
    },
    {
        "industry": "Transportation",
        "market_size": "$7 trillion globally",
        "growth_rate": "6% CAGR",
        "key_players": ["Uber", "Tesla", "FedEx", "Maersk", "Lyft"],
        "avg_revenue": "$28M for mid-stage startups",
        "challenges": ["Capital and infrastructure costs", "Regulatory hurdles", "Unit economics", "Safety and liability"],
    },
    {
        "industry": "Entertainment",
        "market_size": "$2.8 trillion globally",
        "growth_rate": "8% CAGR",
        "key_players": ["Netflix", "Disney", "Spotify", "Sony", "Tencent"],
        "avg_revenue": "$18M for mid-stage startups",
        "challenges": ["Content costs", "Attention competition", "Monetization and churn", "Rights and licensing"],
    },
    {
        "industry": "Agriculture",
        "market_size": "$12 trillion globally",
        "growth_rate": "7% CAGR (AgTech)",
        "key_players": ["John Deere", "Bayer", "Cargill", "Corteva", "Indigo Ag"],
        "avg_revenue": "$16M for mid-stage startups",
        "challenges": ["Long adoption cycles", "Weather and climate risk", "Fragmented buyers", "Capital intensity"],
    },
]


def seed_market_data() -> None:
    _, market_data = _collections()
    if market_data is None:
        return
    if market_data.estimated_document_count() == 0:
        market_data.insert_many(SEED_MARKET_DATA)


def init_db() -> None:
    db = _get_db()
    if db is None:
        print("⚠️  MongoDB not configured — running without persistence.")
        return
    try:
        business_plans = db["business_plans"]
        market_data = db["market_data"]
        seed_market_data()
        business_plans.create_index(
            [("share_token", ASCENDING)],
            unique=True,
            partialFilterExpression={"share_token": {"$type": "string"}},
            name="share_token_unique",
        )
        market_data.create_index([("industry", TEXT)], name="industry_text")
        print("✅ MongoDB connected and ready")
    except Exception as error:
        print(f"❌ MongoDB init error: {error}")


# ---------------------------------------------------------------------------
# Query functions
# ---------------------------------------------------------------------------

def save_plan(idea: str, user_id: str | None = None) -> str:
    business_plans, _ = _collections()
    if business_plans is None:
        return "no-db"
    doc = {
        "idea": idea,
        "created_at": datetime.now(timezone.utc),
        "status": "generating",
        "user_id": user_id or "anonymous",   # device-scoped identity
        "validation": {},
        "market_research": {},
        "personas": [],
        "business_plan": {},
        "financials": {},
        "risks": {},
        "share_token": None,
    }
    result = business_plans.insert_one(doc)
    return str(result.inserted_id)


def update_plan(plan_id: str, field: str, data) -> None:
    if plan_id == "no-db":
        return
    business_plans, _ = _collections()
    if business_plans is None:
        return
    try:
        business_plans.update_one(
            {"_id": ObjectId(plan_id)},
            {"$set": {field: data}},
        )
    except Exception:
        pass


def get_plan(plan_id: str) -> dict | None:
    if plan_id == "no-db":
        return None
    business_plans, _ = _collections()
    if business_plans is None:
        return None
    if not ObjectId.is_valid(plan_id):
        return None
    return business_plans.find_one({"_id": ObjectId(plan_id)})


def get_plan_by_token(token: str) -> dict | None:
    business_plans, _ = _collections()
    if business_plans is None:
        return None
    return business_plans.find_one({"share_token": token})


def get_plan_count() -> int:
    business_plans, _ = _collections()
    if business_plans is None:
        return 0
    try:
        return business_plans.count_documents({})
    except Exception:
        return 0


def get_plans_today() -> int:
    """Number of plans created since 00:00 UTC today."""
    business_plans, _ = _collections()
    if business_plans is None:
        return 0
    try:
        start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        return business_plans.count_documents({"created_at": {"$gte": start}})
    except Exception:
        return 0


def get_recent_plans(limit: int = 50, user_id: str | None = None) -> list[dict]:
    business_plans, _ = _collections()
    if business_plans is None:
        return []
    try:
        query: dict = {"status": "complete"}
        # If a user_id is provided, restrict to that user's plans only.
        if user_id and user_id != "anonymous":
            query["user_id"] = user_id
        docs = list(
            business_plans.find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        for d in docs:
            d["_id"] = str(d["_id"])
            d.pop("user_id", None)   # don't expose internal user_id to regular users
        return docs
    except Exception:
        return []


# ---------------------------------------------------------------------------
# Admin functions (all plans, user stats)
# ---------------------------------------------------------------------------

def get_all_plans_admin(limit: int = 100, status: str | None = None) -> list[dict]:
    """Admin-only: return all plans with user_id visible, sorted newest first."""
    business_plans, _ = _collections()
    if business_plans is None:
        return []
    try:
        query: dict = {}
        if status:
            query["status"] = status
        docs = list(
            business_plans.find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        for d in docs:
            d["_id"] = str(d["_id"])
            if "created_at" in d:
                d["created_at"] = d["created_at"].isoformat() if hasattr(d["created_at"], "isoformat") else str(d["created_at"])
        return docs
    except Exception:
        return []


def get_user_stats() -> list[dict]:
    """Admin-only: aggregate plan counts grouped by user_id."""
    business_plans, _ = _collections()
    if business_plans is None:
        return []
    try:
        pipeline = [
            {"$group": {
                "_id": "$user_id",
                "total_plans": {"$sum": 1},
                "complete_plans": {"$sum": {"$cond": [{"$eq": ["$status", "complete"]}, 1, 0]}},
                "last_active": {"$max": "$created_at"},
            }},
            {"$sort": {"total_plans": -1}},
            {"$limit": 100},
        ]
        results = list(business_plans.aggregate(pipeline))
        for r in results:
            r["user_id"] = r.pop("_id") or "anonymous"
            if r.get("last_active") and hasattr(r["last_active"], "isoformat"):
                r["last_active"] = r["last_active"].isoformat()
        return results
    except Exception:
        return []


def search_market_data(industry_keyword: str) -> dict:
    keyword = (industry_keyword or "").strip()
    lowered = keyword.lower()
    _, market_data_col = _collections()

    def _search_static(kw: str) -> dict:
        k = kw.lower()
        for row in SEED_MARKET_DATA:
            industry = row["industry"].lower()
            tokens = re.split(r"[^a-z]+", industry)
            if industry in k or any(t and t in k for t in tokens):
                return dict(row)
        return dict(SEED_MARKET_DATA[0])

    if market_data_col is None:
        return _search_static(lowered)

    try:
        if keyword:
            exact = market_data_col.find_one(
                {"industry": re.compile(f"^{re.escape(keyword)}$", re.IGNORECASE)}
            )
            if exact:
                return _clean(exact)
            for row in market_data_col.find({}):
                industry = row["industry"].lower()
                tokens = re.split(r"[^a-z]+", industry)
                if industry in lowered or any(t and t in lowered for t in tokens):
                    return _clean(row)
        fallback = market_data_col.find_one({"industry": "Technology"}) or market_data_col.find_one({})
        return _clean(fallback) if fallback else _search_static(lowered)
    except Exception:
        return _search_static(lowered)


def _clean(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# Audit chains (tamper-evident SHA-256 chain, one document per plan)
# ---------------------------------------------------------------------------

def _audit_collection():
    db = _get_db()
    if db is None:
        return None
    return db["audit_chains"]


def save_audit_chain(plan_id: str, chain: list[dict]) -> None:
    """Persist (or replace) the full audit chain for a plan."""
    if plan_id == "no-db":
        return
    col = _audit_collection()
    if col is None:
        return
    try:
        col.update_one(
            {"plan_id": plan_id},
            {"$set": {
                "plan_id": plan_id,
                "chain": chain,
                "generated_at": datetime.now(timezone.utc),
            }},
            upsert=True,
        )
    except Exception as exc:
        print(f"⚠️  save_audit_chain failed: {exc}")


def get_audit_chain(plan_id: str) -> dict | None:
    """Return the stored audit-chain document {plan_id, chain, generated_at}."""
    if plan_id == "no-db":
        return None
    col = _audit_collection()
    if col is None:
        return None
    try:
        doc = col.find_one({"plan_id": plan_id})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Human-in-the-loop approval requests
# ---------------------------------------------------------------------------
# In-memory fallback so the approval gate still works when MongoDB is not
# configured (local dev): the SSE poller and the /decide endpoint run in the
# same process, so they share this dict. Production uses the Mongo collection.
_MEMORY_APPROVALS: dict[str, dict] = {}


def _approval_collection():
    db = _get_db()
    if db is None:
        return None
    return db["approval_requests"]


def create_approval_request(plan_id: str, step_data: dict) -> str:
    """Create a pending approval request and return its approval_id (uuid4)."""
    approval_id = str(uuid.uuid4())
    doc = {
        "plan_id": plan_id,
        "approval_id": approval_id,
        "status": "pending",
        "step_data": step_data,
        "created_at": datetime.now(timezone.utc),
        "decided_at": None,
        "direction_override": None,
    }
    col = _approval_collection()
    if col is None:
        _MEMORY_APPROVALS[approval_id] = doc
        return approval_id
    try:
        col.insert_one(dict(doc))  # copy so pymongo's _id injection won't leak
    except Exception as exc:
        print(f"⚠️  create_approval_request failed, using memory: {exc}")
        _MEMORY_APPROVALS[approval_id] = doc
    return approval_id


def get_approval_request(approval_id: str) -> dict | None:
    """Return the approval request document, or None if not found."""
    col = _approval_collection()
    if col is not None:
        try:
            doc = col.find_one({"approval_id": approval_id})
            if doc:
                doc["_id"] = str(doc["_id"])
                return doc
        except Exception:
            pass
    mem = _MEMORY_APPROVALS.get(approval_id)
    return dict(mem) if mem else None


def list_approval_requests(status: str | None = None) -> list[dict]:
    """List approval requests. If `status` is provided, filter by status.
    Falls back to in-memory approvals when the DB is not available.
    """
    col = _approval_collection()
    results: list[dict] = []
    if col is not None:
        try:
            query = {"status": status} if status else {}
            docs = list(col.find(query).sort("created_at", -1))
            for d in docs:
                d["_id"] = str(d["_id"])
                results.append(d)
            return results
        except Exception:
            pass
    # fallback to in-memory
    for d in list(_MEMORY_APPROVALS.values()):
        if status is None or d.get("status") == status:
            results.append(dict(d))
    return results


def resolve_approval(approval_id: str, approved: bool, direction_override: str | None) -> bool:
    """Mark an approval request approved/rejected. Returns True if a matching
    request was found and updated."""
    status = "approved" if approved else "rejected"
    now = datetime.now(timezone.utc)
    update = {"status": status, "decided_at": now, "direction_override": direction_override}
    col = _approval_collection()
    if col is not None:
        try:
            result = col.update_one({"approval_id": approval_id}, {"$set": update})
            if result.matched_count:
                return True
        except Exception as exc:
            print(f"⚠️  resolve_approval failed: {exc}")
    mem = _MEMORY_APPROVALS.get(approval_id)
    if mem is not None:
        mem.update(update)
        return True
    return False


# ---------------------------------------------------------------------------
# MCP tools
# ---------------------------------------------------------------------------

def mcp_search_similar_plans(industry: str) -> dict:
    business_plans, _ = _collections()
    if business_plans is None:
        return {"tool": "search_similar_plans", "results": [], "count": 0}
    try:
        plans = list(
            business_plans.find(
                {"validation.target_market": {"$regex": industry, "$options": "i"}, "status": "complete"},
                {"market_research": 1, "financials": 1, "validation.viability_score": 1},
            ).limit(3)
        )
        for p in plans:
            p["_id"] = str(p["_id"])
        return {"tool": "search_similar_plans", "results": plans, "count": len(plans)}
    except Exception:
        return {"tool": "search_similar_plans", "results": [], "count": 0}


def mcp_get_market_benchmarks(industry: str) -> dict:
    """Aggregate real benchmarks from completed plans in MongoDB and blend them
    with the seed industry data. Used to ground the agent's financial step in
    whatever the database has actually seen before."""
    market = search_market_data(industry)
    business_plans, _ = _collections()
    viability_scores: list[float] = []
    break_even_months: list[int] = []
    plans_analyzed = 0

    if business_plans is not None:
        try:
            cursor = business_plans.find(
                {"status": "complete"},
                {"validation.viability_score": 1, "financials.break_even_month": 1},
            ).sort("created_at", -1).limit(50)
            for p in cursor:
                plans_analyzed += 1
                score = (p.get("validation") or {}).get("viability_score")
                if isinstance(score, (int, float)):
                    viability_scores.append(float(score))
                be = (p.get("financials") or {}).get("break_even_month")
                if isinstance(be, (int, float)):
                    break_even_months.append(int(be))
        except Exception:
            pass

    def _avg(xs):
        return round(sum(xs) / len(xs), 1) if xs else None

    return {
        "tool": "get_market_benchmarks",
        "industry_data": market,
        "plans_analyzed": plans_analyzed,
        "avg_viability_score": _avg(viability_scores),
        "avg_break_even_month": _avg(break_even_months),
        "note": "Grounded in real plans stored in MongoDB",
    }


def mcp_get_tools_manifest() -> list:
    return [
        {"name": "search_similar_plans", "description": "Search stored business plans by industry", "input_schema": {"industry": "string"}},
        {"name": "get_market_benchmarks", "description": "Get aggregated financial benchmarks", "input_schema": {"industry": "string"}},
        {"name": "store_plan", "description": "Store a completed business plan", "input_schema": {"plan_id": "string"}},
    ]
