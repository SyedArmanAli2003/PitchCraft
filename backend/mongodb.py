"""MongoDB connection, queries, and seed data for PitchCraft."""

import os
import re
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, TEXT
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB", "pitchcraft")

# --------------------------------------------------------------------------- #
# Lazy client — created on first use so a bad/missing URI doesn't crash import
# --------------------------------------------------------------------------- #

_client: MongoClient | None = None
_db = None
_mongo_available = False


def _get_db():
    """Return the database handle, initialising the client on first call."""
    global _client, _db, _mongo_available

    if _db is not None:
        return _db

    uri = MONGODB_URI.strip()
    # Placeholder values mean "not configured"
    if not uri or "<" in uri or "your" in uri.lower():
        return None

    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")  # quick connectivity check
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


# --------------------------------------------------------------------------- #
# Seed data
# --------------------------------------------------------------------------- #

SEED_MARKET_DATA = [
    {
        "industry": "Technology",
        "market_size": "$5.3 trillion globally (2024)",
        "growth_rate": "8% CAGR",
        "key_players": ["Apple", "Microsoft", "Google", "Amazon", "NVIDIA"],
        "avg_revenue": "$50M for mid-stage startups",
        "challenges": [
            "Rapid obsolescence",
            "High talent costs",
            "Intense competition",
            "Security and privacy compliance",
        ],
    },
    {
        "industry": "Healthcare",
        "market_size": "$12 trillion globally",
        "growth_rate": "9% CAGR",
        "key_players": ["UnitedHealth", "Johnson & Johnson", "Pfizer", "Roche"],
        "avg_revenue": "$30M for mid-stage startups",
        "challenges": [
            "Strict regulation (FDA/HIPAA)",
            "Long sales cycles",
            "Reimbursement complexity",
            "Clinical validation costs",
        ],
    },
    {
        "industry": "Education",
        "market_size": "$7 trillion globally",
        "growth_rate": "10% CAGR (EdTech)",
        "key_players": ["Coursera", "Duolingo", "Chegg", "Byju's", "Khan Academy"],
        "avg_revenue": "$15M for mid-stage startups",
        "challenges": [
            "Low willingness to pay",
            "High churn",
            "Slow institutional adoption",
            "Measuring learning outcomes",
        ],
    },
    {
        "industry": "Food & Beverage",
        "market_size": "$8 trillion globally",
        "growth_rate": "6% CAGR",
        "key_players": ["Nestle", "PepsiCo", "Coca-Cola", "Unilever", "DoorDash"],
        "avg_revenue": "$20M for mid-stage startups",
        "challenges": [
            "Thin margins",
            "Perishability and logistics",
            "Food safety regulation",
            "Brand differentiation",
        ],
    },
    {
        "industry": "E-commerce",
        "market_size": "$6.3 trillion globally",
        "growth_rate": "11% CAGR",
        "key_players": ["Amazon", "Alibaba", "Shopify", "eBay", "Walmart"],
        "avg_revenue": "$25M for mid-stage startups",
        "challenges": [
            "Customer acquisition cost",
            "Logistics and fulfillment",
            "Razor-thin margins",
            "Platform dependency",
        ],
    },
    {
        "industry": "Finance",
        "market_size": "$26 trillion globally",
        "growth_rate": "7% CAGR (FinTech)",
        "key_players": ["JPMorgan", "Visa", "Stripe", "PayPal", "Mastercard"],
        "avg_revenue": "$40M for mid-stage startups",
        "challenges": [
            "Heavy regulation and licensing",
            "Trust and security",
            "Fraud risk",
            "Incumbent competition",
        ],
    },
    {
        "industry": "Real Estate",
        "market_size": "$3.7 trillion (PropTech adjacent)",
        "growth_rate": "5% CAGR",
        "key_players": ["Zillow", "CBRE", "Compass", "Opendoor", "Redfin"],
        "avg_revenue": "$22M for mid-stage startups",
        "challenges": [
            "High capital intensity",
            "Market cyclicality",
            "Fragmented data",
            "Long transaction cycles",
        ],
    },
    {
        "industry": "Transportation",
        "market_size": "$7 trillion globally",
        "growth_rate": "6% CAGR",
        "key_players": ["Uber", "Tesla", "FedEx", "Maersk", "Lyft"],
        "avg_revenue": "$28M for mid-stage startups",
        "challenges": [
            "Capital and infrastructure costs",
            "Regulatory hurdles",
            "Unit economics",
            "Safety and liability",
        ],
    },
    {
        "industry": "Entertainment",
        "market_size": "$2.8 trillion globally",
        "growth_rate": "8% CAGR",
        "key_players": ["Netflix", "Disney", "Spotify", "Sony", "Tencent"],
        "avg_revenue": "$18M for mid-stage startups",
        "challenges": [
            "Content costs",
            "Attention competition",
            "Monetization and churn",
            "Rights and licensing",
        ],
    },
    {
        "industry": "Agriculture",
        "market_size": "$12 trillion globally",
        "growth_rate": "7% CAGR (AgTech)",
        "key_players": ["John Deere", "Bayer", "Cargill", "Corteva", "Indigo Ag"],
        "avg_revenue": "$16M for mid-stage startups",
        "challenges": [
            "Long adoption cycles",
            "Weather and climate risk",
            "Fragmented buyers",
            "Capital intensity",
        ],
    },
]


