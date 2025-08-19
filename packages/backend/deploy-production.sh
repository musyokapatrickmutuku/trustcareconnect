#!/bin/bash

# TrustCareConnect Backend Production Deployment Script
# Deploys Motoko canister to Internet Computer mainnet

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TrustCareConnect Backend Production Deployment${NC}"
echo "=================================================="

# Check requirements
check_requirements() {
    echo -e "${YELLOW}📋 Checking deployment requirements...${NC}"
    
    if ! command -v dfx &> /dev/null; then
        echo -e "${RED}❌ DFX is not installed. Please install DFX first.${NC}"
        exit 1
    fi
    
    if [ ! -f "identity.pem" ] && [ -z "$DFX_IDENTITY" ]; then
        echo -e "${YELLOW}⚠️  No production identity found. Using default identity.${NC}"
        echo "   For production, set DFX_IDENTITY environment variable or provide identity.pem"
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Setup identity for production
setup_identity() {
    if [ -n "$DFX_IDENTITY" ]; then
        echo -e "${YELLOW}🔑 Setting up production identity...${NC}"
        echo "$DFX_IDENTITY" | base64 -d > identity.pem
        dfx identity import production identity.pem --force
        dfx identity use production
        echo -e "${GREEN}✅ Production identity configured${NC}"
    elif [ -f "identity.pem" ]; then
        echo -e "${YELLOW}🔑 Using existing identity.pem...${NC}"
        dfx identity import production identity.pem --force
        dfx identity use production
        echo -e "${GREEN}✅ Identity configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Using default identity for deployment${NC}"
    fi
}

# Check cycles balance
check_cycles() {
    echo -e "${YELLOW}💰 Checking cycles balance...${NC}"
    
    # Get current balance (this might fail if wallet not set up)
    if dfx wallet --network ic balance 2>/dev/null; then
        echo -e "${GREEN}✅ Wallet balance checked${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not check wallet balance. Ensure you have cycles for deployment.${NC}"
        echo "   You need at least 2-4 trillion cycles for deployment."
        echo "   Visit https://faucet.dfinity.org/ for free cycles."
    fi
}

# Deploy to mainnet
deploy_to_mainnet() {
    echo -e "${YELLOW}🌍 Deploying to Internet Computer mainnet...${NC}"
    
    # Build and deploy with cycles
    echo "Building backend canister..."
    dfx build --network ic backend
    
    echo "Deploying to mainnet..."
    if [ -n "$DEPLOYMENT_CYCLES" ]; then
        dfx deploy --network ic backend --with-cycles="$DEPLOYMENT_CYCLES"
    else
        dfx deploy --network ic backend --with-cycles=2000000000000  # 2T cycles
    fi
    
    # Get canister ID
    CANISTER_ID=$(dfx canister --network ic id backend)
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo -e "${GREEN}📋 Canister ID: $CANISTER_ID${NC}"
    echo -e "${GREEN}🌐 Live at: https://$CANISTER_ID.icp0.io${NC}"
    
    # Save canister ID for frontend
    echo "REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID" > ../../.env.production
    echo "ICP_BACKEND_CANISTER_ID=$CANISTER_ID" >> ../../.env.production
    echo "ICP_NETWORK=ic" >> ../../.env.production
}

# Test deployment
test_deployment() {
    echo -e "${YELLOW}🧪 Testing deployment...${NC}"
    
    CANISTER_ID=$(dfx canister --network ic id backend)
    
    # Test health check
    if dfx canister --network ic call backend healthCheck; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
    
    # Test basic functionality
    echo "Testing basic functionality..."
    dfx canister --network ic call backend getStats
    
    echo -e "${GREEN}✅ Deployment test completed${NC}"
}

# Update frontend config
update_frontend_config() {
    echo -e "${YELLOW}⚙️  Updating frontend configuration...${NC}"
    
    CANISTER_ID=$(dfx canister --network ic id backend)
    
    # Update frontend environment
    cat > ../../packages/frontend/.env.production << EOF
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
REACT_APP_ICP_NETWORK=ic
REACT_APP_ICP_HOST=https://icp-api.io
REACT_APP_API_HOST=https://api.trustcareconnect.com
REACT_APP_ENVIRONMENT=production
EOF
    
    echo -e "${GREEN}✅ Frontend configuration updated${NC}"
}

# Main deployment flow
main() {
    echo "Starting production deployment..."
    
    check_requirements
    setup_identity
    check_cycles
    deploy_to_mainnet
    test_deployment
    update_frontend_config
    
    echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo "- Backend Canister ID: $(dfx canister --network ic id backend)"
    echo "- Network: Internet Computer Mainnet"
    echo "- Environment configs updated"
    echo ""
    echo -e "${BLUE}🔗 Next Steps:${NC}"
    echo "1. Deploy AI Proxy to your preferred cloud provider"
    echo "2. Deploy Frontend to Vercel/Netlify"
    echo "3. Update DNS records to point to your services"
    echo "4. Set up monitoring and alerts"
}

# Handle errors
trap 'echo -e "${RED}❌ Deployment failed!${NC}"; exit 1' ERR

# Run main deployment
main