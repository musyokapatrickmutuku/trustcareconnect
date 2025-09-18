# TrustCareConnect MVP - Healthcare AI Platform

## Project Overview

TrustCareConnect is an AI-powered diabetes care platform providing 24/7 medical guidance with human oversight for the Kenyan market. Uses Baichuan-M2-32B medical LLM via Novita AI API, deployed on Internet Computer Protocol (ICP) blockchain.

**MVP Goal**: Demonstrate real AI models providing medical guidance via HTTP outcalls from ICP canisters with patient context.

## **CRITICAL: Real HTTP Outcall Requirements**

- **NO Mock Responses**: All AI responses MUST come from actual HTTP outcalls to Novita AI API
- **Patient Context Integration**: Send full medical history with each query
- **Real-time Processing**: Actual external API calls, not simulated responses
- **Error Handling**: Handle HTTP outcall failures appropriately

## Core Workflow

1. **Patient Query**: Patient submits medical query → "submitted" → "processing"
2. **AI Processing**: HTTP outcall to Novita AI with patient history → "ai_processed"
3. **Doctor Review**: Doctor reviews/edits AI response → "doctor_approved"
4. **Final Delivery**: System delivers doctor-approved response → "completed"

## Test Patient Data

**P001 - Sarah Johnson**: Type 2, 45yr, HbA1c 6.9%, Metformin+Empagliflozin, excellent control
**P002 - Michael Rodriguez**: Type 1, 19yr, insulin pump, HbA1c 7.8%, college stress issues

## MVP Test Scenarios

**Scenario 1 (Sarah)**: "Feeling tired, morning blood sugars higher than usual"
**Scenario 2 (Michael)**: "Blood sugars high during college exams with pump"

## Backend Implementation (Motoko)

### Core Data Types
```motoko
type VitalSigns = { bloodGlucose: ?Float; bloodPressure: ?Text; heartRate: ?Nat; temperature: ?Float };
type PatientContext = { diabetesType: Text; hba1c: Float; medications: [Text]; allergies: [Text]; medicalHistory: Text };
type MedicalResponse = { content: Text; safetyScore: Nat; urgency: UrgencyLevel; timestamp: Int; requiresReview: Bool };
type UrgencyLevel = { #low; #medium; #high };
```

