# ─── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:18 AS frontend-build
WORKDIR /build/frontend

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

# 2) Preload libraries to avoid TLS issues
ENV LD_PRELOAD="libgomp.so.1 libstdc++.so.6"

# 3) Install Python deps (CPU‐only torch + the rest)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# 4) Copy backend code
COPY backend/ ./backend

# 5) Copy built React assets into backend/static so FastAPI can serve the UI
COPY --from=frontend-build /build/frontend/public ./backend/static

# 6) Tell Docker/Cloud Run to listen on 8080
EXPOSE 8080

# 7) Launch Uvicorn on the port Cloud Run injects (default 8080)
CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
