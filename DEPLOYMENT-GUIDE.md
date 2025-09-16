# TrustCareConnect Deployment Guide

## Current Deployment Status ✅

**Last Successful Deployment**: Current
**Backend Canister**: `uxrrr-q7777-77774-qaaaq-cai` (Running)
**Frontend Canister**: `u6s2n-gx777-77774-qaaba-cai` (Running)

## Quick Deployment Commands

### Standard Deployment
```bash
# Start DFX replica
dfx start --background --clean

# Deploy all canisters
dfx deploy --with-cycles 2000000000000

# Check deployment status
dfx canister status --all
```

### Optimized Deployment (Recommended)
```bash
# Ensure frontend is built first
cd packages/frontend && npm run build && cd ../..

# Deploy with optimized configuration
dfx start --background --clean
dfx deploy --with-cycles 2000000000000

# Verify deployment
dfx ping
dfx canister status --all
```

## Application Access URLs

### Primary Frontend Access
```
http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/
```

### Alternative Access Methods
```
# Alternative frontend URL
http://127.0.0.1:4943/?canisterId=u6s2n-gx777-77774-qaaba-cai

# Backend API endpoint
http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/

# Candid Interface for API testing
http://127.0.0.1:4943/_/candid?id=uxrrr-q7777-77774-qaaaq-cai
```

## dfx.json Configuration

### Current Optimized Configuration
```json
{
  "version": 1,
  "canisters": {
    "backend": {
      "main": "packages/backend/src/main.mo",
      "type": "motoko"
    },
    "frontend": {
      "dependencies": ["backend"],
      "frontend": {
        "entrypoint": "packages/frontend/dist/index.html"
      },
      "source": ["packages/frontend/dist/"],
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
    }
  }
}
```

### Key Configuration Changes Applied

**Frontend Source Configuration**:
- ✅ **Fixed**: `"source": ["packages/frontend/dist/"]` (was `packages/frontend/`)
- ✅ **Fixed**: `"entrypoint": "packages/frontend/dist/index.html"` (was `packages/frontend/index.html`)

**Benefits of Current Configuration**:
- Deploys only built assets (132KB) instead of entire source directory
- Eliminates deployment hangs and stuck processes
- Reduces deployment time from hours to minutes
- Prevents asset processing conflicts

## Troubleshooting Common Issues

### Issue 1: Frontend Deployment Hanging
**Symptoms**: Deployment stuck on "Uploading assets" for extended periods

**Root Cause**: dfx.json configured to deploy entire source directory instead of built assets

**Solution**: Ensure dfx.json points to dist/ directory (already applied)
```json
"frontend": {
  "source": ["packages/frontend/dist/"],
  "frontend": {
    "entrypoint": "packages/frontend/dist/index.html"
  }
}
```

### Issue 2: Stuck Deployment Processes
**Symptoms**: Deployment never completes, high CPU usage

**Solution**: Kill processes and restart
```bash
# Kill stuck processes
pkill -f dfx
pkill -f node

# Clear dfx cache
rm -rf .dfx/local

# Restart clean
dfx start --background --clean
dfx deploy
```

### Issue 3: Canister Connection Errors
**Symptoms**: "Canister does not belong to any subnet"

**Solution**: Verify canister IDs and network configuration
```bash
# Check current canister IDs
dfx canister id backend
dfx canister id frontend

# Update environment files with correct IDs
# Update .env and packages/frontend/.env.local
```

### Issue 4: Port Conflicts
**Symptoms**: "Port 4943 already in use"

**Solution**: Clean restart dfx
```bash
dfx stop
lsof -ti:4943 | xargs kill -9
dfx start --background --clean
```

### Issue 5: Asset Processing Timeout
**Symptoms**: Frontend deployment times out during asset processing

**Solution**: Ensure frontend is pre-built
```bash
# Build frontend first
cd packages/frontend
npm run build
cd ../..

# Then deploy
dfx deploy
```

## Build Process

### Frontend Build Requirements
```bash
# Navigate to frontend package
cd packages/frontend

# Install dependencies
npm install

# Build production assets
npm run build

# Verify build output
ls -la dist/
```

**Expected dist/ structure**:
```
dist/
├── index.html
├── js/
│   ├── app.js
│   ├── backend.js
│   ├── config.js
│   ├── errorHandler.js
│   ├── logger.js
│   ├── mockResponses.js
│   ├── offlineManager.js
│   └── ui.js
└── css/
    └── styles.css
```

## Deployment Verification

### Health Check Commands
```bash
# 1. Check DFX replica status
dfx ping

# 2. Check canister status
dfx canister status backend
dfx canister status frontend

# 3. Test backend functionality
dfx canister call backend healthCheck

# 4. Verify frontend loading
curl -I http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/

# 5. Check cycles balance
dfx canister status --all
```

### Expected Healthy Output
```bash
# dfx ping
{
  "ic_api_version": "0.18.0",
  "impl_hash": "...",
  "impl_version": "...",
  "replica_health_status": "healthy",
  "root_key": [...]
}

# dfx canister status backend
Canister status call result for backend.
Status: Running
Controllers: [your-principal-id]
Memory allocation: 0 Bytes
Compute allocation: 0 %
Freezing threshold: 2_592_000 Seconds
Memory Size: 2_851_293 Bytes
Balance: 1_497_285_328_937 Cycles
```

## Performance Optimization

### Deployment Time Optimization
- ✅ Use dist/ directory for frontend deployment
- ✅ Pre-build frontend before deployment
- ✅ Clear dfx cache between deployments
- ✅ Use clean restart for reliable deployment

### Cycle Management
```bash
# Check cycle balance
dfx canister status --all

# Add cycles if needed
dfx canister deposit-cycles 1000000000000 backend
dfx canister deposit-cycles 1000000000000 frontend
```

## Emergency Recovery

### Complete Reset Procedure
```bash
# 1. Stop everything
dfx stop
pkill -f dfx
pkill -f node

# 2. Clean all state
rm -rf .dfx/local
rm -rf packages/frontend/dist
rm -rf packages/frontend/node_modules

# 3. Rebuild from scratch
cd packages/frontend
npm install
npm run build
cd ../..

# 4. Fresh deployment
dfx start --background --clean
dfx deploy --with-cycles 2000000000000

# 5. Verify
dfx canister status --all
```

## Monitoring Commands

### Real-time Monitoring
```bash
# Monitor deployment progress
watch -n 2 'dfx canister status --all'

# Monitor logs
dfx canister logs backend --follow
dfx canister logs frontend --follow

# Monitor system resources
top -p $(pgrep -f dfx)
```

## Success Criteria

A successful deployment should show:
- ✅ Both canisters with "Running" status
- ✅ Healthy cycle balances (>1T cycles each)
- ✅ Frontend accessible via provided URLs
- ✅ Backend responding to health checks
- ✅ No error messages in canister logs

## Contact Information

For deployment issues:
- Check GitHub Issues: https://github.com/musyokapatrickmutuku/trustcareconnect/issues
- Review this guide thoroughly before seeking help
- Include deployment logs and error messages in any issue reports