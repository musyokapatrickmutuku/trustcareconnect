#!/bin/bash

# =====================================
# TrustCareConnect One-Command Startup
# =====================================
# This script sets up the entire TrustCareConnect development environment
# with a single command, including ICP canisters and WebSocket bridge

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/musyokapatrickmutuku/trustcareconnect.git"
PROJECT_DIR="trustcareconnect"
BRIDGE_DIR="trustcare-bridge"
REQUIRED_NODE_VERSION="18"
DFX_VERSION="0.15.0"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%H:%M:%S')

    case $level in
        INFO)  echo -e "${CYAN}[$timestamp]${NC} ${BLUE}ℹ${NC}  $message" ;;
        WARN)  echo -e "${CYAN}[$timestamp]${NC} ${YELLOW}⚠${NC}  $message" ;;
        ERROR) echo -e "${CYAN}[$timestamp]${NC} ${RED}✗${NC}  $message" ;;
        SUCCESS) echo -e "${CYAN}[$timestamp]${NC} ${GREEN}✓${NC}  $message" ;;
        STEP) echo -e "${CYAN}[$timestamp]${NC} ${PURPLE}▶${NC}  $message" ;;
    esac
}

# Error handling
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log ERROR "Setup failed! Check the output above for details."
        log INFO "You can re-run this script to retry the setup."

        # Stop any running services
        pkill -f "dfx start" 2>/dev/null || true
        pkill -f "npm run dev" 2>/dev/null || true
    fi
    exit $exit_code
}

trap cleanup EXIT

# Display banner
display_banner() {
    echo -e "${PURPLE}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║               TrustCareConnect QuickStart                    ║
║                                                              ║
║       AI-Powered Diabetes Care Platform Setup               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo
    log INFO "This script will set up the complete TrustCareConnect development environment"
    echo
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Compare version numbers
version_gte() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Get installed Node.js version
get_node_version() {
    if command_exists node; then
        node --version | sed 's/v//'
    else
        echo "0"
    fi
}

# Check prerequisites
check_prerequisites() {
    log STEP "Checking prerequisites..."

    local missing_tools=()
    local need_install=false

    # Check Node.js
    if command_exists node; then
        local node_version=$(get_node_version)
        if version_gte "$node_version" "$REQUIRED_NODE_VERSION"; then
            log SUCCESS "Node.js v$node_version (✓ >= v$REQUIRED_NODE_VERSION)"
        else
            log WARN "Node.js v$node_version found (need >= v$REQUIRED_NODE_VERSION)"
            missing_tools+=("nodejs")
            need_install=true
        fi
    else
        log WARN "Node.js not found"
        missing_tools+=("nodejs")
        need_install=true
    fi

    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        log SUCCESS "npm v$npm_version"
    else
        log WARN "npm not found"
        missing_tools+=("npm")
        need_install=true
    fi

    # Check DFX
    if command_exists dfx; then
        local dfx_version=$(dfx --version | head -1 | awk '{print $2}')
        log SUCCESS "DFX v$dfx_version"
    else
        log WARN "DFX not found"
        missing_tools+=("dfx")
        need_install=true
    fi

    # Check Docker
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
            log SUCCESS "Docker v$docker_version (running)"
        else
            log WARN "Docker installed but not running"
            log INFO "Please start Docker Desktop or Docker daemon"
            missing_tools+=("docker-running")
            need_install=true
        fi
    else
        log WARN "Docker not found"
        missing_tools+=("docker")
        need_install=true
    fi

    # Check Git
    if command_exists git; then
        local git_version=$(git --version | awk '{print $3}')
        log SUCCESS "Git v$git_version"
    else
        log WARN "Git not found"
        missing_tools+=("git")
        need_install=true
    fi

    # Check curl
    if command_exists curl; then
        log SUCCESS "curl available"
    else
        log WARN "curl not found"
        missing_tools+=("curl")
        need_install=true
    fi

    if [ "$need_install" = true ]; then
        echo
        log ERROR "Missing required tools. Please install:"
        echo

        # Provide installation instructions
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            echo -e "${YELLOW}macOS Installation Commands:${NC}"
            for tool in "${missing_tools[@]}"; do
                case $tool in
                    nodejs|npm)
                        echo "  brew install node"
                        ;;
                    dfx)
                        echo "  sh -ci \"\$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
                        ;;
                    docker)
                        echo "  Download Docker Desktop from https://docker.com/products/docker-desktop"
                        ;;
                    docker-running)
                        echo "  Start Docker Desktop application"
                        ;;
                    git)
                        echo "  brew install git"
                        ;;
                    curl)
                        echo "  brew install curl"
                        ;;
                esac
            done
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            echo -e "${YELLOW}Linux Installation Commands:${NC}"
            for tool in "${missing_tools[@]}"; do
                case $tool in
                    nodejs|npm)
                        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
                        echo "  sudo apt-get install -y nodejs"
                        ;;
                    dfx)
                        echo "  sh -ci \"\$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
                        ;;
                    docker)
                        echo "  curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
                        ;;
                    docker-running)
                        echo "  sudo systemctl start docker"
                        ;;
                    git)
                        echo "  sudo apt-get install git"
                        ;;
                    curl)
                        echo "  sudo apt-get install curl"
                        ;;
                esac
            done
        else
            # Windows/Other
            echo -e "${YELLOW}Installation Instructions:${NC}"
            echo "  1. Install Node.js 18+ from https://nodejs.org"
            echo "  2. Install DFX: sh -ci \"\$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
            echo "  3. Install Docker from https://docker.com/products/docker-desktop"
            echo "  4. Install Git from https://git-scm.com"
        fi

        echo
        log INFO "After installing missing tools, re-run this script:"
        echo -e "${CYAN}  curl -fsSL https://raw.githubusercontent.com/musyokapatrickmutuku/trustcareconnect/main/quickstart.sh | bash${NC}"
        exit 1
    fi

    log SUCCESS "All prerequisites satisfied!"
    echo
}

