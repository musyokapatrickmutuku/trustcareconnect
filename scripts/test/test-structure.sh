#!/bin/bash
# Test script for new TrustCareConnect structure

echo "🧪 Testing TrustCareConnect New Structure..."
echo "============================================="

# Test results file
TEST_RESULTS_FILE="STRUCTURE_TEST_RESULTS.txt"
echo "Structure Test Results - $(date)" > $TEST_RESULTS_FILE

# Function to log test results
log_test() {
    echo "$1" | tee -a $TEST_RESULTS_FILE
}

# Function to check if directory exists and has expected files
test_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        log_test "✅ $description - Directory exists: $dir"
        return 0
    else
        log_test "❌ $description - Directory missing: $dir"
        return 1
    fi
}

# Function to check if file exists
test_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        log_test "✅ $description - File exists: $file"
        return 0
    else
        log_test "❌ $description - File missing: $file"
        return 1
    fi
}

echo ""
echo "🏗️ Testing Project Structure..."
echo "--------------------------------"

# Test root structure
test_directory "packages" "Monorepo Structure"
test_directory "config" "Configuration Management"  
test_directory "docs" "Documentation"
test_directory "scripts" "Build Scripts"
test_file "package.json" "Root Package Config"
test_file ".env.example" "Environment Template"

echo ""
echo "🔧 Testing Backend Package..."
echo "------------------------------"

# Test backend structure
test_directory "packages/backend" "Backend Package"
test_directory "packages/backend/src" "Backend Source"
test_file "packages/backend/src/main.mo" "Main Motoko File"
test_file "packages/backend/dfx.json" "DFX Configuration"
test_file "packages/backend/package.json" "Backend Package Config"

# Test backend source structure
test_directory "packages/backend/src/controllers" "Backend Controllers"
test_directory "packages/backend/src/services" "Backend Services"
test_directory "packages/backend/src/types" "Backend Types"

echo ""
echo "🤖 Testing AI Proxy Package..."
echo "-------------------------------"

# Test AI proxy structure
test_directory "packages/ai-proxy" "AI Proxy Package"
test_directory "packages/ai-proxy/src" "AI Proxy Source"
test_file "packages/ai-proxy/src/app.js" "AI Proxy Entry Point"
test_file "packages/ai-proxy/package.json" "AI Proxy Package Config"

# Test AI proxy source structure
test_directory "packages/ai-proxy/src/controllers" "AI Proxy Controllers"
test_directory "packages/ai-proxy/src/services" "AI Proxy Services"
test_file "packages/ai-proxy/src/services/MockService.js" "Mock Service"
test_file "packages/ai-proxy/src/services/OpenAIService.js" "OpenAI Service"

echo ""
echo "🎨 Testing Frontend Package..."
echo "-------------------------------"

# Test frontend structure
test_directory "packages/frontend" "Frontend Package"
test_directory "packages/frontend/src" "Frontend Source"
test_file "packages/frontend/src/App.tsx" "Main App Component"
test_file "packages/frontend/src/index.tsx" "Frontend Entry Point"
test_file "packages/frontend/package.json" "Frontend Package Config"
test_file "packages/frontend/public/index.html" "HTML Template"

# Test frontend source structure
test_directory "packages/frontend/src/components" "React Components"
test_directory "packages/frontend/src/pages" "Page Components"
test_directory "packages/frontend/src/services" "Frontend Services"
test_directory "packages/frontend/src/types" "TypeScript Types"
test_file "packages/frontend/src/services/icpService.ts" "ICP Service"

echo ""
echo "📚 Testing Documentation..."
echo "---------------------------"

# Test documentation structure
test_directory "docs/development" "Development Docs"
test_directory "docs/architecture" "Architecture Docs"
test_file "docs/README.md" "Documentation Index"
test_file "docs/development/getting-started.md" "Getting Started Guide"
test_file "docs/architecture/overview.md" "Architecture Overview"

echo ""
echo "⚙️ Testing Configuration..."
echo "---------------------------"

# Test configuration structure
test_directory "config/environments" "Environment Configs"
test_file "config/environments/development.json" "Development Config"
test_file "config/environments/production.json" "Production Config"

echo ""
echo "🚀 Testing CI/CD..."
echo "-------------------"

# Test GitHub Actions
test_directory ".github" "GitHub Integration"
test_directory ".github/workflows" "GitHub Actions"
test_file ".github/workflows/ci.yml" "CI Workflow"
test_file ".github/workflows/deploy.yml" "Deploy Workflow"

echo ""
echo "🧪 Testing Package Scripts..."
echo "-----------------------------"

# Test root package.json scripts
if [ -f "package.json" ]; then
    log_test "✅ Root Scripts - package.json exists"
    
    # Check if key scripts exist
    if grep -q '"dev"' package.json; then
        log_test "✅ Root Scripts - dev script found"
    else
        log_test "❌ Root Scripts - dev script missing"
    fi
    
    if grep -q '"build"' package.json; then
        log_test "✅ Root Scripts - build script found"
    else
        log_test "❌ Root Scripts - build script missing"
    fi
    
    if grep -q '"test"' package.json; then
        log_test "✅ Root Scripts - test script found"
    else
        log_test "❌ Root Scripts - test script missing"
    fi
else
    log_test "❌ Root Scripts - package.json missing"
fi

echo ""
echo "📦 Testing Legacy Backup..."
echo "---------------------------"

# Test archive structure
test_directory "archive" "Archive Directory"
test_file "archive/CLEANUP_RECORD.md" "Cleanup Documentation"

if [ -d "archive/legacy-backup" ]; then
    log_test "✅ Legacy Backup - Backup directory exists"
else
    log_test "⚠️  Legacy Backup - No backup found (may have been cleaned up)"
fi

echo ""
echo "📋 Test Summary"
echo "==============="

# Count test results
TOTAL_TESTS=$(grep -E "✅|❌|⚠️" $TEST_RESULTS_FILE | wc -l)
PASSED_TESTS=$(grep "✅" $TEST_RESULTS_FILE | wc -l)
FAILED_TESTS=$(grep "❌" $TEST_RESULTS_FILE | wc -l)
WARNING_TESTS=$(grep "⚠️" $TEST_RESULTS_FILE | wc -l)

log_test ""
log_test "📊 Test Results Summary:"
log_test "========================"
log_test "Total Tests: $TOTAL_TESTS"
log_test "✅ Passed: $PASSED_TESTS"
log_test "❌ Failed: $FAILED_TESTS"  
log_test "⚠️  Warnings: $WARNING_TESTS"
log_test ""

# Overall result
if [ $FAILED_TESTS -eq 0 ]; then
    log_test "🎉 OVERALL RESULT: SUCCESS - Structure is properly organized!"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Install dependencies: npm run setup"
    echo "2. Start development: npm run dev"
    echo "3. Read documentation: docs/development/getting-started.md"
else
    log_test "❌ OVERALL RESULT: FAILED - Structure has missing components"
    echo ""
    echo "🔧 Fix Required:"
    echo "1. Check failed tests above"
    echo "2. Ensure all files are properly created"
    echo "3. Re-run test script"
fi

echo ""
echo "📄 Detailed results saved to: $TEST_RESULTS_FILE"
echo "🧪 Structure testing complete!"