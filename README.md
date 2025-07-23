# Assist AI - Simplified ICP Version

A simplified medical AI assistant for diabetes patients built on the Internet Computer Protocol (ICP) using Motoko and React.

## Overview

This is a simplified version of the Assist AI medical assistant, rebuilt using the IC-Vibe-Coding-Template-Motoko structure. It demonstrates the core functionality of the original system while leveraging ICP's blockchain capabilities.

## Core Features

- **Patient Portal**: Submit medical queries with diabetes context
- **Doctor Review System**: Human-in-the-loop AI response approval
- **Safety Scoring**: AI responses evaluated for medical safety (0-100%)
- **Confidence Scoring**: Response quality assessment based on patient context
- **Urgency Classification**: Automatic prioritization (high/medium/low)
- **Demo Patient Data**: 3 sample diabetes patients with different profiles

## Architecture

### Backend (Motoko Canister)
- **Patient Management**: Store and retrieve patient profiles
- **Query Processing**: AI response generation with safety evaluation
- **Doctor Workflow**: Review and approval system for AI responses
- **Stable Storage**: Persistent data using ICP stable memory

### Frontend (React SPA)
- **Role-based Interface**: Separate patient and doctor portals  
- **Real-time Updates**: Query status and response management
- **Responsive Design**: Tailwind CSS for modern UI
- **Mock Backend**: Development mode with local data simulation

## Quick Start

### Prerequisites
- DFX (Internet Computer SDK)
- Node.js (for development)
- Motoko compiler (via DFX)

### Installation

1. **Clone and navigate to project**:
```bash
cd assist_v1_icp_simplified
```

2. **Install dependencies**:
```bash
npm install
npm install -g @dfinity/sdk
```

3. **Start local ICP network**:
```bash
dfx start --background
```

4. **Deploy canisters**:
```bash
dfx deploy
```

5. **Open frontend**:
- Navigate to the canister URL shown after deployment
- Or open `src/assist_frontend/src/index.html` directly for development

### Development Mode

For development without ICP deployment:
1. Open `src/assist_frontend/src/index.html` in your browser
2. Uses mock backend with local data
3. All functionality works except persistence

## Usage

### Patient Portal
1. Select a demo patient (P001: Sarah Johnson, P002: Michael Thompson, P003: Carlos Rodriguez)
2. Submit medical queries about diabetes management
3. View AI responses with safety scores and urgency levels
4. Track query status (pending → reviewed → completed)

### Doctor Portal  
1. Review pending patient queries
2. See AI-generated responses with safety/confidence scores
3. Approve or edit responses before sending to patients
4. Prioritize based on urgency levels

## Demo Patient Profiles

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

## Key Differences from Original

### Improvements
- **Decentralized**: Runs on ICP blockchain vs. centralized FastAPI
- **Persistent**: Stable memory vs. SQLite database
- **Scalable**: ICP's automatic scaling vs. Docker containers
- **Secure**: Blockchain-level security vs. application-level

### Simplifications
- **Mock AI**: Predefined responses vs. DeepSeek LLM integration
- **3 Patients**: Reduced from 5 demo patients
- **Basic UI**: Single HTML file vs. multi-file Streamlit app
- **No Auth**: Simple role selection vs. authentication system

## Testing

```bash
# Run all tests
npm run test

# Backend tests (Motoko unit tests)
npm run test:backend

# Frontend tests (React component tests)  
npm run test:frontend
```

## Deployment

### Local Development
```bash
dfx start --background
dfx deploy
```

### IC Mainnet
```bash
dfx deploy --network ic
```

## Future Enhancements

1. **Real LLM Integration**: Add HTTP outcalls for actual AI API
2. **Internet Identity**: Implement proper ICP authentication
3. **Advanced UI**: Migrate to full React/TypeScript project
4. **Medical Records**: Expand patient data management
5. **Notifications**: Real-time alerts for urgent queries
6. **Analytics**: Usage metrics and outcome tracking

## File Structure

```
assist_v1_icp_simplified/
├── dfx.json                     # ICP project configuration
├── mops.toml                    # Motoko package manager
├── package.json                 # Node.js dependencies
├── src/
│   ├── assist_backend/
│   │   └── main.mo             # Motoko canister (backend logic)
│   └── assist_frontend/
│       └── src/
│           └── index.html      # React SPA (frontend)
└── README.md                   # This file
```

## Contributing

This is a simplified demonstration version. For production use:
1. Add comprehensive error handling
2. Implement real LLM integration  
3. Add proper authentication
4. Create extensive test coverage
5. Add monitoring and logging

## License

Educational/Demo purposes - Based on original Assist AI project architecture.