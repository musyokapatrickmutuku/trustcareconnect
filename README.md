# 🏥 TrustCareConnect

> AI-driven healthcare communication platform with human oversight, built on Internet Computer Protocol (ICP)

[![CI Status](https://github.com/your-username/trustcareconnect/workflows/CI/badge.svg)](https://github.com/your-username/trustcareconnect/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

## ✨ Overview

TrustCareConnect is a secure, decentralized healthcare communication platform that connects patients with doctors through AI-assisted consultations. The platform ensures all AI-generated responses are reviewed and approved by licensed healthcare professionals before reaching patients.

### 🎯 Key Features

- **🤖 AI-Assisted Consultations**: Smart draft responses using OpenAI GPT and Claude
- **👨‍⚕️ Human Oversight**: Mandatory physician review for all AI responses
- **🔐 Blockchain Security**: Secure data storage on Internet Computer Protocol
- **📱 Dual Interface**: Separate portals for patients and healthcare providers
- **⚡ Real-time Updates**: Live query status and response notifications
- **🔒 Privacy First**: HIPAA-compliant design with end-to-end security

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│   AI Proxy      │◄──►│  ICP Backend    │
│                 │    │                 │    │                 │
│ - Patient Portal│    │ - OpenAI API    │    │ - Motoko Smart  │
│ - Doctor Portal │    │ - Claude API    │    │   Contracts     │
│ - Query Mgmt    │    │ - Mock Responses│    │ - Data Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 🎮 Option 1: Instant Demo (Recommended for First-Time Users)

**No installation required** - Run the demo directly in your browser:

1. **Download the project**:
   ```bash
   git clone https://github.com/your-username/trustcareconnect.git
   cd trustcareconnect
   ```

2. **Open the demo**:
   - **Windows**: Double-click `demo.html` or right-click → "Open with" → Browser
   - **Mac/Linux**: Open `demo.html` in any web browser
   - **Alternative**: Open browser and go to `file:///path/to/trustcareconnect/demo.html`

3. **Start testing**:
   - Select "Patient Portal"
   - Choose a demo patient (Sarah, Michael, or Carlos)
   - Submit queries like: "My blood sugar is 250 mg/dL, what should I do?"
   - Switch to "Doctor Portal" to review AI responses

### ⚙️ Option 2: Full Development Setup (Advanced Users)

#### Prerequisites

- Node.js ≥ 16.0.0
- npm ≥ 8.0.0
- [DFX (Internet Computer SDK)](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

#### Installation

```bash
# Clone the repository
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect

# Install dependencies and set up workspaces
npm run setup

# Copy environment configuration
cp .env.example .env

# Start all services (New Architecture)
npm run dev

# OR use legacy setup for backward compatibility
npm run legacy:dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **AI Proxy**: http://localhost:3001
- **ICP Backend**: http://localhost:4943

### 🪟 Option 3: WSL Windows Deployment (One-Click Setup)

**Perfect for Windows developers using WSL**:

```bash
# Clone and navigate to project
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect

# One-command deployment (installs dependencies, starts all services)
npm run deploy:wsl
```

This automated script will:
- ✅ Check and install all prerequisites (Node.js, DFX, etc.)
- ✅ Set up the project environment
- ✅ Deploy backend canister to local IC network
- ✅ Start AI proxy service on port 3001
- ✅ Launch frontend application on port 3000
- ✅ Run health checks and provide testing commands

**📚 For detailed WSL setup guide**: See [docs/deployment/WSL_DEPLOYMENT_GUIDE.md](docs/deployment/WSL_DEPLOYMENT_GUIDE.md)

## 📁 Project Structure

### 🆕 New Organized Structure

```
trustcareconnect/
├── packages/                 # Monorepo packages
│   ├── backend/             # ICP Motoko smart contracts
│   │   ├── src/
│   │   │   ├── controllers/      # Business logic controllers
│   │   │   ├── services/         # Core services
│   │   │   ├── types/            # Type definitions
│   │   │   └── main.mo           # Main canister
│   │   └── tests/
│   ├── frontend/            # React application
│   │   ├── src/
│   │   │   ├── components/       # UI components
│   │   │   ├── pages/            # Page components
│   │   │   ├── services/         # API services
│   │   │   └── types/            # TypeScript types
│   │   └── public/
│   ├── ai-proxy/            # AI integration service
│   │   ├── src/
│   │   │   ├── controllers/      # API controllers
│   │   │   ├── services/         # AI integrations
│   │   │   └── routes/           # API routes
│   │   └── tests/
│   └── shared/              # Shared utilities
├── config/                  # Environment configurations
├── docs/                    # Comprehensive documentation
├── scripts/                 # Build and deployment scripts
└── .github/                 # CI/CD workflows
```

### 📁 Legacy Structure (Maintained for Compatibility)

```
src/
├── backend/main.mo          # Original Motoko backend
├── frontend/               # Original React frontend
└── ...
```

## 🎯 Core Functionality

### 1. Human-in-the-Loop AI Architecture
- **AI Response Generation**: Pre-trained LLM provides initial medical guidance
- **Safety Scoring**: Automated risk assessment for every AI recommendation
- **Doctor Review Gate**: All AI responses require physician approval
- **Confidence Metrics**: Quality assessment based on patient context

### 2. Intelligent Triage System
- **Urgency Classification**: Automatic priority assignment (High/Medium/Low)
- **Patient Profiling**: Personalized responses based on medical history
- **Query Routing**: Critical cases fast-tracked to human review

### 3. Blockchain-Secured Infrastructure
- **ICP Canister Backend**: Decentralized data storage and processing
- **Immutable Audit Trail**: All medical interactions recorded on-chain
- **HTTP Outcalls**: Secure external LLM API integration

## 🧪 Testing

```bash
# Run all tests (new structure)
npm test

# Run specific package tests
npm run test:frontend
npm run test:ai-proxy
npm run test:backend

# Legacy testing
npm run legacy:test
```

## 🚢 Deployment

### Local Development
```bash
# New architecture
npm run deploy:local

# Legacy deployment
npm run legacy:deploy:local
```

### Production Deployment
```bash
npm run deploy:production
```

## 🎮 Demo Patient Profiles

**P001 - Sarah Johnson (47, Type 2)**
- HbA1c: 6.9%, well-controlled
- Medications: Metformin, Lisinopril, Empagliflozin
- Use case: Standard Type 2 diabetes management

**P002 - Michael Thompson (19, Type 1)**  
- HbA1c: 7.8%, college student
- Medications: Insulin pump
- Use case: Young adult with lifestyle challenges

**P003 - Carlos Rodriguez (64, Type 2)**
- HbA1c: 6.8%, with complications
- Medications: Metformin, Semaglutide, Lisinopril  
- Use case: Older patient with comorbidities

### Sample Queries to Try:
- "My blood sugar reading is 250 mg/dL this morning, what should I do?"
- "I'm feeling dizzy and think my blood sugar might be low"
- "Can I exercise if my blood sugar is 180 mg/dL?"
- "What foods should I avoid before bedtime?"

## 📚 Documentation

- 📖 [Getting Started Guide](./docs/development/getting-started.md)
- 🏗️ [Architecture Overview](./docs/architecture/overview.md)
- 🔌 [API Reference](./docs/api/backend-api.md)
- 🚀 [Deployment Guide](./docs/deployment/production.md)
- 🤝 [Contributing Guidelines](./docs/development/contributing.md)

## 🔧 Configuration

### Environment Variables

Key environment variables:

```bash
# ICP Configuration
REACT_APP_BACKEND_CANISTER_ID=your-canister-id

# AI Configuration
OPENAI_API_KEY=your-openai-key
CLAUDE_API_KEY=your-claude-key

# Development
NODE_ENV=development
```

See [.env.example](./.env.example) for complete configuration options.

## 🛠️ Troubleshooting

### Common Issues

**Demo doesn't open**:
- Ensure you're opening `demo.html` directly in a web browser
- Try a different browser (Chrome, Firefox, Safari, Edge)

**DFX installation fails on Windows**:
- Install WSL (Windows Subsystem for Linux) first
- Run DFX installation commands in WSL environment

**"Insufficient cycles" error**:
- Deploy with more cycles: `dfx deploy --with-cycles 2000000000000`

For more troubleshooting, see our [documentation](./docs/development/troubleshooting.md).

## 🚀 Future Enhancements

1. **Real LLM Integration**: Fine-tuned models for diabetes care
2. **Internet Identity**: Implement proper ICP authentication
3. **Advanced Analytics**: Usage metrics and outcome tracking
4. **Mobile Application**: Native iOS/Android apps
5. **Multi-language Support**: Internationalization

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./docs/development/contributing.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Internet Computer](https://internetcomputer.org/) for blockchain infrastructure
- [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/) for AI capabilities
- The open-source community for excellent tools and libraries

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/your-username/trustcareconnect/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/trustcareconnect/discussions)
- 📧 Email: support@trustcareconnect.com

---

<div align="center">
  <strong>Built with ❤️ for better healthcare communication</strong><br>
  <em>Combining AI efficiency with human medical expertise</em>
</div>