#!/bin/bash

# TrustCareConnect Environment Setup Script
# Configures environment variables for different deployment scenarios

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 TrustCareConnect Environment Setup${NC}"
echo "===================================="

ENVIRONMENT=${1:-development}
PROJECT_ROOT=$(pwd)

# Environment configuration
setup_development() {
    echo -e "${YELLOW}⚙️  Setting up development environment...${NC}"
    
    # Get backend canister ID if available
    BACKEND_CANISTER_ID=""
    if command -v dfx &> /dev/null && [ -f ".dfx/local/canister_ids.json" ]; then
        BACKEND_CANISTER_ID=$(dfx canister id backend 2>/dev/null || echo "")
    fi
    
    # Create development environment file
    cat > .env.local << EOF
# TrustCareConnect Development Environment
# Auto-generated on $(date)

# ICP Backend Configuration
REACT_APP_BACKEND_CANISTER_ID=${BACKEND_CANISTER_ID:-rrkah-fqaaa-aaaaa-aaaaq-cai}
ICP_BACKEND_CANISTER_ID=${BACKEND_CANISTER_ID:-rrkah-fqaaa-aaaaa-aaaaq-cai}
REACT_APP_ICP_NETWORK=local
ICP_NETWORK=local
REACT_APP_ICP_HOST=http://localhost:4943
ICP_HOST=http://localhost:4943

# AI Proxy Configuration
REACT_APP_API_HOST=http://localhost:3001
API_HOST=http://localhost:3001
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
CLAUDE_MODEL=claude-3-sonnet-20240229

# Application Configuration
REACT_APP_ENVIRONMENT=development
NODE_ENV=development
REACT_APP_APP_URL=http://localhost:3000
LOG_LEVEL=debug

# Security Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:4943,https://localhost:4943
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    echo -e "${GREEN}✅ Development environment configured${NC}"
}

