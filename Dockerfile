# ─── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:18 AS frontend-build
WORKDIR /app/frontend

# Install JS deps & build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build & Run FastAPI backend ─────────────────────────────────
FROM python:3.11-slim-buster
WORKDIR /app

# 1) Install OS libs for OpenMP, BLAS, C++ runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libgomp1 libomp5 libopenblas0-pthread libstdc++6 gcc && \
    rm -rf /var/lib/apt/lists/*

# 2) Preload OpenMP & stdc++ to avoid TLS issues
ENV LD_PRELOAD="libgomp.so.1 libstdc++.so.6"

# 3) Install Python deps (CPU‐only torch + the rest)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# 4) Copy backend code
COPY backend/ ./backend

# 5) Copy the built React static files into backend/static
COPY --from=frontend-build /app/frontend/public ./backend/static

# 6) Tell Docker and Cloud Run we listen on port 8000
EXPOSE 8000

# 7) Start Uvicorn on Cloud Run’s $PORT (defaults to 8000)
CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
