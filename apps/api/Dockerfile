# =============================================================================
# Multi-stage build for @wealth-os/api
# =============================================================================

# ---- Stage 1: dependency installer ----
FROM node:20.11-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# ---- Stage 2: builder ----
FROM node:20.11-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /repo/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /repo/packages/shared/node_modules ./packages/shared/node_modules

COPY . .

RUN pnpm --filter @wealth-os/database prisma:generate
RUN pnpm --filter @wealth-os/shared build
RUN pnpm --filter @wealth-os/api build

# ---- Stage 3: production runner ----
FROM node:20.11-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Run as non-root.
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs wealthos

COPY --from=builder --chown=wealthos:nodejs /repo/apps/api/dist ./dist
COPY --from=builder --chown=wealthos:nodejs /repo/apps/api/node_modules ./node_modules
COPY --from=builder --chown=wealthos:nodejs /repo/apps/api/package.json ./package.json
COPY --from=builder --chown=wealthos:nodejs /repo/packages ./packages
COPY --from=builder --chown=wealthos:nodejs /repo/node_modules ./root_node_modules

USER wealthos
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
