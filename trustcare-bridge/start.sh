#!/bin/bash

# TrustCareConnect Bridge Service - Production Deployment Script
# This script handles the complete deployment lifecycle for the bridge service

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
PROJECT_NAME="trustcare-bridge"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log_success "System requirements met"
}

check_environment() {
    log_info "Checking environment configuration..."

    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found. Creating template..."
        create_env_template
        log_error "Please configure $ENV_FILE with your settings and run again"
        exit 1
    fi

    # Source environment variables
    source "$ENV_FILE"

    # Check required environment variables
    REQUIRED_VARS=(
        "NOVITA_API_KEY"
        "ICP_CANISTER_ID"
        "JWT_SECRET"
        "BRIDGE_SECRET_KEY"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var:-}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    log_success "Environment configuration valid"
}

create_env_template() {
    cat > "$ENV_FILE" << 'EOF'
# TrustCareConnect Bridge Service Environment Configuration

# Node.js Environment
NODE_ENV=production
LOG_LEVEL=info
TZ=UTC

# Service Ports
WEBSOCKET_PORT=8080
HTTP_PORT=3001
REDIS_PORT=6379
HTTP_PROXY_PORT=80
HTTPS_PROXY_PORT=443

# External API Configuration (REQUIRED)
NOVITA_API_KEY=your_novita_api_key_here
NOVITA_BASE_URL=https://api.novita.ai/openai/v1
NOVITA_API_RATE_LIMIT=10
NOVITA_API_CACHE_TTL=300

# ICP Blockchain Configuration (REQUIRED)
ICP_CANISTER_ID=your_canister_id_here
ICP_HOST=http://host.docker.internal:4943
ICP_AGENT_HOST=http://host.docker.internal:4943
ICP_FETCH_ROOT_KEY=true

# Security Configuration (REQUIRED)
JWT_SECRET=your_jwt_secret_here
BRIDGE_SECRET_KEY=your_bridge_secret_key_here
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Redis Configuration
REDIS_PASSWORD=trustcare2024

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_CONNECTION_TIMEOUT=60000
MAX_CONCURRENT_CONNECTIONS=1000

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
EOF
}

setup_directories() {
    log_info "Setting up required directories..."

    # Create directories if they don't exist
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./data/redis"
    mkdir -p "./data/bridge"
    mkdir -p "./logs/bridge"
    mkdir -p "./logs/nginx"
    mkdir -p "./ssl"
    mkdir -p "./config"
    mkdir -p "./certs"

    # Set proper permissions
    chmod 755 "$BACKUP_DIR" "$LOG_DIR"
    chmod 755 "./data" "./logs"

    log_success "Directories created successfully"
}

create_ssl_certificates() {
    log_info "Checking SSL certificates..."

    if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/key.pem" ]; then
        log_warning "SSL certificates not found. Creating self-signed certificates..."

        mkdir -p "./ssl"

        # Generate self-signed certificate
        openssl req -x509 -newkey rsa:4096 -keyout "./ssl/key.pem" -out "./ssl/cert.pem" \
            -days 365 -nodes -subj "/C=KE/ST=Nairobi/L=Nairobi/O=TrustCareConnect/CN=trustcare-bridge.local"

        chmod 600 "./ssl/key.pem"
        chmod 644 "./ssl/cert.pem"

        log_success "Self-signed SSL certificates created"
        log_warning "For production, replace with proper SSL certificates"
    else
        log_success "SSL certificates found"
    fi
}

backup_data() {
    log_info "Creating backup of existing data..."

    if [ -d "./data" ]; then
        BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" "./data" "./logs" 2>/dev/null || true
        log_success "Backup created: $BACKUP_NAME"
    fi
}

pull_images() {
    log_info "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" pull
    log_success "Images updated"
}

build_services() {
    log_info "Building bridge service..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache trustcare-bridge
    log_success "Bridge service built successfully"
}

stop_services() {
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans
    log_success "Services stopped"
}

start_services() {
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    log_success "Services started"
}

wait_for_health() {
    log_info "Waiting for services to become healthy..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps | grep -q "healthy"; then
            if curl -f http://localhost:${HTTP_PROXY_PORT:-80}/health &> /dev/null; then
                log_success "Services are healthy and responding"
                return 0
            fi
        fi

        log_info "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        ((attempt++))
    done

    log_error "Services failed to become healthy within expected time"
    show_logs
    return 1
}

show_status() {
    log_info "Service Status:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps

    echo ""
    log_info "Service URLs:"
    echo "  - HTTP API: http://localhost:${HTTP_PROXY_PORT:-80}"
    echo "  - HTTPS API: https://localhost:${HTTPS_PROXY_PORT:-443}"
    echo "  - WebSocket: ws://localhost:${HTTP_PROXY_PORT:-80}/ws"
    echo "  - WebSocket (SSL): wss://localhost:${HTTPS_PROXY_PORT:-443}/ws"
    echo "  - Health Check: http://localhost:${HTTP_PROXY_PORT:-80}/health"
    echo "  - Metrics: http://localhost:${HTTP_PROXY_PORT:-80}/metrics"
}

show_logs() {
    log_info "Recent service logs:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs --tail=50
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    log_success "Cleanup completed"
}

# Command handling
case "${1:-start}" in
    "start")
        log_info "Starting TrustCareConnect Bridge Service deployment..."
        check_requirements
        check_environment
        setup_directories
        create_ssl_certificates
        backup_data
        pull_images
        build_services
        stop_services
        start_services
        wait_for_health
        show_status
        log_success "Deployment completed successfully!"
        ;;

    "stop")
        log_info "Stopping TrustCareConnect Bridge Service..."
        stop_services
        log_success "Services stopped"
        ;;

    "restart")
        log_info "Restarting TrustCareConnect Bridge Service..."
        stop_services
        start_services
        wait_for_health
        show_status
        log_success "Services restarted successfully!"
        ;;

    "status")
        show_status
        ;;

    "logs")
        show_logs
        ;;

    "update")
        log_info "Updating TrustCareConnect Bridge Service..."
        backup_data
        pull_images
        build_services
        stop_services
        start_services
        wait_for_health
        cleanup_old_images
        show_status
        log_success "Update completed successfully!"
        ;;

    "clean")
        log_info "Cleaning up TrustCareConnect Bridge Service..."
        stop_services
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --rmi all
        cleanup_old_images
        log_success "Cleanup completed"
        ;;

    "backup")
        backup_data
        ;;

    "help")
        echo "TrustCareConnect Bridge Service Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start the bridge service (default)"
        echo "  stop      - Stop the bridge service"
        echo "  restart   - Restart the bridge service"
        echo "  status    - Show service status"
        echo "  logs      - Show service logs"
        echo "  update    - Update and restart services"
        echo "  clean     - Stop and remove all containers, networks, and images"
        echo "  backup    - Create backup of data and logs"
        echo "  help      - Show this help message"
        ;;

    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac