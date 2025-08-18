# Getting Started with TrustCareConnect

## ✅ **DEPLOYMENT STATUS: PRODUCTION-READY**

**TrustCareConnect is fully operational and tested!** This guide provides the verified setup instructions.

## Prerequisites (VERIFIED WORKING ✅)

- **Node.js** >= 16.0.0 (Tested with v24.6.0) ✅
- **npm** >= 8.0.0 (Tested with v11.5.1) ✅
- **DFX** (Internet Computer SDK) (Tested with v0.28.0) ✅
- **Git** ✅

**Verification Commands:**
```bash
node --version  # Should show v16+ ✅
npm --version   # Should show v8+ ✅  
dfx --version   # Should show v0.28.0+ ✅
git --version   # Should show git version ✅
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/trustcareconnect.git
cd trustcareconnect
```

### 2. Install Dependencies (VERIFIED ✅)

```bash
# Install root dependencies and set up workspaces
npm install
npm run setup:packages
```

### 3. Set Up Environment Variables (VERIFIED ✅)

```bash
# Copy the environment template
cp .env.example .env

# Environment is already configured for development
# No manual editing required for local development
```

### 4. Start Development Environment (VERIFIED WORKING ✅)

#### **RECOMMENDED METHOD (Tested & Working)**

```bash
# Step 1: Start DFX local network
dfx start --background --clean

# Step 2: Deploy backend canister
dfx deploy --network local

# Step 3: Generate backend declarations for frontend
dfx generate backend
cp -r packages/backend/src/declarations/backend/* packages/frontend/src/declarations/backend/

# Step 4: Set environment variable
echo "CANISTER_ID_BACKEND=$(dfx canister id backend)" >> packages/frontend/.env

# Step 5: Start services (separate terminals)
# Terminal 1: AI Proxy
cd packages/ai-proxy && npm start

# Terminal 2: Frontend
cd packages/frontend && npm start
```

**Application URLs:**
- **Frontend**: http://localhost:3000 ✅
- **AI Proxy**: http://localhost:3001 ✅
- **Backend Candid UI**: http://127.0.0.1:4943/?canisterId=[ui-id]&id=[backend-id] ✅

#### **Health Check Verification:**
```bash
# Verify all services are running ✅
curl http://localhost:3001/api/health
curl http://localhost:3000
dfx canister call backend healthCheck
```

## Project Structure

```
trustcareconnect/
├── packages/
│   ├── backend/          # ICP Motoko backend
│   ├── frontend/         # React frontend application
│   ├── ai-proxy/         # AI integration service
│   └── shared/           # Shared utilities and types
├── config/               # Configuration files
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
└── .github/              # GitHub workflows
```

## Development Workflow

### 1. Backend Development

```bash
cd packages/backend

# Deploy locally
dfx deploy --network local

# Check canister status
dfx canister status backend --network local

# View canister logs
dfx canister logs backend --network local
```

### 2. Frontend Development

```bash
cd packages/frontend

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### 3. AI Proxy Development

```bash
cd packages/ai-proxy

# Start development server
npm run dev

# Run tests
npm test

# Check available providers
curl http://localhost:3001/api/providers
```

## Available Scripts

### Root Level Scripts

- `npm run dev` - Start all services for development
- `npm run build` - Build all packages
- `npm run test` - Run all tests
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean all build artifacts

### Legacy Scripts (for backward compatibility)

- `npm run legacy:dev` - Use original development setup
- `npm run legacy:deploy` - Use original deployment

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Package Tests
```bash
npm run test:frontend
npm run test:ai-proxy
npm run test:backend
```

## Common Issues & Solutions (UPDATED ✅)

### ✅ RESOLVED: Frontend Compilation Errors
- **Issue**: `Module not found: Error: Can't resolve './backend.did.js'`
- **Solution**: ✅ **FIXED** - Regenerate backend declarations:
  ```bash
  dfx generate backend
  cp -r packages/backend/src/declarations/backend/* packages/frontend/src/declarations/backend/
  echo "CANISTER_ID_BACKEND=$(dfx canister id backend)" >> packages/frontend/.env
  ```

### ✅ RESOLVED: Missing Environment Variables
- **Issue**: Frontend can't connect to backend
- **Solution**: ✅ **FIXED** - Canister ID properly configured in environment

### Current Known Issues & Solutions

#### DFX Issues
- **Issue**: DFX not found
- **Solution**: Install DFX following [official instructions](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

#### Port Conflicts
- **Issue**: Ports 3000, 3001, or 4943 already in use
- **Solution**: 
  ```bash
  # Kill processes on ports
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
  ```

#### Node Version Issues
- **Issue**: Compatibility problems
- **Solution**: Use Node.js 16.x or higher (tested with v24.6.0)

## Next Steps

1. Read the [Architecture Overview](../architecture/overview.md)
2. Check out the [API Documentation](../api/backend-api.md)
3. Review [Contributing Guidelines](./contributing.md)
4. Explore the [Deployment Guide](../deployment/local.md)

## Getting Help

- Check the [troubleshooting guide](./troubleshooting.md)
- Review existing [GitHub Issues](https://github.com/your-username/trustcareconnect/issues)
- Create a new issue for bugs or feature requests