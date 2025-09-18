# TrustCareConnect - Clean Architecture Overview

## 🎯 **Simplified Architecture Post-Cleanup**

After comprehensive analysis and cleanup, TrustCareConnect now has a streamlined architecture focused on the **WebSocket Bridge** as the primary service layer.

## 📁 **Project Structure**

```
trustcareconnect/
├── trustcare-bridge/          # 🚀 PRIMARY SERVICE - WebSocket Bridge
│   ├── src/
│   │   ├── bridge-server.js   # Main WebSocket + HTTP server
│   │   ├── novita-client.js   # AI API client (Baichuan M2-32B)
│   │   ├── icp-client.js      # ICP canister integration
│   │   └── monitoring.js      # Metrics and health monitoring
│   ├── tests/                 # Comprehensive test suite
│   ├── dashboard/             # Real-time monitoring dashboard
│   ├── deploy.sh              # Production deployment automation
│   └── package.json           # Node.js dependencies
│
├── packages/backend/          # 🔗 ICP CANISTER - Data persistence
│   └── src/
│       ├── main.mo            # Motoko canister (simplified)
│       └── types.mo           # Type definitions
│
├── frontend-simple/           # 🌐 MINIMAL FRONTEND - Basic UI
│   ├── index.html             # Simple HTML interface
│   ├── js/app.js              # Basic JavaScript
│   └── css/styles.css         # Minimal styling
│
├── packages/frontend/         # 📱 REACT FRONTEND - Advanced UI (optional)
│   └── src/                   # React components for complex UI
│
├── quickstart.sh              # 🚀 One-command setup
├── deploy.sh                  # 🚀 Production deployment
├── dfx.json                   # ICP configuration
└── CLAUDE.md                  # Project requirements
```

## 🏗️ **Architecture Layers**

### **1. WebSocket Bridge (Primary Service)**
- **Real-time communication** via WebSocket on port 8080
- **HTTP REST API** on port 3001 for fallback
- **Direct AI integration** with Novita AI API
- **ICP canister integration** for data persistence
- **Comprehensive monitoring** with metrics dashboard
- **Production-ready** with SSL, rate limiting, health checks

### **2. ICP Canister (Data Layer)**
- **Simplified Motoko backend** for blockchain data storage
- **Audit trail** for all medical interactions
- **Patient/doctor data** persistence
- **Query history** storage

### **3. Frontend Options**
- **Simple HTML**: Basic interface connecting to bridge
- **React Components**: Advanced UI for complex workflows
- **Real-time Dashboard**: Monitoring and metrics visualization

## 🔄 **Data Flow**

```
Patient Query → WebSocket Bridge → Novita AI API → Response Processing → ICP Storage → Patient Notification
                      ↓
              Real-time Dashboard Updates
```

## 🧹 **Cleanup Results**

### **Removed Redundant Files:**
- ❌ `packages/backend/src/main_complex.mo`
- ❌ `packages/backend/src/types_backup.mo`
- ❌ `packages/backend/src/queryProcessor.mo`
- ❌ `packages/frontend/src/declarations/` (auto-generated)
- ❌ `packages/frontend/improved-demo.html`
- ❌ `packages/frontend/modern-demo.html`
- ❌ `packages/frontend/deploy-production.sh`
- ❌ `packages/frontend/src/auth/` (handled by bridge)
- ❌ `packages/frontend/src/scripts/` (obsolete)
- ❌ `packages/frontend/vercel.json`
- ❌ `packages/frontend/netlify.toml`
- ❌ Various redundant CSS and component files

### **Consolidated Functionality:**
- ✅ **Medical query processing**: Bridge service only
- ✅ **Real-time communication**: WebSocket bridge
- ✅ **AI API calls**: Direct from bridge to Novita
- ✅ **Authentication**: Handled by bridge
- ✅ **Monitoring**: Centralized dashboard
- ✅ **Testing**: Unified test suite
- ✅ **Deployment**: Single deployment script

## 🚀 **Quick Start Commands**

```bash
# Complete setup
./quickstart.sh

# Start bridge service
cd trustcare-bridge && npm run dev

# Deploy production
./deploy.sh
```

## 📊 **Key Benefits**

1. **Simplified Architecture**: Single service handling real-time communication
2. **Direct AI Integration**: No intermediary layers for AI calls
3. **Real-time Updates**: WebSocket-based instant notifications
4. **Production Ready**: SSL, monitoring, health checks, rate limiting
5. **Clean Codebase**: Removed 30+ redundant files
6. **Unified Testing**: Comprehensive test suite for all components
7. **Easy Deployment**: One-command setup and deployment

## 🔧 **Development Workflow**

1. **Local Development**: Use `quickstart.sh` for instant setup
2. **Testing**: Run `npm test` in `trustcare-bridge/`
3. **Monitoring**: Access dashboard at `http://localhost:3001/dashboard`
4. **Production**: Use `deploy.sh` for automated deployment

This clean architecture focuses on the WebSocket bridge as the primary service, eliminating duplication and providing a clear separation of concerns while maintaining all the required functionality for the TrustCareConnect MVP.