# 🚀 TrustCareConnect - Complete Setup Guide

> Comprehensive step-by-step installation guide for developers

## 🎯 Overview

This guide provides detailed instructions for setting up TrustCareConnect in a new development environment. Follow these steps exactly to ensure a successful installation.

## 📋 Prerequisites Checklist

Before starting, ensure you have the following installed:

### System Requirements
- **Operating System**: Linux, macOS, or Windows (with WSL2)
- **Memory**: At least 4GB RAM available
- **Storage**: At least 2GB free space
- **Network**: Stable internet connection for downloads

### Required Software

#### 1. Node.js and npm
```bash
# Check if already installed
node --version  # Should be ≥ 16.0.0
npm --version   # Should be ≥ 8.0.0

# If not installed:
# Visit https://nodejs.org/ and download LTS version
# Or use package manager:

# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (with Homebrew):
brew install node

# Windows: Download from https://nodejs.org/
```

#### 2. DFX (Internet Computer SDK)
```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Add to PATH (important!)
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh users:
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
dfx --version  # Should show 0.28.0 or higher
```

#### 3. Git
```bash
# Check if installed
git --version

# If not installed:
# Ubuntu/Debian:
sudo apt-get install git

# macOS (usually pre-installed):
brew install git

# Windows: Download from https://git-scm.com/
```

## 🔧 Step-by-Step Installation

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git

# Navigate to project directory
cd trustcareconnect

# Verify you're in the right directory
ls -la  # Should see dfx.json, package.json, src/, packages/
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Start DFX Local Replica

```bash
# Start DFX in background mode
dfx start --background --clean

# Verify DFX is running
dfx ping
# Should return: {"replica_health_status": "healthy"}

# Check DFX processes
dfx info
```

### Step 4: Deploy Backend Canister

```bash
# Create backend canister (if needed)
dfx canister create backend

# Deploy the backend
dfx deploy backend

# Verify deployment
dfx canister call backend healthCheck
# Should return: "TrustCareConnect backend is running! Patients: 0, Doctors: 0, Queries: 0"
```

### Step 5: Configure Environment Variables

```bash
# Get your local canister ID
CANISTER_ID=$(dfx canister id backend)
echo "Your backend canister ID: $CANISTER_ID"

# Update environment files with your canister ID
# Edit .env file
cat > .env << EOF
NODE_ENV=development
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
CANISTER_ID_BACKEND=$CANISTER_ID
REACT_APP_NETWORK=local
DFX_NETWORK=local
REACT_APP_DEBUG_MODE=true
EOF

# Update .env.local file in packages/frontend/
cat > packages/frontend/.env.local << EOF
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
REACT_APP_CANISTER_ID=$CANISTER_ID
REACT_APP_NETWORK=local
REACT_APP_DEBUG_MODE=true
EOF
```

### Step 6: Start Frontend Application

```bash
# Start the frontend development server
npm start

# The application should automatically open at http://localhost:3000
# If it doesn't open automatically, open your browser and go to:
# http://localhost:3000
```

## ✅ Verification Steps

After completing the installation, verify everything is working:

### Backend Verification
```bash
# 1. Check DFX replica status
dfx ping

# 2. Test backend canister
dfx canister call backend healthCheck

# 3. Check canister status
dfx canister status backend
```

### Frontend Verification
```bash
# 1. Check if frontend is running
curl http://localhost:3000
# Should return HTML content

# 2. Check browser console
# Open http://localhost:3000 in browser
# Check browser console for any errors
```

### Complete Workflow Test
```bash
# Test the complete patient-doctor workflow:

# 1. Register a doctor
dfx canister call backend registerDoctor '("Dr. Emily Chen", "Endocrinology")'
# Should return: ("doctor_1")

# 2. Register a patient
dfx canister call backend registerPatient '("Sarah Johnson", "Diabetes Type 2", "sarah.johnson@email.com")'
# Should return: ("patient_1")

# 3. Assign patient to doctor
dfx canister call backend assignPatientToDoctor '("patient_1", "doctor_1")'
# Should return: (variant { ok })

# 4. Submit a query
dfx canister call backend submitQuery '("patient_1", "Morning Blood Sugar", "My blood sugar is 180 mg/dL this morning, should I be concerned?")'
# Should return: (variant { ok = "query_1" })

# 5. Check the AI-generated response
dfx canister call backend getQuery '("query_1")'
# Should return a comprehensive medical response with AI analysis

# 6. Verify system statistics
dfx canister call backend healthCheck
# Should return: "TrustCareConnect backend is running! Patients: 1, Doctors: 1, Queries: 1"
```

