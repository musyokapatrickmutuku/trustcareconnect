# TrustCareConnect
**AI-Driven Diabetes Care Platform with Human Oversight**

## 🚀 Quick Start (5 minutes)

### Windows Users:
```cmd
# Clone and run
git clone <repo-url>
cd trustcareconnect
start-local.bat
```

### macOS/Linux Users:
```bash
# Clone and run  
git clone <repo-url>
cd trustcareconnect
./start-local.sh
```

**What this does:**
1. ✅ Starts ICP local replica  
2. ✅ Deploys backend + frontend canisters
3. ✅ Starts AI proxy server
4. ✅ Provides testing URLs

**Full deployment guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🎯 Core Problem Statement

**The Challenge**: Diabetes patients need immediate, safe, and personalized medical guidance, but healthcare providers can't provide 24/7 availability in light of different emmergency situations, where the patient is unable to reach a doctor. 

**Our Solution**: A human-in-the-loop AI system that combines the efficiency of AI with the safety of physician oversight, built on blockchain infrastructure for trust and security.

## 🏗️ System Architecture

TrustCareConnect bridges the gap between AI efficiency and medical safety through:
- **Safety-Scored AI Responses**: Every AI recommendation includes quantified risk assessment
- **Mandatory Doctor Review**: All AI responses require physician approval before patient delivery
- **Blockchain Security**: Immutable medical interaction records on Internet Computer Protocol
- **Personalized Care**: Patient-specific responses based on diabetes type, HbA1c, and medications

## ⚙️ Core Functionality

### 1. Human-in-the-Loop AI Architecture
- **AI Response Generation**: Pretrained LLM provides initial medical guidance
- **Safety Scoring**: Automated risk assessment (0-100%) for every AI recommendation
- **Doctor Review Gate**: All AI responses require physician approval before patient delivery
- **Confidence Metrics**: Quality assessment based on patient-specific context

### 2. Intelligent Triage System
- **Urgency Classification**: Automatic priority assignment (High/Medium/Low)
- **Patient Profiling**: Personalized responses based on diabetes type, HbA1c, medications
- **Query Routing**: Critical cases fast-tracked to human review

### 3. Blockchain-Secured Infrastructure
- **ICP Canister Backend**: Decentralized data storage and processing
- **Immutable Audit Trail**: All medical interactions recorded on-chain
- **HTTP Outcalls**: Secure external LLM API integration

### 4. Dual-Portal Interface
- **Patient Portal**: Submit queries, view approved responses, track care history
- **Doctor Portal**: Review AI responses, approve/edit recommendations, manage patient cases

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

## 🚀 Quick Start Demo

### Option 1: Instant Demo (Recommended for First-Time Users)

**No installation required** - Run the demo directly in your browser:

1. **Download the project**:
   ```bash
   git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
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

**✅ What works in demo mode**:
- Complete UI/UX experience
- Mock AI responses with safety scoring
- Patient and doctor portal workflows
- Urgency classification and triage

**❌ What doesn't work in demo mode**:
- Real LLM integration (uses predefined responses)
- Data persistence (resets on page refresh)

### Option 2: Full ICP Deployment (Advanced Users)

**For real LLM integration and blockchain deployment**:

#### Prerequisites
- **Git**: For cloning the repository
- **Modern web browser**: Chrome, Firefox, Safari, or Edge
- **For full deployment**: DFX (Internet Computer SDK), Node.js

#### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
   cd trustcareconnect
   ```

2. **Install DFX (Internet Computer SDK)**:
   - **Mac/Linux**: 
     ```bash
     sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
     ```
   - **Windows**: Use WSL (Windows Subsystem for Linux) and run the above command

3. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

4. **Start local ICP network**:
   ```bash
   dfx start --background
   ```

5. **Deploy canisters with cycles for HTTP outcalls**:
   ```bash
   dfx deploy --with-cycles 1000000000000
   ```

6. **Set up API key** (for real LLM responses):
   - Edit `src/assist_backend/main.mo` line 97
   - Replace `YOUR_API_KEY_HERE` with your Novita AI or Specific AI API key
   - Redeploy: `dfx deploy`

7. **Access the application**:
   - Open the URL shown after deployment
   - Or open `src/assist_frontend/src/index.html` for development mode

## 🎯 Primary Use Cases

### Scenario 1: Emergency Blood Sugar Management
- **Patient Query**: "My blood sugar is 250 mg/dL and I feel dizzy"
- **System Response**: AI generates immediate guidance → Flagged HIGH priority → Doctor reviews within minutes → Patient receives personalized action plan

