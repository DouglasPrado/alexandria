# =============================================
# Alexandria — Multi-stage Production Build
# Fonte: docs/blueprint/06-system-architecture.md
# =============================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/core-sdk/package.json packages/core-sdk/package.json
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/core-sdk/node_modules ./packages/core-sdk/node_modules
COPY . .
RUN pnpm --filter @alexandria/core-sdk build
RUN pnpm --filter @alexandria/api db:generate
RUN pnpm --filter @alexandria/api build

# Stage 3: Production
FROM node:22-alpine AS runner
RUN apk add --no-cache ffmpeg vips-dev
WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/core-sdk/dist ./packages/core-sdk/dist
COPY --from=builder /app/packages/core-sdk/package.json ./packages/core-sdk/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3333
EXPOSE 3333

# Run migrations then start
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy --schema prisma/schema.prisma && node dist/main.js"]
