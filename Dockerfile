# ─── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:18 AS frontend-build
WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build & Run FastAPI backend ─────────────────────────────────
FROM python:3.11

WORKDIR /app

# Install OpenMP libs, stdc++, gcc
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libgomp1 libomp5 libopenblas0-pthread libstdc++6 gcc && \
    rm -rf /var/lib/apt/lists/*

# Preload both gomp and stdc++ for FAISS/scikit-learn/transformers
ENV LD_PRELOAD="libgomp.so.1 libstdc++.so.6"

# Python deps: CPU-only torch first, then requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# Copy backend code (main.py, utils.py, ollama_utils.py, etc.)
COPY backend/ ./backend

# Copy built React app into backend/static for FastAPI
COPY --from=frontend-build /build/frontend/public ./backend/static

EXPOSE 8080

CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
