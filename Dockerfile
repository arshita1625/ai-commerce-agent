# ─── Stage 1: Build React frontend ─────────────────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Install JS deps & build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# This will run your webpack build, which emits into frontend/public/
RUN npm run build

# ─── Stage 2: Build & run FastAPI backend ──────────────────────────────────
FROM python:3.11-slim-buster
WORKDIR /app

# Install minimal OS libs for PyTorch CPU wheels & FAISS
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential libopenblas-dev libomp-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt ./
# First install CPU-only PyTorch wheels, then the rest of your requirements
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# Copy your FastAPI code
COPY backend/ ./backend

# Copy the built React app into backend/static
COPY --from=frontend-build /app/frontend/public ./backend/static

# Expose & run
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
