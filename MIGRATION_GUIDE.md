# TrustCareConnect Migration Guide

## 🔄 Migrating from Legacy to New Structure

This guide helps you migrate from the old file structure to the new organized architecture.

## Quick Migration

### 1. **For Developers Using Legacy Commands**

The old commands still work through legacy aliases:

```bash
# OLD WAY (still works)
npm run legacy:dev         # Start old development setup
npm run legacy:build       # Use old build process
npm run legacy:deploy      # Use old deployment

# NEW WAY (recommended)
npm run dev                 # Start new monorepo development
npm run build              # Build all packages
npm run deploy:local       # Deploy with new structure
```

### 2. **File Location Changes**

| Old Location | New Location | Status |
|-------------|-------------|---------|
| `src/backend/main.mo` | `packages/backend/src/main.mo` | ✅ Migrated |
| `src/frontend/src/App.jsx` | `packages/frontend/src/App.tsx` | ✅ Migrated + TypeScript |
| `ai-proxy/ai-proxy.js` | `packages/ai-proxy/src/app.js` | ✅ Migrated + Restructured |
| `rollup.config.js` | `packages/frontend/` (managed by CRA) | ✅ Replaced |
| `dfx.json` | `packages/backend/dfx.json` | ✅ Moved |

### 3. **Import Path Updates**

If you have custom code that imports from the old structure:

```typescript
// OLD
import icpService from '../icpService.js';

// NEW  
import icpService from '../services/icpService';
```

### 4. **Environment Variables**

Update your `.env` files to use the new structure:

```bash
# OLD
REACT_APP_BACKEND_CANISTER_ID=local-canister-id

# NEW (same variable, but organized in config/)
REACT_APP_BACKEND_CANISTER_ID=your-canister-id
```

## Detailed Migration Steps

### Step 1: Update Your Development Workflow

```bash
# Instead of old scripts, use:
npm run dev                 # Start all services
npm run dev:backend         # Just backend  
npm run dev:frontend        # Just frontend
npm run dev:ai-proxy        # Just AI proxy
```

### Step 2: Update Dependencies

The new structure uses workspace management:

```bash
# Install root dependencies
npm install

# Install package dependencies
npm run setup
```

### Step 3: Update Your IDE/Editor

Update your IDE configurations to point to the new structure:

**VSCode settings.json:**
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "eslint.workingDirectories": ["packages/*"]
}
```

### Step 4: Update CI/CD

If you have custom CI/CD, update paths:

```yaml
# OLD
- name: Build frontend
  run: cd src/frontend && npm run build

# NEW  
- name: Build frontend
  run: cd packages/frontend && npm run build
```

## What Changed?

### 🎯 **Backend (Motoko)**
- **Separated into modules**: Controllers, Services, Types
- **Better error handling**: Structured error responses
- **Type safety**: Centralized type definitions
- **Location**: `packages/backend/src/`

### 🎨 **Frontend (React)**  
- **TypeScript conversion**: Full type safety
- **Component architecture**: Organized by feature
- **Service layer**: Clean API abstractions
- **Location**: `packages/frontend/src/`

### 🤖 **AI Proxy (Node.js)**
- **Service classes**: Modular AI integrations  
- **Controller pattern**: Clean request handling
- **Better error handling**: Structured responses
- **Location**: `packages/ai-proxy/src/`

### 📦 **Shared Code**
- **Common types**: Shared across packages
- **Utilities**: Reusable functions  
- **Constants**: Centralized configuration
- **Location**: `packages/shared/`

## Troubleshooting Migration

### Issue: "Module not found"
**Solution**: Update import paths to new structure
```typescript
// Change this:
import './old-path'
// To this:
import './new-path'
```

### Issue: "Command not found"
**Solution**: Use new npm scripts
```bash
# Instead of custom scripts, use:
npm run dev
npm run build  
npm run test
```

### Issue: "DFX canister not found"
**Solution**: Navigate to backend directory
```bash
cd packages/backend
dfx deploy
```

### Issue: "Environment variables not loaded"
**Solution**: Copy environment template
```bash
cp .env.example .env
# Edit .env with your settings
```

## Rollback Plan

If you need to rollback to the old structure:

### Option 1: Use Legacy Commands
```bash
npm run legacy:dev         # Use old development setup
npm run legacy:build       # Use old build process
```

### Option 2: Restore from Archive
```bash
# Legacy files are preserved in archive/legacy-backup/
# Copy back if needed (not recommended)
```

### Option 3: Git Revert
```bash
# Revert to previous commit
git log --oneline
git revert <commit-hash>
```

## Getting Help

### Check These Resources First:
1. **Documentation**: `docs/development/getting-started.md`
2. **Architecture**: `docs/architecture/overview.md`
3. **Cleanup Record**: `archive/CLEANUP_RECORD.md`

### Still Need Help?
1. **Check existing issues**: GitHub Issues
2. **Create new issue**: Include error details
3. **Use legacy commands temporarily**: While getting help

## Benefits of Migration

### ✅ **Improved Developer Experience**
- Clear project structure
- Type safety with TypeScript
- Better error messages
- Consistent code organization

### ✅ **Better Collaboration**
- Industry-standard practices
- Clear separation of concerns
- Easier code reviews
- Onboarding documentation

### ✅ **Enhanced Maintainability**
- Modular architecture
- Easier testing
- Better configuration management
- Scalable structure

### ✅ **Future-Proofing**
- Modern tooling
- CI/CD pipelines
- Automated workflows
- Production-ready setup

---

**Note**: The migration preserves all functionality while improving the codebase organization. Take your time and migrate gradually!