#!/bin/bash

# TrustCareConnect Frontend Production Deployment Script
# Supports Vercel and Netlify deployment

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TrustCareConnect Frontend Production Deployment${NC}"
echo "=================================================="

# Configuration
BUILD_DIR="build"
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-vercel}

# Check deployment target
check_deployment_target() {
    echo -e "${YELLOW}📋 Checking deployment target...${NC}"
    
    if [ -z "$DEPLOYMENT_TARGET" ]; then
        echo -e "${YELLOW}⚠️  DEPLOYMENT_TARGET not set. Available options:${NC}"
        echo "   - vercel (Vercel deployment)"
        echo "   - netlify (Netlify deployment)"
        echo ""
        echo "Set DEPLOYMENT_TARGET environment variable and run again."
        exit 1
    fi
    
    echo -e "${GREEN}✅ Deployment target: $DEPLOYMENT_TARGET${NC}"
}

# Build React application
build_app() {
    echo -e "${YELLOW}🔨 Building React application...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm ci
    fi
    
    # Run build
    npm run build
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        echo -e "${RED}❌ Build failed - no build directory found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Build completed successfully${NC}"
    echo -e "${GREEN}📦 Build size: $(du -sh $BUILD_DIR | cut -f1)${NC}"
}

# Deploy to Vercel
deploy_vercel() {
    echo -e "${YELLOW}▲ Deploying to Vercel...${NC}"
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found.${NC}"
        echo "Install with: npm install -g vercel"
        exit 1
    fi
    
    # Set environment variables
    if [ -n "$REACT_APP_BACKEND_CANISTER_ID" ]; then
        vercel env add REACT_APP_BACKEND_CANISTER_ID production "$REACT_APP_BACKEND_CANISTER_ID" --force
    fi
    
    if [ -n "$REACT_APP_ICP_NETWORK" ]; then
        vercel env add REACT_APP_ICP_NETWORK production "$REACT_APP_ICP_NETWORK" --force
    fi
    
    if [ -n "$REACT_APP_ICP_HOST" ]; then
        vercel env add REACT_APP_ICP_HOST production "$REACT_APP_ICP_HOST" --force
    fi
    
    if [ -n "$REACT_APP_API_HOST" ]; then
        vercel env add REACT_APP_API_HOST production "$REACT_APP_API_HOST" --force
    fi
    
    vercel env add REACT_APP_ENVIRONMENT production "production" --force
    
    # Deploy to production
    echo "Deploying to Vercel..."
    DEPLOYMENT_URL=$(vercel --prod --yes)
    
    echo -e "${GREEN}✅ Deployed to Vercel successfully${NC}"
    echo -e "${GREEN}🌐 Available at: $DEPLOYMENT_URL${NC}"
    
    # Set custom domain if provided
    if [ -n "$CUSTOM_DOMAIN" ]; then
        echo -e "${YELLOW}🔗 Setting up custom domain...${NC}"
        vercel domains add "$CUSTOM_DOMAIN" --yes
        vercel alias set "$DEPLOYMENT_URL" "$CUSTOM_DOMAIN"
        echo -e "${GREEN}✅ Custom domain configured: https://$CUSTOM_DOMAIN${NC}"
    fi
}

