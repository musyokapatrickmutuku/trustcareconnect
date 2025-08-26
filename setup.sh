#!/bin/bash

# 🚀 TrustCareConnect - Complete Automated Setup Script
# This script sets up everything needed for TrustCareConnect including:
# - Dependencies verification
# - DFX replica startup
# - Backend canister deployment
# - Environment configuration
# - Test patient and doctor data loading
# - Frontend startup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_color $CYAN "=================================================="
    print_color $CYAN "$1"
    print_color $CYAN "=================================================="
    echo ""
}

print_step() {
    print_color $BLUE "🔸 $1"
}

print_success() {
    print_color $GREEN "✅ $1"
}

print_warning() {
    print_color $YELLOW "⚠️  $1"
}

print_error() {
    print_color $RED "❌ $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "🔍 CHECKING PREREQUISITES"
    
    local missing_deps=()
    
    print_step "Checking Node.js..."
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        missing_deps+=("Node.js (>=16.0.0)")
        print_error "Node.js not found"
    fi
    
    print_step "Checking npm..."
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        missing_deps+=("npm")
        print_error "npm not found"
    fi
    
    print_step "Checking DFX..."
    if command_exists dfx; then
        DFX_VERSION=$(dfx --version)
        print_success "DFX found: $DFX_VERSION"
    else
        missing_deps+=("DFX (Internet Computer SDK)")
        print_error "DFX not found"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_warning "Please install missing dependencies and run this script again."
        print_warning "See SETUP-GUIDE.md for installation instructions."
        exit 1
    fi
    
    print_success "All prerequisites satisfied!"
}

