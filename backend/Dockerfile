# PitchCraft backend — Google Cloud Run image.
# The FastAPI app lives in index.py (NOT main.py). Cloud Run injects $PORT (8080).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App source.
COPY . .

# Cloud Run sends traffic to $PORT (default 8080). Bind there.
ENV PORT=8080
EXPOSE 8080

# Shell form so ${PORT} is expanded at runtime.
CMD exec uvicorn index:app --host 0.0.0.0 --port ${PORT}
