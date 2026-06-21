# PitchCraft backend — Cloud Run / Railway / Fly.io compatible image.
#
# The app entrypoint is index.py. Cloud Run and Fly.io both inject
# $PORT at runtime (8080 by default).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App source
COPY . .

# Port: Cloud Run, Fly.io, and Railway all inject $PORT (default 8080).
ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn index:app --host 0.0.0.0 --port ${PORT}
