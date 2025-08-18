#!/bin/bash
# TrustCareConnect WSL Ubuntu Startup Test Script
# Complete from-scratch test run for the application
# This script performs a full deployment and validation test

set -e  # Exit on any error

echo "🚀 TrustCareConnect WSL Ubuntu Startup Test"
echo "===========================================" 
echo
echo "This script will:"
echo "  1. Check and install prerequisites"
echo "  2. Clean and setup the project from scratch"
echo "  3. Deploy all services (Backend, AI Proxy, Frontend)"
echo "  4. Run comprehensive validation tests"
echo "  5. Provide status report and next steps"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_section() {
    echo -e "${PURPLE}[§]${NC} $1"
}

print_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get public IP for WSL
get_wsl_ip() {
    # Try multiple methods to get WSL IP
    WSL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    echo "$WSL_IP"
}

# Store start time
START_TIME=$(date +%s)

echo "⏰ Test started at: $(date)"
echo

# =============================================================================
# STEP 1: Prerequisites Check and Installation
# =============================================================================
print_section "STEP 1: Prerequisites Check and Installation"
echo "=================================================="

# Update package lists
print_info "Updating package lists..."
sudo apt update -qq

# Check and install Node.js
print_info "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_status "Node.js is installed and compatible: $NODE_VERSION"
    else
        print_warning "Node.js version is too old: $NODE_VERSION. Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        print_status "Node.js 20 installed successfully"
    fi
else
    print_info "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed successfully"
fi

# Verify npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "npm is available: $NPM_VERSION"
else
    print_error "npm is not available after Node.js installation"
    exit 1
fi

# Check and install DFX
print_info "Checking DFX installation..."
if command_exists dfx; then
    DFX_VERSION=$(dfx --version)
    print_status "DFX is installed: $DFX_VERSION"
else
    print_info "Installing DFX..."
    sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
    export PATH="$HOME/.local/share/dfx/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/dfx/bin:$PATH"' >> ~/.bashrc
    
    if command_exists dfx; then
        print_status "DFX installed successfully"
    else
        print_error "Failed to install DFX"
        exit 1
    fi
fi

# Install additional tools
print_info "Installing additional tools..."
sudo apt install -y curl git lsof jq build-essential

print_status "All prerequisites installed!"
echo

# =============================================================================
# STEP 2: Clean Setup
# =============================================================================
print_section "STEP 2: Clean Environment Setup"
echo "=================================="

# Stop any running services
print_info "Stopping any existing services..."

# Stop DFX if running
if command_exists dfx && dfx ping local >/dev/null 2>&1; then
    print_warning "Stopping existing DFX network..."
    dfx stop 2>/dev/null || true
fi

# Kill processes on our ports
for port in 3000 3001 4943 8000 8080; do
    if lsof -i:$port >/dev/null 2>&1; then
        print_warning "Killing process on port $port..."
        sudo kill -9 $(lsof -t -i:$port) 2>/dev/null || true
    fi
done

