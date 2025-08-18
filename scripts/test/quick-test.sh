#!/bin/bash
# Quick validation test for TrustCareConnect deployment

echo "🧪 TrustCareConnect Quick Validation Test"
echo "========================================"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Check if services are running
print_test "Checking if services are running..."

# Test Frontend (port 3000)
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_pass "Frontend is running on port 3000"
else
    print_fail "Frontend is not accessible on port 3000"
fi

# Test AI Proxy (port 3001)
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
    print_pass "AI Proxy is running on port 3001"
    print_info "Health response: $HEALTH_RESPONSE"
else
    print_fail "AI Proxy is not accessible on port 3001"
fi

# Test DFX local network
if command -v dfx >/dev/null 2>&1; then
    if dfx ping local >/dev/null 2>&1; then
        print_pass "DFX local network is running"
    else
        print_fail "DFX local network is not running"
    fi
else
    print_fail "DFX command not found"
fi

echo

# Test 2: Backend Canister Functionality
print_test "Testing backend canister functionality..."

if command -v dfx >/dev/null 2>&1 && dfx ping local >/dev/null 2>&1; then
    cd packages/backend 2>/dev/null || cd backend 2>/dev/null || true
    
    # Test patient registration
    if dfx canister call backend registerPatient '("Test User", "test condition", "test@quicktest.com")' >/dev/null 2>&1; then
        print_pass "Patient registration works"
    else
        print_fail "Patient registration failed"
    fi
    
    # Test getting unassigned patients (since getAllPatients doesn't exist)
    if dfx canister call backend getUnassignedPatients '()' >/dev/null 2>&1; then
        print_pass "Patient retrieval works"
    else
        print_fail "Patient retrieval failed"
    fi
    
    cd - >/dev/null 2>&1
else
    print_fail "Cannot test backend - DFX not available or not running"
fi

echo

# Test 3: AI Proxy API
print_test "Testing AI Proxy API endpoints..."

if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    # Test AI query endpoint
    QUERY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/query \
        -H "Content-Type: application/json" \
        -d '{"queryText": "Quick test query", "condition": "test", "provider": "mock"}' 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$QUERY_RESPONSE" ]; then
        print_pass "AI query endpoint responds"
        print_info "Sample response: ${QUERY_RESPONSE:0:100}..."
    else
        print_fail "AI query endpoint not responding properly"
    fi
else
    print_fail "Cannot test AI Proxy - service not running"
fi

echo

# Test 4: File Structure Validation
print_test "Validating project structure..."

# Check key directories
KEY_DIRS=(
    "packages/backend"
    "packages/frontend" 
    "packages/ai-proxy"
    "docs"
    "scripts"
    "config"
)

for dir in "${KEY_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_pass "Directory exists: $dir"
    else
        print_fail "Missing directory: $dir"
    fi
done

# Check key files
KEY_FILES=(
    "package.json"
    ".env.example"
    "README.md"
    "packages/backend/src/main.mo"
    "packages/frontend/src/App.tsx"
    "packages/ai-proxy/src/app.js"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_pass "File exists: $file"
    else
        print_fail "Missing file: $file"
    fi
done

echo

# Summary
echo "📋 Test Summary"
echo "==============="
print_info "If all tests pass, TrustCareConnect is properly deployed!"
print_info "If any tests fail, check the troubleshooting guide in docs/deployment/WSL_DEPLOYMENT_GUIDE.md"
echo
print_info "Access the application:"
echo "  • Frontend: http://localhost:3000"
echo "  • AI Proxy: http://localhost:3001"
echo "  • Health Check: curl http://localhost:3001/health"
echo