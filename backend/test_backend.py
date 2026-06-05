"""
Run this to verify everything works before building the frontend.
Usage: python test_backend.py
"""
import asyncio
import os
import sys
from dotenv import load_dotenv
load_dotenv()

# Windows consoles default to cp1252, which can't encode the emoji used below.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


async def test_all():
    print("\n🧪 PitchCraft Backend Tests\n")

    # Test 1: MongoDB connection
    print("1️⃣  Testing MongoDB...")
    try:
        from mongodb import db
        db.command("ping")
        print("   ✅ MongoDB connected successfully")
    except Exception as e:
        print(f"   ❌ MongoDB failed: {e}")
        print("   → Check your MONGODB_URI in .env")
        return

    # Test 2: Gemini API
    print("2️⃣  Testing Gemini API...")
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        r = model.generate_content('Reply with only: {"status": "ok"}')
        print(f"   ✅ Gemini working: {r.text[:50]}")
    except Exception as e:
        print(f"   ❌ Gemini failed: {e}")
        print("   → Check your GEMINI_API_KEY in .env")
        return

    # Test 3: Save + retrieve a plan
    print("3️⃣  Testing MongoDB read/write...")
    try:
        from mongodb import save_plan, get_plan, update_plan
        plan_id = save_plan("Test idea for PitchCraft")
        update_plan(plan_id, "status", "test_complete")
        plan = get_plan(plan_id)
        print(f"   ✅ Plan saved and retrieved: {plan_id}")
    except Exception as e:
        print(f"   ❌ MongoDB read/write failed: {e}")
        return

    print("\n✅ All systems go! Run: uvicorn main:app --reload\n")


asyncio.run(test_all())