### Scenario 2: Medication Adjustment Queries
- **Patient Query**: "Can I skip my metformin if I'm feeling nauseous?"
- **System Response**: AI considers patient's medication profile → MEDIUM priority review → Contextualized advice based on diabetes history

### Scenario 3: Lifestyle Management Support
- **Patient Query**: "What foods can I eat before my workout?"
- **System Response**: Evidence-based nutrition guidance → LOW priority → Integrated with patient's care plan

### Testing the Demo

**Demo Patient Profiles Available**:

1. **Sarah Johnson (P001)** - Type 2 Diabetes
   - Age: 47, HbA1c: 6.9% (well-controlled)
   - Medications: Metformin, Lisinopril, Empagliflozin
   - Use for: Standard diabetes management queries

2. **Michael Thompson (P002)** - Type 1 Diabetes
   - Age: 19, HbA1c: 7.8% (college student)
   - Medications: Insulin Pump
   - Use for: Young adult lifestyle challenges

3. **Carlos Rodriguez (P003)** - Type 2 with Complications
   - Age: 64, HbA1c: 6.8% (with comorbidities)
   - Medications: Metformin, Semaglutide, Lisinopril
   - Use for: Complex diabetes management

**Sample Queries to Try**:
- "My blood sugar reading is 250 mg/dL this morning, what should I do?"
- "I'm feeling dizzy and think my blood sugar might be low"
- "Can I exercise if my blood sugar is 180 mg/dL?"
- "What foods should I avoid before bedtime?"
- "I forgot to take my metformin this morning, should I take it now?"

### Target Users
- **Primary**: Type 1 & Type 2 diabetes patients (ages 18-70)
- **Secondary**: Endocrinologists, family physicians, diabetes educators
- **Developers**: Healthcare tech teams building AI-assisted medical platforms

## 🛠️ Troubleshooting

### Common Issues and Solutions

**Problem**: Demo.html doesn't open or displays blank page
- **Solution**: Ensure you're opening the file directly in a web browser, not a text editor
- **Alternative**: Try a different browser (Chrome, Firefox, Safari, Edge)

**Problem**: "File not found" error when opening demo.html
- **Solution**: 
  - Check that you've downloaded the complete project
  - Verify the file path: `trustcareconnect/demo.html`
  - Try opening with: File → Open File in your browser

**Problem**: Demo looks broken or unstyled
- **Solution**: Ensure you have internet connection (demo loads CSS from CDN)
- **Alternative**: Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)

**Problem**: Cannot submit queries or buttons don't work
- **Solution**: 
  - Enable JavaScript in your browser
  - Try a different browser
  - Check browser console for errors (F12 → Console)

**Problem**: DFX installation fails on Windows
- **Solution**: 
  - Install WSL (Windows Subsystem for Linux) first
  - Run DFX installation commands in WSL environment
  - Alternative: Use Docker Desktop with dfinity/sdk image

**Problem**: "Insufficient cycles" error during deployment
- **Solution**: Deploy with more cycles: `dfx deploy --with-cycles 2000000000000`

**Problem**: HTTP outcalls fail in local development
- **Solution**: 
  - Ensure internet connection
  - Check API key is correctly set in main.mo
  - Verify cycles balance: `dfx canister status assist_backend`

**Need Help?**
- Check the [LLM_INTEGRATION_SETUP.md](LLM_INTEGRATION_SETUP.md) for detailed API setup
- Open an issue on GitHub for technical problems
- Ensure you're using a modern web browser with JavaScript enabled

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

## Advantages of Using the ICP Protocal 

- **Decentralized**: Runs on ICP blockchain vs. centralized FastAPI
- **Persistent**: Stable memory vs. SQLite database
- **Scalable**: ICP's automatic scaling vs. Docker containers
- **Secure**: Blockchain-level security vs. application-level

### Simplifications
- **Mock AI**: Predefined responses vs. LLM integration
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

1. **Real LLM Integration**: Add HTTP outcalls for actual AI API e.g. a finetuned local LLM on diabetis 
2. **Internet Identity**: Implement proper ICP authentication
3. **Advanced UI**: Migrate to full React/TypeScript project
4. **Medical Records**: Expand patient data management
5. **Notifications**: Real-time alerts for all queries with the relevant urgency requirements 
6. **Analytics**: Usage metrics and outcome tracking

## File Structure

```
trustcareconnect/
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


