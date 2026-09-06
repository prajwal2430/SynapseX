# ==========================================
# SynapseX API Dockerfile (NestJS + TypeScript)
# Multi-stage build for Development and Production
# ==========================================

# 1. Base Node stage
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY package.json ./

# 2. Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3001/api/v1/health || exit 1
CMD ["npm", "run", "start:dev"]

# 3. Build stage
FROM base AS build
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production

# 4. Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init curl
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:3001/api/v1/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
