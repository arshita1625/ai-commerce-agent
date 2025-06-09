# ───────────── Stage 1: Build React frontend ─────────────
FROM node:18-alpine AS frontend-build

# work in the frontend folder
WORKDIR /app/frontend

# install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent

# copy & build
COPY frontend/ ./
RUN npm run build

# ───────────── Stage 2: Build FastAPI backend ────────────
FROM python:3.11-slim

# set a non-root user (optional but recommended)
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup
USER appuser

WORKDIR /app

# install Python deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# copy backend source
COPY --chown=appuser:appgroup backend/ ./backend

# copy in the React build as static files
COPY --chown=appuser:appgroup --from=frontend-build /app/frontend/build ./backend/static

# expose the port (Railway will override $PORT if set)
ENV PORT=8000
EXPOSE 8000

# run Uvicorn serving both API & static files
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
