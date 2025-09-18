# TrustCareConnect WebSocket Bridge Service Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Base stage with common dependencies
FROM node:18-alpine AS base

# Install system dependencies and security updates
RUN apk add --no-cache \
    curl \
    dumb-init \
    ca-certificates \
    tzdata \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S trustcare && \
    adduser -S trustcare -u 1001 -G trustcare

WORKDIR /app

# Copy package files
COPY package*.json ./

# Stage 2: Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
RUN chown -R trustcare:trustcare /app
USER trustcare
EXPOSE 8080 3001
CMD ["dumb-init", "npm", "run", "dev"]

# Stage 3: Production dependencies stage
FROM base AS deps-production
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# Stage 4: Production stage
FROM base AS production

# Set environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512" \
    TZ=UTC \
    LOG_LEVEL=info \
    WEBSOCKET_PORT=8080 \
    HTTP_PORT=3001 \
    REDIS_URL=redis://redis:6379 \
    NOVITA_API_RATE_LIMIT=10 \
    NOVITA_API_CACHE_TTL=300

# Copy production dependencies
COPY --from=deps-production --chown=trustcare:trustcare /app/node_modules ./node_modules

# Copy application code
COPY --chown=trustcare:trustcare src/ ./src/
COPY --chown=trustcare:trustcare package*.json ./
COPY --chown=trustcare:trustcare README.md ./

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data /app/certs && \
    chown -R trustcare:trustcare /app/logs /app/data /app/certs

# Health check command targeting correct HTTP port
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER trustcare

# Expose WebSocket port (8080) and HTTP port (3001)
EXPOSE 8080 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/bridge-server.js"]

# Metadata labels
LABEL maintainer="TrustCareConnect Team"
LABEL version="1.0.0"
LABEL description="WebSocket bridge service for TrustCareConnect healthcare platform"
LABEL org.opencontainers.image.source="https://github.com/musyokapatrickmutuku/trustcareconnect"
LABEL org.opencontainers.image.documentation="https://github.com/musyokapatrickmutuku/trustcareconnect/blob/main/trustcare-bridge/README.md"
LABEL org.opencontainers.image.licenses="MIT"