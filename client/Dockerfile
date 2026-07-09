# ── CarbonSmart frontend (Vite build → nginx static) ────────────────
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# API base URL + sub-path base are baked in at build time (Vite env)
ARG VITE_API_URL
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

# ── serve ──
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Build output goes under /carbonsmart/ to match the Vite base path
COPY --from=build /app/dist /usr/share/nginx/html/carbonsmart
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
