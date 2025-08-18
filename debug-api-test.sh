#!/bin/bash
# Quick debug commands for TrustCareConnect AI Proxy API

echo "🔍 TrustCareConnect AI Proxy API Debug Test"
echo "==========================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

echo "Testing corrected AI Proxy endpoints..."
echo

# Test 1: Health Check (correct endpoint)
print_test "1. Testing health endpoint (correct path /api/health)"
if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
    print_pass "Health endpoint working!"
    print_info "Response: $HEALTH_RESPONSE"
else
    print_fail "Health endpoint not accessible"
fi
echo

# Test 2: Available Providers
print_test "2. Testing providers endpoint"
if curl -s http://localhost:3001/api/providers >/dev/null 2>&1; then
    PROVIDERS_RESPONSE=$(curl -s http://localhost:3001/api/providers)
    print_pass "Providers endpoint working!"
    print_info "Response: $PROVIDERS_RESPONSE"
else
    print_fail "Providers endpoint not accessible"
fi
echo

# Test 3: AI Query (correct format)
print_test "3. Testing AI query endpoint (correct request format)"
QUERY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/query \
    -H "Content-Type: application/json" \
    -d '{"queryText": "Test query for debugging", "condition": "debugging condition", "provider": "mock"}' 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$QUERY_RESPONSE" ]; then
    # Check if response contains success field
    if echo "$QUERY_RESPONSE" | grep -q '"success":true'; then
        print_pass "AI Query endpoint working correctly!"
        print_info "Successful response received"
        echo "Full response:"
        echo "$QUERY_RESPONSE" | jq . 2>/dev/null || echo "$QUERY_RESPONSE"
    else
        print_fail "AI Query endpoint returned error"
        print_info "Error response: $QUERY_RESPONSE"
    fi
else
    print_fail "AI Query endpoint not responding"
fi
echo

# Test 4: Wrong endpoint (should return 404 with available endpoints)
print_test "4. Testing wrong endpoint (should show available endpoints)"
WRONG_RESPONSE=$(curl -s http://localhost:3001/health 2>/dev/null)
if echo "$WRONG_RESPONSE" | grep -q "availableEndpoints"; then
    print_pass "404 handler working correctly"
    print_info "Available endpoints listed in error response"
else
    print_fail "404 handler not working as expected"
fi
echo

# Test 5: Service Status Summary
print_test "5. Service Status Summary"
echo "Checking all services..."

# Check if AI Proxy is running on correct port
if netstat -tulpn 2>/dev/null | grep -q ":3001 "; then
    print_pass "AI Proxy service is running on port 3001"
else
    print_fail "AI Proxy service not detected on port 3001"
fi

# Check if Frontend is running
if netstat -tulpn 2>/dev/null | grep -q ":3000 "; then
    print_pass "Frontend service is running on port 3000"
else
    print_fail "Frontend service not detected on port 3000"
fi

# Check if DFX is running
if dfx ping local >/dev/null 2>&1; then
    print_pass "DFX local network is running"
else
    print_fail "DFX local network not running"
fi

echo
echo "🎯 QUICK TEST COMMANDS"
echo "======================"
echo "# Test health endpoint:"
echo "curl http://localhost:3001/api/health"
echo
echo "# Test query endpoint:"
echo 'curl -X POST http://localhost:3001/api/query \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '"'"'{"queryText": "How are you?", "condition": "general", "provider": "mock"}'"'"
echo
echo "# Check available providers:"
echo "curl http://localhost:3001/api/providers"
echo
echo "# Check if services are running:"
echo "netstat -tulpn | grep -E ':(3000|3001|4943) '"
echo

echo "✅ Debug test completed!"