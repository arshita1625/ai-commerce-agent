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

# Install OS libs for OpenMP, BLAS, C++ runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libgomp1 \
      libomp-dev \
      libopenblas-dev \
      libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Preload libraries to avoid static TLS errors
ENV LD_PRELOAD="libgomp.so.1 libstdc++.so.6"

# Install Python deps (CPU-only torch + your requirements)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Copy built React app into backend/static so FastAPI can serve it
COPY --from=frontend-build /build/frontend/public ./backend/static

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Run Uvicorn on the Cloud Run–provided port
CMD ["sh", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