### Main Processing Function
```motoko
actor MedicalAssistant {
    private stable var NOVITA_API_URL = "https://api.novita.ai/openai/v1/chat/completions";

    public shared func processMedicalQuery(patientId: Text, query: Text, vitalSigns: ?VitalSigns) : async Result.Result<MedicalResponse, Text> {
        // 1. Input validation & rate limiting (10 queries/hour)
        if (Text.size(query) == 0) return #err("Query cannot be empty");
        if (not checkRateLimit(patientId)) return #err("Rate limit exceeded");

        // 2. Get patient context & build clinical prompt
        let patientContext = await getPatientContext(patientId);
        let clinicalPrompt = buildClinicalPrompt(patientContext);
        let clinicalResponse = await callNovitaAI(clinicalPrompt, query);

        // 3. Calculate safety & urgency
        let safetyScore = calculateSafetyScore(clinicalResponse, vitalSigns);
        let urgency = determineUrgency(safetyScore, query);
        let requiresReview = (safetyScore < 70 or urgency == #high);

        // 4. Route to doctor review if needed
        if (requiresReview) {
            await queueForDoctorReview(patientId, query, clinicalResponse);
            return #ok({ content = "Forwarded for doctor review"; safetyScore; urgency; timestamp = Time.now(); requiresReview = true });
        };

        // 5. Extract guidance, store audit, return response
        let patientResponse = extractPatientGuidance(clinicalResponse);
        await storeInteraction(patientId, query, clinicalResponse, safetyScore);
        #ok({ content = patientResponse; safetyScore; urgency; timestamp = Time.now(); requiresReview = false });
    };

    // Build clinical prompt with patient context for Kenyan diabetes care
    private func buildClinicalPrompt(context: PatientContext) : Text {
        "Clinical AI for Kenya diabetes care\nPatient: " # context.diabetesType # ", HbA1c:" # Float.toText(context.hba1c) # "%, Meds:" # Text.join(",", context.medications.vals()) # "\nProvide clinical analysis with numbered action steps."
    };

    // Extract numbered patient guidance steps (1., 2., 3., etc.)
    private func extractPatientGuidance(clinicalResponse: Text) : Text {
        let lines = Text.split(clinicalResponse, #char '\n');
        let steps = Array.filter<Text>(Iter.toArray(lines), func(line: Text) : Bool {
            Text.startsWith(line, #text "1.") or Text.startsWith(line, #text "2.") or Text.startsWith(line, #text "3.")
        });
        Text.join("\n", steps.vals());
    };

    // Safety scoring: Critical symptoms (-60), Glucose: <54(-50), <70(-30), >400(-45), >250(-25), Med concerns (-40), Pregnancy (-30)
    private func calculateSafetyScore(response: Text, vitals: ?VitalSigns) : Nat {
        var score = 100;
        let criticalSymptoms = ["chest pain", "unconscious", "severe bleeding"];
        for (symptom in criticalSymptoms.vals()) { if (Text.contains(response, #text symptom)) score -= 60 };

        switch (vitals) {
            case (?v) {
                switch (v.bloodGlucose) {
                    case (?glucose) {
                        if (glucose < 54.0) score -= 50 else if (glucose < 70.0) score -= 30
                        else if (glucose > 400.0) score -= 45 else if (glucose > 250.0) score -= 25;
                    };
                    case null {};
                };
            };
            case null {};
        };

        if (Text.contains(response, #text "stop medication")) score -= 40;
        if (Text.contains(response, #text "pregnant")) score -= 30;
        Nat.max(0, Nat.min(100, Int.abs(score)))
    };

    // Urgency: <40 = HIGH, <70 = MEDIUM, ≥70 = LOW
    private func determineUrgency(safetyScore: Nat, query: Text) : UrgencyLevel {
        if (safetyScore < 40) #high else if (safetyScore < 70) #medium else #low
    };

    // HTTP outcall to Novita AI API with fallback
    private func callNovitaAI(prompt: Text, query: Text) : async Text {
        let requestBody = {
            model = "baichuan/baichuan-m2-32b";
            messages = [{ role = "system"; content = prompt }, { role = "user"; content = query }];
            temperature = 0.7; max_tokens = 2048; stream = false;
        };
        let response = await makeHttpRequest(NOVITA_API_URL, API_KEY, requestBody);
        switch (response) { case (#ok(content)) content; case (#err(error)) getFallbackResponse(query); }
    };
};

## Frontend Implementation (React/TypeScript)

### Core Interfaces
```typescript
interface VitalSigns { bloodGlucose?: number; bloodPressure?: string; heartRate?: number; temperature?: number }
interface MedicalQuery { query: string; vitalSigns?: VitalSigns; patientId: string; timestamp: string; channel: string }
interface MedicalResponse { content: string; safetyScore: number; urgency: 'LOW'|'MEDIUM'|'HIGH'; timestamp: number; requiresReview: boolean; queryId?: string }
interface DoctorReviewItem { id: string; patientId: string; patientName: string; originalQuery: string; aiResponse: string; safetyScore: number; urgency: string; timestamp: number; status: string; doctorNotes?: string }
```

### Patient Query Interface
```typescript
export const MedicalQueryInterface: React.FC = ({ patientId, onResponse }) => {
    const [query, setQuery] = useState(''); const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const submitQuery = useMutation(async (data: MedicalQuery) => {
        if (!validateQuery(data)) throw new Error('Invalid query');
        const response = await MedicalService.submitQuery({ ...data, patientId, timestamp: new Date().toISOString() });
        if (response.safetyScore < 40) await triggerEmergencyProtocol(response);
        return response;
    }, {
        onSuccess: (response) => {
            if (response.requiresReview) {
                setStatusMessage('Forwarded for doctor review');
                startPollingForApproval(response.queryId);
            } else { onResponse(response); setStatusMessage(null); }
            setQuery(''); setVitalSigns({});
        },
        onError: (error) => { console.error('Query failed:', error); const cached = getCachedResponse(query); if (cached) onResponse(cached); }
    });

    const validateQuery = (data: MedicalQuery): boolean => {
        if (!data.query || data.query.length < 10) { setStatusMessage('Please provide more details'); return false; }
        const crisisPatterns = [/suicide/i, /kill myself/i]; // Crisis detection
        if (crisisPatterns.some(p => p.test(data.query))) { triggerCrisisProtocol(); return false; }
        return true;
    };

    return (
        <div className="medical-query-interface">
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Describe symptoms (min 10 chars)" rows={4} />
            <VitalSignsInput values={vitalSigns} onChange={setVitalSigns} />
            <button onClick={() => submitQuery.mutate({ query, vitalSigns })} disabled={submitQuery.isLoading || query.length < 10}>
                {submitQuery.isLoading ? 'Processing...' : 'Get Medical Guidance'}
            </button>
            {statusMessage && <div className="status-message">{statusMessage}</div>}
        </div>
    );
};

