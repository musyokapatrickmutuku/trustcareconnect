# 🔧 TrustCare Bridge Setup Solutions

> **Note:** The recommended way to set up the project is to use the `quickstart.sh` script in the root directory. This script will automatically install all dependencies and configure the project for you.

## 🚨 Current Issue: npm Permission Errors in WSL

The npm install is failing due to Windows/WSL file permission conflicts when trying to install Node.js modules.

## 🛠️ Solution Options

### **Option 1: Fix WSL Permissions (Recommended)**
```bash
# 1. Navigate to project root
cd /path/to/your/project/trustcareconnect

# 2. Set correct permissions for the bridge directory
chmod -R 755 trustcare-bridge/

# 3. Clean and reinstall
cd trustcare-bridge
rm -rf node_modules package-lock.json
npm install --no-optional --verbose
```

### **Option 2: Use Windows PowerShell/CMD**
```powershell
# Open Windows PowerShell as Administrator
cd C:\path\to\your\project\trustcareconnect\trustcare-bridge
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

### **Option 3: Copy to Linux Directory**
```bash
# Copy project to Linux filesystem
cp -r /path/to/your/project/trustcareconnect ~/trustcare-bridge-linux
cd ~/trustcare-bridge-linux/trustcare-bridge
npm install
node src/bridge-server.js
```

### **Option 4: Manual Essential Dependencies**
```bash
# Install only critical modules
cd trustcare-bridge
npm install ws express cors dotenv axios uuid --omit=dev --omit=optional
```

### **Option 5: Docker Approach (Alternative)**
```bash
# Create Dockerfile in trustcare-bridge/
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080 3001
CMD ["node", "src/bridge-server.js"]
EOF

# Build and run
docker build -t trustcare-bridge .
docker run -p 8080:8080 -p 3001:3001 trustcare-bridge
```

## 🎯 Quick Start Once Dependencies Install

### **1. Test Bridge Service**
```bash
cd trustcare-bridge
node src/bridge-server.js
```

**Expected Output:**
```
🚀 TrustCare Bridge HTTP server running on port 3001
🔌 WebSocket server (ws) running on port 8080
💚 Health check passed - Connections: 0
```

### **2. Test WebSocket Connection**
```bash
# In another terminal
wscat -c ws://localhost:8080
```

**Expected Response:**
```json
{
  "type": "connection_established",
  "payload": {
    "connectionId": "uuid-here",
    "serverTime": "2025-09-18T07:20:00.000Z",
    "features": ["medical_query", "get_history", "doctor_review", "real_time_updates"]
  }
}
```

### **3. Send Test Medical Query**
```json
{
  "type": "medical_query",
  "payload": {
    "patientId": "P001",
    "query": "I feel dizzy and my blood sugar is low",
    "vitalSigns": {
      "bloodGlucose": 65
    }
  },
  "requestId": "test-123"
}
```

### **4. Test Health Endpoint**
```bash
curl http://localhost:3001/health
```

## 🔍 Troubleshooting

### **Permission Denied Errors:**
- Use `sudo` with npm commands in WSL
- Run PowerShell as Administrator on Windows
- Copy project to Linux filesystem (`~/`)

### **Module Not Found Errors:**
- Ensure `ws`, `express`, `cors`, `dotenv` are installed
- Check `node_modules` exists and has correct permissions
- Verify Node.js version: `node --version` (needs ≥18.0.0)

### **Port Already in Use:**
```bash
# Check what's using the ports
lsof -i :8080
lsof -i :3001

# Kill processes if needed
pkill -f "node.*bridge-server"
```

### **API Connection Issues:**
- Verify Novita API key in `.env`: `your_novita_api_key_here`
- Check internet connectivity for API calls
- Test with fallback responses if API is unavailable

## 🎉 Success Indicators

When the bridge is working correctly:

✅ **WebSocket connects** on `ws://localhost:8080`
✅ **Health check responds** at `http://localhost:3001/health`
✅ **Medical queries process** and return AI responses
✅ **Metrics available** at `http://localhost:3001/metrics/json`
✅ **No permission errors** in console output

## 🚀 Next Steps After Setup

1. **Test all WebSocket commands** from `bridge-test-commands.md`
2. **Verify AI integration** with real medical queries
3. **Test ICP canister integration** with `dfx canister call`
4. **Run load tests** with `npm run test:load`
5. **Deploy to production** with `deploy.sh`

The bridge service is architecturally complete - it just needs the Node.js dependencies to run!