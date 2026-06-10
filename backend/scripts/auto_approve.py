"""Auto-approve helper for local development.

Usage: run this while the backend server is running. It will list pending
approval requests and POST an approval decision to let the agent continue.

This is intended for local testing only.
"""
import time
import requests

BASE = "http://127.0.0.1:8000"


def find_pending():
    # Try HTTP API first (requires backend to be restarted after code changes).
    try:
        r = requests.get(f"{BASE}/api/approvals", params={"status": "pending"}, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception:
        # Fallback: import the backend mongodb helper directly (local dev)
        try:
            import sys
            from pathlib import Path

            # Ensure backend package path is on sys.path
            root = Path(__file__).resolve().parents[1]
            if str(root) not in sys.path:
                sys.path.insert(0, str(root))
            from mongodb import list_approval_requests

            return list_approval_requests("pending")
        except Exception as e:
            raise


def decide(approval_id: str, approved: bool = True):
    body = {"approved": approved, "direction_override": None}
    r = requests.post(f"{BASE}/api/approval/{approval_id}/decide", json=body, timeout=5)
    r.raise_for_status()
    return r.json()


if __name__ == "__main__":
    print("Looking for pending approvals...")
    for _ in range(12):
        try:
            pending = find_pending()
        except Exception as e:
            print("Failed to query approvals:", e)
            pending = []
        if pending:
            print(f"Found {len(pending)} pending approval(s)")
            for p in pending:
                aid = p.get("approval_id") or p.get("approval_id")
                print("Approving:", aid)
                try:
                    res = decide(aid, True)
                    print("Approved:", res)
                except Exception as e:
                    print("Failed to approve:", e)
            break
        time.sleep(2)
    else:
        print("No pending approvals found after waiting")
