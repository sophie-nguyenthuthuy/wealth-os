#!/usr/bin/env bash
# Bootstrap local dev: install deps, start services, run migrations, seed.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Install with: corepack enable && corepack prepare pnpm@9.12.0 --activate"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Copying .env.example -> .env"
  cp .env.example .env
fi

echo "Installing dependencies..."
pnpm install

echo "Starting Postgres + Redis..."
docker compose up -d postgres redis

echo "Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U wealthos >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Generating Prisma client..."
pnpm --filter @wealth-os/database prisma:generate

echo "Applying migrations..."
pnpm --filter @wealth-os/database prisma:migrate:dev

echo "Seeding..."
pnpm --filter @wealth-os/database prisma:seed

echo ""
echo "Bootstrap complete. Start the API with:"
echo "  pnpm --filter @wealth-os/api dev"
