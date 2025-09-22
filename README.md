# 🏥 TrustCareConnect

> AI-enhanced healthcare communication platform with real HTTP outcalls to AI models, built on Internet Computer Protocol (ICP)

[![CI Status](https://github.com/musyokapatrickmutuku/trustcareconnect/workflows/CI/badge.svg)](https://github.com/musyokapatrickmutuku/trustcareconnect/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

## ✨ Overview

TrustCareConnect is a **production-ready** healthcare communication platform that connects patients with doctors through AI-assisted consultations. The platform features **real HTTP outcalls to AI models** from ICP canisters and ensures all AI-generated medical responses are reviewed and approved by licensed healthcare professionals.

### 🎯 Key Features

- **🤖 Real AI Integration**: HTTP outcalls to BaiChuan M2 32B via Novita AI API
- **👨‍⚕️ Human Oversight**: Mandatory physician review for all AI responses  
- **🔐 Blockchain Security**: Secure data storage on Internet Computer Protocol
- **📱 Dual Interface**: Separate portals for patients and healthcare providers
- **⚡ Real-time Processing**: Live AI draft generation and query management
- **🔒 Privacy First**: HIPAA-compliant design with comprehensive audit trails

## 🏗️ Architecture

```
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ React/JS Frontend├─►│ trustcare-bridge  │◄─►│   ICP Backend   │◄─►│  Novita AI API  │
│                 │    │ (Node.js)         │    │                 │    │                 │
│ - Patient Portal│    │ - WebSocket/HTTP  │    │ - HTTP Outcalls │    │ - BaiChuan M2   │
│ - Doctor Portal │    │ - API Gateway     │    │ - Motoko Smart  │    │   32B Model     │
│ - Query Mgmt    │    │ - Novita Client   │    │   Contracts     │    │ - Real AI       │
│ - Local Dev     │    │ - ICP Client      │    │ - Data Storage  │    │   Responses     │
└─────────────────┘    └───────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start - ONE COMMAND SETUP! ✅

### 🎯 **INSTANT SETUP** (Recommended for Everyone)

**Get TrustCareConnect running in under 5 minutes with a single command!**

```bash
# Clone and run automated setup
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect
./quickstart.sh
```

**For Windows Users:**
> Note: The `quickstart.sh` script is a bash script. We recommend using a bash-like environment like Git Bash or Windows Subsystem for Linux (WSL) to run the script.

**That's it! The script automatically:**
- ✅ Checks all prerequisites (Node.js, npm, DFX)
- ✅ Installs dependencies for all packages
- ✅ Starts DFX replica
- ✅ Deploys backend canister
- ✅ Starts the `trustcare-bridge` service
- ✅ Configures environment variables

### Prerequisites (Auto-Checked by `quickstart.sh`)

**Required Dependencies:**
- **Node.js**: ≥ 16.0.0 (Tested with v20.x) ✅
- **npm**: ≥ 8.0.0 (Latest version recommended) ✅  
- **DFX**: ≥ 0.15.0 (Internet Computer SDK) ✅
- **Git**: For cloning the repository ✅
- **Docker**: For running the `trustcare-bridge` service ✅

---

## 🔧 Manual Setup

**If the automated setup encounters issues, or if you prefer manual control:**

### Step 1: Install DFX (Internet Computer SDK)

```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Add to PATH
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
dfx --version
```

### Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect

# Install project dependencies  
npm install
```

### Step 3: Start Local IC Replica

```bash
# Start DFX local replica (required for backend)
dfx start --background --clean

# Verify replica is running
dfx ping  # Should return healthy status
```

### Step 4: Deploy Backend Canister

```bash
# Deploy the backend canister
dfx deploy backend

# The canister ID will be written to a .env file in the root directory
# You can also get the canister ID with:
dfx canister id backend
```

### Step 5: Start the `trustcare-bridge`

```bash
# Navigate to the bridge directory
cd trustcare-bridge

# Install dependencies
npm install

# Start the bridge
npm run dev
```

### Step 6: Start Frontend Application

This project contains two frontends:
*   `frontend-simple`: A basic HTML/JS frontend for testing and interacting with the bridge.
*   `packages/frontend`: A more advanced React-based frontend (work in progress).

To start the simple frontend:
```bash
# Navigate to the simple frontend directory
cd frontend-simple

# Start the server
npm start
```

The application will be available at `http://localhost:3000`.

## 🔧 Environment Configuration

The project uses a `.env` file for environment variables. The `dfx.json` is configured to automatically output the canister IDs to a `.env` file in the root directory after deployment.

**`trustcare-bridge/.env.example`:**
```bash
# TrustCareConnect Bridge Configuration
NODE_ENV=development
PORT=3001
WS_PORT=8080
LOG_LEVEL=debug

# Novita AI Configuration (REQUIRED)
NOVITA_API_KEY=your_novita_api_key_here
NOVITA_BASE_URL=https://api.novita.ai/openai/v1

# ICP Configuration (will be updated automatically)
ICP_HOST=http://localhost:4943
ICP_AGENT_HOST=http://127.0.0.1:4943
DFX_NETWORK=local

# Security
JWT_SECRET=dev-jwt-secret-change-in-production
BRIDGE_SECRET_KEY=dev-bridge-secret-change-in-production

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_CONNECTION_TIMEOUT=60000
MAX_CONCURRENT_CONNECTIONS=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important Notes:**
- You need to create a `.env` file in the `trustcare-bridge` directory and add your `NOVITA_API_KEY`.
- The canister ID will be automatically populated in the root `.env` file after running `dfx deploy`.

## 📁 Project Structure

```
trustcareconnect/
├── dfx.json                     # DFX project configuration
├── quickstart.sh                # One-command setup script
├── trustcare-bridge/            # WebSocket/HTTP bridge service
│   ├── src/
│   │   ├── bridge-server.js    # Main WebSocket and HTTP server
│   │   ├── icp-client.js       # Client for the IC canister
│   │   └── novita-client.js    # Client for the Novita AI API
│   └── package.json
├── packages/
│   ├── backend/                 # ICP Motoko backend
│   │   ├── src/
│   │   │   ├── main.mo         # Main canister with HTTP outcalls
│   │   │   └── types.mo        # Type definitions
│   │   └── dfx.json
│   └── frontend/               # React frontend application (WIP)
│       ├── src/
│       │   ├── App.tsx         # Main application component
│       │   ├── components/     # React components
│       │   └── pages/          # Application pages
│       └── package.json
├── frontend-simple/             # Simple HTML/JS frontend
│   ├── index.html
│   └── app.js
└── README.md                   # This file
```

## 🧪 Testing

The `trustcare-bridge` contains a suite of tests.

```bash
# Navigate to the bridge directory
cd trustcare-bridge

# Run tests
npm test
```

## 🚢 Production Deployment

The `deploy.sh` script in the root directory can be used for production deployment. Please review the script and the `trustcare-bridge/DEPLOYMENT.md` file for more details.

## 📚 API Reference

### Backend Canister Methods

Please refer to the Candid UI for the latest API reference. You can access it at: `http://127.0.0.1:4943/_/candid?id=<your-backend-canister-id>`

## 🤝 Contributing

We welcome contributions! To contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes and test thoroughly**
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all health checks pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Internet Computer](https://internetcomputer.org/) for revolutionary blockchain infrastructure
- [Novita AI](https://novita.ai/) for BaiChuan M2 32B model access
- The healthcare technology community for inspiration and best practices

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/musyokapatrickmutuku/trustcareconnect/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/musyokapatrickmutuku/trustcareconnect/discussions) 
- 📧 **Email**: support@trustcareconnect.com

---

<div align="center">
  <strong>Built with ❤️ for better healthcare communication</strong><br>
  <em>Real AI integration with human medical expertise oversight</em>
  
  **🎉 Production Ready - Fully Tested - HTTP Outcalls Working ✅**
</div>