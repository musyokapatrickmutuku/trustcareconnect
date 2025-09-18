#!/bin/bash

# TrustCareConnect Bridge Deployment Script
# Comprehensive deployment automation with rollback capability
# Usage: ./deploy.sh [environment] [version]

set -euo pipefail

# ================================
# Configuration and Global Variables
# ================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ID="deploy-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/var/log/trustcare-deploy-${DEPLOYMENT_ID}.log"

# Default values
ENVIRONMENT="${1:-staging}"
VERSION="${2:-$(git rev-parse --short HEAD)}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/trustcareconnect}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================
# Utility Functions
# ================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    case $level in
        INFO)  echo -e "${BLUE}[INFO]${NC} ${message}" | tee -a "$LOG_FILE" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} ${message}" | tee -a "$LOG_FILE" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${message}" | tee -a "$LOG_FILE" ;;
        SUCCESS) echo -e "${GREEN}[SUCCESS]${NC} ${message}" | tee -a "$LOG_FILE" ;;
    esac

    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log ERROR "Deployment failed with exit code $exit_code"
        if [ "$ROLLBACK_ENABLED" = "true" ]; then
            log INFO "Initiating rollback procedure..."
            rollback_deployment
        fi
        send_notification "❌ Deployment Failed" "Deployment $DEPLOYMENT_ID failed. Check logs for details."
    fi

    log INFO "Cleaning up temporary files..."
    # Cleanup any temporary files or processes
    exit $exit_code
}

trap cleanup EXIT

# ================================
# 1. Environment Validation
# ================================

validate_environment() {
    log INFO "Validating environment variables and dependencies..."

    local required_vars=(
        "DB_HOST"
        "DB_USER"
        "DB_PASSWORD"
        "DB_NAME"
        "REDIS_URL"
        "NOVITA_API_KEY"
        "ICP_CANISTER_ID"
        "JWT_SECRET"
        "BRIDGE_SECRET_KEY"
    )

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log ERROR "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi

    # Validate environment-specific variables
    case $ENVIRONMENT in
        production)
            if [ -z "${SSL_CERT_PATH:-}" ] || [ -z "${SSL_KEY_PATH:-}" ]; then
                log ERROR "SSL certificates are required for production deployment"
                return 1
            fi
            ;;
        staging)
            export SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/ssl/certs/staging.pem}"
            export SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/ssl/private/staging.key}"
            ;;
    esac

    # Check required tools
    local required_tools=("docker" "docker-compose" "npm" "dfx" "pm2" "nginx" "curl" "jq")

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log ERROR "Required tool not found: $tool"
            return 1
        fi
    done

    # Validate Docker daemon
    if ! docker info &> /dev/null; then
        log ERROR "Docker daemon is not running"
        return 1
    fi

    # Validate DFX identity
    if ! dfx identity whoami &> /dev/null; then
        log ERROR "DFX identity not configured"
        return 1
    fi

    # Check disk space (minimum 5GB free)
    local available_space=$(df / | awk 'NR==2{print $4}')
    if [ "$available_space" -lt 5242880 ]; then  # 5GB in KB
        log ERROR "Insufficient disk space. At least 5GB required."
        return 1
    fi

    log SUCCESS "Environment validation completed"
}

# ================================
# 2. Docker Image Building
# ================================

