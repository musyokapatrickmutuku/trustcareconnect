# Multi-stage Docker build for TrustCareConnect AI Proxy
# Optimized for production deployment

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aiproxy -u 1001

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aiproxy -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=aiproxy:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=aiproxy:nodejs /app/src ./src
COPY --from=builder --chown=aiproxy:nodejs /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3001

# Switch to non-root user
USER aiproxy

# Start application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "src/app.js"]