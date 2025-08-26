# 🚢 TrustCareConnect - Deployment Configuration Guide

> Complete guide for deploying TrustCareConnect in different environments

## 🎯 Overview

This document provides comprehensive deployment configurations for TrustCareConnect, covering local development, staging, and production environments.

## 🔧 Environment Configurations

### Local Development Environment

#### File Structure
```
trustcareconnect/
├── .env                    # Root environment config
├── .env.local             # Local overrides
└── packages/frontend/
    └── .env.local         # Frontend-specific config
```

#### Root `.env` Configuration
```bash
# Environment
NODE_ENV=development

# ICP Configuration
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=lqy7q-dh777-77777-aaaaq-cai
CANISTER_ID_BACKEND=lqy7q-dh777-77777-aaaaq-cai
REACT_APP_NETWORK=local
DFX_NETWORK=local
REACT_APP_DEBUG_MODE=true

# AI Configuration (Optional for local)
AI_PROXY_HOST=http://localhost:3001
OPENAI_API_KEY=your-openai-api-key-here
CLAUDE_API_KEY=your-claude-api-key-here

# Frontend Configuration
REACT_APP_API_HOST=http://localhost:3001
FRONTEND_HOST=http://localhost:3000

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:4943,https://localhost:4943

# Development Tools
ENABLE_DEV_TOOLS=true
ENABLE_MOCK_RESPONSES=true
GENERATE_SOURCEMAP=true
```

#### Frontend `.env.local` Configuration
```bash
# TrustCareConnect Frontend Environment Configuration
# Internet Computer Protocol (ICP) Configuration

# ICP Host Configuration  
# Development: Use local DFX replica
REACT_APP_IC_HOST=http://127.0.0.1:4943

# Deployed Backend Canister ID - Local Development
REACT_APP_BACKEND_CANISTER_ID=lqy7q-dh777-77777-aaaaq-cai
REACT_APP_CANISTER_ID=lqy7q-dh777-77777-aaaaq-cai

# Network Configuration
REACT_APP_NETWORK=local
REACT_APP_NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_CLINICAL_FEATURES=true
REACT_APP_ENABLE_AI_INTEGRATION=true

# Debug Configuration
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug

# Authentication Configuration
REACT_APP_AUTH_PROVIDER=ii
REACT_APP_LOCAL_II_URL=http://localhost:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai

# Development settings
NODE_ENV=development
```

### Production Environment

#### Root `.env.production` Configuration
```bash
# Environment
NODE_ENV=production

# ICP Configuration - MAINNET
REACT_APP_IC_HOST=https://ic0.app
REACT_APP_BACKEND_CANISTER_ID=your-mainnet-canister-id
CANISTER_ID_BACKEND=your-mainnet-canister-id
REACT_APP_NETWORK=ic
DFX_NETWORK=ic
REACT_APP_DEBUG_MODE=false

# AI Configuration - PRODUCTION
OPENAI_API_KEY=your-production-openai-key
CLAUDE_API_KEY=your-production-claude-key
NOVITA_AI_API_KEY=sk_F_8dAOPzGPmh98MZPYGOQyYFrPdy2l6d29HQjmj6PA8

# Security - PRODUCTION
CORS_ORIGINS=https://yourdomain.com
ENABLE_DEV_TOOLS=false
ENABLE_MOCK_RESPONSES=false

# Performance
GENERATE_SOURCEMAP=false
REACT_APP_LOG_LEVEL=error
```

#### Production Deployment Steps
```bash
# 1. Deploy backend to mainnet
dfx deploy --network ic --with-cycles 5000000000000

# 2. Get production canister ID
PROD_CANISTER_ID=$(dfx canister --network ic id backend)
echo "Production Canister ID: $PROD_CANISTER_ID"

# 3. Update production environment
cat > .env.production << EOF
NODE_ENV=production
REACT_APP_IC_HOST=https://ic0.app
REACT_APP_BACKEND_CANISTER_ID=$PROD_CANISTER_ID
CANISTER_ID_BACKEND=$PROD_CANISTER_ID
REACT_APP_NETWORK=ic
DFX_NETWORK=ic
REACT_APP_DEBUG_MODE=false
EOF

# 4. Build production frontend
npm run build

# 5. Verify production deployment
dfx canister --network ic call backend healthCheck
```

