# =============================================================================
# Multi-stage build for @wealth-os/api
# =============================================================================

# ---- Stage 1: builder (install + generate + compile) ----
FROM node:26.4-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo

RUN npm install -g pnpm@9.12.0

# Bring the whole repo in first; .dockerignore excludes node_modules / dist.
COPY . .

# Install with the schema present so the typed Prisma client is available.
RUN pnpm install --frozen-lockfile

# Explicit generate (the @prisma/client postinstall can't find the schema in
# a monorepo because it runs from its own package dir).
RUN pnpm --filter @wealth-os/database prisma:generate

# Build in topological order (shared → database → api).
RUN pnpm --filter @wealth-os/shared build \
 && pnpm --filter @wealth-os/database build \
 && pnpm --filter @wealth-os/api build

# Self-contained, production-only app tree.
RUN pnpm --filter @wealth-os/api --prod deploy /deploy

# Regenerate the Prisma client inside /deploy. pnpm deploy copies the
# @prisma/client package itself but not the sibling .prisma/ directory
# where `prisma generate` writes the typed runtime client.
RUN cd /deploy && \
    pnpm --package=prisma@5.18.0 dlx prisma generate \
      --schema=node_modules/@wealth-os/database/prisma/schema.prisma

# ---- Stage 2: production runner ----
FROM node:26.4-alpine AS runner
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
