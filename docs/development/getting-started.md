# Getting Started with TrustCareConnect

This guide will help you set up the TrustCareConnect project for local development.

## Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **DFX** (Internet Computer SDK)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/trustcareconnect.git
cd trustcareconnect
```

### 2. Install Dependencies

```bash
# Install root dependencies and set up workspaces
npm run setup
```

### 3. Set Up Environment Variables

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your settings
# For development, you can use the default values
```

### 4. Start Development Environment

#### Option A: Start All Services (Recommended)
```bash
npm run dev
```

This will start:
- ICP backend canister
- AI proxy server
- React frontend

#### Option B: Start Services Individually
```bash
# Terminal 1: Start ICP backend
npm run dev:backend

# Terminal 2: Start AI proxy
npm run dev:ai-proxy

# Terminal 3: Start frontend
npm run dev:frontend
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

## Common Issues

### DFX Issues
- **Issue**: DFX not found
- **Solution**: Install DFX following [official instructions](https://internetcomputer.org/docs/current/developer-docs/setup/install/)

### Port Conflicts
- **Issue**: Ports 3000, 3001, or 4943 already in use
- **Solution**: Stop other services or modify port configurations in environment files

### Node Version Issues
- **Issue**: Compatibility problems
- **Solution**: Use Node.js 16.x or 18.x

## Next Steps

1. Read the [Architecture Overview](../architecture/overview.md)
2. Check out the [API Documentation](../api/backend-api.md)
3. Review [Contributing Guidelines](./contributing.md)
4. Explore the [Deployment Guide](../deployment/local.md)

## Getting Help

- Check the [troubleshooting guide](./troubleshooting.md)
- Review existing [GitHub Issues](https://github.com/your-username/trustcareconnect/issues)
- Create a new issue for bugs or feature requests