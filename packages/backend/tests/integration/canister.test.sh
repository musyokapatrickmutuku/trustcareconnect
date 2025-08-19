#!/bin/bash

# Backend Integration Tests for TrustCareConnect
# Tests all canister functions with real deployments

set -e

echo "🧪 Starting Backend Integration Tests..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
test_function() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    echo -n "Testing: $test_name... "
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if result=$(eval "$command" 2>&1); then
        if [[ -z "$expected_pattern" ]] || echo "$result" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✅ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}❌ FAILED${NC} - Pattern '$expected_pattern' not found"
            echo "   Output: $result"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ FAILED${NC} - Command failed"
        echo "   Error: $result"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Ensure DFX is running
echo "🚀 Starting local DFX network..."
dfx start --background --clean

# Deploy the canister
echo "📦 Deploying backend canister..."
dfx deploy backend

# Get canister ID
CANISTER_ID=$(dfx canister id backend)
echo "🆔 Backend Canister ID: $CANISTER_ID"

echo ""
echo "🧪 Running Integration Tests..."
echo "================================"

# Test 1: Health Check
test_function "Health Check" \
    "dfx canister call backend healthCheck" \
    "TrustCareConnect backend is running"

# Test 2: Register Patient
echo ""
echo "👥 Testing Patient Management..."
test_function "Register Patient" \
    "dfx canister call backend registerPatient '(\"John Doe\", \"Diabetes\", \"john@example.com\")'" \
    "patient_"

# Get the patient ID from previous test for subsequent tests
PATIENT_ID=$(dfx canister call backend registerPatient '("Jane Smith", "Hypertension", "jane@example.com")' | grep -o '"[^"]*"' | tr -d '"')

test_function "Get Patient by ID" \
    "dfx canister call backend getPatient '(\"$PATIENT_ID\")'" \
    "Jane Smith"

test_function "Find Patient by Email" \
    "dfx canister call backend findPatientByEmail '(\"jane@example.com\")'" \
    "Jane Smith"

test_function "Get Unassigned Patients" \
    "dfx canister call backend getUnassignedPatients" \
    "John Doe\\|Jane Smith"

# Test 3: Register Doctor
echo ""
echo "👨‍⚕️ Testing Doctor Management..."
test_function "Register Doctor" \
    "dfx canister call backend registerDoctor '(\"Dr. Smith\", \"Cardiology\")'" \
    "doctor_"

# Get doctor ID for assignment tests
DOCTOR_ID=$(dfx canister call backend registerDoctor '("Dr. Johnson", "Neurology")' | grep -o '"[^"]*"' | tr -d '"')

test_function "Get Doctor by ID" \
    "dfx canister call backend getDoctor '(\"$DOCTOR_ID\")'" \
    "Dr. Johnson"

test_function "Get All Doctors" \
    "dfx canister call backend getAllDoctors" \
    "Dr. Smith\\|Dr. Johnson"

# Test 4: Patient-Doctor Assignment
echo ""
echo "🔗 Testing Patient-Doctor Assignment..."
test_function "Assign Patient to Doctor" \
    "dfx canister call backend assignPatientToDoctor '(\"$PATIENT_ID\", \"$DOCTOR_ID\")'" \
    "ok"

test_function "Get Doctor Patients" \
    "dfx canister call backend getDoctorPatients '(\"$DOCTOR_ID\")'" \
    "Jane Smith"

# Test 5: Query Management
echo ""
echo "❓ Testing Query Management..."
test_function "Submit Query (Valid)" \
    "dfx canister call backend submitQuery '(\"$PATIENT_ID\", \"Chest Pain\", \"I have been experiencing chest pain for 2 days\")'" \
    "query_"

# Get query ID for further tests
QUERY_ID=$(dfx canister call backend submitQuery '("'$PATIENT_ID'", "Headache", "Severe headache for 3 days")' | grep -o '"[^"]*"' | tr -d '"')

test_function "Get Patient Queries" \
    "dfx canister call backend getPatientQueries '(\"$PATIENT_ID\")'" \
    "Chest Pain\\|Headache"

test_function "Get Pending Queries" \
    "dfx canister call backend getPendingQueries" \
    "pending"

test_function "Doctor Take Query" \
    "dfx canister call backend takeQuery '(\"$QUERY_ID\", \"$DOCTOR_ID\")'" \
    "ok"

test_function "Doctor Respond to Query" \
    "dfx canister call backend respondToQuery '(\"$QUERY_ID\", \"$DOCTOR_ID\", \"This appears to be tension headache. Recommend rest and hydration.\")'" \
    "ok"

test_function "Get Doctor Queries" \
    "dfx canister call backend getDoctorQueries '(\"$DOCTOR_ID\")'" \
    "Headache"

# Test 6: System Statistics
echo ""
echo "📊 Testing System Statistics..."
test_function "Get System Stats" \
    "dfx canister call backend getStats" \
    "totalPatients.*totalDoctors.*totalQueries"

# Test 7: Error Handling
echo ""
echo "🚨 Testing Error Handling..."
test_function "Invalid Patient ID" \
    "dfx canister call backend getPatient '(\"invalid_patient_id\")'" \
    "null"

test_function "Submit Query Without Doctor Assignment" \
    "dfx canister call backend submitQuery '(\"nonexistent_patient\", \"Test\", \"Test query\")'" \
    "err.*Patient not found"

test_function "Assign to Non-existent Doctor" \
    "dfx canister call backend assignPatientToDoctor '(\"$PATIENT_ID\", \"invalid_doctor_id\")'" \
    "err.*Doctor not found"

# Test 8: Authorization Tests (New security features)
echo ""
echo "🔐 Testing Authorization & Security..."

# Create another doctor for authorization testing
DOCTOR2_ID=$(dfx canister call backend registerDoctor '("Dr. Wilson", "Psychiatry")' | grep -o '"[^"]*"' | tr -d '"')

test_function "Unauthorized Query Response" \
    "dfx canister call backend respondToQuery '(\"$QUERY_ID\", \"$DOCTOR2_ID\", \"Unauthorized response\")'" \
    "err.*not assigned to you"

test_function "Unauthorized Patient Unassignment" \
    "dfx canister call backend unassignPatient '(\"$PATIENT_ID\", \"$DOCTOR2_ID\")'" \
    "err.*not assigned to this doctor"

# Test valid unassignment
test_function "Valid Patient Unassignment" \
    "dfx canister call backend unassignPatient '(\"$PATIENT_ID\", \"$DOCTOR_ID\")'" \
    "ok"

# Test Summary
echo ""
echo "📋 Test Summary"
echo "==============="
echo -e "Tests Run: ${YELLOW}$TESTS_RUN${NC}"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed!${NC}"
    echo "Backend integration tests completed successfully."
else
    echo -e "\n💥 ${RED}Some tests failed!${NC}"
    echo "Please review the failed tests above."
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
dfx stop

# Exit with appropriate code
exit $TESTS_FAILED