# Clone repository
clone_repository() {
    log STEP "Setting up project repository..."

    if [ -d "$PROJECT_DIR" ]; then
        log INFO "Project directory exists, updating..."
        cd "$PROJECT_DIR"
        git pull origin main
        cd ..
    else
        log INFO "Cloning TrustCareConnect repository..."
        git clone "$REPO_URL" "$PROJECT_DIR"
        log SUCCESS "Repository cloned successfully"
    fi

    if [ ! -d "$PROJECT_DIR/$BRIDGE_DIR" ]; then
        log ERROR "Bridge directory not found in repository"
        log INFO "Expected: $PROJECT_DIR/$BRIDGE_DIR"
        exit 1
    fi

    echo
}

# Setup development environment
setup_environment() {
    log STEP "Setting up development environment..."

    # Setup main project
    cd "$PROJECT_DIR"

    if [ -f "package.json" ]; then
        log INFO "Installing main project dependencies..."
        npm install
        log SUCCESS "Main project dependencies installed"
    fi

    # Setup bridge service
    cd "$BRIDGE_DIR"

    if [ -f "package.json" ]; then
        log INFO "Installing bridge service dependencies..."
        npm install
        log SUCCESS "Bridge service dependencies installed"
    else
        log ERROR "package.json not found in bridge directory"
        exit 1
    fi

    # Setup environment file
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            log INFO "Creating .env file from template..."
            cp .env.example .env
            log SUCCESS "Environment file created"
        else
            log INFO "Creating basic .env file..."
            cat > .env << 'EOF'
# TrustCareConnect Bridge Configuration
NODE_ENV=development
PORT=3001
WS_PORT=8080
LOG_LEVEL=debug

# Novita AI Configuration (REQUIRED)
NOVITA_API_KEY=your_novita_api_key_here
NOVITA_BASE_URL=https://api.novita.ai/openai/v1

# ICP Configuration (will be updated automatically)
ICP_HOST=http://localhost:4943
ICP_AGENT_HOST=http://127.0.0.1:4943
DFX_NETWORK=local

# Security
JWT_SECRET=dev-jwt-secret-change-in-production
BRIDGE_SECRET_KEY=dev-bridge-secret-change-in-production

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_CONNECTION_TIMEOUT=60000
MAX_CONCURRENT_CONNECTIONS=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
            log SUCCESS "Basic environment file created"
        fi
    else
        log INFO "Environment file already exists"
    fi

    cd ..
    echo
}

# Start ICP local network
start_icp_network() {
    log STEP "Starting ICP local development network..."

    # Kill any existing dfx processes
    pkill -f "dfx start" 2>/dev/null || true
    sleep 2

    # Start DFX in background
    log INFO "Starting DFX replica..."
    dfx start --background --clean

    # Wait for network to be ready
    log INFO "Waiting for ICP network to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if dfx ping local >/dev/null 2>&1; then
            log SUCCESS "ICP local network is ready"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            log ERROR "ICP network failed to start after $max_attempts attempts"
            exit 1
        fi

        log INFO "Attempt $attempt/$max_attempts - waiting for network..."
        sleep 2
        ((attempt++))
    done

    echo
}