// Vital Signs: Blood Glucose, BP, Heart Rate, Temperature inputs
const VitalSignsInput = ({ values, onChange }) => (
    <div className="vital-signs">
        <input type="number" placeholder="Blood Glucose (mg/dL)" value={values.bloodGlucose || ''} onChange={(e) => onChange({...values, bloodGlucose: +e.target.value})} />
        <input type="text" placeholder="Blood Pressure" value={values.bloodPressure || ''} onChange={(e) => onChange({...values, bloodPressure: e.target.value})} />
        <input type="number" placeholder="Heart Rate (BPM)" value={values.heartRate || ''} onChange={(e) => onChange({...values, heartRate: +e.target.value})} />
        <input type="number" placeholder="Temperature (°C)" value={values.temperature || ''} onChange={(e) => onChange({...values, temperature: +e.target.value})} />
    </div>
);
```

### Doctor Review Portal
```typescript
export const DoctorReviewPortal = () => {
    const [selectedReview, setSelectedReview] = useState(null); const [editedResponse, setEditedResponse] = useState(''); const [doctorNotes, setDoctorNotes] = useState('');
    const { data: pendingReviews = [] } = useQuery('pendingReviews', MedicalService.getPendingReviews, { refetchInterval: 15000 });

    const approveReview = useMutation(MedicalService.approveReview, { onSuccess: () => { /* reset state, show success */ } });
    const rejectReview = useMutation(MedicalService.rejectReview, { onSuccess: () => { /* reset state, show success */ } });

    return (
        <div className="doctor-portal">
            <h1>Doctor Review Portal ({pendingReviews.length} Pending)</h1>
            <div className="reviews-grid">
                <div className="pending-list">
                    {pendingReviews.map(review => (
                        <div key={review.id} onClick={() => setSelectedReview(review)} className={`review-item ${selectedReview?.id === review.id ? 'selected' : ''}`}>
                            <p>{review.patientName} - {review.urgency} ({review.safetyScore}%)</p>
                            <p>{review.originalQuery}</p>
                        </div>
                    ))}
                </div>
                {selectedReview && (
                    <div className="review-details">
                        <h3>Query: {selectedReview.originalQuery}</h3>
                        <textarea value={editedResponse} onChange={(e) => setEditedResponse(e.target.value)} placeholder="Edit AI response" />
                        <textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="Doctor notes" />
                        <button onClick={() => approveReview.mutate({reviewId: selectedReview.id, finalResponse: editedResponse, doctorNotes})}>Approve</button>
                        <button onClick={() => rejectReview.mutate({reviewId: selectedReview.id, reason: doctorNotes})}>Reject</button>
                    </div>
                )}
            </div>
        </div>
    );
};
```

### Key Services & Utilities
```typescript
// MedicalService API calls: submitQuery, getPatientHistory, getQueryStatus, getPendingReviews, approveReview, rejectReview
class MedicalService {
    static async submitQuery(query: MedicalQuery): Promise<MedicalResponse> { return fetch('/api/queries', {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}`}, body: JSON.stringify(query)}).then(r => r.json()); }
    static async approveReview(data): Promise<void> { return fetch(`/api/doctor/reviews/${data.reviewId}/approve`, {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}`}, body: JSON.stringify(data)}).then(r => r.json()); }
    /* Other methods follow similar pattern */
}

