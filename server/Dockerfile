# ── CarbonSmart API (Node + Express + Prisma + SQLite) ──────────────
FROM node:20-slim AS base
WORKDIR /app
# openssl is required by Prisma engines on slim images
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# ── deps (cached) ──
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── build (compile TS -> dist, generate Prisma client, compile seed) ──
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build \
    && npx tsc -p tsconfig.seed.json

# ── runtime ──
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Prisma client + engines
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh \
    && mkdir -p /app/data /app/uploads/photos /app/uploads/certificates

# SQLite DB lives on a volume so data survives restarts
ENV DATABASE_URL="file:/app/data/prod.db"
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