build_docker_images() {
    log INFO "Building Docker images with version tag: $VERSION"

    local services=("bridge" "nginx" "monitoring")

    for service in "${services[@]}"; do
        log INFO "Building $service image..."

        local image_name="$DOCKER_REGISTRY/trustcare-$service"
        local dockerfile_path="$SCRIPT_DIR/docker/$service.Dockerfile"

        if [ ! -f "$dockerfile_path" ]; then
            log WARN "Dockerfile not found for $service, using default"
            dockerfile_path="$SCRIPT_DIR/Dockerfile"
        fi

        docker build \
            --tag "$image_name:$VERSION" \
            --tag "$image_name:latest" \
            --file "$dockerfile_path" \
            --build-arg VERSION="$VERSION" \
            --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
            --build-arg VCS_REF="$(git rev-parse HEAD)" \
            "$SCRIPT_DIR"

        # Security scan with Trivy
        if command -v trivy &> /dev/null; then
            log INFO "Running security scan on $service image..."
            trivy image --exit-code 1 --severity HIGH,CRITICAL "$image_name:$VERSION"
        fi

        # Push to registry if not local environment
        if [ "$ENVIRONMENT" != "local" ]; then
            log INFO "Pushing $service image to registry..."
            docker push "$image_name:$VERSION"
            docker push "$image_name:latest"
        fi
    done

    log SUCCESS "Docker images built successfully"
}

# ================================
# 3. Health Checks
# ================================

health_check_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=${3:-30}
    local wait_time=${4:-10}

    log INFO "Performing health check for $service_name..."

    for ((i=1; i<=max_attempts; i++)); do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log SUCCESS "$service_name is healthy (attempt $i/$max_attempts)"
            return 0
        fi

        log INFO "$service_name not ready, waiting... (attempt $i/$max_attempts)"
        sleep $wait_time
    done

    log ERROR "$service_name health check failed after $max_attempts attempts"
    return 1
}

perform_health_checks() {
    log INFO "Performing health checks on all services..."

    local services_config="$SCRIPT_DIR/config/services-$ENVIRONMENT.json"

    if [ ! -f "$services_config" ]; then
        log WARN "Services config not found, using defaults"
        # Default health check endpoints
        health_check_service "Database" "http://localhost:5432" 10 5
        health_check_service "Redis" "http://localhost:6379" 10 5
        health_check_service "Bridge Service" "http://localhost:3001/health" 20 10
    else
        # Read services from config
        local services=$(jq -r '.services[] | @base64' "$services_config")

        while IFS= read -r service_data; do
            local service=$(echo "$service_data" | base64 --decode)
            local name=$(echo "$service" | jq -r '.name')
            local health_url=$(echo "$service" | jq -r '.health_url')
            local max_attempts=$(echo "$service" | jq -r '.max_attempts // 30')
            local wait_time=$(echo "$service" | jq -r '.wait_time // 10')

            health_check_service "$name" "$health_url" "$max_attempts" "$wait_time"
        done <<< "$services"
    fi

    log SUCCESS "All health checks completed"
}

# ================================
# 4. Database Migrations
# ================================

