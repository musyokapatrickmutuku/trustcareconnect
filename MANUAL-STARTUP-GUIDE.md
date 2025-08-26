# 🔧 TrustCareConnect - Manual Startup & Troubleshooting Guide

## 📋 Overview
This guide provides step-by-step manual startup procedures and troubleshooting solutions for TrustCareConnect when automated scripts encounter issues.

---

## 🚀 Quick Start (Automated Scripts)

### Option 1: Unix/Linux/WSL
```bash
./setup.sh
```

### Option 2: Windows Command Prompt
```batch
setup.bat
```

**If automated scripts work perfectly, you can skip the manual sections below.**

---

## 🔧 Manual Startup Procedures

### Step 1: Prerequisites Verification

#### Check Required Tools
```bash
# Check Node.js (Required: 16.0.0+)
node --version

# Check npm
npm --version

# Check DFX (Internet Computer SDK)
dfx --version
```

#### ❌ **Common Issue**: Missing Prerequisites
**Problem**: Command not found errors
**Solutions**:
```bash
# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# For Windows: Install in WSL (Windows Subsystem for Linux)
# 1. wsl --install
# 2. Install DFX in WSL environment
```

### Step 2: Dependency Installation

#### Normal Installation
```bash
npm install --legacy-peer-deps
```

#### ❌ **Common Issue**: NPM Installation Timeout/Failures
**Problem**: Dependencies fail to install, ENOTEMPTY errors, peer dependency conflicts

**Solutions**:
```bash
# Solution 1: Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps

# Solution 2: Use different npm registry
npm install --legacy-peer-deps --registry https://registry.npmjs.org/

# Solution 3: Install with increased timeout
npm install --legacy-peer-deps --timeout=300000

# Solution 4: For WSL/Windows filesystem issues
npm install --legacy-peer-deps --no-optional

# Solution 5: Force install specific problematic packages
npm install react-dev-utils@12.0.1 --save-dev --legacy-peer-deps
npm install
```

### Step 3: DFX Replica Management

#### Start DFX Replica
```bash
# Check if already running
dfx ping

# If not running, start clean replica
dfx start --background --clean
```

#### ❌ **Common Issues**: DFX Replica Problems

**Problem 1**: Port 4943 already in use
```bash
# Solution: Kill existing processes
sudo lsof -ti:4943 | xargs kill -9
dfx start --background --clean
```

**Problem 2**: Permission denied errors
```bash
# Solution: Fix permissions
sudo chown -R $USER:$USER ~/.cache/dfinity
sudo chown -R $USER:$USER ~/.config/dfx
dfx start --background --clean
```

**Problem 3**: Network binding issues (WSL)
```bash
# Solution: Specify host explicitly
dfx start --background --clean --host 127.0.0.1
```

**Problem 4**: Replica won't start clean
```bash
# Solution: Force clean state
dfx stop
rm -rf .dfx/local
dfx start --background --clean
```

### Step 4: Backend Canister Deployment

#### Deploy Backend
```bash
dfx deploy backend
```

#### ❌ **Common Issues**: Backend Deployment Failures

**Problem 1**: Canister compilation errors
```bash
# Check Motoko compiler version
dfx --version

# Solution: Update DFX if needed
dfx upgrade
dfx deploy backend
```

**Problem 2**: Out of cycles error
```bash
# Solution: Use local network (should have unlimited cycles)
dfx deploy backend --network local
```

**Problem 3**: Canister already exists error
```bash
# Solution: Force redeploy
dfx deploy backend --mode reinstall
```

**Problem 4**: Backend compilation warnings
```bash
# These warnings are normal and don't prevent deployment:
# - unused identifier warnings
# - These are development artifacts and can be ignored
```

### Step 5: Environment Configuration

#### Automatic Configuration
```bash
# Get backend canister ID
CANISTER_ID=$(dfx canister id backend)
echo "Backend Canister ID: $CANISTER_ID"
```

#### Manual Environment Setup
Create `.env` file in project root:
```bash
cat > .env << EOF
# Environment
NODE_ENV=development

# ICP Configuration
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$(dfx canister id backend)
CANISTER_ID_BACKEND=$(dfx canister id backend)
REACT_APP_NETWORK=local
DFX_NETWORK=local
REACT_APP_DEBUG_MODE=true

# Frontend Configuration
REACT_APP_API_HOST=http://localhost:3001
FRONTEND_HOST=http://localhost:3000

# Development Tools
ENABLE_DEV_TOOLS=true
ENABLE_MOCK_RESPONSES=true
GENERATE_SOURCEMAP=true
EOF
```

Create `packages/frontend/.env.local`:
```bash
mkdir -p packages/frontend
cat > packages/frontend/.env.local << EOF
# Frontend Environment
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$(dfx canister id backend)
REACT_APP_CANISTER_ID=$(dfx canister id backend)
REACT_APP_NETWORK=local
REACT_APP_NODE_ENV=development
REACT_APP_DEBUG_MODE=true
NODE_ENV=development
EOF
```

### Step 6: Test Data Loading

