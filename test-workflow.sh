#!/bin/bash

# TrustCareConnect End-to-End Workflow Test Script
# Tests the complete patient → AI → doctor workflow via CLI

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[TEST]${NC} $1"; }
print_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
print_error() { echo -e "${RED}[FAIL]${NC} $1"; }

echo "🧪 TrustCareConnect Workflow Test"
echo "================================="
echo

# Test 1: Health Check
print_status "Testing backend health..."
health_result=$(dfx canister call backend healthCheck 2>/dev/null || echo "FAILED")
if [[ $health_result == *"TrustCareConnect backend is running"* ]]; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    exit 1
fi

# Test 2: Register Doctor
print_status "Registering test doctor..."
doctor_result=$(dfx canister call backend registerDoctor '("Dr. Test Johnson", "endocrinologist")' 2>/dev/null)
doctor_id=$(echo $doctor_result | sed 's/[()"]//g' | tr -d ' ')
print_success "Doctor registered with ID: $doctor_id"

# Test 3: Register Patient
print_status "Registering test patient..."
patient_result=$(dfx canister call backend registerPatient '("Test Patient", "diabetes", "test@example.com")' 2>/dev/null)
patient_id=$(echo $patient_result | sed 's/[()"]//g' | tr -d ' ')
print_success "Patient registered with ID: $patient_id"

# Test 4: Assign Patient to Doctor
print_status "Assigning patient to doctor..."
assign_result=$(dfx canister call backend assignPatientToDoctor "(\"$patient_id\", \"$doctor_id\")" 2>/dev/null)
if [[ $assign_result == *"ok"* ]]; then
    print_success "Patient assigned successfully"
else
    print_error "Patient assignment failed: $assign_result"
    exit 1
fi

# Test 5: Submit Query (with AI draft generation)
print_status "Submitting patient query (will generate AI draft)..."
query_result=$(dfx canister call backend submitQuery "(\"$patient_id\", \"Blood Sugar Question\", \"How often should I check my blood sugar levels?\")" 2>/dev/null)

if [[ $query_result == *"ok"* ]]; then
    query_id=$(echo $query_result | grep -o 'query_[0-9]*' | head -1)
    print_success "Query submitted with ID: $query_id"
else
    print_error "Query submission failed: $query_result"
    exit 1
fi

# Test 6: Check AI Draft was Generated
print_status "Checking if AI draft response was generated..."
sleep 2  # Wait for AI processing
query_details=$(dfx canister call backend getQuery "(\"$query_id\")" 2>/dev/null)

if [[ $query_details == *"aiDraftResponse"* ]] && [[ $query_details != *"null"* ]]; then
    print_success "AI draft response was generated"
    echo "  📄 AI Draft Preview: $(echo "$query_details" | grep -o 'Based on your.*recommendation' | head -1 | cut -c1-60)..."
else
    print_error "AI draft response was not generated"
    echo "  🔍 Query details: $query_details"
    exit 1
fi

# Test 7: Doctor Takes Query
print_status "Doctor taking query for review..."
take_result=$(dfx canister call backend takeQuery "(\"$query_id\", \"$doctor_id\")" 2>/dev/null)
if [[ $take_result == *"ok"* ]]; then
    print_success "Doctor took query for review"
else
    print_error "Doctor failed to take query: $take_result"
    exit 1
fi

# Test 8: Doctor Responds to Query
print_status "Doctor submitting final response..."
response_text="Based on your diabetes management, I recommend checking blood sugar 3 times daily before meals. The AI suggestions are good, but let's personalize this in your next appointment. - Dr. Test Johnson"
respond_result=$(dfx canister call backend respondToQuery "(\"$query_id\", \"$doctor_id\", \"$response_text\")" 2>/dev/null)

if [[ $respond_result == *"ok"* ]]; then
    print_success "Doctor response submitted successfully"
else
    print_error "Doctor response failed: $respond_result"
    exit 1
fi

# Test 9: Verify Complete Workflow
print_status "Verifying complete workflow..."
final_query=$(dfx canister call backend getQuery "(\"$query_id\")" 2>/dev/null)

if [[ $final_query == *"completed"* ]] && [[ $final_query == *"Dr. Test Johnson"* ]]; then
    print_success "Query completed successfully"
else
    print_error "Workflow verification failed"
    echo "  🔍 Final query state: $final_query"
    exit 1
fi

# Test 10: AI Proxy Direct Test
print_status "Testing AI proxy directly..."
ai_test=$(curl -s -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"queryText": "Test query", "condition": "diabetes", "provider": "mock"}' 2>/dev/null)

if [[ $ai_test == *"success\":true"* ]]; then
    print_success "AI proxy is working correctly"
else
    print_error "AI proxy test failed"
    echo "  🔍 AI Response: $ai_test"
    exit 1
fi

# Final Summary
echo
print_success "🎉 ALL TESTS PASSED!"
echo "================================="
echo
echo "✅ Workflow Summary:"
echo "  👩‍⚕️ Doctor: $doctor_id (Dr. Test Johnson)"
echo "  🤒 Patient: $patient_id (Test Patient)"
echo "  💬 Query: $query_id (Blood Sugar Question)"
echo "  🤖 AI Draft: Generated successfully"
echo "  📝 Final Response: Doctor approved with personalization"
echo
echo "📊 System Stats:"
dfx canister call backend getStats 2>/dev/null | sed 's/record {//' | sed 's/}//' | sed 's/;/\n  /g' | sed 's/^/  /'
echo
echo "🌐 Frontend URL: http://$(dfx canister id frontend).localhost:4943"
echo "🤖 AI Proxy URL: http://localhost:3001"
echo
echo "The complete TrustCareConnect workflow is working correctly!"
echo "Patient queries now include AI assistance for doctors."