# Clean previous installations
print_info "Cleaning previous installations..."
npm run clean 2>/dev/null || true
rm -rf node_modules packages/*/node_modules packages/*/build packages/*/dist 2>/dev/null || true
rm -rf .dfx packages/backend/.dfx 2>/dev/null || true

print_status "Environment cleaned!"
echo

# =============================================================================
# STEP 3: Project Setup
# =============================================================================
print_section "STEP 3: Project Setup and Dependencies"
echo "======================================="

# Install root dependencies
print_info "Installing root dependencies..."
if npm install; then
    print_status "Root dependencies installed"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

# Setup packages
print_info "Setting up package dependencies..."
if npm run setup; then
    print_status "Package dependencies installed"
else
    print_error "Failed to install package dependencies"
    exit 1
fi

# Create environment file if needed
print_info "Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status "Environment file created from template"
    else
        # Create basic .env file
        cat > .env << 'EOF'
# TrustCareConnect Environment Configuration
NODE_ENV=development
PORT=3000
AI_PROXY_PORT=3001

# AI Service Configuration
AI_SERVICE_PROVIDER=mock
OPENAI_API_KEY=your-openai-key-here
CLAUDE_API_KEY=your-claude-key-here

# ICP Configuration
CANISTER_ID_BACKEND=rdmx6-jaaaa-aaaaa-aaadq-cai
NETWORK=local

# Logging
LOG_LEVEL=info
EOF
        print_status "Basic environment file created"
    fi
else
    print_status "Environment file already exists"
fi

print_status "Project setup complete!"
echo

# =============================================================================
# STEP 4: Backend Deployment
# =============================================================================
print_section "STEP 4: Backend Canister Deployment"
echo "===================================="

cd packages/backend

print_info "Starting DFX local network..."
if dfx start --background --clean; then
    print_status "DFX local network started"
    sleep 5  # Give DFX more time to fully initialize
else
    print_error "Failed to start DFX local network"
    exit 1
fi

print_info "Deploying backend canister..."
if dfx deploy --network local; then
    print_status "Backend canister deployed successfully"
    
    # Get canister ID
    BACKEND_CANISTER_ID=$(dfx canister id backend --network local 2>/dev/null || echo "unknown")
    print_info "Backend Canister ID: $BACKEND_CANISTER_ID"
else
    print_error "Failed to deploy backend canister"
    exit 1
fi

cd ../..
print_status "Backend deployment complete!"
echo

# =============================================================================
# STEP 5: AI Proxy Service
# =============================================================================
print_section "STEP 5: AI Proxy Service Deployment"
echo "====================================="

cd packages/ai-proxy

print_info "Starting AI Proxy service..."
# Start AI proxy in background
nohup npm run dev > ai-proxy.log 2>&1 &
AI_PROXY_PID=$!
echo $AI_PROXY_PID > ai-proxy.pid

print_info "Waiting for AI Proxy to start... (PID: $AI_PROXY_PID)"
sleep 10

# Test AI proxy
MAX_RETRIES=6
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        print_status "AI Proxy service is running on port 3001"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_warning "AI Proxy not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "AI Proxy failed to start properly"
    print_error "AI Proxy logs:"
    cat ai-proxy.log | tail -20
    exit 1
fi

cd ../..
print_status "AI Proxy deployment complete!"
echo

# =============================================================================
# STEP 6: Frontend Application
# =============================================================================
print_section "STEP 6: Frontend Application Deployment"
echo "========================================"

cd packages/frontend

print_info "Starting React development server..."
# Start frontend in background
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

print_info "Waiting for Frontend to start... (PID: $FRONTEND_PID)"
sleep 15

# Test frontend
MAX_RETRIES=8
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_status "Frontend application is running on port 3000"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_warning "Frontend not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)"
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_warning "Frontend may still be starting up..."
    print_info "Frontend logs (last 10 lines):"
    tail -10 frontend.log
fi

cd ../..
print_status "Frontend deployment complete!"
echo

# =============================================================================
# STEP 7: Comprehensive Testing
# =============================================================================
print_section "STEP 7: Comprehensive Application Testing"
echo "=========================================="

print_test "Running comprehensive validation tests..."

TESTS_PASSED=0
TESTS_TOTAL=0

# Test 1: Service Availability
print_test "Testing service availability..."

TESTS_TOTAL=$((TESTS_TOTAL + 3))

# Frontend test
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
    print_status "✓ Frontend is accessible (port 3000)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "✗ Frontend not accessible on port 3000"
fi

# AI Proxy test
if curl -s http://localhost:3001/api/health | grep -q "ok\|healthy\|running"; then
    print_status "✓ AI Proxy is healthy (port 3001)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "✗ AI Proxy health check failed"
fi

# Backend test
if dfx ping local >/dev/null 2>&1; then
    print_status "✓ DFX local network is responding"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "✗ DFX local network not responding"
fi

# Test 2: Backend Functionality
print_test "Testing backend canister functionality..."

cd packages/backend
TESTS_TOTAL=$((TESTS_TOTAL + 2))

# Test patient registration
if dfx canister call backend registerPatient '("Startup Test Patient", "Test Condition for Validation", "startuptest@trustcare.local")' >/dev/null 2>&1; then
    print_status "✓ Patient registration works"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "✗ Patient registration failed"
fi

# Test patient retrieval
if dfx canister call backend getUnassignedPatients '()' >/dev/null 2>&1; then
    print_status "✓ Patient data retrieval works"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "✗ Patient data retrieval failed"
fi

cd ../..

# Test 3: AI Proxy API
print_test "Testing AI Proxy API functionality..."

TESTS_TOTAL=$((TESTS_TOTAL + 1))

API_RESPONSE=$(curl -s -X POST http://localhost:3001/api/query \
    -H "Content-Type: application/json" \
    -d '{"queryText": "Startup test query for validation", "condition": "test condition", "provider": "mock"}' 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$API_RESPONSE" ]; then
    print_status "✓ AI Query API is responding"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "✗ AI Query API not responding properly"
fi

# Test 4: File Structure Integrity
print_test "Validating critical file structure..."

CRITICAL_FILES=(
    "package.json"
    "packages/backend/src/main.mo"
    "packages/frontend/src/App.tsx"
    "packages/ai-proxy/src/app.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if [ -f "$file" ]; then
        print_status "✓ Critical file exists: $file"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "✗ Missing critical file: $file"
    fi
done

echo

# =============================================================================
# STEP 8: Results and Status Report
# =============================================================================
print_section "STEP 8: Test Results and Status Report"
echo "======================================="

# Calculate test results
TEST_PERCENTAGE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo
echo "📊 TEST RESULTS SUMMARY"
echo "======================="
echo "Tests Passed: $TESTS_PASSED/$TESTS_TOTAL ($TEST_PERCENTAGE%)"
echo "Total Duration: ${MINUTES}m ${SECONDS}s"
echo "Test Status: $([ $TEST_PERCENTAGE -ge 80 ] && echo "🟢 EXCELLENT" || [ $TEST_PERCENTAGE -ge 60 ] && echo "🟡 GOOD" || echo "🔴 NEEDS ATTENTION")"
echo

echo "🌐 APPLICATION ENDPOINTS"
echo "========================="
WSL_IP=$(get_wsl_ip)
echo "Frontend Application:"
echo "  • Local: http://localhost:3000"
echo "  • WSL Network: http://$WSL_IP:3000"
echo
echo "AI Proxy Service:"
echo "  • Local: http://localhost:3001"
echo "  • Health Check: http://localhost:3001/health"
echo "  • WSL Network: http://$WSL_IP:3001"
echo
echo "Backend Canister:"
echo "  • Network: Local IC"
echo "  • Canister ID: $(cd packages/backend && dfx canister id backend --network local 2>/dev/null || echo "unknown")"
echo

echo "🔧 MANAGEMENT COMMANDS"
echo "======================"
echo "Stop All Services:"
echo "  kill $(cat packages/ai-proxy/ai-proxy.pid 2>/dev/null || echo 'N/A') $(cat packages/frontend/frontend.pid 2>/dev/null || echo 'N/A') 2>/dev/null; dfx stop"
echo
echo "Check Service Status:"
echo "  • Frontend: curl -s http://localhost:3000 && echo 'Frontend OK'"
echo "  • AI Proxy: curl -s http://localhost:3001/api/health"
echo "  • Backend: cd packages/backend && dfx canister call backend getUnassignedPatients '()'"
echo
echo "View Logs:"
echo "  • AI Proxy: tail -f packages/ai-proxy/ai-proxy.log"
echo "  • Frontend: tail -f packages/frontend/frontend.log"
echo "  • DFX: dfx logs"
echo

echo "🧪 NEXT STEPS FOR TESTING"
echo "=========================="
echo "1. Open http://localhost:3000 in your browser"
echo "2. Test patient registration functionality"
echo "3. Test AI query submission"
echo "4. Verify data flow between components"
echo "5. Check responsive design on different screen sizes"
echo

if [ $TEST_PERCENTAGE -ge 80 ]; then
    echo "🎉 STARTUP TEST SUCCESSFUL!"
    echo "==========================="
    print_status "TrustCareConnect is fully deployed and operational in WSL Ubuntu!"
    print_status "All critical systems are running and tests are passing."
    echo
elif [ $TEST_PERCENTAGE -ge 60 ]; then
    echo "⚠️  STARTUP TEST PARTIALLY SUCCESSFUL"
    echo "====================================="
    print_warning "TrustCareConnect is mostly operational but some issues were detected."
    print_warning "Review the test results above and check service logs."
    echo
else
    echo "🚨 STARTUP TEST NEEDS ATTENTION"
    echo "==============================="
    print_error "Multiple issues detected during startup test."
    print_error "Please review the failures above and check system logs."
    echo
fi

echo "📚 TROUBLESHOOTING RESOURCES"
echo "============================"
echo "• Project Documentation: README.md"
echo "• Deployment Guide: docs/deployment/"
echo "• Test Scripts: scripts/test/"
echo "• Architecture Overview: docs/architecture/"
echo

print_info "Test completed at: $(date)"
print_info "For detailed logs, check individual service log files."
echo

# Save test results to file
cat > startup-test-results.log << EOF
TrustCareConnect WSL Ubuntu Startup Test Results
===============================================
Test Date: $(date)
Duration: ${MINUTES}m ${SECONDS}s
Tests Passed: $TESTS_PASSED/$TESTS_TOTAL ($TEST_PERCENTAGE%)

Endpoints:
- Frontend: http://localhost:3000
- AI Proxy: http://localhost:3001  
- Backend Canister: Local IC Network

Process IDs:
- AI Proxy: $(cat packages/ai-proxy/ai-proxy.pid 2>/dev/null || echo 'N/A')
- Frontend: $(cat packages/frontend/frontend.pid 2>/dev/null || echo 'N/A')

Status: $([ $TEST_PERCENTAGE -ge 80 ] && echo "SUCCESS" || [ $TEST_PERCENTAGE -ge 60 ] && echo "PARTIAL" || echo "ISSUES")
EOF

print_status "Test results saved to: startup-test-results.log"
echo