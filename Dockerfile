# ---------- Stage 1: build the React frontend ----------
FROM node:24-slim AS frontend
WORKDIR /app/frontend

# Install dependencies first (cached unless package files change)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./
RUN npm run build


# ---------- Stage 2: the Python server that runs everything ----------
FROM python:3.14-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py connect.py ./
# Only the built React files are needed, not the source or node_modules
COPY --from=frontend /app/frontend/build ./frontend/build

# Don't run as root
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
# Hosting platforms (Render, Railway, ...) tell the app which port to use via $PORT
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
