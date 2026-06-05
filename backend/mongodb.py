"""MongoDB connection, queries, and seed data for PitchCraft."""

import os
import re
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, TEXT
from bson import ObjectId

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB", "pitchcraft")

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI is not set. Add it to your .env file "
        "(see .env.example)."
    )

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

business_plans = db["business_plans"]
market_data = db["market_data"]


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
    if market_data.estimated_document_count() == 0:
        market_data.insert_many(SEED_MARKET_DATA)


def init_db() -> None:
    """Verify connectivity, seed reference data, and ensure indexes.

    Called once on application startup. Any failure is reported but not raised,
    so a misconfigured database surfaces a clear message instead of a crash.
    """
    try:
        # 1. Confirm the cluster is reachable (MongoClient connects lazily).
        client.admin.command("ping")

        # 2. Seed reference data if the collection is empty.
        seed_market_data()

        # 3. Fast, unique lookups by share token. Plans start without a token,
        #    so the unique constraint only applies once a string token exists.
        business_plans.create_index(
            [("share_token", ASCENDING)],
            unique=True,
            partialFilterExpression={"share_token": {"$type": "string"}},
            name="share_token_unique",
        )

        # 4. Text index for searching industries.
        market_data.create_index([("industry", TEXT)], name="industry_text")

        print("✅ MongoDB connected")
    except Exception as error:  # noqa: BLE001 - report any startup failure
        print(f"❌ MongoDB failed: {error}")


# --------------------------------------------------------------------------- #
# Query functions
# --------------------------------------------------------------------------- #

def save_plan(idea: str) -> str:
    """Create a new (empty) business plan document and return its id as a str."""
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
    """Update a single field of a plan."""
    business_plans.update_one(
        {"_id": ObjectId(plan_id)},
        {"$set": {field: data}},
    )


def get_plan(plan_id: str) -> dict | None:
    """Fetch a plan by its id. Returns None if not found or id is invalid."""
    if not ObjectId.is_valid(plan_id):
        return None
    return business_plans.find_one({"_id": ObjectId(plan_id)})


def get_plan_by_token(token: str) -> dict | None:
    """Fetch a plan by its public share token."""
    return business_plans.find_one({"share_token": token})


def search_market_data(industry_keyword: str) -> dict:
    """Find the best-matching seeded industry for a free-text keyword.

    The keyword usually comes from the model's `target_market` field, which can
    be a phrase like "small business owners in tech". We try a few strategies
    and fall back to a generic Technology profile so downstream steps always
    have context to work with.
    """
    keyword = (industry_keyword or "").strip()

    if keyword:
        # 1. Exact (case-insensitive) industry match.
        exact = market_data.find_one(
            {"industry": re.compile(f"^{re.escape(keyword)}$", re.IGNORECASE)}
        )
        if exact:
            return _clean(exact)

        # 2. Industry name appears anywhere in the keyword phrase, or vice versa.
        lowered = keyword.lower()
        for row in market_data.find({}):
            industry = row["industry"].lower()
            # Split "Food & Beverage" -> ["food", "beverage"] for token matching.
            tokens = re.split(r"[^a-z]+", industry)
            if industry in lowered or any(
                t and t in lowered for t in tokens
            ):
                return _clean(row)

    # 3. Fallback: Technology profile (or first row if Technology is missing).
    fallback = market_data.find_one({"industry": "Technology"}) or market_data.find_one(
        {}
    )
    return _clean(fallback) if fallback else {}


def _clean(doc: dict) -> dict:
    """Drop the Mongo _id (ObjectId is not JSON-serializable) from a doc."""
    doc = dict(doc)
    doc.pop("_id", None)
    return doc
