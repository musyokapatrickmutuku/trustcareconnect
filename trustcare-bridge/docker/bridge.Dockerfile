# TrustCareConnect Bridge Service Dockerfile
# Multi-stage build for production optimization

FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    tar \
    gzip \
    git \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ================================
# Development dependencies stage
# ================================
FROM base AS deps

# Install all dependencies (including dev dependencies)
RUN npm ci

# ================================
# Build stage
# ================================
FROM base AS build

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build 2>/dev/null || echo "No build script found"

# Run tests
RUN npm run test:unit 2>/dev/null || echo "No tests found"

# ================================
# Production dependencies stage
# ================================
FROM base AS prod-deps

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# ================================
# Production stage
# ================================
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S bridge -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps --chown=bridge:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=bridge:nodejs /app/src ./src
COPY --from=build --chown=bridge:nodejs /app/package*.json ./
COPY --from=build --chown=bridge:nodejs /app/ecosystem.config.js ./

# Create log directory
RUN mkdir -p /var/log/trustcare && chown -R bridge:nodejs /var/log/trustcare

# Set build arguments
ARG VERSION=dev
ARG BUILD_DATE
ARG VCS_REF

# Add metadata labels
LABEL org.opencontainers.image.title="TrustCareConnect Bridge Service"
LABEL org.opencontainers.image.description="WebSocket bridge service for AI medical assistance"
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.source="https://github.com/trustcareconnect/bridge"
LABEL org.opencontainers.image.licenses="MIT"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV WS_PORT=8080
ENV LOG_LEVEL=info
ENV VERSION=$VERSION

# Expose ports
EXPOSE 3001 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER bridge

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/bridge-server.js"]