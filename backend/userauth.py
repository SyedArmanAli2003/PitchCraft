"""User authentication helpers for PitchCraft.

Real email + password auth backed by MongoDB (users collection in mongodb.py).
We deliberately use only the Python standard library so deploys stay slim and
build-safe on every platform (no native bcrypt wheels, no PyJWT):

  - Passwords  : PBKDF2-HMAC-SHA256 with a per-user random salt.
  - Sessions   : a compact HMAC-SHA256 signed token (JWT-shaped:
                 base64url(header).base64url(payload).base64url(sig)).

All secrets come from env (AUTH_SECRET). A stable fallback is derived so local
dev works out of the box — set AUTH_SECRET in production.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time

# --- Tunables ---------------------------------------------------------------
_PBKDF2_ITERATIONS = 200_000
_TOKEN_TTL_SECONDS = int(os.getenv("AUTH_TOKEN_TTL", str(60 * 60 * 24 * 30)))  # 30 days


# --- Secret -----------------------------------------------------------------
def _secret() -> bytes:
    """The HMAC signing secret. Prefer AUTH_SECRET; otherwise derive a stable
    value so tokens remain valid across restarts in a single deployment."""
    explicit = os.getenv("AUTH_SECRET", "").strip()
    if explicit:
        return explicit.encode("utf-8")
    # Deterministic fallback so dev tokens survive reloads. Mixed with a couple
    # of deploy-stable env values to avoid a hard-coded literal.
    seed = (os.getenv("MONGODB_URI", "") + "|pitchcraft-auth|" + os.getenv("MONGODB_DB", "pitchcraft"))
    return hashlib.sha256(seed.encode("utf-8")).digest()


# --- Password hashing -------------------------------------------------------
def hash_password(password: str) -> str:
    """Return a self-describing PBKDF2 hash: pbkdf2_sha256$iters$salt$hash."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time verification against a hash produced by hash_password."""
    try:
        algo, iters_s, salt_hex, hash_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        dk = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iters_s)
        )
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


# --- Token (JWT-shaped, HMAC-SHA256) ----------------------------------------
def _b64u_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64u_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def make_token(user_id: str, email: str, ttl_seconds: int = _TOKEN_TTL_SECONDS) -> str:
    """Issue a signed session token carrying the user id + email."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {"sub": user_id, "email": email, "iat": now, "exp": now + ttl_seconds}
    h = _b64u_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p = _b64u_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{h}.{p}".encode("ascii")
    sig = hmac.new(_secret(), signing_input, hashlib.sha256).digest()
    return f"{h}.{p}.{_b64u_encode(sig)}"


def verify_token(token: str) -> dict | None:
    """Return the token payload if the signature is valid and not expired."""
    try:
        h, p, s = token.split(".", 2)
        signing_input = f"{h}.{p}".encode("ascii")
        expected = hmac.new(_secret(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _b64u_decode(s)):
            return None
        payload = json.loads(_b64u_decode(p))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def token_from_header(authorization: str | None) -> str:
    """Extract a bearer token from an Authorization header value."""
    if not authorization:
        return ""
    parts = authorization.split(None, 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return authorization.strip()