# Production environment setup
setup_production() {
    echo -e "${YELLOW}⚙️  Setting up production environment...${NC}"
    
    # Check for required production variables
    if [ -z "$PRODUCTION_BACKEND_CANISTER_ID" ]; then
        echo -e "${RED}❌ PRODUCTION_BACKEND_CANISTER_ID is required for production setup${NC}"
        exit 1
    fi
    
    if [ -z "$PRODUCTION_API_HOST" ]; then
        echo -e "${RED}❌ PRODUCTION_API_HOST is required for production setup${NC}"
        exit 1
    fi
    
    # Create production environment file
    cat > .env.production << EOF
# TrustCareConnect Production Environment
# Auto-generated on $(date)

# ICP Backend Configuration
REACT_APP_BACKEND_CANISTER_ID=${PRODUCTION_BACKEND_CANISTER_ID}
ICP_BACKEND_CANISTER_ID=${PRODUCTION_BACKEND_CANISTER_ID}
REACT_APP_ICP_NETWORK=ic
ICP_NETWORK=ic
REACT_APP_ICP_HOST=https://icp-api.io
ICP_HOST=https://icp-api.io

# AI Proxy Configuration
REACT_APP_API_HOST=${PRODUCTION_API_HOST}
API_HOST=${PRODUCTION_API_HOST}
OPENAI_API_KEY=${OPENAI_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY}
OPENAI_MODEL=gpt-4
CLAUDE_MODEL=claude-3-opus-20240229

# Application Configuration
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
REACT_APP_APP_URL=${PRODUCTION_APP_URL:-https://trustcareconnect.com}
LOG_LEVEL=info

# Security Configuration
CORS_ORIGINS=${PRODUCTION_CORS_ORIGINS:-https://trustcareconnect.com,https://app.trustcareconnect.com}
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=50
EOF
    
    echo -e "${GREEN}✅ Production environment configured${NC}"
}

# Staging environment setup
setup_staging() {
    echo -e "${YELLOW}⚙️  Setting up staging environment...${NC}"
    
    cat > .env.staging << EOF
# TrustCareConnect Staging Environment
# Auto-generated on $(date)

# ICP Backend Configuration
REACT_APP_BACKEND_CANISTER_ID=${STAGING_BACKEND_CANISTER_ID:-rdmx6-jaaaa-aaaah-qcaiq-cai}
ICP_BACKEND_CANISTER_ID=${STAGING_BACKEND_CANISTER_ID:-rdmx6-jaaaa-aaaah-qcaiq-cai}
REACT_APP_ICP_NETWORK=ic
ICP_NETWORK=ic
REACT_APP_ICP_HOST=https://icp-api.io
ICP_HOST=https://icp-api.io

# AI Proxy Configuration
REACT_APP_API_HOST=${STAGING_API_HOST:-https://staging-api.trustcareconnect.com}
API_HOST=${STAGING_API_HOST:-https://staging-api.trustcareconnect.com}
OPENAI_API_KEY=${OPENAI_API_KEY}
CLAUDE_API_KEY=${CLAUDE_API_KEY}
OPENAI_MODEL=gpt-3.5-turbo
CLAUDE_MODEL=claude-3-sonnet-20240229

# Application Configuration
REACT_APP_ENVIRONMENT=staging
NODE_ENV=production
REACT_APP_APP_URL=${STAGING_APP_URL:-https://staging.trustcareconnect.com}
LOG_LEVEL=debug

# Security Configuration
CORS_ORIGINS=${STAGING_CORS_ORIGINS:-https://staging.trustcareconnect.com}
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=75
EOF
    
    echo -e "${GREEN}✅ Staging environment configured${NC}"
}

# Validate environment variables
validate_environment() {
    echo -e "${YELLOW}🔍 Validating environment configuration...${NC}"
    
    local env_file=""
    case $ENVIRONMENT in
        development)
            env_file=".env.local"
            ;;
        production)
            env_file=".env.production"
            ;;
        staging)
            env_file=".env.staging"
            ;;
    esac
    
    if [ ! -f "$env_file" ]; then
        echo -e "${RED}❌ Environment file $env_file not found${NC}"
        return 1
    fi
    
    # Check required variables
    local required_vars=(
        "REACT_APP_BACKEND_CANISTER_ID"
        "REACT_APP_ICP_NETWORK" 
        "REACT_APP_API_HOST"
        "REACT_APP_ENVIRONMENT"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required variables:${NC}"
        printf '   - %s\n' "${missing_vars[@]}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
}

# Copy environment files to packages
distribute_environment() {
    echo -e "${YELLOW}📦 Distributing environment files to packages...${NC}"
    
    local env_file=""
    case $ENVIRONMENT in
        development)
            env_file=".env.local"
            ;;
        production)
            env_file=".env.production"
            ;;
        staging)
            env_file=".env.staging"
            ;;
    esac
    
    # Copy to frontend
    if [ -f "$env_file" ]; then
        cp "$env_file" "packages/frontend/$env_file"
        echo "  Frontend: packages/frontend/$env_file"
    fi
    
    # Copy to AI proxy
    if [ -f "$env_file" ]; then
        # Filter AI proxy specific variables
        grep -E '^(OPENAI_|CLAUDE_|API_HOST|NODE_ENV|LOG_LEVEL|CORS_|RATE_LIMIT_)' "$env_file" > "packages/ai-proxy/$env_file" 2>/dev/null || true
        echo "  AI Proxy: packages/ai-proxy/$env_file"
    fi
    
    echo -e "${GREEN}✅ Environment files distributed${NC}"
}

# Create environment summary
create_summary() {
    echo ""
    echo -e "${BLUE}📋 Environment Setup Summary${NC}"
    echo "=============================="
    echo "Environment: $ENVIRONMENT"
    echo "Project Root: $PROJECT_ROOT"
    echo ""
    
    case $ENVIRONMENT in
        development)
            echo "Configuration:"
            echo "  - Backend: Local DFX (localhost:4943)"
            echo "  - AI Proxy: localhost:3001"
            echo "  - Frontend: localhost:3000"
            echo "  - Log Level: debug"
            ;;
        production)
            echo "Configuration:"
            echo "  - Backend: Internet Computer Mainnet"
            echo "  - AI Proxy: $PRODUCTION_API_HOST"
            echo "  - Frontend: $PRODUCTION_APP_URL"
            echo "  - Log Level: info"
            ;;
        staging)
            echo "Configuration:"
            echo "  - Backend: Internet Computer Mainnet (staging)"
            echo "  - AI Proxy: ${STAGING_API_HOST:-https://staging-api.trustcareconnect.com}"
            echo "  - Frontend: ${STAGING_APP_URL:-https://staging.trustcareconnect.com}"
            echo "  - Log Level: debug"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}🔗 Next Steps:${NC}"
    echo "1. Review generated environment files"
    echo "2. Add your API keys (OpenAI, Claude)"
    echo "3. Start services: npm run dev (development) or deploy (production)"
    echo "4. Test the application end-to-end"
}

# Main setup function
main() {
    echo "Setting up $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        development)
            setup_development
            ;;
        production)
            setup_production
            ;;
        staging)
            setup_staging
            ;;
        *)
            echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
            echo "Available environments: development, production, staging"
            exit 1
            ;;
    esac
    
    validate_environment
    distribute_environment
    create_summary
    
    echo -e "${GREEN}🎉 Environment setup completed!${NC}"
}

# Usage information
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development (default) - Local development setup"
    echo "  production           - Production deployment setup"
    echo "  staging             - Staging deployment setup"
    echo ""
    echo "Environment Variables (for production/staging):"
    echo "  PRODUCTION_BACKEND_CANISTER_ID - Backend canister ID"
    echo "  PRODUCTION_API_HOST           - AI proxy service URL"
    echo "  PRODUCTION_APP_URL           - Frontend application URL"
    echo "  OPENAI_API_KEY               - OpenAI API key"
    echo "  CLAUDE_API_KEY               - Claude API key"
    echo ""
    echo "Examples:"
    echo "  $0                          # Setup development"
    echo "  $0 production              # Setup production"
    echo "  $0 staging                 # Setup staging"
    exit 0
fi

# Handle errors
trap 'echo -e "${RED}❌ Environment setup failed!${NC}"; exit 1' ERR

# Run main setup
main