# Deployment Guide

PitchCraft is a split stack — a Next.js frontend and a FastAPI backend that streams Server-Sent Events for up to ~3 minutes per plan (which is why the backend can't run as a Vercel serverless function).

Two supported layouts. **Option A (everything on Google Cloud Run) is recommended for the hackathon** — the whole product runs on Google Cloud, which directly supports the "Technological Implementation" judging criterion.

---

## Option A — Everything on Google Cloud Run (recommended)

Prereqs: `gcloud` CLI authenticated, a GCP project with Cloud Build + Cloud Run APIs enabled.

### 1. Deploy the backend

```bash
gcloud builds submit --config backend/cloudbuild.yaml backend
```

Then set the runtime env vars (never baked into the image):

```bash
gcloud run services update pitchcraft-backend --region=us-central1 \
  --set-env-vars "GEMINI_API_KEY_1=...,GEMINI_API_KEY_2=...,MONGODB_URI=...,PHOENIX_API_KEY=..."
```

Copy the service URL (e.g. `https://pitchcraft-backend-xxxx-uc.a.run.app`) and verify:
`https://<backend-url>/api/health` → `{"status": "ok", "gemini": true, "atlas": true}`

### 2. Deploy the frontend

```bash
gcloud builds submit --config frontend/cloudbuild.yaml \
  --substitutions _API_BASE=https://<backend-url> \
  frontend
```

`NEXT_PUBLIC_API_BASE` is inlined at **build** time, so the backend URL goes in as a build substitution — if the backend URL ever changes, rebuild the frontend.

The frontend service URL is your public product URL. CORS for `*.run.app` origins is already allowed by the backend.

---

## Option B — Vercel (frontend) + Railway (backend)

### Backend → Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Root Directory: **`backend`** — Railway reads `backend/railway.toml` (uvicorn + `/api/health` healthcheck)
3. Add the same env vars as Option A (`GEMINI_API_KEY_1`, `MONGODB_URI`, optional `PHOENIX_API_KEY`, `FRONTEND_URL`)
4. Copy the public URL and verify `/api/health`

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → import this repo, Root Directory: **`frontend`**
2. Env var: `NEXT_PUBLIC_API_BASE` = the Railway URL (no trailing slash)
3. Deploy

---

## Testing either deployment

1. Open the frontend URL → Generate Plan → type any startup idea
2. Step 1 starts within ~5 s (the backend emits an immediate liveness event)
3. After Step 2 the **Human Oversight** approval modal appears — Approve
4. All 7 steps complete in ~60–120 s (varies with Gemini load), then the plan page opens
5. Open the **Audit Trail** tab — "Chain verified ✓"
6. Step 2's card shows the **MongoDB MCP** panel; Step 5 shows benchmark grounding

If the backend is unreachable, the frontend replays a clearly-labelled **demo mode** run after 60 s so the UI never dead-ends.

## Local development

```bash
cd backend  && uvicorn index:app --reload --port 8000   # backend :8000
cd frontend && npm run dev                              # frontend :3000, proxies /api/* → :8000
```

Backend env vars go in `backend/.env`.

## Environment variables reference

| Variable | Where | Required | Description |
|---|---|---|---|
| `GEMINI_API_KEY_1..N` | backend | Yes (1) | Gemini API keys; auto-rotated on quota errors |
| `MONGODB_URI` | backend | Yes | MongoDB Atlas connection string |
| `PHOENIX_API_KEY` | backend | No | Arize Phoenix tracing |
| `FRONTEND_URL` | backend | No | Frontend origin for CORS (`*.vercel.app` / `*.run.app` already allowed) |
| `APPROVAL_TIMEOUT_SECONDS` | backend | No | HITL gate timeout (default 300) |
| `SKIP_APPROVAL` | backend | No | `true` auto-approves the HITL gate after 3 s (unattended demos) |
| `NEXT_PUBLIC_API_BASE` | frontend | Yes | Backend URL — Vercel env var / Cloud Build `_API_BASE` substitution |

## End-to-end smoke scripts

```bash
cd backend
.venv/Scripts/python scripts/check_models.py    # verifies every cascade model ID against the live Gemini API
.venv/Scripts/python scripts/e2e_generate.py    # full 7-step generation incl. HITL approval (backend must be on :8000)
```