# Deploy to Netlify
deploy_netlify() {
    echo -e "${YELLOW}🌐 Deploying to Netlify...${NC}"
    
    # Check Netlify CLI
    if ! command -v netlify &> /dev/null; then
        echo -e "${RED}❌ Netlify CLI not found.${NC}"
        echo "Install with: npm install -g netlify-cli"
        exit 1
    fi
    
    # Initialize Netlify site if needed
    if [ ! -f ".netlify/state.json" ]; then
        echo "Initializing Netlify site..."
        netlify init --yes
    fi
    
    # Set environment variables
    if [ -n "$REACT_APP_BACKEND_CANISTER_ID" ]; then
        netlify env:set REACT_APP_BACKEND_CANISTER_ID "$REACT_APP_BACKEND_CANISTER_ID"
    fi
    
    if [ -n "$REACT_APP_ICP_NETWORK" ]; then
        netlify env:set REACT_APP_ICP_NETWORK "$REACT_APP_ICP_NETWORK"
    fi
    
    if [ -n "$REACT_APP_ICP_HOST" ]; then
        netlify env:set REACT_APP_ICP_HOST "$REACT_APP_ICP_HOST"
    fi
    
    if [ -n "$REACT_APP_API_HOST" ]; then
        netlify env:set REACT_APP_API_HOST "$REACT_APP_API_HOST"
    fi
    
    netlify env:set REACT_APP_ENVIRONMENT "production"
    
    # Deploy to production
    echo "Deploying to Netlify..."
    DEPLOYMENT_URL=$(netlify deploy --prod --dir="$BUILD_DIR" --json | jq -r '.deploy_url')
    
    echo -e "${GREEN}✅ Deployed to Netlify successfully${NC}"
    echo -e "${GREEN}🌐 Available at: $DEPLOYMENT_URL${NC}"
    
    # Set custom domain if provided
    if [ -n "$CUSTOM_DOMAIN" ]; then
        echo -e "${YELLOW}🔗 Setting up custom domain...${NC}"
        netlify sites:update --name="$CUSTOM_DOMAIN"
        echo -e "${GREEN}✅ Custom domain configured: https://$CUSTOM_DOMAIN${NC}"
    fi
}

# Test deployment
test_deployment() {
    echo -e "${YELLOW}🧪 Testing deployment...${NC}"
    
    local test_url=""
    case $DEPLOYMENT_TARGET in
        vercel)
            test_url=$(vercel ls | grep "trustcareconnect-frontend" | head -n1 | awk '{print $2}' | sed 's/.*https:/https:/')
            ;;
        netlify)
            test_url=$(netlify status | grep "Website URL" | awk '{print $3}')
            ;;
    esac
    
    if [ -n "$test_url" ]; then
        echo "Testing URL: $test_url"
        
        # Test if site is accessible
        if curl -f -s "$test_url" > /dev/null; then
            echo -e "${GREEN}✅ Site is accessible${NC}"
        else
            echo -e "${RED}❌ Site is not accessible${NC}"
            return 1
        fi
        
        # Test if React app loads
        if curl -f -s "$test_url" | grep -q "trustcareconnect"; then
            echo -e "${GREEN}✅ React app loaded successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not verify React app content${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not determine deployment URL for testing${NC}"
    fi
}

# Create deployment summary
create_summary() {
    echo -e "${BLUE}📋 Deployment Summary${NC}"
    echo "===================="
    echo "Platform: $DEPLOYMENT_TARGET"
    echo "Build directory: $BUILD_DIR"
    echo "Environment: production"
    
    if [ -n "$REACT_APP_BACKEND_CANISTER_ID" ]; then
        echo "Backend Canister: $REACT_APP_BACKEND_CANISTER_ID"
    fi
    
    if [ -n "$CUSTOM_DOMAIN" ]; then
        echo "Custom Domain: https://$CUSTOM_DOMAIN"
    fi
    
    echo ""
    echo -e "${BLUE}🔗 Next Steps:${NC}"
    echo "1. Verify deployment is working correctly"
    echo "2. Update DNS records if using custom domain"
    echo "3. Set up monitoring and alerts"
    echo "4. Configure CDN and caching if needed"
}

# Main deployment function
main() {
    check_deployment_target
    build_app
    
    case $DEPLOYMENT_TARGET in
        vercel)
            deploy_vercel
            ;;
        netlify)
            deploy_netlify
            ;;
        *)
            echo -e "${RED}❌ Unknown deployment target: $DEPLOYMENT_TARGET${NC}"
            exit 1
            ;;
    esac
    
    test_deployment
    create_summary
    
    echo -e "${GREEN}🎉 Frontend deployment completed!${NC}"
}

# Handle errors
trap 'echo -e "${RED}❌ Deployment failed!${NC}"; exit 1' ERR

# Run main deployment
main