def seed_market_data() -> None:
    """Insert the pre-seeded industry data if the collection is empty."""
    _, market_data = _collections()
    if market_data is None:
        return
    if market_data.estimated_document_count() == 0:
        market_data.insert_many(SEED_MARKET_DATA)


def init_db() -> None:
    """Verify connectivity, seed reference data, and ensure indexes.

    Called once on application startup.  Failure is logged but not raised so
    the app still starts when MongoDB is unavailable.
    """
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
    except Exception as error:  # noqa: BLE001
        print(f"❌ MongoDB init error: {error}")


# --------------------------------------------------------------------------- #
# Query functions — all gracefully no-op when DB is unavailable
# --------------------------------------------------------------------------- #

def save_plan(idea: str) -> str:
    """Create a new (empty) business plan document and return its id as a str.

    Returns a fake id ("no-db") if MongoDB is not available so the agent can
    still run in a DB-less mode.
    """
    business_plans, _ = _collections()
    if business_plans is None:
        return "no-db"

    doc = {
        "idea": idea,
        "created_at": datetime.now(timezone.utc),
        "status": "generating",
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
    """Update a single field of a plan (no-op when DB unavailable)."""
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
    """Fetch a plan by its id. Returns None if not found or id is invalid."""
    if plan_id == "no-db":
        return None
    business_plans, _ = _collections()
    if business_plans is None:
        return None
    if not ObjectId.is_valid(plan_id):
        return None
    return business_plans.find_one({"_id": ObjectId(plan_id)})


def get_plan_by_token(token: str) -> dict | None:
    """Fetch a plan by its public share token."""
    business_plans, _ = _collections()
    if business_plans is None:
        return None
    return business_plans.find_one({"share_token": token})


def get_plan_count() -> int:
    """Return total number of business plans in the database. Returns 0 if DB is unavailable."""
    business_plans, _ = _collections()
    if business_plans is None:
        return 0
    try:
        return business_plans.count_documents({})
    except Exception:
        return 0



def search_market_data(industry_keyword: str) -> dict:
    """Find the best-matching seeded industry for a free-text keyword.

    Falls back to the static SEED_MARKET_DATA when MongoDB is unavailable so
    the agent always has market context to work with.
    """
    keyword = (industry_keyword or "").strip()
    lowered = keyword.lower()

    _, market_data_col = _collections()

    # ── Static fallback (used when DB is down or not configured) ── #
    def _search_static(keyword: str) -> dict:
        kw = keyword.lower()
        for row in SEED_MARKET_DATA:
            industry = row["industry"].lower()
            tokens = re.split(r"[^a-z]+", industry)
            if industry in kw or any(t and t in kw for t in tokens):
                return dict(row)
        # Default to Technology
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
    """Drop the Mongo _id (ObjectId is not JSON-serializable) from a doc."""
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


# --------------------------------------------------------------------------- #
# MCP tools
# --------------------------------------------------------------------------- #

def mcp_search_similar_plans(industry: str) -> dict:
    """MCP Tool: Search stored plans by industry for market intelligence."""
    business_plans, _ = _collections()
    if business_plans is None:
        return {"tool": "search_similar_plans", "results": [], "count": 0}

    try:
        plans = list(
            business_plans.find(
                {
                    "validation.target_market": {"$regex": industry, "$options": "i"},
                    "status": "complete",
                },
                {
                    "market_research": 1,
                    "financials": 1,
                    "validation.viability_score": 1,
                },
            ).limit(3)
        )
        for p in plans:
            p["_id"] = str(p["_id"])
        return {"tool": "search_similar_plans", "results": plans, "count": len(plans)}
    except Exception:
        return {"tool": "search_similar_plans", "results": [], "count": 0}


def mcp_get_market_benchmarks(industry: str) -> dict:
    """MCP Tool: Aggregate financial benchmarks from stored plans."""
    market = search_market_data(industry)
    business_plans, _ = _collections()

    recent_plans = []
    if business_plans is not None:
        try:
            recent_plans = list(
                business_plans.find({"status": "complete"}, {"financials": 1})
                .sort("created_at", -1)
                .limit(10)
            )
        except Exception:
            pass

    return {
        "tool": "get_market_benchmarks",
        "industry_data": market,
        "plans_analyzed": len(recent_plans),
        "note": "Grounded in MongoDB stored data",
    }


def mcp_get_tools_manifest() -> list:
    """Returns the MCP tools manifest for this server."""
    return [
        {
            "name": "search_similar_plans",
            "description": "Search stored business plans by industry",
            "input_schema": {"industry": "string"},
        },
        {
            "name": "get_market_benchmarks",
            "description": "Get aggregated financial benchmarks",
            "input_schema": {"industry": "string"},
        },
        {
            "name": "store_plan",
            "description": "Store a completed business plan",
            "input_schema": {"plan_id": "string"},
        },
    ]