run_database_migrations() {
    log INFO "Checking for database migrations..."

    # Create migrations directory if it doesn't exist
    local migrations_dir="$SCRIPT_DIR/migrations"
    mkdir -p "$migrations_dir"

    # Check if migrations are needed
    local latest_migration=$(ls -1 "$migrations_dir"/*.sql 2>/dev/null | sort | tail -1 || echo "")

    if [ -z "$latest_migration" ]; then
        log INFO "No migrations found, skipping..."
        return 0
    fi

    # Get current database version
    local current_version=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;
    " 2>/dev/null | xargs || echo "0")

    log INFO "Current database version: $current_version"

    # Create backup before migrations
    local backup_file="/tmp/trustcare-backup-${DEPLOYMENT_ID}.sql"
    log INFO "Creating database backup before migrations..."

    pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"

    # Run migrations
    local migrations_applied=0

    for migration_file in $(ls -1 "$migrations_dir"/*.sql | sort); do
        local migration_version=$(basename "$migration_file" .sql | grep -o '[0-9]*' | head -1)

        if [ "$migration_version" -gt "$current_version" ]; then
            log INFO "Applying migration: $(basename "$migration_file")"

            # Start transaction and apply migration
            if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
                # Record migration in schema_migrations table
                psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
                    INSERT INTO schema_migrations (version, applied_at)
                    VALUES ($migration_version, NOW())
                    ON CONFLICT (version) DO NOTHING;
                "
                ((migrations_applied++))
                log SUCCESS "Migration $migration_version applied successfully"
            else
                log ERROR "Migration $migration_version failed"
                log INFO "Restoring database from backup..."
                psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
                return 1
            fi
        fi
    done

    if [ $migrations_applied -eq 0 ]; then
        log INFO "Database is up to date, no migrations needed"
    else
        log SUCCESS "$migrations_applied migrations applied successfully"
    fi

    # Cleanup backup file
    rm -f "$backup_file"
}

# ================================
# 5. ICP Canister Deployment
# ================================

deploy_icp_canisters() {
    log INFO "Deploying ICP canisters..."

    cd "$PROJECT_ROOT"

    # Check DFX network configuration
    local network="ic"
    if [ "$ENVIRONMENT" != "production" ]; then
        network="local"

        # Start local replica if needed
        if ! dfx ping local &> /dev/null; then
            log INFO "Starting local DFX replica..."
            dfx start --background --clean
            sleep 10
        fi
    fi

    # Get current canister status for rollback
    local backend_canister_id=$(dfx canister id packages/backend --network "$network" 2>/dev/null || echo "")
    local frontend_canister_id=$(dfx canister id packages/frontend --network "$network" 2>/dev/null || echo "")

    if [ -n "$backend_canister_id" ]; then
        log INFO "Backing up current backend canister state..."
        dfx canister call packages/backend getState --network "$network" > "/tmp/backend-state-${DEPLOYMENT_ID}.json" || true
    fi

    # Build and deploy canisters
    log INFO "Building canisters..."
    dfx build --network "$network"

    # Deploy with cycles
    local cycles="5000000000000"  # 5T cycles
    if [ "$ENVIRONMENT" = "production" ]; then
        cycles="10000000000000"  # 10T cycles for production
    fi

    log INFO "Deploying canisters with $cycles cycles..."
    dfx deploy --network "$network" --with-cycles "$cycles"

    # Update API key and configuration
    if [ -n "$NOVITA_API_KEY" ]; then
        log INFO "Updating API configuration..."
        dfx canister call packages/backend setApiKey "(\"$NOVITA_API_KEY\")" --network "$network"
    fi

    # Verify deployment
    local new_backend_id=$(dfx canister id packages/backend --network "$network")
    local new_frontend_id=$(dfx canister id packages/frontend --network "$network")

    log INFO "Backend canister ID: $new_backend_id"
    log INFO "Frontend canister ID: $new_frontend_id"

    # Test canister functionality
    log INFO "Testing canister functionality..."
    local test_result=$(dfx canister call packages/backend getHealth --network "$network" 2>/dev/null || echo "error")

    if [[ "$test_result" == *"healthy"* ]]; then
        log SUCCESS "ICP canisters deployed and verified successfully"
    else
        log ERROR "Canister deployment verification failed"
        return 1
    fi

    cd "$SCRIPT_DIR"
}

# ================================
# 6. PM2 Process Management
# ================================

configure_pm2() {
    log INFO "Configuring PM2 process management..."

    # Create PM2 ecosystem file
    cat > "$SCRIPT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'trustcare-bridge',
    script: './src/bridge-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      WS_PORT: 8080,
      LOG_LEVEL: 'info'
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3002,
      WS_PORT: 8081,
      LOG_LEVEL: 'debug'
    },
    error_file: '/var/log/trustcare/bridge-error.log',
    out_file: '/var/log/trustcare/bridge-out.log',
    log_file: '/var/log/trustcare/bridge-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

    # Create log directory
    sudo mkdir -p /var/log/trustcare
    sudo chown -R $USER:$USER /var/log/trustcare

    # Stop existing processes
    pm2 stop ecosystem.config.js 2>/dev/null || true
    pm2 delete ecosystem.config.js 2>/dev/null || true

    # Start new processes
    log INFO "Starting PM2 processes..."
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"

    # Save PM2 configuration
    pm2 save

    # Setup PM2 startup script
    pm2 startup | grep -E '^sudo ' | bash || true

    # Wait for processes to be ready
    sleep 10

    # Verify PM2 processes
    local pm2_status=$(pm2 jlist | jq -r '.[0].pm2_env.status' 2>/dev/null || echo "unknown")

    if [ "$pm2_status" = "online" ]; then
        log SUCCESS "PM2 processes configured and started successfully"
    else
        log ERROR "PM2 process startup failed"
        pm2 logs --lines 50
        return 1
    fi
}

# ================================
# 7. Nginx Configuration
# ================================

configure_nginx() {
    log INFO "Configuring Nginx with SSL certificates..."

    # Create Nginx configuration
    local nginx_config="/etc/nginx/sites-available/trustcare-bridge"

    sudo tee "$nginx_config" > /dev/null << EOF
# TrustCareConnect Bridge Nginx Configuration
upstream bridge_backend {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 backup;
}

upstream bridge_websocket {
    least_conn;
    server 127.0.0.1:8080 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8081 backup;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=ws:10m rate=5r/s;

server {
    listen 80;
    server_name ${DOMAIN:-bridge.trustcareconnect.com};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN:-bridge.trustcareconnect.com};

    # SSL Configuration
    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://bridge_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 300s;
    }

    # WebSocket endpoint
    location /ws {
        limit_req zone=ws burst=10 nodelay;
        proxy_pass http://bridge_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://bridge_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Metrics endpoint (restrict access)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://bridge_backend;
    }

    # Static files
    location /static/ {
        alias /var/www/trustcare/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /var/www/html;
    }
}
EOF

    # Test Nginx configuration
    log INFO "Testing Nginx configuration..."
    sudo nginx -t

    # Enable site
    sudo ln -sf "$nginx_config" /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default

    # Reload Nginx
    log INFO "Reloading Nginx configuration..."
    sudo systemctl reload nginx

    # Verify SSL certificates
    if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
        log INFO "Verifying SSL certificate..."
        openssl x509 -in "$SSL_CERT_PATH" -noout -dates
        log SUCCESS "SSL certificate verified"
    else
        log WARN "SSL certificates not found, using self-signed certificates"
        # Generate self-signed certificates for development
        sudo mkdir -p "$(dirname "$SSL_CERT_PATH")"
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_KEY_PATH" \
            -out "$SSL_CERT_PATH" \
            -subj "/C=KE/ST=Nairobi/L=Nairobi/O=TrustCareConnect/CN=${DOMAIN:-localhost}"
    fi

    log SUCCESS "Nginx configured successfully"
}

# ================================
# 8. Log Aggregation Setup
# ================================

setup_log_aggregation() {
    log INFO "Setting up log aggregation..."

    # Create log aggregation configuration
    local fluentd_config="/etc/fluent/fluent.conf"

    sudo mkdir -p /etc/fluent
    sudo tee "$fluentd_config" > /dev/null << EOF
# TrustCareConnect Log Aggregation Configuration

# Application logs
<source>
  @type tail
  path /var/log/trustcare/*.log
  pos_file /var/log/fluent/trustcare.log.pos
  tag trustcare.app
  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%d %H:%M:%S
  </parse>
</source>

# Nginx access logs
<source>
  @type tail
  path /var/log/nginx/access.log
  pos_file /var/log/fluent/nginx.access.log.pos
  tag trustcare.nginx.access
  <parse>
    @type nginx
  </parse>
</source>

# Nginx error logs
<source>
  @type tail
  path /var/log/nginx/error.log
  pos_file /var/log/fluent/nginx.error.log.pos
  tag trustcare.nginx.error
  <parse>
    @type multiline
    format_firstline /^\d{4}/\d{2}/\d{2}/
    format1 /^(?<time>\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}) \[(?<log_level>\w+)\] (?<message>.*)$/
  </parse>
</source>

# System logs
<source>
  @type systemd
  tag trustcare.systemd
  path /var/log/journal
  <storage>
    @type local
    persistent true
    path /var/log/fluent/systemd.pos
  </storage>
  <entry>
    fields_strip_underscores true
    field_map {"MESSAGE": "message", "_PID": "pid", "_CMDLINE": "cmdline", "_SYSTEMD_UNIT": "unit"}
  </entry>
</source>

# Add environment and deployment metadata
<filter trustcare.**>
  @type record_transformer
  <record>
    environment ${ENVIRONMENT}
    deployment_id ${DEPLOYMENT_ID}
    version ${VERSION}
    hostname #{Socket.gethostname}
  </record>
</filter>

# Output to Elasticsearch (if configured)
<match trustcare.**>
  @type elasticsearch
  host ${ELASTICSEARCH_HOST:-localhost}
  port ${ELASTICSEARCH_PORT:-9200}
  index_name trustcare-logs
  type_name _doc
  logstash_format true
  logstash_prefix trustcare
  logstash_dateformat %Y.%m.%d
  include_tag_key true
  tag_key @tag
  <buffer>
    @type file
    path /var/log/fluent/buffer
    flush_mode interval
    flush_interval 30s
    chunk_limit_size 64MB
    queue_limit_length 512
    retry_max_interval 30
    retry_forever true
  </buffer>
</match>

# Fallback to file output
<match **>
  @type file
  path /var/log/fluent/fallback
  append true
  <format>
    @type json
  </format>
  <buffer>
    timekey 1d
    timekey_use_utc true
    timekey_wait 10m
  </buffer>
</match>
EOF

    # Install and configure log rotation
    sudo tee /etc/logrotate.d/trustcare > /dev/null << EOF
/var/log/trustcare/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    # Create log directories with proper permissions
    sudo mkdir -p /var/log/fluent /var/log/trustcare
    sudo chown -R $USER:$USER /var/log/trustcare

    # Start log aggregation service (if fluentd is available)
    if command -v fluentd &> /dev/null; then
        log INFO "Starting Fluentd log aggregation..."
        sudo systemctl enable fluentd
        sudo systemctl restart fluentd
        log SUCCESS "Log aggregation configured with Fluentd"
    else
        log WARN "Fluentd not available, using file-based logging only"
    fi

    log SUCCESS "Log aggregation setup completed"
}

# ================================
# 9. Smoke Tests
# ================================

run_smoke_tests() {
    log INFO "Running smoke tests..."

    local base_url="https://${DOMAIN:-localhost}"
    if [ "$ENVIRONMENT" = "local" ]; then
        base_url="http://localhost:3001"
    fi

    local test_results=()

    # Test 1: Health endpoint
    log INFO "Testing health endpoint..."
    if curl -f -s "$base_url/health" | jq -e '.status == "healthy"' > /dev/null; then
        test_results+=("✓ Health check")
        log SUCCESS "Health endpoint test passed"
    else
        test_results+=("✗ Health check")
        log ERROR "Health endpoint test failed"
    fi

    # Test 2: API endpoint
    log INFO "Testing API endpoint..."
    local api_response=$(curl -s -w "%{http_code}" -H "Content-Type: application/json" \
        -d '{"test": true}' "$base_url/api/test" -o /dev/null)

    if [ "$api_response" = "200" ] || [ "$api_response" = "404" ]; then
        test_results+=("✓ API endpoint")
        log SUCCESS "API endpoint test passed"
    else
        test_results+=("✗ API endpoint")
        log ERROR "API endpoint test failed (HTTP $api_response)"
    fi

    # Test 3: WebSocket connection
    log INFO "Testing WebSocket connection..."
    if command -v wscat &> /dev/null; then
        local ws_url="wss://${DOMAIN:-localhost}/ws"
        if [ "$ENVIRONMENT" = "local" ]; then
            ws_url="ws://localhost:8080"
        fi

        timeout 10s wscat -c "$ws_url" --execute 'process.exit(0)' 2>/dev/null
        if [ $? -eq 0 ]; then
            test_results+=("✓ WebSocket connection")
            log SUCCESS "WebSocket connection test passed"
        else
            test_results+=("✗ WebSocket connection")
            log ERROR "WebSocket connection test failed"
        fi
    else
        test_results+=("⚠ WebSocket connection (wscat not available)")
        log WARN "WebSocket test skipped (wscat not available)"
    fi

    # Test 4: Database connectivity
    log INFO "Testing database connectivity..."
    if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        test_results+=("✓ Database connectivity")
        log SUCCESS "Database connectivity test passed"
    else
        test_results+=("✗ Database connectivity")
        log ERROR "Database connectivity test failed"
    fi

    # Test 5: Redis connectivity
    log INFO "Testing Redis connectivity..."
    if redis-cli -u "$REDIS_URL" ping | grep -q "PONG"; then
        test_results+=("✓ Redis connectivity")
        log SUCCESS "Redis connectivity test passed"
    else
        test_results+=("✗ Redis connectivity")
        log ERROR "Redis connectivity test failed"
    fi

    # Test 6: ICP canister health
    log INFO "Testing ICP canister health..."
    local network="ic"
    if [ "$ENVIRONMENT" != "production" ]; then
        network="local"
    fi

    local canister_health=$(dfx canister call packages/backend getHealth --network "$network" 2>/dev/null || echo "error")
    if [[ "$canister_health" == *"healthy"* ]]; then
        test_results+=("✓ ICP canister health")
        log SUCCESS "ICP canister health test passed"
    else
        test_results+=("✗ ICP canister health")
        log ERROR "ICP canister health test failed"
    fi

    # Summary
    log INFO "Smoke test results:"
    for result in "${test_results[@]}"; do
        echo "  $result"
    done

    local failed_tests=$(printf '%s\n' "${test_results[@]}" | grep -c "✗" || echo "0")

    if [ "$failed_tests" -eq 0 ]; then
        log SUCCESS "All smoke tests passed"
        return 0
    else
        log ERROR "$failed_tests smoke tests failed"
        return 1
    fi
}

# ================================
# 10. Deployment Notifications
# ================================

send_notification() {
    local title="$1"
    local message="$2"
    local status="${3:-info}"

    local color="good"
    case $status in
        error) color="danger" ;;
        warning) color="warning" ;;
        success) color="good" ;;
    esac

    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local payload=$(cat << EOF
{
    "text": "$title",
    "attachments": [
        {
            "color": "$color",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Version",
                    "value": "$VERSION",
                    "short": true
                },
                {
                    "title": "Deployment ID",
                    "value": "$DEPLOYMENT_ID",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u '+%Y-%m-%d %H:%M:%S UTC')",
                    "short": true
                }
            ],
            "text": "$message"
        }
    ]
}
EOF
        )

        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi

    # Email notification (if configured)
    if [ -n "${NOTIFICATION_EMAIL:-}" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "$title - TrustCareConnect Deployment" "$NOTIFICATION_EMAIL" || true
    fi

    log INFO "Notification sent: $title"
}

# ================================
# 11. Rollback Functionality
# ================================

rollback_deployment() {
    log ERROR "Initiating rollback procedure..."

    # Stop current services
    log INFO "Stopping current services..."
    pm2 stop all 2>/dev/null || true

    # Restore previous Docker images
    if [ -f "/tmp/previous-images-${ENVIRONMENT}.txt" ]; then
        log INFO "Restoring previous Docker images..."
        while IFS= read -r image; do
            docker tag "$image" "${image%:*}:latest"
        done < "/tmp/previous-images-${ENVIRONMENT}.txt"
    fi

    # Restore database if backup exists
    local backup_file="/tmp/trustcare-backup-${DEPLOYMENT_ID}.sql"
    if [ -f "$backup_file" ]; then
        log INFO "Restoring database from backup..."
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    fi

    # Restore ICP canister state
    if [ -f "/tmp/backend-state-${DEPLOYMENT_ID}.json" ]; then
        log INFO "Restoring ICP canister state..."
        local network="ic"
        if [ "$ENVIRONMENT" != "production" ]; then
            network="local"
        fi
        dfx canister call packages/backend restoreState \
            "$(cat "/tmp/backend-state-${DEPLOYMENT_ID}.json")" \
            --network "$network" 2>/dev/null || true
    fi

    # Restore previous PM2 configuration
    if [ -f "/tmp/ecosystem-backup-${ENVIRONMENT}.config.js" ]; then
        log INFO "Restoring previous PM2 configuration..."
        cp "/tmp/ecosystem-backup-${ENVIRONMENT}.config.js" ecosystem.config.js
        pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    fi

    # Restore previous Nginx configuration
    if [ -f "/tmp/nginx-backup-${ENVIRONMENT}.conf" ]; then
        log INFO "Restoring previous Nginx configuration..."
        sudo cp "/tmp/nginx-backup-${ENVIRONMENT}.conf" /etc/nginx/sites-available/trustcare-bridge
        sudo nginx -t && sudo systemctl reload nginx
    fi

    # Run health checks on restored services
    log INFO "Verifying rollback..."
    if perform_health_checks; then
        log SUCCESS "Rollback completed successfully"
        send_notification "🔄 Rollback Successful" "Deployment $DEPLOYMENT_ID rolled back successfully. System restored to previous state." "success"
    else
        log ERROR "Rollback verification failed"
        send_notification "💥 Rollback Failed" "Deployment $DEPLOYMENT_ID rollback failed. Manual intervention required." "error"
    fi
}

create_rollback_point() {
    log INFO "Creating rollback point..."

    # Save current Docker images
    docker images --format "{{.Repository}}:{{.Tag}}" | grep "$DOCKER_REGISTRY" > "/tmp/previous-images-${ENVIRONMENT}.txt"

    # Backup current PM2 configuration
    if [ -f "ecosystem.config.js" ]; then
        cp ecosystem.config.js "/tmp/ecosystem-backup-${ENVIRONMENT}.config.js"
    fi

    # Backup current Nginx configuration
    if [ -f "/etc/nginx/sites-available/trustcare-bridge" ]; then
        sudo cp /etc/nginx/sites-available/trustcare-bridge "/tmp/nginx-backup-${ENVIRONMENT}.conf"
    fi

    log SUCCESS "Rollback point created"
}

# ================================
# Main Deployment Function
# ================================

main() {
    log INFO "Starting TrustCareConnect Bridge deployment..."
    log INFO "Environment: $ENVIRONMENT"
    log INFO "Version: $VERSION"
    log INFO "Deployment ID: $DEPLOYMENT_ID"

    # Create rollback point before starting
    create_rollback_point

    # Execute deployment steps
    validate_environment
    build_docker_images
    run_database_migrations
    deploy_icp_canisters
    configure_pm2
    configure_nginx
    setup_log_aggregation
    perform_health_checks
    run_smoke_tests

    log SUCCESS "Deployment completed successfully!"
    send_notification "🚀 Deployment Successful" "Deployment $DEPLOYMENT_ID completed successfully in $ENVIRONMENT environment." "success"
}

# ================================
# Script Entry Point
# ================================

# Ensure log directory exists
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo touch "$LOG_FILE"
sudo chown $USER:$USER "$LOG_FILE"

# Display usage if invalid arguments
if [ $# -gt 2 ]; then
    echo "Usage: $0 [environment] [version]"
    echo "  environment: staging, production, local (default: staging)"
    echo "  version: git commit hash or version tag (default: current git hash)"
    exit 1
fi

# Run main deployment function
main "$@"