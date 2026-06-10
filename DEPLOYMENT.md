# Deployment Guide

PitchCraft deploys as a **split stack**: Next.js frontend on Vercel, FastAPI backend on Railway (or Google Cloud Run — a `Dockerfile` + `cloudbuild.yaml` are included in `backend/`). The backend cannot run as a Vercel serverless function because plan generation streams Server-Sent Events for up to 90 seconds.

## Backend → Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Select this repo and set **Root Directory: `backend`**
3. Railway reads `backend/railway.toml` and starts: `uvicorn index:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (Service → Variables):

   | Variable | Required | Description |
   |---|---|---|
   | `GEMINI_API_KEY_1` | Yes | Primary Gemini API key |
   | `GEMINI_API_KEY_2` | No | Backup key — rotated automatically on 429/quota |
   | `MONGODB_URI` | Yes | MongoDB Atlas connection string (`mongodb+srv://...`) |
   | `PHOENIX_API_KEY` | No | Arize Phoenix observability key |
   | `FRONTEND_URL` | No | Your Vercel URL, for credentialed CORS (any `*.vercel.app` origin is already allowed) |
   | `SKIP_APPROVAL` | No | `true` auto-approves the HITL gate after 3 s (useful for unattended demos) |

5. Deploy, then copy the public URL (e.g. `https://pitchcraft-production.up.railway.app`)
6. Verify: open `https://<railway-url>/api/health` — expect `{"status": "ok", "gemini": true, "atlas": true}`

### Alternative: Google Cloud Run

```bash
gcloud builds submit --config backend/cloudbuild.yaml backend
```

Set the same environment variables on the Cloud Run service. Use the Cloud Run URL as `NEXT_PUBLIC_API_BASE` below.

## Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project → Import this repo**
2. Framework preset: **Next.js**, Root Directory: **`frontend`**
   (the root `vercel.json` also works if you import the repo root)
3. Add environment variable:
   - `NEXT_PUBLIC_API_BASE` = your Railway/Cloud Run backend URL (no trailing slash)
4. Deploy

## Testing the deployment

1. Visit your Vercel URL
2. Click **Generate Plan** in the navbar, type any startup idea
3. Step 1 should start within ~5 seconds (the backend emits an immediate liveness event)
4. After Step 2, the **Human Oversight** approval modal appears — click Approve
5. All 7 steps complete in 45–90 seconds, then the plan page opens
6. On the plan page, open the **Audit Trail** tab — the SHA-256 chain should show "Chain verified ✓"

If the backend is unreachable, the frontend automatically replays a clearly-labelled **demo mode** run after 60 seconds, so the UI never dead-ends.

## Local development

```bash
# Backend (port 8000)
cd backend && uvicorn index:app --reload --port 8000

# Frontend (port 3000 — proxies /api/* to :8000 via next.config.mjs)
cd frontend && npm run dev
```

Backend env vars go in `backend/.env` (same names as the Railway table above).

## Environment variables reference

| Variable | Where | Required | Description |
|---|---|---|---|
| `GEMINI_API_KEY_1..N` | Railway | Yes (1) | Gemini API keys; multi-key rotation on quota errors |
| `MONGODB_URI` | Railway | Yes | MongoDB Atlas connection string |
| `PHOENIX_API_KEY` | Railway | No | Arize Phoenix tracing |
| `FRONTEND_URL` | Railway | No | Vercel URL for CORS |
| `APPROVAL_TIMEOUT_SECONDS` | Railway | No | HITL gate timeout (default 300) |
| `SKIP_APPROVAL` | Railway | No | Auto-approve the HITL gate after 3 s |
| `NEXT_PUBLIC_API_BASE` | Vercel | Yes | Railway/Cloud Run backend URL |
