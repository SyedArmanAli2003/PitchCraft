"""Diagnostic: verify every cascade model ID against the live Gemini API.

Run:  python scripts/check_models.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from google import genai
from google.genai import types

key = os.getenv("GEMINI_API_KEY_1")
client = genai.Client(api_key=key)

print("=== models available to this key (generateContent-capable, gemini*) ===")
available = set()
for m in client.models.list():
    name = m.name.removeprefix("models/")
    actions = getattr(m, "supported_actions", None) or []
    if "generateContent" in actions and name.startswith("gemini"):
        available.add(name)
        print(" ", name)

print("\n=== test-calling each configured cascade ID ===")
CANDIDATES = [
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
]
for mid in CANDIDATES:
    try:
        r = client.models.generate_content(
            model=mid,
            contents='Reply with exactly: {"ok": true}',
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        print(f"  PASS  {mid:28s} -> {(r.text or '')[:40]!r}")
    except Exception as e:
        msg = str(e).replace("\n", " ")[:110]
        print(f"  FAIL  {mid:28s} -> {type(e).__name__}: {msg}")