## 🏗️ DFX Configuration

### `dfx.json` Configuration
```json
{
  "version": 1,
  "canisters": {
    "backend": {
      "main": "packages/backend/src/main.mo",
      "type": "motoko"
    },
    "frontend": {
      "dependencies": [
        "backend"
      ],
      "frontend": {
        "entrypoint": "packages/frontend/src/index.html"
      },
      "source": [
        "packages/frontend/dist/"
      ],
      "type": "assets"
    }
  },
  "defaults": {
    "build": {
      "args": "",
      "packtool": ""
    }
  },
  "output_env_file": ".env",
  "networks": {
    "local": {
      "bind": "127.0.0.1:4943",
      "type": "ephemeral"
    },
    "ic": {
      "providers": ["https://ic0.app"],
      "type": "persistent"
    }
  }
}
```

## 🔐 Security Configuration

### Local Development Security
```bash
# Disable certificate verification (already configured)
# In src/services/api.js:
# agentOptions.verifyQuerySignatures = false;

# Enable debug mode
REACT_APP_DEBUG_MODE=true

# Local CORS settings
CORS_ORIGINS=http://localhost:3000,http://localhost:4943
```

### Production Security
```bash
# Enable certificate verification
# In src/services/api.js (automatic):
# agentOptions.verifyQuerySignatures = true;

# Disable debug mode
REACT_APP_DEBUG_MODE=false

# Strict CORS settings
CORS_ORIGINS=https://yourdomain.com,https://your-subdomain.yourdomain.com

# API Key management
NOVITA_AI_API_KEY=your-production-api-key
OPENAI_API_KEY=your-production-openai-key
```

## 🌐 Network Configurations

### Local Network (Development)
```bash
# DFX Local Replica
Host: http://127.0.0.1:4943
Network: local
Certificate Verification: Disabled
Root Key: Fetched automatically
```

### IC Mainnet (Production)
```bash
# Internet Computer Mainnet
Host: https://ic0.app
Network: ic
Certificate Verification: Enabled
Root Key: Not fetched (uses mainnet certificates)
```

## 📊 Monitoring and Logging

### Development Logging
```bash
# Enable comprehensive logging
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug

# Browser console will show:
# - ICP Agent initialization
# - Canister call details
# - HTTP outcall attempts
# - Error details with context
```

### Production Monitoring
```bash
# Minimal logging for performance
REACT_APP_DEBUG_MODE=false
REACT_APP_LOG_LEVEL=error

# Monitor canister cycles
dfx canister --network ic status backend

# Set up alerts for low cycles
# (Implementation depends on your monitoring system)
```

## 🚀 Deployment Scripts

### Local Deployment Script
```bash
#!/bin/bash
# deploy-local.sh

set -e

echo "🚀 Deploying TrustCareConnect Locally..."

# Start DFX if not running
if ! dfx ping > /dev/null 2>&1; then
    echo "Starting DFX replica..."
    dfx start --background --clean
fi

# Deploy backend
echo "Deploying backend canister..."
dfx deploy backend

# Get canister ID
CANISTER_ID=$(dfx canister id backend)
echo "Backend canister deployed: $CANISTER_ID"

# Update environment variables
echo "Updating environment variables..."
cat > .env << EOF
NODE_ENV=development
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
CANISTER_ID_BACKEND=$CANISTER_ID
REACT_APP_NETWORK=local
DFX_NETWORK=local
REACT_APP_DEBUG_MODE=true
EOF

# Update frontend env
cat > packages/frontend/.env.local << EOF
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
REACT_APP_CANISTER_ID=$CANISTER_ID
REACT_APP_NETWORK=local
REACT_APP_DEBUG_MODE=true
EOF

# Test deployment
echo "Testing deployment..."
dfx canister call backend healthCheck

echo "✅ Local deployment complete!"
echo "🌐 Frontend: npm start"
echo "🏥 Backend: $CANISTER_ID"
```

