# ===========================================
# Artellico - Production Dockerfile
# ===========================================
# Multi-stage build for optimal image size.
#
# Build:
#   docker build -t artellico:latest .
#
# Run:
#   docker run -p 3000:3000 --env-file .env.production.local artellico:latest

# ===========================================
# Stage 1: Build
# ===========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ===========================================
# Stage 2: Production
# ===========================================
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S artellico -u 1001

# Copy built application
COPY --from=builder --chown=artellico:nodejs /app/build ./build
COPY --from=builder --chown=artellico:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=artellico:nodejs /app/package.json ./

# Switch to non-root user
USER artellico

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start application
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build/index.js"]
