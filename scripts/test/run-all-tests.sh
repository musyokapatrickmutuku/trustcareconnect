#!/bin/bash

# Comprehensive Test Runner for TrustCareConnect
# Runs all tests across frontend, backend, and AI proxy

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test result tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}🧪 TrustCareConnect Comprehensive Test Suite${NC}"
echo "=============================================="
echo ""

# Function to run test suite
run_test_suite() {
    local suite_name="$1"
    local test_command="$2"
    local directory="$3"
    
    echo -e "${YELLOW}📦 Testing: $suite_name${NC}"
    echo "----------------------------------------"
    
    cd "$directory"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $suite_name: PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $suite_name: FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo ""
    
    cd - > /dev/null
}

# Store original directory
ORIGINAL_DIR=$(pwd)

# 1. Frontend Tests
echo -e "${BLUE}🎨 Frontend Tests${NC}"
run_test_suite "Frontend Unit Tests" \
    "npm run test:ci" \
    "packages/frontend"

# 2. AI Proxy Tests
echo -e "${BLUE}🤖 AI Proxy Tests${NC}"
run_test_suite "AI Proxy Unit Tests" \
    "npm test" \
    "packages/ai-proxy"

# 3. Backend Integration Tests
echo -e "${BLUE}🔗 Backend Integration Tests${NC}"
run_test_suite "Backend Integration Tests" \
    "chmod +x tests/integration/canister.test.sh && ./tests/integration/canister.test.sh" \
    "packages/backend"

# 4. End-to-End Tests (if applicable)
if [ -f "scripts/test/e2e-tests.sh" ]; then
    echo -e "${BLUE}🌐 End-to-End Tests${NC}"
    run_test_suite "E2E Tests" \
        "../scripts/test/e2e-tests.sh" \
        "."
fi

# Test Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=============="
echo -e "Total Test Suites: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All test suites passed!${NC}"
    echo -e "${GREEN}✨ TrustCareConnect is ready for deployment!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}💥 $FAILED_TESTS test suite(s) failed!${NC}"
    echo -e "${RED}🔧 Please fix the failing tests before deployment.${NC}"
    exit 1
fi