// Crisis Protocol: Kenya Emergency 999/112, Suicide Prevention +254 722 178 177
function triggerCrisisProtocol(): void { alert('🚨 Kenya Emergency: 999/112, Suicide Prevention: +254 722 178 177'); }
function triggerEmergencyProtocol(response): void { fetch('/api/emergency/alert', {method: 'POST', body: JSON.stringify(response)}); }
```

### State Management & API Integration
```typescript
// React Context: AppProvider manages currentUser, notifications, connectionStatus with useReducer
const AppContext = createContext<{state: AppState; dispatch: React.Dispatch<AppAction>}>(null);
export const useAppContext = () => useContext(AppContext);

// Novita AI Service with retry logic (3 attempts, exponential backoff)
class NovitaAIService {
    async getMedicalGuidance(query: string, context: PatientContext): Promise<AIResponse> {
        return fetch('https://api.novita.ai/openai/v1/chat/completions', {
            method: 'POST', headers: {'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({model: 'baichuan/baichuan-m2-32b', messages: [{role: 'system', content: this.buildClinicalPrompt(context)}, {role: 'user', content: query}], temperature: 0.7, max_tokens: 2048})
        }).then(r => r.json()).then(data => this.processAIResponse(data.choices[0].message.content, query, context));
    }
}
```

## Safety & Medical Guidelines

### Safety Scoring Algorithm
**Base Score**: 100
**Deductions**: Critical symptoms (-60), Glucose <54 (-50), <70 (-30), >400 (-45), >250 (-25), Med concerns (-40), Pregnancy (-30), Age <18/>70 (-10)
**Urgency**: <40 = HIGH, <70 = MEDIUM, ≥70 = LOW

### Response Guidelines
**Always Include**: Urgency level, safety score, numbered action steps, when to seek help, AI disclaimer
**Never Include**: Definitive diagnoses, prescription changes, advice to stop medications, pregnancy guidance

### Fallback Responses
- **Low glucose**: "Take 15g fast-acting carbs, wait 15 min, recheck. Seek help if symptoms persist." (Score: 30, HIGH)
- **High glucose**: "Drink water, avoid sugar, monitor every 2 hours. Contact doctor if >250 mg/dL for 6+ hours." (Score: 50, MEDIUM)

## Development & Testing

### Setup Commands
```bash
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect && npm install
cp .env.example .env.local  # Add NOVITA_API_KEY, MPESA_API_KEY
dfx start --clean --background
dfx deploy --with-cycles 2000000000000
dfx canister call assist_backend setApiKey '("your-novita-api-key")'
npm run dev
```

## Current Deployment

### Local Development
**Backend**: `uxrrr-q7777-77774-qaaaq-cai` (1.49T cycles) - http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/
**Frontend**: `u6s2n-gx777-77774-qaaba-cai` (1.30T cycles) - http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/
**Candid Interface**: http://127.0.0.1:4943/_/candid?id=uxrrr-q7777-77774-qaaaq-cai

### Test Commands
```bash
# High-risk: dfx canister call packages/backend processMedicalQuery '("patient123", "chest pain and dizzy", opt record { bloodGlucose = opt 45.0 })'
# Medium-risk: dfx canister call packages/backend processMedicalQuery '("patient456", "blood sugar is 250", opt record { bloodGlucose = opt 250.0 })'
# Low-risk: dfx canister call packages/backend processMedicalQuery '("patient789", "breakfast food recommendations", null)'
```

## System Monitoring & Troubleshooting

### Key Metrics & Alerts
- **Metrics**: Query volume, response times (P50/P95/P99), safety score distribution, doctor review rates, API errors
- **Alerts**: Response time >5s, Safety score <40% on >10% queries, Review queue >20 items, API error >1%
- **Diagnostics**: `dfx canister status/logs packages/backend`, `curl Novita API test`, `dfx canister call getMemoryStats`

### Common Issues
- **High Safety Scores**: Check glucose parsing, symptom keywords, prompt changes
- **Slow Response**: Check Novita AI latency, canister performance, query complexity
- **Payment Failures**: Validate M-Pesa credentials, network connectivity, transaction logs

## Technical Architecture
- **Frontend**: React/TypeScript progressive web app
- **Backend**: Motoko canisters on ICP blockchain
- **AI Model**: Baichuan-M2-32B via Novita AI API
- **Database**: ICP stable storage with blockchain audit trail
- **Payments**: M-Pesa, Airtel Money APIs (future)
- **Messaging**: WhatsApp Business API, Africa's Talking SMS/USSD (future)

## Security & Compliance
- Rate limiting: 10 queries/hour per patient
- Encryption for all PII
- HIPAA and Kenya Data Protection Act compliance
- Regular security audits and model evaluation
- API key rotation every 90 days

## Future Features
### Language Support: English/Swahili, medical terminology translation, cultural context, USSD for feature phones
### Integration: M-Pesa payments, WhatsApp Business API, SMS via Africa's Talking, pharmacy routing, SHA insurance

## Target Market Context
- **Users**: 2.5M+ Kenyan diabetes patients, healthcare providers, caregivers
- **Market**: <1000 endocrinologists for 53M population, 60% undiagnosed cases
- **Technology**: 89% mobile penetration, 60% smartphones, 40% feature phones
- **Economics**: Avg consultation KSh 1,500-3,000, M-Pesa processes $314B annually

## Repository
https://github.com/musyokapatrickmutuku/trustcareconnect

**KEY SUCCESS METRIC**: Demonstrate real AI medical guidance via HTTP outcalls from ICP canisters using actual patient context.

## Comprehensive Development Guide

### Testing Strategy
1. **Unit Testing**: Jest, React Testing Library, Motoko testing
2. **Integration Testing**: End-to-end workflow testing, canister integration
3. **E2E Testing**: Playwright for complete user journeys
4. **Load Testing**: k6 (95% requests <2s, error rate <10%)

### Security & Authentication
1. **Authentication**: JWT with refresh tokens, MFA support
2. **RBAC**: Patient/doctor/admin roles with granular permissions
3. **API Security**: Rate limiting, CORS, helmet headers, input validation
4. **Audit Logging**: Comprehensive compliance logging

### CI/CD Pipeline
- **GitHub Actions**: Automated testing, security scans, multi-environment deployment
- **Docker**: Multi-stage builds with health checks
- **Infrastructure**: Terraform for AWS resources (VPC, RDS, ElastiCache, ECS)

### Monitoring & Observability
1. **Logging**: Winston with daily rotation, medical/audit specific loggers
2. **APM**: DataDog integration with custom medical operation metrics
3. **Health Checks**: Comprehensive endpoint monitoring

### Data Management
1. **Database Schema**: PostgreSQL with encryption, audit logs, emergency alerts
2. **Backup & Recovery**: Automated S3 backups with restore testing
3. **Data Retention**: GDPR compliance, 7-year medical record retention
4. **Privacy**: Row-level security, PII encryption

### API Documentation
- **OpenAPI 3.0**: Complete API specification with examples
- **Webhooks**: Emergency alerts, doctor notifications with retry logic
- **SDK**: TypeScript client with error handling and timeouts

**KEY SUCCESS METRIC**: Demonstrate real AI medical guidance via HTTP outcalls from ICP canisters using actual patient context - NO MOCK RESPONSES.
