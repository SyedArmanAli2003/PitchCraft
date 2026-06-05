# PitchCraft — Backend

FastAPI backend for an AI agent that generates a complete business plan from a
one-line startup idea. The agent runs 7 steps (validation → market research →
personas → business plan → financials → risk analysis → finalize) and streams
each step to the client over Server-Sent Events.

## Stack

- **FastAPI** + Uvicorn (HTTP + SSE streaming)
- **MongoDB Atlas** (plan storage + seeded market data)
- **Google Gemini** (`google-generativeai`)

## Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then fill in MONGODB_URI and GEMINI_API_KEY
```

On first run the app creates indexes and seeds `market_data` with 10 industries
(Technology, Healthcare, Education, Food & Beverage, E-commerce, Finance,
Real Estate, Transportation, Entertainment, Agriculture) if the collection is
empty.

## Run

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Endpoints

| Method | Path                 | Description                                   |
| ------ | -------------------- | --------------------------------------------- |
| POST   | `/api/generate`      | Start generation; streams steps as SSE. The new plan id is also returned in the `X-Plan-ID` response header. |
| GET    | `/api/plan/{id}`     | Fetch a stored plan by id (404 if missing).   |
| GET    | `/api/share/{token}` | Fetch a plan by its public share token.       |
| GET    | `/health`            | Health check.                                 |

### Example

```bash
curl -N -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"idea": "An app that pairs dog owners for shared walks"}'
```

Each SSE message looks like:

```
data: {"step": 1, "name": "Validation", "status": "complete", "data": {...}}
```

## Notes

- The default model is `gemini-3.0-flash` (override with `GEMINI_MODEL`). If your
  Gemini access doesn't include that model yet, set `GEMINI_MODEL` to one you
  have, e.g. `gemini-2.0-flash` or `gemini-1.5-flash`.
- Gemini calls are synchronous; they're dispatched with `asyncio.to_thread` so a
  streaming request never blocks the event loop.
