# Production Dockerfile for PutiMach Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY admin/package*.json ./admin/

# Install dependencies
RUN npm ci
RUN cd admin && npm ci

# Copy source files
COPY . .

# Build storefront & admin panel
RUN node build-all.js

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install lightweight static server
RUN npm install -g serve

# Copy built dist files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
