#!/bin/bash

# TrustCareConnect MVP Deployment Script
# Deploys the complete MVP with real AI functionality

set -e

echo "🚀 TrustCareConnect MVP Deployment"
echo "=================================="
echo ""

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install the DFINITY SDK first."
    echo "   Visit: https://sdk.dfinity.org/docs/quickstart/local-quickstart.html"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "dfx.json" ]; then
    echo "❌ dfx.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo "   ✓ dfx installed"
echo "   ✓ In project root directory"
echo ""

# Start local replica
echo "🔧 Starting local ICP replica..."
dfx start --background --clean

# Deploy canisters with cycles
echo "📦 Deploying backend canister..."
dfx deploy --with-cycles 2000000000000

# Get canister ID
BACKEND_CANISTER_ID=$(dfx canister id backend)
echo "✅ Backend canister deployed: $BACKEND_CANISTER_ID"

# Build frontend
echo "🏗️  Building frontend..."
cd packages/frontend
npm install
npm run build
cd ../..

# Deploy frontend
echo "📦 Deploying frontend canister..."
dfx deploy frontend

FRONTEND_CANISTER_ID=$(dfx canister id frontend)
echo "✅ Frontend canister deployed: $FRONTEND_CANISTER_ID"

# Setup test patients
echo "👥 Initializing test patients..."
dfx canister call backend initializeTestPatients

echo ""
echo "🎉 MVP Deployment Complete!"
echo "========================="
echo ""
echo "📍 Access URLs:"
echo "   Frontend: http://localhost:4943/?canisterId=$FRONTEND_CANISTER_ID"
echo "   Backend:  http://localhost:4943/?canisterId=$BACKEND_CANISTER_ID"
echo ""
echo "🧪 Test Data Ready:"
echo "   Patient P001: Sarah Michelle Johnson (Type 2 Diabetes)"
echo "   Patient P002: Michael David Rodriguez (Type 1 Diabetes)"
echo ""
echo "🔑 Next Steps:"
echo "   1. Visit the frontend URL above"
echo "   2. Click 'Show Setup' to configure Novita AI API key"
echo "   3. Use the 'Test MVP' button to test processMedicalQuery function"
echo "   4. Try sample queries with P001 or P002 patient data"
echo ""
echo "📋 MVP Test Scenarios:"
echo "   • Sarah (P001): 'I've been feeling more tired lately and my morning blood sugars are higher than usual'"
echo "   • Michael (P002): 'I'm having trouble with my blood sugars during college exams'"
echo ""
echo "⚠️  Remember to set your Novita AI API key for real AI responses!"
echo ""