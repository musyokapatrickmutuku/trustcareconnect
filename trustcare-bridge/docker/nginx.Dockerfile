# TrustCareConnect Nginx Proxy Dockerfile
# Optimized Nginx configuration for WebSocket and API proxying

FROM nginx:1.25-alpine

# Install additional tools for SSL and monitoring
RUN apk add --no-cache \
    curl \
    openssl \
    certbot \
    certbot-nginx

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/mime.types /etc/nginx/mime.types

# Create directories for SSL certificates and logs
RUN mkdir -p /etc/nginx/ssl \
    && mkdir -p /var/log/nginx \
    && mkdir -p /var/cache/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/log/nginx

# Copy SSL configuration template
COPY docker/nginx/ssl.conf /etc/nginx/conf.d/ssl.conf.template

# Copy site configuration template
COPY docker/nginx/trustcare.conf /etc/nginx/conf.d/trustcare.conf.template

# Copy custom error pages
COPY docker/nginx/error-pages/ /usr/share/nginx/html/error-pages/

# Copy startup script
COPY docker/nginx/start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh

# Set build arguments
ARG VERSION=dev
ARG BUILD_DATE
ARG VCS_REF

# Add metadata labels
LABEL org.opencontainers.image.title="TrustCareConnect Nginx Proxy"
LABEL org.opencontainers.image.description="Nginx reverse proxy for TrustCareConnect Bridge"
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF

# Set environment variables
ENV DOMAIN=bridge.trustcareconnect.com
ENV BACKEND_HOST=bridge
ENV BACKEND_PORT=3001
ENV WS_PORT=8080
ENV SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
ENV SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Use custom startup script
ENTRYPOINT ["/start-nginx.sh"]