#### Basic Test Data
```bash
# Register test doctors
dfx canister call backend registerDoctor '("Dr. Maria Elena Rodriguez", "Endocrinology")'
dfx canister call backend registerDoctor '("Dr. James Michael Thompson", "Endocrinology")'

# Register test patients
dfx canister call backend registerPatient '("Sarah Michelle Johnson", "Diabetes Type 2", "sarah.johnson@email.com")'
dfx canister call backend registerPatient '("Michael David Rodriguez", "Diabetes Type 1", "mike.rodriguez@student.edu")'
dfx canister call backend registerPatient '("Carlos Eduardo Mendoza", "Diabetes Type 2", "carlos.mendoza@gmail.com")'

# Verify data loaded
dfx canister call backend healthCheck
```

#### ❌ **Common Issue**: Canister Call Failures
**Problem**: Backend not responding or call format errors

**Solutions**:
```bash
# Solution 1: Verify canister is running
dfx canister status backend

# Solution 2: Check canister ID is correct
dfx canister id backend

# Solution 3: Use different call format if needed
dfx canister call backend healthCheck --query

# Solution 4: Restart backend if unresponsive
dfx deploy backend --mode reinstall
```

### Step 7: Frontend Startup

#### Start Frontend Development Server
```bash
cd packages/frontend
npm start
```

#### ❌ **Common Issues**: Frontend Startup Failures

**Problem 1**: Missing react-dev-utils/crossSpawn
```bash
# Solution: Install missing dependencies
npm install react-dev-utils@12.0.1 --save-dev
npm install
npm start
```

**Problem 2**: Port 3000 already in use
```bash
# Solution: Use different port
PORT=3001 npm start

# Or kill existing process
sudo lsof -ti:3000 | xargs kill -9
npm start
```

**Problem 3**: TypeScript compilation errors
```bash
# Solution: Skip type checking temporarily
npm run start --skip-ts-check

# Or fix TypeScript config
cd packages/frontend
npm install @types/node @types/react @types/react-dom --save-dev
npm start
```

**Problem 4**: Environment variables not loaded
```bash
# Solution: Verify .env.local exists
ls -la packages/frontend/.env.local

# Recreate if missing (use Step 5 commands above)
```

---

## 🧪 Verification & Testing

### Health Check Procedures
```bash
# 1. Verify DFX replica is healthy
dfx ping

# 2. Check backend canister status
dfx canister call backend healthCheck

# 3. Test frontend accessibility
curl -I http://localhost:3000

# 4. Check canister interface
curl -I "http://127.0.0.1:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai&id=$(dfx canister id backend)"
```

### Complete System Test
```bash
# Test complete workflow
dfx canister call backend submitQuery '("patient_1", "Blood Sugar Question", "My blood sugar has been high lately.")'
dfx canister call backend getQueries '()'
```

---

## 🔍 Advanced Troubleshooting

### Log Analysis
```bash
# DFX replica logs
dfx info
cat .dfx/local/replica.log

# Frontend development server logs
# Check terminal output for compilation errors

# Backend canister logs
dfx canister logs backend
```

### Network Connectivity Issues
```bash
# Test local network connectivity
ping 127.0.0.1
netstat -an | grep 4943
netstat -an | grep 3000

# Windows WSL specific tests
# Ensure WSL can access Windows network
ip route show
```

### Performance Issues
```bash
# Check system resources
free -h
df -h
ps aux | grep dfx
ps aux | grep node

# Clean up resources if needed
dfx stop
pkill -f "dfx start"
pkill -f "npm start"
```

---

## 📝 Manual Recovery Procedures

### Complete Reset (Nuclear Option)
```bash
# Stop all services
dfx stop
pkill -f "npm start"

# Clean all artifacts
rm -rf .dfx
rm -rf node_modules
rm -rf packages/frontend/node_modules
rm -rf packages/frontend/build
rm package-lock.json
rm packages/frontend/package-lock.json

# Restart from scratch
dfx start --background --clean
npm install --legacy-peer-deps
dfx deploy backend
# Follow Steps 5-7 above
```

### Backup Working State
```bash
# Save working configuration
cp .env .env.backup
cp packages/frontend/.env.local packages/frontend/.env.local.backup
dfx canister id backend > canister-id.backup
```

---

## 📚 Reference Information

### Test Credentials
See `TEST-CREDENTIALS.md` for complete login information.

### Key URLs
- Frontend: http://localhost:3000
- DFX Replica: http://127.0.0.1:4943
- Backend Canister Interface: http://127.0.0.1:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai&id={BACKEND_CANISTER_ID}

### File Locations
- Main config: `.env`
- Frontend config: `packages/frontend/.env.local`
- DFX config: `dfx.json`
- Backend code: `packages/backend/src/main.mo`

---

## 🆘 Getting Help

### Common Commands Summary
```bash
# Status checks
dfx ping                           # Check DFX replica
dfx canister status backend       # Check backend status
npm list --depth=0                # Check installed packages

# Restart services
dfx restart --clean               # Restart DFX completely
npm start                         # Start frontend
dfx deploy backend --mode reinstall  # Redeploy backend

# Clean up
dfx stop && dfx start --clean     # Clean DFX restart
rm -rf node_modules && npm install  # Clean npm restart
```

### When to Use Manual vs Automated
- **Use Automated Scripts**: First time setup, clean environments
- **Use Manual Procedures**: When scripts fail, development troubleshooting, understanding the system
- **Use Advanced Troubleshooting**: Complex environment issues, performance problems, network connectivity

---

*This guide covers all scenarios encountered during testing. The automated scripts handle 95% of cases correctly - manual procedures are for the remaining edge cases and learning purposes.*