## 🛠️ Troubleshooting Common Issues

### Issue 1: DFX Installation Failed
```bash
# Symptoms: dfx command not found
# Solutions:
1. Ensure PATH is updated:
   echo $PATH | grep "$HOME/bin"
   
2. Restart terminal after installation
   source ~/.bashrc  # or ~/.zshrc for zsh

3. Manual PATH export:
   export PATH="$HOME/bin:$PATH"
```

### Issue 2: Port Already in Use
```bash
# Symptoms: EADDRINUSE error on port 3000 or 4943
# Solutions:
1. Kill processes on port 3000:
   lsof -ti:3000 | xargs kill -9
   
2. Kill processes on port 4943:
   dfx stop
   dfx start --background --clean
```

### Issue 3: Canister ID Not Found
```bash
# Symptoms: "Cannot find canister id" error
# Solutions:
1. Check if backend canister exists:
   dfx canister id backend
   
2. Create canister if not exists:
   dfx canister create backend
   
3. Update environment variables with correct ID
```

### Issue 4: Frontend Compilation Errors
```bash
# Symptoms: Module not found errors
# Solutions:
1. Clear npm cache:
   npm cache clean --force
   
2. Delete node_modules and reinstall:
   rm -rf node_modules package-lock.json
   npm install
   
3. Update environment variables:
   Check .env and .env.local files have correct canister ID
```

### Issue 5: Certificate Verification Errors
```bash
# Symptoms: "Invalid signature" or certificate errors
# Solutions:
These should be automatically handled by the codebase, but if you encounter them:

1. Check environment variables:
   echo $REACT_APP_NETWORK  # Should be "local"
   echo $REACT_APP_IC_HOST  # Should be "http://127.0.0.1:4943"
   
2. Clear browser cache and restart browser
```

## 🔍 Health Check Commands

Use these commands to verify system health:

```bash
# 1. DFX Status
dfx ping
dfx canister status backend

# 2. Backend Health
dfx canister call backend healthCheck

# 3. Frontend Status
curl -I http://localhost:3000

# 4. Environment Variables
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo "DFX: $(dfx --version)"
echo "Backend Canister: $(dfx canister id backend 2>/dev/null || echo 'Not deployed')"
```

## 📝 Environment Variables Reference

### Required Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `NODE_ENV` | Node environment | `development` |
| `REACT_APP_IC_HOST` | ICP host URL | `http://127.0.0.1:4943` |
| `REACT_APP_BACKEND_CANISTER_ID` | Backend canister ID | `lqy7q-dh777-77777-aaaaq-cai` |
| `CANISTER_ID_BACKEND` | DFX canister ID | `lqy7q-dh777-77777-aaaaq-cai` |
| `REACT_APP_NETWORK` | Network type | `local` |
| `DFX_NETWORK` | DFX network | `local` |
| `REACT_APP_DEBUG_MODE` | Debug logging | `true` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_FALLBACK_MODE` | Use mock responses | `true` |
| `REACT_APP_LOG_LEVEL` | Logging level | `debug` |

## 🚀 Next Steps After Installation

1. **Explore the Application**:
   - Open http://localhost:3000
   - Try the patient and doctor portals
   - Submit test queries

2. **Load Sample Data**:
   ```bash
   # Use the test patient data from patients.txt
   dfx canister call backend registerPatient '("Sarah Michelle Johnson", "Diabetes Type 2", "sarah.johnson@email.com")'
   ```

3. **Development**:
   - Code changes will auto-reload the frontend
   - Backend changes require redeployment: `dfx deploy backend`

4. **Testing**:
   - Submit various medical queries
   - Test the doctor workflow
   - Verify AI response generation

## 📞 Getting Help

If you encounter issues not covered in this guide:

1. **Check the main README.md** for additional troubleshooting
2. **Review error messages carefully** - they often contain helpful information
3. **Use health check commands** to isolate the problem
4. **Open an issue** on GitHub with:
   - Your operating system
   - Error messages
   - Steps you tried
   - Output of health check commands

## 🎉 Success Indicators

You know the installation was successful when:

- ✅ `dfx ping` returns healthy status
- ✅ `dfx canister call backend healthCheck` returns system info
- ✅ `http://localhost:3000` loads the application
- ✅ Frontend shows "Compiled successfully!"
- ✅ You can register patients and doctors
- ✅ Query submission generates AI responses

---

**Congratulations! TrustCareConnect is now running on your local machine.** 🎉