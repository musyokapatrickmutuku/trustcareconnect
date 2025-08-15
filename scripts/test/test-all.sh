#!/bin/bash
# Test script for all packages

echo "🧪 Running tests for TrustCareConnect..."

# Test backend
echo "Testing backend..."
cd packages/backend && npm test
BACKEND_EXIT_CODE=$?
cd ../..

# Test AI proxy
echo "Testing AI proxy..."
cd packages/ai-proxy && npm test
AI_PROXY_EXIT_CODE=$?
cd ../..

# Test frontend
echo "Testing frontend..."
cd packages/frontend && npm test -- --watchAll=false
FRONTEND_EXIT_CODE=$?
cd ../..

# Check results
TOTAL_FAILURES=$((BACKEND_EXIT_CODE + AI_PROXY_EXIT_CODE + FRONTEND_EXIT_CODE))

if [ $TOTAL_FAILURES -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    echo "Backend: $BACKEND_EXIT_CODE"
    echo "AI Proxy: $AI_PROXY_EXIT_CODE"  
    echo "Frontend: $FRONTEND_EXIT_CODE"
    exit 1
fi