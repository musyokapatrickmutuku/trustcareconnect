# TrustCareConnect Local Deployment Guide

## 🚀 Quick Start Overview

This guide walks you through deploying TrustCareConnect locally with full AI integration:

1. **Start ICP local replica** (dfx)
2. **Deploy backend + frontend canisters**  
3. **Start AI proxy server** (Node.js)
4. **Test complete workflow** (Patient → AI → Doctor → Patient)

---

## 📋 Prerequisites

### Required Software
- **dfx CLI** (Internet Computer SDK) - [Install Guide](https://internetcomputer.org/docs/current/developer-docs/setup/install/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **Git** - For cloning if needed

### Verify Installation
```bash
# Check dfx version
dfx --version

# Check Node.js version  
node --version
npm --version
```

---

## 🏗️ Step 1: Start Local ICP Replica

### Start dfx Background Process
```bash
# Navigate to project root
cd trustcareconnect

# Start local replica (runs in background)
dfx start --background

# Verify replica is running
dfx ping
```

**Expected Output:**
```
{
  "replica_health_status": "healthy"
}
```

### Alternative: Start dfx in Foreground (Optional)
```bash
# If you prefer to see logs in terminal
dfx start --clean
# Keep this terminal open, use new terminal for next steps
```

---

## 🏗️ Step 2: Deploy ICP Canisters

### Deploy Backend Canister
```bash
# Deploy Motoko backend
dfx deploy backend

# Verify backend deployment
dfx canister call backend healthCheck
```

**Expected Output:**
```
("TrustCareConnect backend is running! Patients: 0, Doctors: 0, Queries: 0")
```

### Deploy Frontend Canister
```bash
# Install frontend dependencies (if not done)
cd src/frontend
npm install
cd ../..

# Deploy React frontend
dfx deploy frontend

# Get frontend URL
dfx canister call frontend http_request '(record {
  url = "/";
  method = "GET";
  body = vec {};
  headers = vec {};
})'
```

### Get Canister URLs
```bash
# Get backend canister ID
dfx canister id backend

# Get frontend URL (will be similar to this)
echo "Frontend URL: http://$(dfx canister id frontend).localhost:4943"
echo "Backend Candid UI: http://$(dfx canister id backend).localhost:4943/_/candid"
```

**Save these URLs - you'll need them for testing!**

---

## 🤖 Step 3: Start AI Proxy Server

### Navigate to AI Proxy Directory
```bash
cd ai-proxy
```

### Install Dependencies (First Time Only)
```bash
# Install Node.js dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Optional: Edit .env file to add real API keys
# nano .env  # or use your preferred editor
```

### Start AI Proxy Server
```bash
# Start in development mode (with auto-restart)
npm run dev

# OR start in production mode
npm start
```

**Expected Output:**
```
🚀 TrustCareConnect AI Proxy Server running on port 3001
📍 Health check: http://localhost:3001/api/health  
🔧 Environment: development
🤖 OpenAI available: false
🤖 Claude available: false
```

### Test AI Proxy (In New Terminal)
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test AI query with mock response
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "queryText": "How often should I check my blood sugar?",
    "condition": "diabetes",
    "provider": "mock"
  }'
```

---

## 🧪 Step 4: Complete Workflow Testing

### Test Setup Summary
- **Backend**: `http://{canister-id}.localhost:4943` 
- **Frontend**: `http://{canister-id}.localhost:4943`
- **AI Proxy**: `http://localhost:3001`
- **Candid UI**: `http://{backend-id}.localhost:4943/_/candid`

### 4.1 Register Test Users

#### Register a Doctor (via Frontend)
1. Open frontend URL in browser
2. Click "Doctor View"  
3. Fill registration form:
   - **Name**: Dr. Sarah Johnson
   - **Specialization**: endocrinologist
4. Click "Register as Doctor"
5. **Save the Doctor ID** shown in the UI

#### Register a Patient (via Frontend)  
1. Click "Patient View"
2. Fill registration form:
   - **Name**: John Diabetes  
   - **Email**: john@example.com
   - **Condition**: diabetes
3. Click "Register"
4. **Save the Patient ID** shown in the UI

### 4.2 Doctor Assigns Patient

#### Assign Patient to Doctor (via Doctor View)
1. In "Doctor View", click "Patient Management" tab
2. Find patient "John Diabetes" in "Available Patients"
3. Click "Assign to My Care"
4. Verify patient appears in "My Patients" section
5. Patient status should show "Active"

### 4.3 Patient Submits Query with AI Generation

#### Submit Patient Query (via Patient View)
1. Switch to "Patient View"
2. Patient should see "Assigned to Dr. Sarah Johnson"
3. Fill out query form:
   - **Title**: Blood Sugar Monitoring Question
   - **Description**: How often should I check my blood sugar levels during the day?
4. Click "Submit Query"
5. **AI Draft Generated**: Backend automatically calls AI proxy
6. Query status shows "Submitted successfully"

### 4.4 Doctor Reviews Query with AI Draft

#### Review Query with AI Assistant (via Doctor View)  
1. Switch to "Doctor View" 
2. Click "Query Management" tab
3. Find the new query in "My Patients' Queries"
4. Click "Start Review" 
5. Query moves to "Queries Under Review & Completed" section
6. **Verify AI Draft Display**:
   - Should see "🤖 AI-Generated Draft Response" section
   - AI response should be relevant to diabetes/blood sugar
   - "Use AI Draft" button should be visible

