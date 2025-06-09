# ─── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:18-alpine AS frontend
WORKDIR /app/frontend

# Install JS deps & build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build & run FastAPI backend ──────────────────────────────────
FROM python:3.11-slim-buster

# Install OS libs needed for PyTorch CPU wheels, FAISS, etc.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libopenblas-dev \
      libomp-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy & install Python deps
COPY backend/requirements.txt ./
# First install CPU-only PyTorch wheels, then the rest
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend

# Copy React build into backend/static so FastAPI can serve it
COPY --from=frontend /app/frontend/build ./backend/static

# Expose and run
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