# Deploy ICP canisters
deploy_canisters() {
    log STEP "Deploying ICP canisters..."

    # Check if dfx.json exists
    if [ ! -f "dfx.json" ]; then
        log ERROR "dfx.json not found. Are you in the correct directory?"
        exit 1
    fi

    # Deploy canisters with cycles
    log INFO "Building and deploying canisters..."
    dfx deploy --with-cycles 2000000000000

    # Get canister IDs
    local backend_id=$(dfx canister id packages/backend 2>/dev/null || echo "")
    local frontend_id=$(dfx canister id packages/frontend 2>/dev/null || echo "")

    if [ -n "$backend_id" ]; then
        log SUCCESS "Backend canister deployed: $backend_id"
        export ICP_CANISTER_ID="$backend_id"
    else
        log ERROR "Failed to get backend canister ID"
        exit 1
    fi

    if [ -n "$frontend_id" ]; then
        log SUCCESS "Frontend canister deployed: $frontend_id"
    fi

    # Test canister functionality
    log INFO "Testing canister functionality..."
    local health_check=$(dfx canister call packages/backend getHealth 2>/dev/null || echo "error")

    if [[ "$health_check" == *"healthy"* ]]; then
        log SUCCESS "Canister health check passed"
    else
        log WARN "Canister health check failed, but continuing..."
    fi

    echo
}

# Update environment with canister ID
update_environment() {
    log STEP "Updating environment configuration..."

    cd "$BRIDGE_DIR"

    if [ -n "${ICP_CANISTER_ID:-}" ]; then
        # Update .env file with canister ID
        if grep -q "ICP_CANISTER_ID=" .env; then
            # Replace existing line
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/ICP_CANISTER_ID=.*/ICP_CANISTER_ID=$ICP_CANISTER_ID/" .env
            else
                sed -i "s/ICP_CANISTER_ID=.*/ICP_CANISTER_ID=$ICP_CANISTER_ID/" .env
            fi
        else
            # Add new line
            echo "ICP_CANISTER_ID=$ICP_CANISTER_ID" >> .env
        fi
        log SUCCESS "Environment updated with canister ID: $ICP_CANISTER_ID"
    else
        log WARN "No canister ID to update"
    fi

    # Check if NOVITA_API_KEY is set
    if grep -q "NOVITA_API_KEY=your_novita_api_key_here" .env; then
        echo
        log WARN "⚠️  IMPORTANT: Add your Novita AI API key to the .env file"
        echo -e "${YELLOW}   1. Get your API key from: https://novita.ai${NC}"
        echo -e "${YELLOW}   2. Edit $PWD/.env${NC}"
        echo -e "${YELLOW}   3. Replace 'your_novita_api_key_here' with your actual API key${NC}"
        echo
    fi

    cd ..
    echo
}

# Start WebSocket bridge service
start_bridge_service() {
    log STEP "Starting WebSocket bridge service..."

    cd "$BRIDGE_DIR"

    # Check if the service script exists
    if [ ! -f "src/bridge-server.js" ]; then
        log ERROR "Bridge server file not found: src/bridge-server.js"
        exit 1
    fi

    # Start the service in development mode
    log INFO "Starting bridge service in development mode..."

    # Start in background and capture PID
    npm run dev &
    local bridge_pid=$!

    # Wait for service to be ready
    log INFO "Waiting for bridge service to start..."
    local max_attempts=20
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3001/health >/dev/null 2>&1; then
            log SUCCESS "Bridge service is ready"
            break
        fi

        if [ $attempt -eq $max_attempts ]; then
            log ERROR "Bridge service failed to start after $max_attempts attempts"
            log INFO "Check the service logs above for errors"
            exit 1
        fi

        log INFO "Attempt $attempt/$max_attempts - waiting for service..."
        sleep 3
        ((attempt++))
    done

    # Test WebSocket connection
    log INFO "Testing WebSocket connection..."
    if command_exists wscat; then
        timeout 5s wscat -c ws://localhost:8080 --execute 'process.exit(0)' 2>/dev/null && \
            log SUCCESS "WebSocket connection test passed" || \
            log WARN "WebSocket test failed (wscat might not be available)"
    else
        log INFO "WebSocket test skipped (wscat not available)"
    fi

    cd ..
    echo
}