### Production Deployment Script
```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "🚀 Deploying TrustCareConnect to Production..."

# Verify we're on the right branch
if [ "$(git branch --show-current)" != "main" ]; then
    echo "❌ Please deploy from main branch"
    exit 1
fi

# Deploy to mainnet with cycles
echo "Deploying to IC mainnet..."
dfx deploy --network ic --with-cycles 5000000000000

# Get production canister ID
PROD_CANISTER_ID=$(dfx canister --network ic id backend)
echo "Production canister deployed: $PROD_CANISTER_ID"

# Update production environment
echo "Updating production environment..."
cat > .env.production << EOF
NODE_ENV=production
REACT_APP_IC_HOST=https://ic0.app
REACT_APP_BACKEND_CANISTER_ID=$PROD_CANISTER_ID
CANISTER_ID_BACKEND=$PROD_CANISTER_ID
REACT_APP_NETWORK=ic
DFX_NETWORK=ic
REACT_APP_DEBUG_MODE=false
EOF

# Build production frontend
echo "Building production frontend..."
npm run build

# Test production deployment
echo "Testing production deployment..."
dfx canister --network ic call backend healthCheck

# Display deployment info
echo "✅ Production deployment complete!"
echo "🌐 Canister ID: $PROD_CANISTER_ID"
echo "🔗 Candid UI: https://ic0.app/_/candid?id=$PROD_CANISTER_ID"
```

## 🔄 Environment Switching

### Quick Environment Switch Commands
```bash
# Switch to local development
cp .env.local .env
export REACT_APP_NETWORK=local
npm start

# Switch to production
cp .env.production .env
export REACT_APP_NETWORK=ic
npm run build

# Reset to development default
git checkout .env
npm start
```

## 🧪 Testing Configurations

### Test Environment Variables
```bash
# For automated testing
NODE_ENV=test
REACT_APP_ENABLE_MOCK_RESPONSES=true
REACT_APP_DEBUG_MODE=true
REACT_APP_BACKEND_CANISTER_ID=test-canister-id
```

### CI/CD Environment
```bash
# GitHub Actions / CI environment
CI=true
NODE_ENV=test
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_NETWORK=local
REACT_APP_DEBUG_MODE=false
```

## 📋 Configuration Checklist

### Before Deployment
- [ ] All environment variables set correctly
- [ ] API keys configured (for production)
- [ ] CORS origins updated
- [ ] Certificate verification settings correct
- [ ] Debug mode appropriate for environment
- [ ] Sufficient cycles for mainnet deployment

### After Deployment
- [ ] Health check passes
- [ ] Frontend loads correctly
- [ ] Patient registration works
- [ ] Doctor assignment functions
- [ ] Query submission and AI processing works
- [ ] All critical workflows tested

## 🆘 Configuration Troubleshooting

### Common Configuration Issues

#### Wrong Canister ID
```bash
# Symptoms: "Canister does not belong to any subnet"
# Solution: Update all .env files with correct canister ID
CANISTER_ID=$(dfx canister id backend)
# Update all environment files with this ID
```

#### Certificate Verification Errors
```bash
# Symptoms: "Invalid signature" errors
# Solution: Check network configuration
# Local: REACT_APP_NETWORK=local (verification disabled)
# Production: REACT_APP_NETWORK=ic (verification enabled)
```

#### CORS Errors
```bash
# Symptoms: "Cross-Origin Request Blocked"
# Solution: Update CORS_ORIGINS environment variable
# Include all domains that will access the application
```

---

**This configuration guide ensures TrustCareConnect runs optimally in any environment.** 🚀