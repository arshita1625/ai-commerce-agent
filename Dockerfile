# ─── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Install JS deps & build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build & run FastAPI backend ──────────────────────────────────
FROM python:3.11-slim-buster
WORKDIR /app

# Install OS libs for PyTorch CPU wheels & FAISS
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential libopenblas-dev libomp-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps (CPU-only PyTorch then rest)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Copy the built React app (webpack output) into backend/static
COPY --from=frontend-build /app/frontend/public ./backend/static

# Expose default port (Railway will override via $PORT)
EXPOSE 8000

# Run Uvicorn using the PORT env var, defaulting to 8000 if unset
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