# Install npm dependencies
install_dependencies() {
    print_header "📦 INSTALLING DEPENDENCIES"
    
    print_step "Installing project dependencies..."
    if npm install --legacy-peer-deps; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Start DFX replica
start_dfx() {
    print_header "🔧 STARTING DFX REPLICA"
    
    print_step "Checking if DFX replica is already running..."
    if dfx ping >/dev/null 2>&1; then
        print_success "DFX replica is already running"
        return 0
    fi
    
    print_step "Starting DFX replica in background..."
    if dfx start --background --clean >/dev/null 2>&1; then
        print_success "DFX replica started successfully"
        
        # Wait a moment for replica to fully initialize
        print_step "Waiting for replica to initialize..."
        sleep 5
        
        # Verify replica is healthy
        if dfx ping >/dev/null 2>&1; then
            print_success "DFX replica is healthy"
        else
            print_error "DFX replica failed to start properly"
            exit 1
        fi
    else
        print_error "Failed to start DFX replica"
        exit 1
    fi
}

# Deploy backend canister
deploy_backend() {
    print_header "🚀 DEPLOYING BACKEND CANISTER"
    
    print_step "Deploying backend canister..."
    if dfx deploy backend; then
        print_success "Backend canister deployed successfully"
        
        # Get the canister ID
        CANISTER_ID=$(dfx canister id backend)
        print_success "Backend canister ID: $CANISTER_ID"
        
        # Test the deployment
        print_step "Testing backend deployment..."
        HEALTH_CHECK=$(dfx canister call backend healthCheck 2>/dev/null || echo "")
        if [[ $HEALTH_CHECK == *"TrustCareConnect backend is running"* ]]; then
            print_success "Backend deployment verified"
        else
            print_warning "Backend deployed but health check uncertain"
        fi
        
        return 0
    else
        print_error "Failed to deploy backend canister"
        exit 1
    fi
}

# Configure environment variables
configure_environment() {
    print_header "⚙️  CONFIGURING ENVIRONMENT"
    
    # Get canister ID
    CANISTER_ID=$(dfx canister id backend)
    print_step "Configuring environment with canister ID: $CANISTER_ID"
    
    # Update root .env file
    print_step "Updating root environment configuration..."
    cat > .env << EOF
# Environment
NODE_ENV=development

# ICP Configuration - Auto-configured by setup script
REACT_APP_IC_HOST=http://127.0.0.1:4943
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
CANISTER_ID_BACKEND=$CANISTER_ID
REACT_APP_NETWORK=local
DFX_NETWORK=local
REACT_APP_DEBUG_MODE=true

# AI Configuration (Optional for local)
AI_PROXY_HOST=http://localhost:3001
OPENAI_API_KEY=your-openai-api-key-here
CLAUDE_API_KEY=your-claude-api-key-here

# Frontend Configuration
REACT_APP_API_HOST=http://localhost:3001
FRONTEND_HOST=http://localhost:3000

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:4943,https://localhost:4943

# Development Tools
ENABLE_DEV_TOOLS=true
ENABLE_MOCK_RESPONSES=true
GENERATE_SOURCEMAP=true
EOF
    
    # Update frontend .env.local file
    print_step "Updating frontend environment configuration..."
    mkdir -p packages/frontend
    cat > packages/frontend/.env.local << EOF
# TrustCareConnect Frontend Environment - Auto-configured by setup script
# Internet Computer Protocol (ICP) Configuration

# ICP Host Configuration  
# Development: Use local DFX replica
REACT_APP_IC_HOST=http://127.0.0.1:4943

# Deployed Backend Canister ID - Auto-configured
REACT_APP_BACKEND_CANISTER_ID=$CANISTER_ID
REACT_APP_CANISTER_ID=$CANISTER_ID

# Network Configuration
REACT_APP_NETWORK=local
REACT_APP_NODE_ENV=development

# Feature Flags
REACT_APP_ENABLE_CLINICAL_FEATURES=true
REACT_APP_ENABLE_AI_INTEGRATION=true

# Debug Configuration
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug

# Authentication Configuration
REACT_APP_AUTH_PROVIDER=ii
REACT_APP_LOCAL_II_URL=http://localhost:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai

# Development settings
NODE_ENV=development
EOF
    
    print_success "Environment configuration completed"
}

# Load comprehensive test data
load_test_data() {
    print_header "🧪 LOADING COMPREHENSIVE TEST DATA"
    
    print_step "Loading test patients and doctors..."
    
    # Register doctors first
    print_step "Registering Dr. Maria Elena Rodriguez (Endocrinology)..."
    DOCTOR1_RESULT=$(dfx canister call backend registerDoctor '("Dr. Maria Elena Rodriguez", "Endocrinology")' 2>/dev/null || echo "")
    if [[ $DOCTOR1_RESULT == *"doctor_"* ]]; then
        DOCTOR1_ID=$(echo $DOCTOR1_RESULT | sed 's/[()"]//g')
        print_success "Dr. Rodriguez registered: $DOCTOR1_ID"
    else
        print_error "Failed to register Dr. Rodriguez"
        return 1
    fi
    
    print_step "Registering Dr. James Michael Thompson (Endocrinology)..."
    DOCTOR2_RESULT=$(dfx canister call backend registerDoctor '("Dr. James Michael Thompson", "Endocrinology")' 2>/dev/null || echo "")
    if [[ $DOCTOR2_RESULT == *"doctor_"* ]]; then
        DOCTOR2_ID=$(echo $DOCTOR2_RESULT | sed 's/[()"]//g')
        print_success "Dr. Thompson registered: $DOCTOR2_ID"
    else
        print_error "Failed to register Dr. Thompson"
        return 1
    fi
    
    # Register patients
    print_step "Registering Sarah Michelle Johnson (Type 2 Diabetes)..."
    PATIENT1_RESULT=$(dfx canister call backend registerPatient '("Sarah Michelle Johnson", "Diabetes Type 2", "sarah.johnson@email.com")' 2>/dev/null || echo "")
    if [[ $PATIENT1_RESULT == *"patient_"* ]]; then
        PATIENT1_ID=$(echo $PATIENT1_RESULT | sed 's/[()"]//g')
        print_success "Sarah registered: $PATIENT1_ID"
        
        # Assign to doctor
        dfx canister call backend assignPatientToDoctor "($PATIENT1_ID, $DOCTOR1_ID)" >/dev/null 2>&1
        print_success "Sarah assigned to Dr. Rodriguez"
    fi
    
    print_step "Registering Michael David Rodriguez (Type 1 Diabetes)..."
    PATIENT2_RESULT=$(dfx canister call backend registerPatient '("Michael David Rodriguez", "Diabetes Type 1", "mike.rodriguez@student.edu")' 2>/dev/null || echo "")
    if [[ $PATIENT2_RESULT == *"patient_"* ]]; then
        PATIENT2_ID=$(echo $PATIENT2_RESULT | sed 's/[()"]//g')
        print_success "Michael registered: $PATIENT2_ID"
        
        # Assign to doctor
        dfx canister call backend assignPatientToDoctor "($PATIENT2_ID, $DOCTOR2_ID)" >/dev/null 2>&1
        print_success "Michael assigned to Dr. Thompson"
    fi
    
    print_step "Registering Carlos Eduardo Mendoza (Type 2 Diabetes)..."
    PATIENT3_RESULT=$(dfx canister call backend registerPatient '("Carlos Eduardo Mendoza", "Diabetes Type 2", "carlos.mendoza@gmail.com")' 2>/dev/null || echo "")
    if [[ $PATIENT3_RESULT == *"patient_"* ]]; then
        PATIENT3_ID=$(echo $PATIENT3_RESULT | sed 's/[()"]//g')
        print_success "Carlos registered: $PATIENT3_ID"
        
        # Assign to doctor
        dfx canister call backend assignPatientToDoctor "($PATIENT3_ID, $DOCTOR1_ID)" >/dev/null 2>&1
        print_success "Carlos assigned to Dr. Rodriguez"
    fi
    
    print_step "Registering Priya Sharma-Patel (Type 2 Diabetes)..."
    PATIENT4_RESULT=$(dfx canister call backend registerPatient '("Priya Sharma-Patel", "Diabetes Type 2", "priya.patel@work.com")' 2>/dev/null || echo "")
    if [[ $PATIENT4_RESULT == *"patient_"* ]]; then
        PATIENT4_ID=$(echo $PATIENT4_RESULT | sed 's/[()"]//g')
        print_success "Priya registered: $PATIENT4_ID"
        
        # Assign to doctor
        dfx canister call backend assignPatientToDoctor "($PATIENT4_ID, $DOCTOR2_ID)" >/dev/null 2>&1
        print_success "Priya assigned to Dr. Thompson"
    fi
    
    print_step "Registering Dorothy Mae Williams (Type 2 Diabetes)..."
    PATIENT5_RESULT=$(dfx canister call backend registerPatient '("Dorothy Mae Williams", "Diabetes Type 2", "dorothy.williams@senior.net")' 2>/dev/null || echo "")
    if [[ $PATIENT5_RESULT == *"patient_"* ]]; then
        PATIENT5_ID=$(echo $PATIENT5_RESULT | sed 's/[()"]//g')
        print_success "Dorothy registered: $PATIENT5_ID"
        
        # Assign to doctor
        dfx canister call backend assignPatientToDoctor "($PATIENT5_ID, $DOCTOR1_ID)" >/dev/null 2>&1
        print_success "Dorothy assigned to Dr. Rodriguez"
    fi
    
    # Create sample queries
    if [[ -n $PATIENT1_ID ]]; then
        print_step "Creating sample query for Sarah..."
        dfx canister call backend submitQuery "($PATIENT1_ID, \"Morning Blood Sugar Higher Than Usual\", \"I have been feeling more tired lately and my morning blood sugars are higher than usual. Should I be concerned?\")" >/dev/null 2>&1
        print_success "Sample query created for Sarah"
    fi
    
    if [[ -n $PATIENT2_ID ]]; then
        print_step "Creating sample query for Michael..."
        dfx canister call backend submitQuery "($PATIENT2_ID, \"Blood Sugar Issues During College Exams\", \"I am having trouble with my blood sugars during college exams. They keep going high even with my pump.\")" >/dev/null 2>&1
        print_success "Sample query created for Michael"
    fi
    
    print_success "Test data loading completed"
}

# Start frontend
start_frontend() {
    print_header "🌐 STARTING FRONTEND APPLICATION"
    
    print_step "Starting frontend development server..."
    print_warning "The frontend will start in the background."
    print_warning "It may take a moment to compile. Check http://localhost:3000 in a few minutes."
    
    # Start frontend in background
    nohup npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Give it a moment to start
    sleep 3
    
    # Check if process is still running
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_success "Frontend server started (PID: $FRONTEND_PID)"
        print_success "Check frontend.log for compilation status"
    else
        print_error "Frontend server failed to start"
        print_warning "You can start it manually with: npm start"
    fi
}

# Generate credentials summary
generate_credentials() {
    print_header "🔐 TEST CREDENTIALS SUMMARY"
    
    echo ""
    print_color $PURPLE "👥 PATIENT ACCOUNTS:"
    echo ""
    echo "1. Sarah Michelle Johnson (Type 2 Diabetes - Well-controlled)"
    echo "   📧 Email: sarah.johnson@email.com"  
    echo "   🔑 Password: SarahDiabetes2024!"
    echo "   📊 HbA1c: 6.9%, Medications: Metformin, Empagliflozin, Lisinopril"
    echo ""
    echo "2. Michael David Rodriguez (Type 1 Diabetes - College Student)"
    echo "   📧 Email: mike.rodriguez@student.edu"
    echo "   🔑 Password: MikeType1Diabetes!"
    echo "   📊 HbA1c: 7.8%, Insulin pump therapy"
    echo ""
    echo "3. Carlos Eduardo Mendoza (Type 2 Diabetes - Cardiac History)"
    echo "   📧 Email: carlos.mendoza@gmail.com"
    echo "   🔑 Password: CarlosType2_2024!"
    echo "   📊 HbA1c: 6.8%, Multiple medications, stable retinopathy"
    echo ""
    echo "4. Priya Sharma-Patel (Type 2 Diabetes - Post-GDM, Pregnant)"
    echo "   📧 Email: priya.patel@work.com"
    echo "   🔑 Password: PriyaDiabetes2024!"
    echo "   📊 HbA1c: 6.2%, Currently pregnant, excellent control"
    echo ""
    echo "5. Dorothy Mae Williams (Type 2 Diabetes - Elderly, CKD)"
    echo "   📧 Email: dorothy.williams@senior.net"
    echo "   🔑 Password: Dorothy2024Senior!"
    echo "   📊 HbA1c: 8.0%, Insulin + Linagliptin, cognitive impairment"
    echo ""
    
    print_color $PURPLE "👨‍⚕️ DOCTOR ACCOUNTS:"
    echo ""
    echo "1. Dr. Maria Elena Rodriguez (Endocrinology - 15 years)"
    echo "   📧 Email: dr.rodriguez@trustcare.com"
    echo "   🔑 Password: DrMaria2024Endo!"
    echo "   👥 Patients: Sarah, Carlos, Dorothy"
    echo ""
    echo "2. Dr. James Michael Thompson (Endocrinology - 12 years)"
    echo "   📧 Email: dr.thompson@trustcare.com"
    echo "   🔑 Password: DrJames2024Endo!"
    echo "   👥 Patients: Michael, Priya"
    echo ""
}

# Main setup function
main() {
    clear
    print_color $CYAN "🏥 TrustCareConnect - Complete Automated Setup"
    print_color $CYAN "Setting up everything needed for healthcare AI platform testing"
    echo ""
    
    # Run setup steps
    check_prerequisites
    install_dependencies  
    start_dfx
    deploy_backend
    configure_environment
    load_test_data
    start_frontend
    
    # Final status
    print_header "🎉 SETUP COMPLETE!"
    
    # System health check
    HEALTH_STATUS=$(dfx canister call backend healthCheck 2>/dev/null || echo "Backend not responding")
    print_success "System Status: $HEALTH_STATUS"
    
    print_success "TrustCareConnect is ready for testing!"
    echo ""
    print_color $GREEN "🌐 Application URL: http://localhost:3000"
    print_color $GREEN "📚 Documentation: See README.md and TEST-CREDENTIALS.md"
    print_color $GREEN "🔍 Health Check: dfx canister call backend healthCheck"
    echo ""
    
    generate_credentials
    
    echo ""
    print_color $YELLOW "📝 NEXT STEPS:"
    echo "1. Wait 2-3 minutes for frontend compilation"
    echo "2. Open http://localhost:3000 in your browser" 
    echo "3. Use any patient credentials above to login"
    echo "4. Test the complete healthcare workflow!"
    echo ""
    print_color $YELLOW "📖 For detailed information, see TEST-CREDENTIALS.md"
    echo ""
    print_success "Happy testing! 🚀"
}

# Run main function
main "$@"