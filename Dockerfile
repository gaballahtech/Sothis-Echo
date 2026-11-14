# Sothis Echo API — real Sentinel-1 / NISAR data server.
# The frontend is deployed separately (Vercel); this image only serves /api.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Runtime dependencies only: geotiff is the sole module the API needs.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/data ./src/data
COPY server ./server

ENV API_HOST=0.0.0.0
ENV API_PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1

CMD ["node", "server/api.mjs"]
