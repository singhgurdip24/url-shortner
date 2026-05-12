#!/usr/bin/env bash
set -e

echo "→ Freeing ports 3001 and 5173..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "→ Stopping existing containers..."
docker compose down --remove-orphans

echo "→ Starting Postgres + Redis..."
docker compose up -d

echo "→ Waiting for Postgres to be ready..."
until docker exec url_shortener_postgres pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done
echo "  Postgres ready."

echo "→ Applying database migrations..."
(cd apps/api && alembic upgrade head)

echo "→ Starting API (FastAPI)..."
(cd apps/api && uvicorn main:app --reload --host 0.0.0.0 --port 3001) &

echo "→ Starting web..."
exec pnpm turbo run dev --filter=@url-shortener/web