#### Doctor Approves/Edits Response
1. Click "Use AI Draft" button to populate textarea
2. Edit the response as needed (or write completely new)
3. Add doctor's professional touch:
   ```
   Based on your diabetes management needs, I recommend checking blood sugar:
   - Before meals (3 times daily)
   - 2 hours after meals if needed
   - Before bedtime
   
   However, your specific testing schedule should be personalized based on your medication regimen and daily routine. Let's discuss this in your next appointment.
   
   Dr. Sarah Johnson
   ```
4. Click "Submit Final Response"
5. Query status changes to "Completed"

### 4.5 Patient Views Final Response

#### Check Response (via Patient View)
1. Switch back to "Patient View"  
2. In "My Queries" section
3. Find the submitted query
4. Status should show "Completed"
5. **Final response** should show doctor's approved/edited response
6. Verify it contains both AI insights and human medical oversight

---

## 🧪 Testing Commands via CLI (Alternative)

### Backend Testing via dfx 
```bash
# Register doctor
dfx canister call backend registerDoctor '("Dr. Sarah Johnson", "endocrinologist")'

# Register patient  
dfx canister call backend registerPatient '("John Diabetes", "diabetes", "john@example.com")'

# Assign patient to doctor (use actual IDs from above)
dfx canister call backend assignPatientToDoctor '("patient_1", "doctor_1")'

# Submit query (triggers AI draft generation)
dfx canister call backend submitQuery '("patient_1", "Blood Sugar Question", "How often should I check my blood sugar?")'

# Get query with AI draft
dfx canister call backend getQuery '("query_1")'

# Doctor responds to query  
dfx canister call backend respondToQuery '("query_1", "doctor_1", "Based on your condition, check 3 times daily before meals...")'
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. dfx start fails
```bash
# Clean and restart
dfx stop
dfx start --clean --background

# Check for port conflicts
lsof -i :4943
```

#### 2. Canister deployment fails
```bash
# Check dfx status
dfx ping

# Rebuild with clean
dfx build --check
dfx deploy --mode reinstall
```

#### 3. AI Proxy connection fails  
```bash
# Check if AI proxy is running
curl http://localhost:3001/api/health

# Restart AI proxy
cd ai-proxy
npm start

# Check firewall/port 3001 access
```

#### 4. Frontend not loading
```bash
# Rebuild frontend
cd src/frontend
npm run build
cd ../..
dfx deploy frontend
```

#### 5. AI Draft not appearing
```bash
# Check backend logs
dfx logs backend

# Test AI proxy directly
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"queryText": "test", "condition": "diabetes", "provider": "mock"}'

# Check if HTTP outcalls are enabled on local replica
# (Should work by default on local dfx)
```

---

## 📊 Monitoring & Logs

### Check System Status
```bash
# dfx processes
dfx info

# Backend logs  
dfx logs backend

# AI proxy logs (in ai-proxy terminal)
# Logs show in the terminal where npm start was run

# Browser dev tools for frontend debugging
# F12 → Console tab → Network tab
```

### Performance Monitoring
```bash
# Check canister memory usage
dfx canister status backend
dfx canister status frontend

# Monitor cycles usage (for HTTP outcalls)
dfx wallet balance
```

---

## 🎯 Success Criteria

### Complete Workflow Verification Checklist

- [ ] **dfx replica running**: `dfx ping` returns healthy
- [ ] **Backend deployed**: Health check returns patient/doctor counts  
- [ ] **Frontend deployed**: UI loads in browser
- [ ] **AI proxy running**: Health endpoint returns 200 OK
- [ ] **Doctor registered**: Doctor appears in system
- [ ] **Patient registered**: Patient appears in system  
- [ ] **Patient assigned**: Patient shows in doctor's patient list
- [ ] **Query submitted**: Patient can submit query successfully
- [ ] **AI draft generated**: Query contains aiDraftResponse field
- [ ] **Doctor sees AI draft**: UI shows "🤖 AI-Generated Draft Response"
- [ ] **Doctor can edit**: "Use AI Draft" button works
- [ ] **Final response submitted**: Query status becomes "Completed"
- [ ] **Patient sees response**: Final response visible in patient view

### Expected End-to-End Flow Time
- **Setup**: ~5-10 minutes (first time)
- **Testing**: ~3-5 minutes per complete workflow
- **AI Response**: ~1-2 seconds (mock responses)

---

## 🚀 Next Steps

After successful local testing:

1. **Switch to Real AI APIs**: Update `.env` with real OpenAI/Claude keys
2. **Deploy to IC Mainnet**: Use `dfx deploy --network ic`
3. **Production Monitoring**: Implement logging and error tracking
4. **Scale Testing**: Test with multiple concurrent users

## 📞 Support

For issues:
1. Check dfx logs: `dfx logs backend`  
2. Check AI proxy logs in terminal
3. Use browser dev tools for frontend issues
4. Verify all services are running with the URLs provided above

The system is designed to be resilient - if AI proxy fails, query submission still works (just without AI draft).