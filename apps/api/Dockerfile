# =============================================================================
# Multi-stage build for @wealth-os/api
# =============================================================================

# ---- Stage 1: builder (install + generate + compile) ----
FROM node:20.11-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy lockfile + workspace manifests + prisma schema BEFORE install so that
# @prisma/client's postinstall can find the schema and generate the typed
# client on the first pass (avoids stub-client mismatches downstream).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Now bring in the rest of the source.
COPY . .

# Regenerate to be safe (idempotent), then build packages in topological order.
RUN pnpm --filter @wealth-os/database prisma:generate \
 && pnpm --filter @wealth-os/shared build \
 && pnpm --filter @wealth-os/database build \
 && pnpm --filter @wealth-os/api build

# Produce a minimal, production-only deployment of the API into /deploy.
RUN pnpm --filter @wealth-os/api --prod deploy /deploy

# ---- Stage 2: production runner ----
FROM node:20.11-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs wealthos

COPY --from=builder --chown=wealthos:nodejs /deploy/node_modules ./node_modules
COPY --from=builder --chown=wealthos:nodejs /deploy/package.json ./package.json
COPY --from=builder --chown=wealthos:nodejs /repo/apps/api/dist ./dist

USER wealthos
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/v1/health/liveness || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
