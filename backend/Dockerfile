# syntax=docker/dockerfile:1
# Build context is the repo root (monorepo): `docker build -f backend/Dockerfile .`

FROM node:22-alpine AS base
WORKDIR /app

# ── Install workspace dependencies (cached on package manifests) ──
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --ignore-scripts

# ── Build shared contracts + the NestJS app ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY backend ./backend
RUN npm run build -w @signalscout/shared && npm run build -w backend

# ── Runtime image (production deps only) ──
FROM base AS runner
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["node", "backend/dist/main.js"]
