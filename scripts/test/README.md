# TrustCareConnect Test Scripts

This directory contains test scripts for validating the TrustCareConnect application deployment and functionality.

## WSL Ubuntu Startup Test

### Quick Start

Run the comprehensive startup test from the project root:

```bash
# Using the wrapper script (recommended)
bash test-startup.sh

# Or directly run the full test
bash scripts/test/wsl-startup-test.sh

# Or using npm
npm run test:startup
```

### What the Startup Test Does

The `wsl-startup-test.sh` script performs a complete from-scratch deployment and validation:

1. **Prerequisites Check & Installation**
   - Installs Node.js 20+ if needed
   - Installs DFX (Internet Computer SDK)
   - Installs required system packages

2. **Clean Environment Setup**
   - Stops any existing services
   - Cleans previous installations
   - Kills processes on ports 3000, 3001, 4943

3. **Project Setup**
   - Installs all dependencies
   - Creates environment configuration
   - Sets up package workspaces

4. **Service Deployment**
   - Deploys backend canister to local IC network
   - Starts AI Proxy service on port 3001
   - Starts React frontend on port 3000

5. **Comprehensive Testing**
   - Tests service availability
   - Tests backend canister functionality
   - Tests AI Proxy API endpoints
   - Validates project file structure

6. **Results & Status Report**
   - Provides detailed test results
   - Shows all application endpoints
   - Gives management commands
   - Suggests next testing steps

### Test Results

The script provides:
- **Test Score**: Percentage of tests passed
- **Duration**: Total time taken
- **Status**: Success/Partial/Issues
- **Endpoints**: All service URLs
- **Management Commands**: How to stop/restart services

### Output Files

- `startup-test-results.log`: Summary of test results
- `packages/ai-proxy/ai-proxy.log`: AI Proxy service logs
- `packages/frontend/frontend.log`: Frontend application logs

### Troubleshooting

If tests fail:

1. **Check Prerequisites**: Ensure Node.js 18+, npm, and git are installed
2. **Check Ports**: Make sure ports 3000, 3001, 4943 are available
3. **Check Logs**: Review service log files for specific errors
4. **WSL Issues**: Ensure WSL Ubuntu is properly configured
5. **Network Issues**: Check firewall and network connectivity

### Manual Testing After Startup

Once the script completes successfully:

1. Open http://localhost:3000 in your browser
2. Test patient registration
3. Submit a test query
4. Verify AI responses
5. Check data persistence

### Service Management

Stop all services:
```bash
# Kill background processes
kill $(cat packages/ai-proxy/ai-proxy.pid) $(cat packages/frontend/frontend.pid) 2>/dev/null
# Stop DFX network
dfx stop
```

Restart individual services:
```bash
# Restart AI Proxy
cd packages/ai-proxy && npm run dev

# Restart Frontend  
cd packages/frontend && npm start

# Restart Backend
cd packages/backend && dfx start --background && dfx deploy
```

### Requirements

- **OS**: WSL Ubuntu (recommended) or Linux
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Memory**: 4GB+ recommended
- **Disk Space**: 2GB+ free space
- **Network**: Internet connection for downloads

### Integration with CI/CD

This script can be used in automated testing pipelines:

```bash
# Non-interactive mode
DEBIAN_FRONTEND=noninteractive bash scripts/test/wsl-startup-test.sh
```

For questions or issues, see the main project documentation or check the troubleshooting guide.