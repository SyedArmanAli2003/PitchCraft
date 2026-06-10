"""End-to-end test: stream a full 7-step generation through the live API.

Requires the backend running on :8000. Approves the HITL gate via the API.
Run:  python scripts/e2e_generate.py
"""
import json
import sys
import threading
import time

import httpx

BASE = "http://127.0.0.1:8000"
IDEA = "A marketplace app that connects home cooks with office workers for daily tiffin delivery"

start = time.time()


def t() -> str:
    return f"[{time.time() - start:6.1f}s]"


def approve(approval_id: str) -> None:
    try:
        r = httpx.post(
            f"{BASE}/api/approval/{approval_id}/decide",
            json={"approved": True, "direction_override": None},
            timeout=15,
        )
        print(f"{t()} >> approval POSTed: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"{t()} >> approval POST failed: {e}")


def main() -> int:
    steps_done: set[int] = set()
    errors: list[str] = []
    approved = False

    with httpx.stream(
        "POST",
        f"{BASE}/api/generate",
        json={"idea": IDEA, "model": "gemini-3-flash-preview"},
        timeout=httpx.Timeout(10, read=420),
    ) as resp:
        print(f"{t()} HTTP {resp.status_code}  X-Plan-ID={resp.headers.get('x-plan-id')}")
        if resp.status_code != 200:
            print(resp.read().decode())
            return 1
        for line in resp.iter_lines():
            if not line.startswith("data: "):
                continue
            try:
                ev = json.loads(line[6:])
            except json.JSONDecodeError:
                continue
            step, status = ev.get("step"), ev.get("status")
            data = ev.get("data") or {}
            if ev.get("error"):
                errors.append(str(ev["error"]))
                print(f"{t()} !! top-level error: {ev['error']}")
                continue
            if step == "approval_gate":
                print(f"{t()} approval_gate status={status} id={ev.get('approval_id')}")
                if status == "waiting" and not approved and ev.get("approval_id"):
                    approved = True
                    threading.Thread(target=approve, args=(ev["approval_id"],), daemon=True).start()
                continue
            extra = ""
            if status == "complete" and isinstance(step, int):
                steps_done.add(step)
                if data.get("_fallback"):
                    extra = f"  FALLBACK->{data['_fallback']}"
                if step == 2:
                    extra += f"  mongodb_sources={'YES' if data.get('mongodb_sources') else 'MISSING'}"
                if step == 5:
                    extra += f"  mongodb_benchmarks={'YES' if data.get('mongodb_benchmarks') else 'MISSING'}"
                if step == 7:
                    extra += f"  plan_id={data.get('plan_id')} model={data.get('model_used')}"
            if status == "error":
                errors.append(f"step {step}: {data.get('error') or data.get('message')}")
            print(f"{t()} step={step} status={status}{extra}")

    elapsed = time.time() - start
    ok = steps_done >= {1, 2, 3, 4, 5, 6, 7} and not errors
    print(f"\n{'PASS' if ok else 'FAIL'}: steps={sorted(steps_done)} errors={errors} total={elapsed:.1f}s")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
