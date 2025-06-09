# ─── Stage 1: Build the React frontend ─────────────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Install JS deps & build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build & Run the FastAPI backend ───────────────────────────────
FROM python:3.11-slim-buster
WORKDIR /app

# Install OS libs for CPU PyTorch wheels & FAISS
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential libopenblas-dev libomp-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps: first CPU-only torch, then your requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# Copy backend code (this brings in main.py, utils.py, ollama_utils.py, product_catalog.json, images/, etc.)
COPY backend/ ./backend

# Copy built React assets into backend/static so FastAPI can serve them
COPY --from=frontend-build /app/frontend/public ./backend/static

# Expose the port (Railway will override using $PORT)
EXPOSE 8000

# Start Uvicorn, binding to the Railway‐provided port if set
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
