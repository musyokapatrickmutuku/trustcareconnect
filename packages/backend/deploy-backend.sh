#!/bin/bash

# TrustCareConnect Backend Deployment Script

echo "🚀 Starting TrustCareConnect Backend Deployment..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Installing dfx..."
    sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
    export PATH="$HOME/bin:$PATH"
fi

echo "✅ dfx version: $(dfx --version)"

# Stop any existing dfx processes
echo "🔄 Stopping any existing dfx processes..."
dfx stop 2>/dev/null || true

# Start dfx in the background
echo "🟢 Starting dfx local network..."
dfx start --clean --background

# Wait for network to be ready
echo "⏳ Waiting for network to be ready..."
sleep 5

# Deploy the backend canister
echo "📦 Deploying backend canister..."
dfx deploy backend

# Get the canister ID
CANISTER_ID=$(dfx canister id backend)
echo "✅ Backend deployed successfully!"
echo "📋 Backend Canister ID: $CANISTER_ID"

# Test the backend
echo "🧪 Testing backend health check..."
dfx canister call backend healthCheck

echo ""
echo "🎉 Deployment Complete!"
echo "📋 Backend Canister ID: $CANISTER_ID"
echo "🌐 Local Network: http://localhost:4943"
echo ""
echo "💡 Next Steps:"
echo "1. Update REACT_APP_BACKEND_CANISTER_ID in your frontend environment"
echo "2. Set environment variable: export REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID"
echo "3. Restart your frontend application"
echo ""