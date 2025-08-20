# Environment Configuration Setup

## Required .env.local Configuration

Create a `.env.local` file in the frontend package root with the following configuration:

```env
# TrustCareConnect Frontend Environment Configuration
# Internet Computer Protocol (ICP) Configuration

# ICP Host Configuration
# Development: Use local replica
REACT_APP_IC_HOST=http://localhost:4943

# Production: Use mainnet (uncomment for production deployment)
# REACT_APP_IC_HOST=https://icp-api.io

# Backend Canister ID (will be set after deploying the Motoko backend canister)
REACT_APP_BACKEND_CANISTER_ID=lqy7q-dh777-77777-aaaaq-cai
REACT_APP_CANISTER_ID=lqy7q-dh777-77777-aaaaq-cai

# AI Proxy Service Configuration
REACT_APP_AI_PROXY_URL=http://localhost:3001

# Network Configuration
REACT_APP_NETWORK=local
REACT_APP_NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_CLINICAL_FEATURES=true
REACT_APP_ENABLE_AI_INTEGRATION=true

# Debug Configuration
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug

# Authentication Configuration (for future use with Internet Identity)
REACT_APP_AUTH_PROVIDER=ii
REACT_APP_II_URL=https://identity.ic0.app

# Development settings
GENERATE_SOURCEMAP=true
NODE_ENV=development
```

## Important Notes

1. **Canister ID**: Update `REACT_APP_BACKEND_CANISTER_ID` with your actual canister ID after deploying the Motoko backend
2. **Production**: Comment out the development host and uncomment the production host for mainnet deployment
3. **AI Proxy**: Ensure the AI proxy service is running on the specified port
4. **Security**: Never commit this file to version control (it's gitignored for security)

## Deployment Configuration

### Local Development
- Use `http://localhost:4943` for local replica
- Set `REACT_APP_NETWORK=local`
- Enable debug mode for development

### Production Deployment  
- Use `https://icp-api.io` for mainnet
- Set `REACT_APP_NETWORK=ic`
- Disable debug mode for production
- Update canister ID with deployed canister