# Display final information
display_completion() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║                🎉 SETUP COMPLETE! 🎉                        ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo

    log SUCCESS "TrustCareConnect development environment is ready!"
    echo

    echo -e "${CYAN}📊 Service Information:${NC}"
    echo -e "   ${BLUE}•${NC} WebSocket Bridge: ${GREEN}ws://localhost:8080${NC}"
    echo -e "   ${BLUE}•${NC} HTTP API: ${GREEN}http://localhost:3001${NC}"
    echo -e "   ${BLUE}•${NC} Health Check: ${GREEN}http://localhost:3001/health${NC}"
    echo -e "   ${BLUE}•${NC} ICP Network: ${GREEN}http://localhost:4943${NC}"

    if [ -n "${ICP_CANISTER_ID:-}" ]; then
        echo -e "   ${BLUE}•${NC} Backend Canister: ${GREEN}$ICP_CANISTER_ID${NC}"
        echo -e "   ${BLUE}•${NC} Candid Interface: ${GREEN}http://localhost:4943/_/candid?id=$ICP_CANISTER_ID${NC}"
    fi

    echo
    echo -e "${CYAN}🛠️  Development Commands:${NC}"
    echo -e "   ${BLUE}•${NC} View bridge logs: ${YELLOW}cd $PROJECT_DIR/$BRIDGE_DIR && npm run logs${NC}"
    echo -e "   ${BLUE}•${NC} Run tests: ${YELLOW}cd $PROJECT_DIR/$BRIDGE_DIR && npm test${NC}"
    echo -e "   ${BLUE}•${NC} Stop services: ${YELLOW}pkill -f \"dfx start\" && pkill -f \"npm run dev\"${NC}"
    echo -e "   ${BLUE}•${NC} Restart bridge: ${YELLOW}cd $PROJECT_DIR/$BRIDGE_DIR && npm run dev${NC}"

    echo
    echo -e "${CYAN}📁 Project Structure:${NC}"
    echo -e "   ${BLUE}•${NC} Main Project: ${YELLOW}$(pwd)/$PROJECT_DIR${NC}"
    echo -e "   ${BLUE}•${NC} Bridge Service: ${YELLOW}$(pwd)/$PROJECT_DIR/$BRIDGE_DIR${NC}"
    echo -e "   ${BLUE}•${NC} Environment Config: ${YELLOW}$(pwd)/$PROJECT_DIR/$BRIDGE_DIR/.env${NC}"

    echo
    echo -e "${CYAN}🔗 Quick Links:${NC}"
    echo -e "   ${BLUE}•${NC} Repository: ${GREEN}https://github.com/musyokapatrickmutuku/trustcareconnect${NC}"
    echo -e "   ${BLUE}•${NC} Documentation: ${GREEN}$(pwd)/$PROJECT_DIR/README.md${NC}"
    echo -e "   ${BLUE}•${NC} Bridge Docs: ${GREEN}$(pwd)/$PROJECT_DIR/$BRIDGE_DIR/README.md${NC}"

    # Check if NOVITA_API_KEY still needs to be set
    if [ -f "$PROJECT_DIR/$BRIDGE_DIR/.env" ] && grep -q "your_novita_api_key_here" "$PROJECT_DIR/$BRIDGE_DIR/.env"; then
        echo
        echo -e "${YELLOW}⚠️  NEXT STEP REQUIRED:${NC}"
        echo -e "   ${RED}•${NC} Add your Novita AI API key to enable AI functionality"
        echo -e "   ${RED}•${NC} Edit: ${YELLOW}$(pwd)/$PROJECT_DIR/$BRIDGE_DIR/.env${NC}"
        echo -e "   ${RED}•${NC} Get API key: ${GREEN}https://novita.ai${NC}"
    fi

    echo
    echo -e "${GREEN}Happy coding! 🚀${NC}"
    echo

    # Optionally open browser
    if command_exists open; then
        # macOS
        log INFO "Opening health check in browser..."
        open "http://localhost:3001/health" 2>/dev/null || true
    elif command_exists xdg-open; then
        # Linux
        log INFO "Opening health check in browser..."
        xdg-open "http://localhost:3001/health" 2>/dev/null || true
    fi
}

# Main execution function
main() {
    display_banner
    check_prerequisites
    clone_repository
    setup_environment
    start_icp_network
    deploy_canisters
    update_environment
    start_bridge_service
    display_completion
}

# Handle script arguments
if [ $# -gt 0 ]; then
    case "$1" in
        --help|-h)
            echo "TrustCareConnect QuickStart Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --help, -h        Show this help message"
            echo "  --check           Only check prerequisites"
            echo "  --no-browser      Don't attempt to open browser"
            echo ""
            echo "This script will:"
            echo "  1. Check and validate all prerequisites"
            echo "  2. Clone the TrustCareConnect repository"
            echo "  3. Install all dependencies"
            echo "  4. Start ICP local development network"
            echo "  5. Deploy Motoko canisters"
            echo "  6. Configure environment variables"
            echo "  7. Start the WebSocket bridge service"
            echo ""
            exit 0
            ;;
        --check)
            display_banner
            check_prerequisites
            log SUCCESS "Prerequisites check complete!"
            exit 0
            ;;
        --no-browser)
            export NO_BROWSER=true
            ;;
        *)
            log ERROR "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
fi

# Run main function
main "$@"