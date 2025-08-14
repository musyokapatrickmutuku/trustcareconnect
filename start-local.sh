#!/bin/bash

# TrustCareConnect Local Deployment Script
# This script automates the local deployment process

set -e

echo "🚀 Starting TrustCareConnect Local Deployment..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v dfx &> /dev/null; then
        print_error "dfx is not installed. Please install the Internet Computer SDK."
        echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_success "All prerequisites found"
    echo "  - dfx: $(dfx --version)"
    echo "  - node: $(node --version)"  
    echo "  - npm: $(npm --version)"
    echo
}

# Start dfx replica
start_replica() {
    print_status "Starting local ICP replica..."
    
    # Stop any existing replica
    dfx stop 2>/dev/null || true
    
    # Start fresh replica
    dfx start --background --clean
    
    # Wait for replica to be ready
    print_status "Waiting for replica to be ready..."
    sleep 5
    
    if dfx ping &> /dev/null; then
        print_success "ICP replica is running"
    else
        print_error "Failed to start ICP replica"
        exit 1
    fi
    echo
}

# Deploy canisters
deploy_canisters() {
    print_status "Deploying backend canister..."
    dfx deploy backend
    
    print_status "Installing frontend dependencies..."
    cd src/frontend
    npm install --silent
    cd ../..
    
    print_status "Deploying frontend canister..."
    dfx deploy frontend
    
    print_success "Canisters deployed successfully"
    echo
}

# Setup AI proxy
setup_ai_proxy() {
    print_status "Setting up AI proxy server..."
    
    cd ai-proxy
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing AI proxy dependencies..."
        npm install --silent
    fi
    
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cp .env.example .env
        print_warning "Using mock AI responses. Edit ai-proxy/.env to add real API keys."
    fi
    
    cd ..
    print_success "AI proxy setup complete"
    echo
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Test backend
    if dfx canister call backend healthCheck &> /dev/null; then
        print_success "Backend is responding"
    else
        print_error "Backend test failed"
        exit 1
    fi
    
    # Get URLs
    backend_id=$(dfx canister id backend)
    frontend_id=$(dfx canister id frontend)
    
    print_success "Deployment test complete"
    echo
    print_status "📋 Your application URLs:"
    echo "  🖥️  Frontend: http://${frontend_id}.localhost:4943"
    echo "  ⚙️  Backend Candid UI: http://${backend_id}.localhost:4943/_/candid"
    echo "  🤖 AI Proxy: http://localhost:3001 (start with: cd ai-proxy && npm start)"
    echo
}

# Start AI proxy in background
start_ai_proxy() {
    print_status "Starting AI proxy server..."
    
    cd ai-proxy
    
    # Kill any existing process on port 3001
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    # Start AI proxy in background
    nohup npm start > ai-proxy.log 2>&1 &
    AI_PROXY_PID=$!
    
    # Wait for server to start
    sleep 3
    
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "AI proxy server started (PID: $AI_PROXY_PID)"
        echo "  📋 Logs: ai-proxy/ai-proxy.log"
    else
        print_error "Failed to start AI proxy server"
        exit 1
    fi
    
    cd ..
    echo
}

# Show next steps
show_next_steps() {
    echo
    echo "🎉 TrustCareConnect is now running locally!"
    echo "==========================================="
    echo
    echo "📋 Quick Testing Steps:"
    echo "1. Open Frontend: http://${frontend_id}.localhost:4943"
    echo "2. Register a Doctor (Doctor View)"
    echo "3. Register a Patient (Patient View)"  
    echo "4. Doctor assigns Patient (Patient Management tab)"
    echo "5. Patient submits Query (generates AI draft)"
    echo "6. Doctor reviews Query with AI assistance"
    echo "7. Doctor submits final response"
    echo
    echo "📖 Full Testing Guide: See DEPLOYMENT_GUIDE.md"
    echo
    echo "🛑 To Stop Everything:"
    echo "  dfx stop"
    echo "  kill $AI_PROXY_PID  # Stop AI proxy"
    echo
    echo "🔧 Troubleshooting:"
    echo "  - Backend logs: dfx logs backend"
    echo "  - AI proxy logs: tail -f ai-proxy/ai-proxy.log"
    echo "  - Frontend: F12 in browser"
    echo
}

# Main execution
main() {
    echo
    check_prerequisites
    start_replica
    deploy_canisters
    setup_ai_proxy
    start_ai_proxy
    test_deployment
    show_next_steps
}

# Handle Ctrl+C
trap 'echo -e "\n${YELLOW}[INTERRUPTED]${NC} Cleaning up..."; dfx stop; exit 1' INT

# Run main function
main