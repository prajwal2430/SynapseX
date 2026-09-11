# ==========================================
# SynapseX Client Dockerfile
# Multi-stage build for Development and Production
# ==========================================

# 1. Base Node environment
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json ./

# 2. Development stage (Vite dev server)
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# 3. Build stage
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# 4. Production stage (Nginx lightweight server)
FROM nginx:1.27-alpine AS production
RUN apk add --no-cache curl
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
