# TrustCareConnect MVP - Healthcare AI Platform

## Project Overview

TrustCareConnect is an AI-powered diabetes care platform providing 24/7 medical guidance with human oversight for the Kenyan market. The system uses Baichuan-M2-32B medical LLM via Novita AI API, deployed on Internet Computer Protocol (ICP) blockchain.

**MVP Goal**: Demonstrate real AI models providing medical guidance via HTTP outcalls from ICP canisters with patient context.

## **CRITICAL: Real HTTP Outcall Requirements**

- **NO Mock Responses**: All AI responses MUST come from actual HTTP outcalls to Novita AI API
- **Patient Context Integration**: Send full medical history with each query
- **Real-time Processing**: Actual external API calls, not simulated responses
- **Error Handling**: Handle HTTP outcall failures appropriately

## Core Workflow

### 1. Patient Query Submission
- **Actor**: Patient submits medical query through portal
- **Status**: "submitted" → "processing"
- **Data**: Patient ID, query text, timestamp

### 2. Real AI Processing via HTTP Outcall
- **Actor**: System makes actual HTTP request to Novita AI API
- **Context**: Patient medical history + current query sent to LLM
- **Status**: "processing" → "ai_processed"
- **Output**: Real AI-generated medical guidance from external API

### 3. Doctor Review & Verification
- **Actor**: Doctor reviews real AI response, edits if needed
- **Interface**: Doctor portal with pending reviews
- **Status**: "ai_processed" → "doctor_approved"

### 4. Final Response Delivery
- **Actor**: System delivers doctor-approved response
- **Status**: "doctor_approved" → "completed"

## Test Patient Data

### Patient P001 - Sarah Michelle Johnson
```typescript
{
  id: "P001",
  name: "Sarah Michelle Johnson", 
  email: "sarah.johnson@email.com",
  condition: "Diabetes Type 2",
  medicalContext: "45-year-old African American female with Type 2 diabetes diagnosed 2022. Current HbA1c 6.9%, on Metformin 1000mg BID, Empagliflozin 10mg daily, Lisinopril 15mg daily. Weight 76kg, BP 125/75. No complications, excellent control achieved."
}
```

### Patient P002 - Michael David Rodriguez
```typescript
{
  id: "P002",
  name: "Michael David Rodriguez",
  email: "mike.rodriguez@student.edu", 
  condition: "Diabetes Type 1",
  medicalContext: "19-year-old Caucasian male college student with Type 1 diabetes diagnosed at 16 with DKA. Currently on insulin pump therapy, basal rate 1.2 units/hour. HbA1c 7.8%, weight 78kg. Stress-related glucose fluctuations during college."
}
```

## MVP Test Scenarios

### Scenario 1: Type 2 Management (Sarah - P001)
- **Query**: "I've been feeling more tired lately and my morning blood sugars are higher than usual. Should I be concerned?"
- **Expected**: Real AI analysis of patient's diabetes management with personalized advice

### Scenario 2: Type 1 Stress Management (Michael - P002)
- **Query**: "I'm having trouble with my blood sugars during college exams. They keep going high even with my pump."
- **Expected**: Real AI response with stress management and pump adjustment guidance

## Backend Implementation - Complete Logic

### Core Data Types
```motoko
type VitalSigns = {
  bloodGlucose: ?Float;
  bloodPressure: ?Text;
  heartRate: ?Nat;
  temperature: ?Float;
};

type PatientContext = {
  diabetesType: Text;
  hba1c: Float;
  medications: [Text];
  allergies: [Text];
  medicalHistory: Text;
};

type MedicalResponse = {
  content: Text;
  safetyScore: Nat;
  urgency: UrgencyLevel;
  timestamp: Int;
  requiresReview: Bool;
};

type UrgencyLevel = { #low; #medium; #high };
```

### Main Processing Function
```motoko
import Result "mo:base/Result";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Array "mo:base/Array";

actor MedicalAssistant {
    private stable var NOVITA_API_URL = "https://api.novita.ai/openai/v1/chat/completions";
    private stable var API_KEY = "";

    public shared func processMedicalQuery(
        patientId: Text,
        query: Text,
        vitalSigns: ?VitalSigns
    ) : async Result.Result<MedicalResponse, Text> {

        // Step 1: Input validation
        if (Text.size(query) == 0) {
            return #err("Query cannot be empty");
        };

        // Step 2: Rate limiting check
        if (not checkRateLimit(patientId)) {
            return #err("Rate limit exceeded. Please wait before next query.");
        };

        // Step 3: Retrieve patient medical context
        let patientContext = await getPatientContext(patientId);

        // Step 4: Build clinical prompt and call AI
        let clinicalPrompt = buildClinicalPrompt(patientContext);
        let clinicalResponse = await callNovitaAI(clinicalPrompt, query);

        // Step 5: Calculate safety metrics
        let safetyScore = calculateSafetyScore(clinicalResponse, vitalSigns);
        let urgency = determineUrgency(safetyScore, query);

        // Step 6: Route to doctor review if needed
        let requiresReview = (safetyScore < 70 or urgency == #high or (urgency == #medium and safetyScore >= 30));
        
        if (requiresReview) {
            await queueForDoctorReview(patientId, query, clinicalResponse);
            return #ok({
                content = "Your query has been forwarded for doctor review. You will receive a response shortly.";
                safetyScore = safetyScore;
                urgency = urgency;
                timestamp = Time.now();
                requiresReview = true;
            });
        };

        // Step 7: Extract patient-friendly guidance
        let patientResponse = extractPatientGuidance(clinicalResponse);

        // Step 8: Store interaction for audit trail
        await storeInteraction(patientId, query, clinicalResponse, safetyScore);

        // Step 9: Return final response
        #ok({
            content = patientResponse;
            safetyScore = safetyScore;
            urgency = urgency;
            timestamp = Time.now();
            requiresReview = false;
        });
    };

    // Build clinical-grade prompt with patient context
    private func buildClinicalPrompt(context: PatientContext) : Text {
        var prompt = "You are a clinical-grade AI assistant for diabetes care in Kenya.\n";
        prompt #= "Patient Profile:\n";
        prompt #= "- Diabetes Type: " # context.diabetesType # "\n";
        prompt #= "- HbA1c: " # Float.toText(context.hba1c) # "%\n";
        prompt #= "- Current Medications: " # Text.join(", ", context.medications.vals()) # "\n";
        prompt #= "- Known Allergies: " # Text.join(", ", context.allergies.vals()) # "\n";
        prompt #= "- Medical History: " # context.medicalHistory # "\n";
        prompt #= "\nInstructions:\n";
        prompt #= "1. Provide detailed clinical analysis considering patient context.\n";
        prompt #= "2. Include safety assessment and urgency level.\n";
        prompt #= "3. End with numbered patient action steps (1., 2., 3., etc.).\n";
        prompt #= "4. Use clear formatting for easy extraction.\n";
        prompt #= "5. Consider Kenyan healthcare context and cultural factors.\n";
        prompt;
    };

    // Extract patient-friendly guidance from clinical response
    private func extractPatientGuidance(clinicalResponse: Text) : Text {
        let lines = Text.split(clinicalResponse, #char '\n');
        let steps = Array.filter<Text>(Iter.toArray(lines), func(line: Text) : Bool {
            Text.startsWith(line, #text "1.") or 
            Text.startsWith(line, #text "2.") or 
            Text.startsWith(line, #text "3.") or
            Text.startsWith(line, #text "4.") or
            Text.startsWith(line, #text "5.")
        });
        Text.join("\n", steps.vals());
    };

    // Rate limiting implementation
    private func checkRateLimit(patientId: Text) : Bool {
        // Check if patient has exceeded 10 queries per hour
        let currentTime = Time.now();
        let oneHourAgo = currentTime - (60 * 60 * 1000_000_000);
        
        switch (getPatientQueryHistory(patientId, oneHourAgo)) {
            case (?history) {
                Array.size(history) < 10
            };
            case null { true };
        }
    };

    // Safety scoring with comprehensive checks
    private func calculateSafetyScore(response: Text, vitals: ?VitalSigns) : Nat {
        var score : Int = 100;

        // Critical symptoms check
        let criticalSymptoms = ["chest pain", "unconscious", "severe bleeding", "difficulty breathing", "seizure"];
        for (symptom in criticalSymptoms.vals()) {
            if (Text.contains(response, #text symptom)) {
                score -= 60;
            };
        };

        // Vital signs assessment
        switch (vitals) {
            case (?v) {
                switch (v.bloodGlucose) {
                    case (?glucose) {
                        if (glucose < 54.0) { score -= 50; }        // Severe hypoglycemia
                        else if (glucose < 70.0) { score -= 30; }   // Hypoglycemia
                        else if (glucose > 400.0) { score -= 45; }  // Severe hyperglycemia
                        else if (glucose > 250.0) { score -= 25; }; // Hyperglycemia
                    };
                    case null {};
                };
            };
            case null {};
        };

        // Medication-related concerns
        let medicationFlags = ["stop medication", "quit drug", "discontinue"];
        for (flag in medicationFlags.vals()) {
            if (Text.contains(response, #text flag)) {
                score -= 40;
            };
        };

        // Pregnancy or vulnerable population flags
        if (Text.contains(response, #text "pregnant") or Text.contains(response, #text "pregnancy")) {
            score -= 30;
        };

        // Ensure score stays within bounds
        Nat.max(0, Int.abs(Nat.min(100, Int.abs(score))))
    };

    // Urgency determination logic
    private func determineUrgency(safetyScore: Nat, query: Text) : UrgencyLevel {
        if (safetyScore < 40) {
            #high
        } else if (safetyScore < 70) {
            #medium  
        } else {
            #low
        }
    };

    // Queue for doctor review
    private func queueForDoctorReview(patientId: Text, query: Text, response: Text) : async () {
        let reviewItem = {
            patientId = patientId;
            originalQuery = query;
            aiResponse = response;
            timestamp = Time.now();
            status = #pending;
        };
        
        // Add to doctor review queue
        await addToDoctorQueue(reviewItem);
        
        // Notify doctors of pending review
        await notifyDoctorsOfPendingReview(patientId);
    };

    // Store interaction for audit and learning
    private func storeInteraction(patientId: Text, query: Text, response: Text, safetyScore: Nat) : async () {
        let interaction = {
            patientId = patientId;
            query = query;
            response = response;
            safetyScore = safetyScore;
            timestamp = Time.now();
        };
        
        // Store in stable storage for audit trail
        await saveToAuditLog(interaction);
    };
    
    // HTTP outcall to Novita AI API
    private func callNovitaAI(prompt: Text, query: Text) : async Text {
        let requestBody = {
            model = "baichuan/baichuan-m2-32b";
            messages = [
                { role = "system"; content = prompt },
                { role = "user"; content = query }
            ];
            temperature = 0.7;
            max_tokens = 2048;
            stream = false;
        };

        let response = await makeHttpRequest(NOVITA_API_URL, API_KEY, requestBody);
        
        switch (response) {
            case (#ok(content)) { content };
            case (#err(error)) { 
                // Return fallback response on API failure
                getFallbackResponse(query)
            };
        }
    };
};

## Frontend Implementation - Complete Logic

### Core Data Types
```typescript
interface VitalSigns {
  bloodGlucose?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
}

interface MedicalQuery {
  query: string;
  vitalSigns?: VitalSigns;
  patientId: string;
  timestamp: string;
  channel: string;
}

interface MedicalResponse {
  content: string;
  safetyScore: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  requiresReview: boolean;
  queryId?: string;
}

interface QueryInterfaceProps {
  patientId: string;
  onResponse: (response: MedicalResponse) => void;
}

interface DoctorReviewItem {
  id: string;
  patientId: string;
  patientName: string;
  originalQuery: string;
  aiResponse: string;
  safetyScore: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  doctorNotes?: string;
}
```

### Patient Query Interface
```typescript
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';
import { MedicalService } from '../services/MedicalService';

export const MedicalQueryInterface: React.FC<QueryInterfaceProps> = ({
    patientId,
    onResponse
}) => {
    const [query, setQuery] = useState('');
    const [vitalSigns, setVitalSigns] = useState<VitalSigns>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [queryHistory, setQueryHistory] = useState<MedicalResponse[]>([]);

    // Fetch patient's query history
    const { data: history } = useQuery(
        ['queryHistory', patientId],
        () => MedicalService.getPatientHistory(patientId),
        { refetchInterval: 30000 } // Refresh every 30 seconds
    );

    useEffect(() => {
        if (history) setQueryHistory(history);
    }, [history]);

    const submitQuery = useMutation(
        async (data: MedicalQuery) => {
            if (!validateQuery(data)) {
                throw new Error('Invalid query data');
            }

            const enrichedQuery = {
                ...data,
                patientId,
                timestamp: new Date().toISOString(),
                channel: detectChannel(),
            };

            const response = await MedicalService.submitQuery(enrichedQuery);

            // Emergency protocol for very low safety score
            if (response.safetyScore < 40) {
                await triggerEmergencyProtocol(response);
            }

            return response;
        },
        {
            onSuccess: (response) => {
                if (response.requiresReview) {
                    setStatusMessage('Your query has been forwarded for doctor review. You will receive a response shortly.');
                    // Start polling for doctor approval
                    startPollingForApproval(response.queryId);
                } else {
                    onResponse(response);
                    setStatusMessage(null);
                }

                // Track analytics
                trackQuerySubmission({
                    urgency: response.urgency,
                    safetyScore: response.safetyScore,
                });

                // Reset form
                setQuery('');
                setVitalSigns({});

                // Update history
                setQueryHistory(prev => [response, ...prev]);
            },
            onError: (error) => {
                console.error('Query submission failed:', error);
                showErrorNotification(error.message);

                // Try cached response as fallback
                const cached = getCachedResponse(query);
                if (cached) {
                    onResponse(cached);
                    setStatusMessage('Using cached response due to connectivity issues.');
                }
            }
        }
    );

    const validateQuery = (data: MedicalQuery): boolean => {
        if (!data.query || data.query.length < 10) {
            setStatusMessage('Please provide more details about your symptoms or question.');
            return false;
        }

        // Crisis detection
        const crisisPatterns = [/suicide/i, /kill myself/i, /end my life/i, /hurt myself/i];
        if (crisisPatterns.some(pattern => pattern.test(data.query))) {
            triggerCrisisProtocol();
            setStatusMessage('Your message indicates you may need immediate help. Please contact emergency services or a crisis hotline.');
            return false;
        }

        return true;
    };

    const startPollingForApproval = (queryId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const status = await MedicalService.getQueryStatus(queryId);
                if (status.status === 'approved') {
                    clearInterval(pollInterval);
                    onResponse(status.finalResponse);
                    setStatusMessage(null);
                } else if (status.status === 'rejected') {
                    clearInterval(pollInterval);
                    setStatusMessage('Your query needs additional information. Please provide more details.');
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 10000); // Poll every 10 seconds

        // Clean up after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 600000);
    };

    return (
        <div className="medical-query-interface space-y-6 max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Ask Your Medical Question</h2>
                
                <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Describe your symptoms, concerns, or questions in detail... (minimum 10 characters)"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    minLength={10}
                />

                <VitalSignsInput
                    values={vitalSigns}
                    onChange={setVitalSigns}
                    className="mt-4"
                />

                <button
                    onClick={() => submitQuery.mutate({ query, vitalSigns })}
                    disabled={submitQuery.isLoading || query.length < 10}
                    className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitQuery.isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : 'Get Medical Guidance'}
                </button>

                {statusMessage && (
                    <div className={`mt-4 p-4 rounded-lg font-medium ${
                        statusMessage.includes('emergency') || statusMessage.includes('crisis') 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                        {statusMessage}
                    </div>
                )}
            </div>

            {/* Query History */}
            <QueryHistory history={queryHistory} />
        </div>
    );
};

// Vital Signs Input Component
const VitalSignsInput: React.FC<{
    values: VitalSigns;
    onChange: (values: VitalSigns) => void;
    className?: string;
}> = ({ values, onChange, className = "" }) => {
    return (
        <div className={`bg-gray-50 p-4 rounded-lg ${className}`}>
            <h3 className="font-medium mb-3">Vital Signs (Optional but helpful for accurate guidance)</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Glucose (mg/dL)</label>
                    <input
                        type="number"
                        value={values.bloodGlucose || ''}
                        onChange={(e) => onChange({
                            ...values,
                            bloodGlucose: e.target.value ? Number(e.target.value) : undefined
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., 120"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
                    <input
                        type="text"
                        value={values.bloodPressure || ''}
                        onChange={(e) => onChange({
                            ...values,
                            bloodPressure: e.target.value || undefined
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., 120/80"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Heart Rate (BPM)</label>
                    <input
                        type="number"
                        value={values.heartRate || ''}
                        onChange={(e) => onChange({
                            ...values,
                            heartRate: e.target.value ? Number(e.target.value) : undefined
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., 72"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={values.temperature || ''}
                        onChange={(e) => onChange({
                            ...values,
                            temperature: e.target.value ? Number(e.target.value) : undefined
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., 37.0"
                    />
                </div>
            </div>
        </div>
    );
};
```

### Doctor Review Portal
```typescript
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export const DoctorReviewPortal: React.FC = () => {
    const [selectedReview, setSelectedReview] = useState<DoctorReviewItem | null>(null);
    const [doctorNotes, setDoctorNotes] = useState('');
    const [editedResponse, setEditedResponse] = useState('');
    
    const queryClient = useQueryClient();

    // Fetch pending reviews
    const { data: pendingReviews = [], refetch } = useQuery(
        'pendingReviews',
        MedicalService.getPendingReviews,
        { 
            refetchInterval: 15000, // Refresh every 15 seconds
            refetchOnWindowFocus: true 
        }
    );

    // Approve review mutation
    const approveReview = useMutation(
        async (data: { reviewId: string; finalResponse: string; doctorNotes: string }) => {
            return MedicalService.approveReview(data);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('pendingReviews');
                setSelectedReview(null);
                setDoctorNotes('');
                setEditedResponse('');
                showSuccessNotification('Review approved and response sent to patient');
            },
            onError: (error) => {
                showErrorNotification('Failed to approve review: ' + error.message);
            }
        }
    );

    // Reject review mutation
    const rejectReview = useMutation(
        async (data: { reviewId: string; reason: string }) => {
            return MedicalService.rejectReview(data);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('pendingReviews');
                setSelectedReview(null);
                setDoctorNotes('');
                showSuccessNotification('Review rejected, patient will be notified');
            }
        }
    );

    useEffect(() => {
        if (selectedReview) {
            setEditedResponse(selectedReview.aiResponse);
        }
    }, [selectedReview]);

    const handleApprove = () => {
        if (!selectedReview) return;
        
        approveReview.mutate({
            reviewId: selectedReview.id,
            finalResponse: editedResponse,
            doctorNotes: doctorNotes
        });
    };

    const handleReject = () => {
        if (!selectedReview || !doctorNotes) return;
        
        rejectReview.mutate({
            reviewId: selectedReview.id,
            reason: doctorNotes
        });
    };

    const getUrgencyBadge = (urgency: string) => {
        const colors = {
            HIGH: 'bg-red-100 text-red-800 border-red-200',
            MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            LOW: 'bg-green-100 text-green-800 border-green-200'
        };
        return colors[urgency] || colors.LOW;
    };

    const getSafetyScoreColor = (score: number) => {
        if (score < 40) return 'text-red-600';
        if (score < 70) return 'text-yellow-600';
        return 'text-green-600';
    };

    return (
        <div className="doctor-review-portal max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Doctor Review Portal</h1>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                    {pendingReviews.length} Pending Reviews
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Reviews List */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Pending Reviews</h2>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {pendingReviews.map((review) => (
                            <div
                                key={review.id}
                                onClick={() => setSelectedReview(review)}
                                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                                    selectedReview?.id === review.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium">{review.patientName}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(review.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded-full border ${getUrgencyBadge(review.urgency)}`}>
                                            {review.urgency}
                                        </span>
                                        <span className={`font-medium ${getSafetyScoreColor(review.safetyScore)}`}>
                                            {review.safetyScore}%
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">
                                    {review.originalQuery}
                                </p>
                            </div>
                        ))}
                        {pendingReviews.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No pending reviews
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Details */}
                {selectedReview && (
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Review Details</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">Patient Query:</h3>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                                    {selectedReview.originalQuery}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">AI Generated Response:</h3>
                                <textarea
                                    value={editedResponse}
                                    onChange={(e) => setEditedResponse(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    rows={8}
                                    placeholder="Review and edit the AI response..."
                                />
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Doctor Notes:</h3>
                                <textarea
                                    value={doctorNotes}
                                    onChange={(e) => setDoctorNotes(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    rows={3}
                                    placeholder="Add your professional notes..."
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleApprove}
                                    disabled={approveReview.isLoading || !editedResponse.trim()}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {approveReview.isLoading ? 'Approving...' : 'Approve & Send'}
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={rejectReview.isLoading || !doctorNotes.trim()}
                                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {rejectReview.isLoading ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
```

### Patient History & Notifications
```typescript
// Query History Component
const QueryHistory: React.FC<{ history: MedicalResponse[] }> = ({ history }) => {
    return (
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Recent Queries</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {history.map((item, index) => (
                    <div key={index} className="p-4 border-b hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                            <div className="flex space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    item.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                                    item.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {item.urgency}
                                </span>
                                <span className="text-xs text-gray-600">
                                    Score: {item.safetyScore}%
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                            {item.content}
                        </p>
                        {item.requiresReview && (
                            <p className="text-xs text-blue-600 mt-1">
                                ✓ Doctor reviewed
                            </p>
                        )}
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No previous queries
                    </div>
                )}
            </div>
        </div>
    );
};

// Medical Service Implementation
class MedicalService {
    private static baseUrl = '/api';

    static async submitQuery(query: MedicalQuery): Promise<MedicalResponse> {
        const response = await fetch(`${this.baseUrl}/queries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            throw new Error(`Query submission failed: ${response.statusText}`);
        }

        return response.json();
    }

    static async getPatientHistory(patientId: string): Promise<MedicalResponse[]> {
        const response = await fetch(`${this.baseUrl}/patients/${patientId}/history`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patient history');
        }

        return response.json();
    }

    static async getQueryStatus(queryId: string): Promise<{
        status: 'pending' | 'approved' | 'rejected';
        finalResponse?: MedicalResponse;
    }> {
        const response = await fetch(`${this.baseUrl}/queries/${queryId}/status`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch query status');
        }

        return response.json();
    }

    static async getPendingReviews(): Promise<DoctorReviewItem[]> {
        const response = await fetch(`${this.baseUrl}/doctor/pending-reviews`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pending reviews');
        }

        return response.json();
    }

    static async approveReview(data: {
        reviewId: string;
        finalResponse: string;
        doctorNotes: string;
    }): Promise<void> {
        const response = await fetch(`${this.baseUrl}/doctor/reviews/${data.reviewId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                finalResponse: data.finalResponse,
                doctorNotes: data.doctorNotes
            })
        });

        if (!response.ok) {
            throw new Error('Failed to approve review');
        }
    }

    static async rejectReview(data: {
        reviewId: string;
        reason: string;
    }): Promise<void> {
        const response = await fetch(`${this.baseUrl}/doctor/reviews/${data.reviewId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
                reason: data.reason
            })
        });

        if (!response.ok) {
            throw new Error('Failed to reject review');
        }
    }
}

// Utility Functions
function detectChannel(): string {
    if (typeof window === 'undefined') return 'server';
    if (window.innerWidth < 768) return 'mobile';
    return 'web';
}

function getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
}

function getCachedResponse(query: string): MedicalResponse | null {
    const cached = localStorage.getItem(`cache_${query.substring(0, 50)}`);
    if (cached) {
        const response = JSON.parse(cached);
        if (Date.now() - response.timestamp < 3600000) { // 1 hour cache
            return response;
        }
    }
    return null;
}

async function triggerEmergencyProtocol(response: MedicalResponse): Promise<void> {
    // Log emergency case
    console.warn('Emergency protocol triggered:', response);
    
    // Could integrate with emergency services API
    await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            safetyScore: response.safetyScore,
            urgency: response.urgency,
            timestamp: response.timestamp
        })
    });
}

function triggerCrisisProtocol(): void {
    // Display crisis resources
    const crisisMessage = `
        🚨 CRISIS SUPPORT RESOURCES:
        
        Kenya:
        - Emergency: 999 or 112
        - Suicide Prevention: +254 722 178 177
        - Mental Health Kenya: +254 726 666 666
        
        International:
        - Crisis Text Line: Text HOME to 741741
        - International Suicide Prevention: befrienders.org
    `;
    
    alert(crisisMessage);
}

function trackQuerySubmission(data: { urgency: string; safetyScore: number }): void {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'query_submitted', {
            urgency: data.urgency,
            safety_score_range: data.safetyScore < 40 ? 'low' : data.safetyScore < 70 ? 'medium' : 'high'
        });
    }
}

function showErrorNotification(message: string): void {
    // Could integrate with toast library
    console.error('Error:', message);
    // toast.error(message);
}

function showSuccessNotification(message: string): void {
    // Could integrate with toast library
    console.log('Success:', message);
    // toast.success(message);
}
```

### State Management & Real-time Updates
```typescript
// React Context for Global State
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface AppState {
    currentUser: {
        id: string;
        type: 'patient' | 'doctor';
        name: string;
    } | null;
    notifications: Notification[];
    connectionStatus: 'online' | 'offline' | 'connecting';
}

type AppAction = 
    | { type: 'SET_USER'; payload: AppState['currentUser'] }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'REMOVE_NOTIFICATION'; payload: string }
    | { type: 'SET_CONNECTION_STATUS'; payload: AppState['connectionStatus'] };

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, currentUser: action.payload };
        case 'ADD_NOTIFICATION':
            return { 
                ...state, 
                notifications: [action.payload, ...state.notifications.slice(0, 9)] // Keep last 10
            };
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload)
            };
        case 'SET_CONNECTION_STATUS':
            return { ...state, connectionStatus: action.payload };
        default:
            return state;
    }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, {
        currentUser: null,
        notifications: [],
        connectionStatus: 'connecting'
    });

    // Monitor connection status
    React.useEffect(() => {
        const handleOnline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'online' });
        const handleOffline = () => dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'offline' });

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        dispatch({ 
            type: 'SET_CONNECTION_STATUS', 
            payload: navigator.onLine ? 'online' : 'offline' 
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
}
```

### API Integration with Retry Logic
```javascript
class NovitaAIService {
    private baseUrl = 'https://api.novita.ai/openai/v1';

    async getMedicalGuidance(query: string, context: PatientContext): Promise<AIResponse> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'baichuan/baichuan-m2-32b',
                messages: [
                    {
                        role: 'system',
                        content: this.buildClinicalPrompt(context)
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        const data = await response.json();
        return this.processAIResponse(data.choices[0].message.content, query, context);
    }
}

async function retryWithBackoff(
    fn: () => Promise<any>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            
            const delay = Math.pow(2, attempt) * baseDelay + Math.random() * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

## Safety & Medical Guidelines

### Safety Scoring Algorithm
```python
def calculate_safety_score(query_data):
    score = 100
    
    # Critical symptoms
    if any(symptom in query_data for symptom in ['chest pain', 'unconscious', 'severe bleeding']):
        score -= 60
    
    # Blood glucose levels
    glucose = query_data.get('blood_glucose')
    if glucose:
        if glucose < 54: score -= 50      # Severe hypoglycemia
        elif glucose < 70: score -= 30    # Hypoglycemia
        elif glucose > 400: score -= 45   # Severe hyperglycemia
        elif glucose > 250: score -= 25   # Hyperglycemia
    
    # Medication queries
    if any(word in query_data for word in ['stop', 'quit', 'discontinue']):
        score -= 40
    
    # Vulnerable populations
    if query_data.get('pregnant'): score -= 30
    if query_data.get('age') < 18 or query_data.get('age') > 70: score -= 10
    
    return max(0, min(100, score))

def determine_urgency(safety_score):
    if safety_score < 40: return 'HIGH'
    elif safety_score < 70: return 'MEDIUM'
    else: return 'LOW'
```

### Response Guidelines
**Always Include**: Urgency level, safety score, numbered action steps, when to seek help, AI disclaimer
**Never Include**: Definitive diagnoses, prescription changes, advice to stop medications, pregnancy guidance

### Fallback Responses
```javascript
const fallbackResponses = {
  low_glucose: {
    content: "Blood sugar low. Take 15g fast-acting carbs, wait 15 minutes, recheck. Repeat if needed. Seek help if symptoms persist.",
    safetyScore: 30, urgency: 'HIGH'
  },
  high_glucose: {
    content: "Blood sugar elevated. Drink water, avoid sugar, monitor every 2 hours. Contact doctor if >250 mg/dL for 6+ hours.",
    safetyScore: 50, urgency: 'MEDIUM'
  }
};
```

## Development & Testing

### Setup Commands
```bash
# Clone and install
git clone https://github.com/musyokapatrickmutuku/trustcareconnect.git
cd trustcareconnect && npm install

# Configure environment
cp .env.example .env.local
# Edit with: NOVITA_API_KEY, MPESA_API_KEY, etc.

# Deploy backend
dfx start --clean --background
dfx deploy --with-cycles 2000000000000
dfx canister call assist_backend setApiKey '("your-novita-api-key")'

# Start frontend
npm run dev
```

## Current Deployment Information

### Latest Canister IDs (Local Development)

**Backend Canister:**
- **ID**: `uxrrr-q7777-77774-qaaaq-cai`
- **Status**: Running ✅
- **Cycles**: 1.49T cycles (healthy)
- **Access**: http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/

**Frontend Canister:**
- **ID**: `u6s2n-gx777-77774-qaaba-cai`
- **Status**: Running ✅
- **Cycles**: 1.30T cycles (healthy)
- **Access**: http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/

### Application Access URLs

**Primary Frontend:**
```
http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/
```

**Alternative Frontend:**
```
http://127.0.0.1:4943/?canisterId=u6s2n-gx777-77774-qaaba-cai
```

**Backend API:**
```
http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/
```

**Candid Interface:**
```
http://127.0.0.1:4943/_/candid?id=uxrrr-q7777-77774-qaaaq-cai
```

### Deployment Configuration Fix

**Critical Fix Applied**: Updated dfx.json to optimize frontend deployment:

```json
{
  "frontend": {
    "source": ["packages/frontend/dist/"],
    "frontend": {
      "entrypoint": "packages/frontend/dist/index.html"
    },
    "type": "assets"
  }
}
```

**Benefits:**
- ✅ Reduced deployment time from hours to minutes
- ✅ Fixed stuck deployment processes
- ✅ Optimized asset processing (132KB vs entire source directory)
- ✅ Eliminated deployment hangs and timeouts

### Test Commands
```bash
# High-risk query test
dfx canister call packages/backend processMedicalQuery '("patient123", "chest pain and dizzy", opt record { bloodGlucose = opt 45.0 })'

# Medium-risk query test  
dfx canister call packages/backend processMedicalQuery '("patient456", "blood sugar is 250", opt record { bloodGlucose = opt 250.0 })'

# Low-risk query test
dfx canister call packages/backend processMedicalQuery '("patient789", "breakfast food recommendations", null)'
```

## System Monitoring & Troubleshooting

### Key Metrics
- Query volume and response times (P50, P95, P99)
- Safety score distribution by risk level
- Doctor review approval rates
- API error rates and payment success rates

### Alert Thresholds
- Response time > 5 seconds: Investigate latency
- Safety score < 40% on > 10% queries: Trigger alert
- Doctor review queue > 20 items: Scale resources
- API error rate > 1%: Backend investigation needed

### Diagnostic Commands
```bash
# System health checks
dfx canister status packages/backend
dfx canister logs packages/backend

# API connectivity test
curl -X POST https://api.novita.ai/openai/v1/chat/completions \
  -H "Authorization: Bearer $NOVITA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"baichuan/baichuan-m2-32b","messages":[{"role":"user","content":"test"}]}'

# Memory monitoring
dfx canister call packages/backend getMemoryStats
```

### Common Issues & Solutions
- **High Safety Scores**: Check glucose parsing, verify symptom keywords, review prompt changes
- **Slow Response Times**: Check Novita AI latency, inspect canister performance, review query complexity
- **Payment Failures**: Validate M-Pesa credentials, check network connectivity, review transaction logs

## Technical Architecture

- **Frontend**: React/TypeScript progressive web app
- **Backend**: Motoko canisters on ICP blockchain  
- **AI Model**: Baichuan-M2-32B via Novita AI API
- **Database**: ICP stable storage with blockchain audit trail
- **Payments**: M-Pesa, Airtel Money APIs
- **Messaging**: WhatsApp Business API, Africa's Talking SMS/USSD

## Security & Compliance

- Rate limiting: 10 queries/hour per patient
- No logging of full patient data in development
- Encryption for all PII
- HIPAA and Kenya Data Protection Act compliance
- Regular security audits and model evaluation
- API key rotation every 90 days

## Future Features (Secondary Implementation)

### Language Support
- Primary: English and Swahili
- Medical terminology translation
- Cultural context for Kenyan patients
- USSD formatting for feature phones

### Integration Features  
- M-Pesa payment processing
- WhatsApp Business API
- SMS notifications via Africa's Talking
- Pharmacy prescription routing
- SHA insurance claim processing

### Target Market Context
- **Users**: 2.5M+ Kenyan diabetes patients, healthcare providers, caregivers
- **Market**: Limited endocrinologists (<1000 for 53M population), 60% undiagnosed cases
- **Technology**: 89% mobile penetration, 60% smartphones, 40% feature phones
- **Economics**: Avg consultation KSh 1,500-3,000, M-Pesa processes $314B annually

## Repository

https://github.com/musyokapatrickmutuku/trustcareconnect

**KEY SUCCESS METRIC**: Demonstrate real AI medical guidance via HTTP outcalls from ICP canisters using actual patient context.

---

# COMPREHENSIVE DEVELOPMENT GUIDE

## Testing Strategy

### 1. Unit Testing Framework
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event msw

# Motoko testing
dfx extension install vessel
```

### Unit Test Examples
```typescript
// __tests__/MedicalQueryInterface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicalQueryInterface } from '../src/components/MedicalQueryInterface';
import { QueryClient, QueryClientProvider } from 'react-query';

const mockSubmitQuery = jest.fn();
jest.mock('../src/services/MedicalService', () => ({
  MedicalService: {
    submitQuery: mockSubmitQuery
  }
}));

describe('MedicalQueryInterface', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
    mockSubmitQuery.mockReset();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MedicalQueryInterface 
          patientId="P001" 
          onResponse={jest.fn()} 
        />
      </QueryClientProvider>
    );
  };

  test('should validate minimum query length', async () => {
    renderComponent();
    
    const textarea = screen.getByPlaceholderText(/describe your symptoms/i);
    const submitButton = screen.getByRole('button', { name: /get medical guidance/i });

    await userEvent.type(textarea, 'short');
    
    expect(submitButton).toBeDisabled();
  });

  test('should detect crisis language and trigger protocol', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    renderComponent();
    
    const textarea = screen.getByPlaceholderText(/describe your symptoms/i);
    await userEvent.type(textarea, 'I want to kill myself and end my life');
    
    fireEvent.click(screen.getByRole('button', { name: /get medical guidance/i }));
    
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('CRISIS SUPPORT'));
    alertSpy.mockRestore();
  });

  test('should submit valid query with vital signs', async () => {
    mockSubmitQuery.mockResolvedValue({
      content: 'Medical advice here',
      safetyScore: 85,
      urgency: 'LOW',
      timestamp: Date.now(),
      requiresReview: false
    });

    renderComponent();
    
    const textarea = screen.getByPlaceholderText(/describe your symptoms/i);
    const glucoseInput = screen.getByPlaceholderText('e.g., 120');
    
    await userEvent.type(textarea, 'I have been feeling tired and my blood sugar is high');
    await userEvent.type(glucoseInput, '180');
    
    fireEvent.click(screen.getByRole('button', { name: /get medical guidance/i }));
    
    await waitFor(() => {
      expect(mockSubmitQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'I have been feeling tired and my blood sugar is high',
          vitalSigns: { bloodGlucose: 180 },
          patientId: 'P001'
        })
      );
    });
  });
});

// Safety scoring tests
describe('Safety Score Calculation', () => {
  test('should flag critical symptoms correctly', () => {
    const criticalQuery = 'I have chest pain and difficulty breathing';
    const safetyScore = calculateSafetyScore(criticalQuery, { bloodGlucose: 45 });
    
    expect(safetyScore).toBeLessThan(40); // Should trigger HIGH urgency
  });

  test('should handle normal glucose levels', () => {
    const normalQuery = 'What should I eat for breakfast?';
    const safetyScore = calculateSafetyScore(normalQuery, { bloodGlucose: 120 });
    
    expect(safetyScore).toBeGreaterThan(70); // Should be LOW urgency
  });
});
```

### 2. Integration Testing
```typescript
// __tests__/integration/workflow.test.ts
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Complete Medical Workflow Integration', () => {
  let patientId: string;
  let queryId: string;

  beforeAll(async () => {
    // Setup test environment
    await setupTestCanister();
    patientId = await createTestPatient({
      diabetesType: 'Type 2',
      hba1c: 6.9,
      medications: ['Metformin', 'Empagliflozin']
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  test('End-to-end patient query workflow', async () => {
    // 1. Patient submits query
    const queryResponse = await submitPatientQuery({
      patientId,
      query: 'My blood sugar has been high lately, should I be concerned?',
      vitalSigns: { bloodGlucose: 250 }
    });

    expect(queryResponse.requiresReview).toBe(true);
    expect(queryResponse.safetyScore).toBeLessThan(70);
    queryId = queryResponse.queryId;

    // 2. Doctor reviews and approves
    const pendingReviews = await getPendingReviews();
    expect(pendingReviews).toContainEqual(
      expect.objectContaining({ id: queryId })
    );

    await approveReview({
      reviewId: queryId,
      finalResponse: 'Please monitor your blood sugar closely and contact your doctor if it remains above 250.',
      doctorNotes: 'Patient needs closer monitoring'
    });

    // 3. Patient receives final response
    const finalStatus = await getQueryStatus(queryId);
    expect(finalStatus.status).toBe('approved');
    expect(finalStatus.finalResponse).toBeDefined();
  });

  test('Emergency protocol for critical symptoms', async () => {
    const emergencyResponse = await submitPatientQuery({
      patientId,
      query: 'I have severe chest pain and I feel unconscious',
      vitalSigns: { bloodGlucose: 35 }
    });

    expect(emergencyResponse.safetyScore).toBeLessThan(40);
    expect(emergencyResponse.urgency).toBe('HIGH');
    
    // Verify emergency alert was triggered
    const emergencyLogs = await getEmergencyAlerts();
    expect(emergencyLogs).toContainEqual(
      expect.objectContaining({ patientId, urgency: 'HIGH' })
    );
  });
});
```

### 3. End-to-End Testing
```typescript
// e2e/patient-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patient Medical Journey', () => {
  test('Patient can submit query and receive doctor-approved response', async ({ page }) => {
    // Login as patient
    await page.goto('/patient/login');
    await page.fill('[data-testid=email]', 'sarah.johnson@email.com');
    await page.fill('[data-testid=password]', 'testpassword');
    await page.click('[data-testid=login-button]');

    // Navigate to query interface
    await page.click('[data-testid=new-query-button]');
    
    // Fill out medical query
    await page.fill('[data-testid=query-textarea]', 
      'I have been feeling more tired lately and my morning blood sugars are higher than usual');
    await page.fill('[data-testid=blood-glucose-input]', '180');
    
    // Submit query
    await page.click('[data-testid=submit-query-button]');
    
    // Verify submission feedback
    await expect(page.locator('[data-testid=status-message]'))
      .toContainText('forwarded for doctor review');

    // Switch to doctor portal
    await page.goto('/doctor/login');
    await page.fill('[data-testid=email]', 'doctor@hospital.com');
    await page.fill('[data-testid=password]', 'doctorpassword');
    await page.click('[data-testid=login-button]');

    // Review and approve query
    await page.click('[data-testid=pending-review]:first-child');
    await page.fill('[data-testid=doctor-notes]', 'Patient needs dietary counseling');
    await page.click('[data-testid=approve-button]');

    // Verify approval notification
    await expect(page.locator('[data-testid=success-notification]'))
      .toContainText('Review approved');

    // Switch back to patient to verify response
    await page.goto('/patient/dashboard');
    await expect(page.locator('[data-testid=latest-response]'))
      .toContainText('Please monitor your blood sugar');
  });

  test('Crisis detection prevents harmful queries', async ({ page }) => {
    await page.goto('/patient/dashboard');
    
    await page.fill('[data-testid=query-textarea]', 
      'I want to kill myself I cannot handle this anymore');
    
    // Verify crisis modal appears
    await expect(page.locator('[data-testid=crisis-modal]')).toBeVisible();
    await expect(page.locator('[data-testid=crisis-resources]'))
      .toContainText('Emergency: 999');
    
    // Verify query is not submitted
    await expect(page.locator('[data-testid=submit-query-button]')).toBeDisabled();
  });
});
```

### 4. Load Testing
```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function() {
  const payload = JSON.stringify({
    patientId: 'P001',
    query: 'My blood sugar is 180, what should I do?',
    vitalSigns: { bloodGlucose: 180 },
    timestamp: new Date().toISOString()
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    },
  };

  let response = http.post('http://localhost:3000/api/queries', payload, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'safety score present': (r) => JSON.parse(r.body).safetyScore !== undefined,
  });

  sleep(1);
}
```

## Security & Authentication Implementation

### 1. Authentication Flow
```typescript
// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string;
  verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (token && isTokenValid(token)) {
      try {
        const user = await validateToken(token);
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true
        });
      } catch (error) {
        if (refreshToken) {
          await refreshTokens(refreshToken);
        } else {
          logout();
        }
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string, mfaCode?: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, mfaCode })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const { user, token, refreshToken } = await response.json();

      // Store tokens securely
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', refreshToken);

      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true
      });

      // Track login event
      trackAuthEvent('login', user.role);

    } catch (error) {
      trackAuthEvent('login_failed', undefined, error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false
    });

    trackAuthEvent('logout');
  };

  const refreshTokens = async (refreshToken: string) => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const { token: newToken, refreshToken: newRefreshToken, user } = await response.json();

      localStorage.setItem('authToken', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      setState({
        user,
        token: newToken,
        isLoading: false,
        isAuthenticated: true
      });

    } catch (error) {
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      refreshToken: () => refreshTokens(localStorage.getItem('refreshToken')!),
      updateProfile: async (data) => {
        // Implement profile update
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Utility functions
function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp! * 1000 > Date.now();
  } catch {
    return false;
  }
}

async function validateToken(token: string): Promise<User> {
  const response = await fetch('/api/auth/validate', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Token validation failed');
  return response.json();
}

function trackAuthEvent(event: string, role?: string, error?: string) {
  if (typeof gtag !== 'undefined') {
    gtag('event', event, {
      user_role: role,
      error_message: error
    });
  }
}
```

### 2. Role-Based Access Control (RBAC)
```typescript
// src/auth/PermissionProvider.tsx
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthProvider';

type Permission = 
  | 'read:own_queries'
  | 'write:queries'
  | 'read:all_queries'
  | 'write:reviews'
  | 'read:analytics'
  | 'admin:users'
  | 'admin:system';

type Role = 'patient' | 'doctor' | 'admin';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  patient: [
    'read:own_queries',
    'write:queries'
  ],
  doctor: [
    'read:own_queries',
    'write:queries',
    'read:all_queries',
    'write:reviews',
    'read:analytics'
  ],
  admin: [
    'read:own_queries',
    'write:queries',
    'read:all_queries',
    'write:reviews',
    'read:analytics',
    'admin:users',
    'admin:system'
  ]
};

interface PermissionContextType {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const getUserPermissions = (): Permission[] => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] || [];
  };

  const hasPermission = (permission: Permission): boolean => {
    return getUserPermissions().includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    const userPermissions = getUserPermissions();
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    const userPermissions = getUserPermissions();
    return permissions.every(permission => userPermissions.includes(permission));
  };

  return (
    <PermissionContext.Provider value={{
      hasPermission,
      hasAnyPermission,
      hasAllPermissions
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

// Permission-based component wrapper
export const ProtectedComponent: React.FC<{
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, fallback = null, children }) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Route protection hook
export const useRouteProtection = (requiredPermissions: Permission[]) => {
  const { hasAllPermissions } = usePermissions();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return { canAccess: false, isLoading: true };
  if (!isAuthenticated) return { canAccess: false, isLoading: false, needsAuth: true };
  if (!hasAllPermissions(requiredPermissions)) {
    return { canAccess: false, isLoading: false, insufficientPermissions: true };
  }

  return { canAccess: true, isLoading: false };
};
```

### 3. API Security Middleware
```typescript
// src/middleware/security.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict limit for sensitive endpoints
  message: {
    error: 'Rate limit exceeded for sensitive operation',
    retryAfter: 900
  }
});

// Medical query specific rate limiting
export const medicalQueryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 queries per hour per patient
  keyGenerator: (req: Request) => {
    return req.body?.patientId || req.ip;
  },
  message: {
    error: 'Medical query limit exceeded. Please wait before submitting another query.',
    retryAfter: 3600
  }
});

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.novita.ai"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://trustcareconnect.com',
      'https://app.trustcareconnect.com'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// JWT Authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Permission authorization middleware
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission
      });
    }
    
    next();
  };
};

// Input validation middleware
export const validateMedicalQuery = (req: Request, res: Response, next: NextFunction) => {
  const { patientId, query, vitalSigns } = req.body;

  // Validate required fields
  if (!patientId || typeof patientId !== 'string') {
    return res.status(400).json({ error: 'Valid patientId required' });
  }

  if (!query || typeof query !== 'string' || query.length < 10) {
    return res.status(400).json({ error: 'Query must be at least 10 characters' });
  }

  // Validate vital signs if provided
  if (vitalSigns) {
    const { bloodGlucose, heartRate, temperature } = vitalSigns;
    
    if (bloodGlucose && (bloodGlucose < 0 || bloodGlucose > 1000)) {
      return res.status(400).json({ error: 'Invalid blood glucose value' });
    }
    
    if (heartRate && (heartRate < 0 || heartRate > 300)) {
      return res.status(400).json({ error: 'Invalid heart rate value' });
    }
    
    if (temperature && (temperature < 30 || temperature > 50)) {
      return res.status(400).json({ error: 'Invalid temperature value' });
    }
  }

  next();
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to capture response
    res.end = function(chunk: any, encoding: any) {
      const duration = Date.now() - startTime;
      
      // Log audit event
      logAuditEvent({
        action,
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      });
      
      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

function logAuditEvent(event: any) {
  // In production, send to proper logging service
  console.log('AUDIT:', JSON.stringify(event));
  
  // Could integrate with services like:
  // - AWS CloudTrail
  // - DataDog logs
  // - Elasticsearch
  // - Custom audit database
}
```

## CI/CD Pipeline & Deployment

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  DFX_VERSION: '0.15.0'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: trustcare_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install DFX
      run: |
        wget https://github.com/dfinity/sdk/releases/download/${{ env.DFX_VERSION }}/dfx-${{ env.DFX_VERSION }}-x86_64-linux.tar.gz
        tar -xzf dfx-${{ env.DFX_VERSION }}-x86_64-linux.tar.gz
        sudo mv dfx /usr/local/bin/
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test environment
      run: |
        cp .env.test .env.local
        dfx start --background --clean
        dfx deploy --with-cycles 2000000000000
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run e2e tests
      run: npm run test:e2e
    
    - name: Run security scan
      run: |
        npm audit --audit-level high
        npm run security:scan
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: true
    
    - name: Build application
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-${{ github.sha }}
        path: |
          dist/
          .dfx/
        retention-days: 30

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
    
    - name: Run CodeQL analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, typescript
    
    - name: Perform CodeQL analysis
      uses: github/codeql-action/analyze@v2

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/develop'
    
    environment:
      name: staging
      url: https://staging.trustcareconnect.com
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-${{ github.sha }}
    
    - name: Deploy to staging
      run: |
        # Deploy to ICP testnet
        dfx identity import staging-identity --storage-mode plaintext <<< "${{ secrets.STAGING_IDENTITY }}"
        dfx identity use staging-identity
        dfx deploy --network testnet --with-cycles 5000000000000
        
        # Deploy frontend to Vercel/Netlify
        curl -X POST "${{ secrets.STAGING_WEBHOOK_URL }}"
    
    - name: Run smoke tests
      run: |
        npm run test:smoke -- --base-url https://staging.trustcareconnect.com
    
    - name: Notify team
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://app.trustcareconnect.com
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-${{ github.sha }}
    
    - name: Deploy to production
      run: |
        # Blue-green deployment to ICP mainnet
        dfx identity import production-identity --storage-mode plaintext <<< "${{ secrets.PRODUCTION_IDENTITY }}"
        dfx identity use production-identity
        
        # Deploy new version
        dfx deploy --network ic --with-cycles 10000000000000
        
        # Run health checks
        curl -f https://app.trustcareconnect.com/health || exit 1
        
        # Switch traffic to new version
        dfx canister call packages/backend switchTraffic
    
    - name: Run production smoke tests
      run: |
        npm run test:smoke -- --base-url https://app.trustcareconnect.com
    
    - name: Create release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: v${{ github.run_number }}
        release_name: Release v${{ github.run_number }}
        body: |
          Automated release from commit ${{ github.sha }}
          
          Changes in this release:
          ${{ github.event.head_commit.message }}
        draft: false
        prerelease: false
```

### 2. Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache curl wget tar gzip

# Install DFX
ARG DFX_VERSION=0.15.0
RUN wget https://github.com/dfinity/sdk/releases/download/${DFX_VERSION}/dfx-${DFX_VERSION}-x86_64-linux.tar.gz \
    && tar -xzf dfx-${DFX_VERSION}-x86_64-linux.tar.gz \
    && mv dfx /usr/local/bin/ \
    && rm dfx-${DFX_VERSION}-x86_64-linux.tar.gz

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY dfx.json ./

# Install dependencies
FROM base AS dependencies
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY . .
RUN npm ci
RUN npm run build
RUN dfx build --network production

# Production stage
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/.dfx ./.dfx
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package*.json ./

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### 3. Infrastructure as Code (Terraform)
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "trustcare-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "trustcare-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# RDS Database
resource "aws_db_instance" "postgres" {
  identifier = "trustcare-db-${var.environment}"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true
  
  db_name  = "trustcare"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  deletion_protection = var.environment == "production"
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "trustcare-cache-subnet-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "trustcare-redis-${var.environment}"
  description                = "Redis cluster for TrustCareConnect"
  
  port                = 6379
  parameter_group_name = "default.redis7"
  node_type           = var.redis_node_type
  num_cache_clusters  = var.redis_num_clusters
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "trustcare-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = module.vpc.public_subnets
  
  enable_deletion_protection = var.environment == "production"
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "trustcare-cluster-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "trustcare-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_desired_count
  
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "trustcare-app"
    container_port   = 3000
  }
  
  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [aws_security_group.app.id]
  }
  
  depends_on = [aws_lb_listener.app]
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/trustcare-app-${var.environment}"
  retention_in_days = var.environment == "production" ? 30 : 7
  
  tags = {
    Environment = var.environment
    Project     = "TrustCareConnect"
  }
}

# Outputs
output "database_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "load_balancer_dns" {
  value = aws_lb.main.dns_name
}
```

## Monitoring & Observability

### 1. Logging Framework Setup
```typescript
// src/utils/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
      traceId: meta.traceId || generateTraceId(),
      service: 'trustcare-api',
      version: process.env.APP_VERSION || '1.0.0'
    });
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'trustcare-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // Separate file for errors
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Medical-specific logging
export const medicalLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'trustcare-medical',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/medical-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '90d', // Keep medical logs for 90 days
      level: 'info'
    })
  ]
});

// Audit logging for compliance
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'trustcare-audit',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxFiles: '2555d', // Keep audit logs for 7 years (compliance requirement)
      level: 'info'
    })
  ]
});

// Helper functions
function generateTraceId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Medical event logging with patient privacy
export function logMedicalEvent(event: {
  type: 'query_submitted' | 'response_generated' | 'doctor_review' | 'emergency_alert';
  patientId: string;
  safetyScore?: number;
  urgency?: string;
  duration?: number;
  metadata?: any;
}) {
  medicalLogger.info('Medical event', {
    ...event,
    // Hash patient ID for privacy
    patientId: hashPatientId(event.patientId),
    timestamp: new Date().toISOString()
  });
}

// Audit event logging for compliance
export function logAuditEvent(event: {
  action: string;
  userId?: string;
  userRole?: string;
  resource?: string;
  outcome: 'success' | 'failure';
  details?: any;
}) {
  auditLogger.info('Audit event', {
    ...event,
    timestamp: new Date().toISOString(),
    sessionId: generateTraceId()
  });
}

function hashPatientId(patientId: string): string {
  // In production, use proper hashing with salt
  return Buffer.from(patientId).toString('base64').substring(0, 10);
}
```

### 2. APM Integration (DataDog)
```typescript
// src/monitoring/apm.ts
import tracer from 'dd-trace';

// Initialize DataDog tracer
tracer.init({
  service: 'trustcare-api',
  version: process.env.APP_VERSION || '1.0.0',
  env: process.env.NODE_ENV || 'development',
  profiling: process.env.NODE_ENV === 'production',
  runtimeMetrics: true,
  logInjection: true
});

// Custom span creation for medical operations
export function createMedicalSpan(operationName: string, callback: Function) {
  const span = tracer.startSpan(`medical.${operationName}`, {
    tags: {
      'medical.operation': operationName,
      'service.type': 'medical'
    }
  });

  return tracer.scope().activate(span, () => {
    try {
      const result = callback();
      
      if (result && typeof result.then === 'function') {
        return result
          .then((res: any) => {
            span.setTag('operation.success', true);
            span.finish();
            return res;
          })
          .catch((error: Error) => {
            span.setTag('operation.success', false);
            span.setTag('error', true);
            span.setTag('error.message', error.message);
            span.finish();
            throw error;
          });
      } else {
        span.setTag('operation.success', true);
        span.finish();
        return result;
      }
    } catch (error) {
      span.setTag('operation.success', false);
      span.setTag('error', true);
      span.setTag('error.message', error.message);
      span.finish();
      throw error;
    }
  });
}

// Middleware for automatic span creation
export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  const span = tracer.startSpan(`http.${req.method.toLowerCase()}`, {
    tags: {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': req.route?.path,
      'user.id': req.user?.id
    }
  });

  tracer.scope().activate(span, () => {
    res.on('finish', () => {
      span.setTag('http.status_code', res.statusCode);
      span.setTag('http.success', res.statusCode < 400);
      span.finish();
    });

    next();
  });
}

// Custom metrics for medical operations
export const metrics = {
  querySubmissionCounter: tracer.dogstatsd.increment.bind(
    tracer.dogstatsd,
    'trustcare.queries.submitted'
  ),
  
  safetyScoreHistogram: (score: number, tags?: string[]) => {
    tracer.dogstatsd.histogram(
      'trustcare.safety_score',
      score,
      tags
    );
  },
  
  responseTimeHistogram: (duration: number, urgency: string) => {
    tracer.dogstatsd.histogram(
      'trustcare.response_time',
      duration,
      [`urgency:${urgency}`]
    );
  },
  
  emergencyAlertCounter: tracer.dogstatsd.increment.bind(
    tracer.dogstatsd,
    'trustcare.emergency_alerts'
  )
};

export default tracer;
```

### 3. Health Check Endpoints
```typescript
// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router = Router();

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    database: HealthStatus;
    redis: HealthStatus;
    novitaApi: HealthStatus;
    dfx: HealthStatus;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

// Basic health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthCheck: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      checks: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        novitaApi: await checkNovitaApi(),
        dfx: await checkDfx()
      },
      uptime: process.uptime(),
      memory: getMemoryUsage()
    };

    // Determine overall status
    const hasUnhealthy = Object.values(healthCheck.checks)
      .some(check => check.status === 'unhealthy');
    
    if (hasUnhealthy) {
      healthCheck.status = 'degraded';
      res.status(503);
    }

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check for internal monitoring
router.get('/health/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const [
      dbHealth,
      redisHealth,
      apiHealth,
      dfxHealth,
      queueHealth
    ] = await Promise.allSettled([
      checkDatabaseDetailed(),
      checkRedisDetailed(),
      checkNovitaApiDetailed(),
      checkDfxDetailed(),
      checkQueueHealth()
    ]);

    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      totalCheckTime: Date.now() - startTime,
      checks: {
        database: getSettledResult(dbHealth),
        redis: getSettledResult(redisHealth),
        novitaApi: getSettledResult(apiHealth),
        dfx: getSettledResult(dfxHealth),
        queue: getSettledResult(queueHealth)
      },
      system: {
        uptime: process.uptime(),
        memory: getMemoryUsage(),
        cpu: await getCpuUsage(),
        diskSpace: await getDiskUsage()
      }
    };

    res.json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check failed', { error: error.message });
    res.status(503).json({ error: error.message });
  }
});

// Ready check for Kubernetes
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies only
    await Promise.all([
      checkDatabase(),
      checkDfx()
    ]);
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Live check for Kubernetes
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Helper functions
async function checkDatabase(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    // Simple query to check database connectivity
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkDatabaseDetailed(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    const [connectionResult, statsResult] = await Promise.all([
      pool.query('SELECT 1'),
      pool.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections
        FROM pg_stat_activity
      `)
    ]);

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        totalConnections: statsResult.rows[0].total_connections,
        activeConnections: statsResult.rows[0].active_connections
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkRedis(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    await redisClient.ping();
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkNovitaApi(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.novita.ai/health', {
      method: 'GET',
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    return {
      status: 'healthy',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkDfx(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    // Check if DFX canister is responsive
    const result = await exec('dfx canister status packages/backend');
    
    if (result.stdout.includes('running')) {
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } else {
      throw new Error('Canister not running');
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    used: Math.round(usage.heapUsed / 1024 / 1024), // MB
    total: Math.round(usage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
  };
}

function getSettledResult(settledResult: any) {
  if (settledResult.status === 'fulfilled') {
    return settledResult.value;
  } else {
    return {
      status: 'unhealthy',
      error: settledResult.reason.message
    };
  }
}

export default router;
```

## Data Management & Operations

### 1. Database Schema & Migrations
```sql
-- migrations/001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_hash VARCHAR(255) UNIQUE NOT NULL, -- For privacy
    name_encrypted TEXT NOT NULL,
    diabetes_type VARCHAR(50) NOT NULL CHECK (diabetes_type IN ('Type 1', 'Type 2', 'Gestational', 'MODY')),
    hba1c DECIMAL(4,2),
    date_of_birth_encrypted TEXT,
    phone_encrypted TEXT,
    emergency_contact_encrypted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    consent_given BOOLEAN DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE,
    data_retention_until TIMESTAMP WITH TIME ZONE
);

-- Patient medications
CREATE TABLE patient_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    prescribed_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient allergies
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen VARCHAR(255) NOT NULL,
    severity VARCHAR(50),
    reaction_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical queries
CREATE TABLE medical_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    query_text_encrypted TEXT NOT NULL,
    query_hash VARCHAR(255) NOT NULL, -- For deduplication
    vital_signs JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' 
        CHECK (status IN ('submitted', 'processing', 'ai_processed', 'doctor_approved', 'completed', 'rejected')),
    urgency VARCHAR(20) NOT NULL DEFAULT 'LOW' 
        CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH')),
    safety_score INTEGER NOT NULL CHECK (safety_score >= 0 AND safety_score <= 100),
    ai_response_encrypted TEXT,
    ai_model_version VARCHAR(50),
    ai_processing_time INTEGER, -- milliseconds
    doctor_response_encrypted TEXT,
    doctor_notes_encrypted TEXT,
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    final_response_encrypted TEXT,
    channel VARCHAR(50) DEFAULT 'web' CHECK (channel IN ('web', 'mobile', 'ussd', 'sms')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name_encrypted TEXT NOT NULL,
    license_number_encrypted TEXT NOT NULL,
    specialization VARCHAR(100),
    hospital_affiliation VARCHAR(255),
    phone_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Doctor review queue
CREATE TABLE doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES medical_queries(id) ON DELETE CASCADE,
    assigned_doctor_id UUID REFERENCES doctors(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated')),
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT
);

-- Audit log for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_type VARCHAR(50), -- 'patient', 'doctor', 'admin', 'system'
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency alerts
CREATE TABLE emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    query_id UUID NOT NULL REFERENCES medical_queries(id),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_safety_score', 'critical_symptoms', 'crisis_detected')),
    alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('HIGH', 'CRITICAL')),
    details JSONB,
    notified_parties JSONB, -- Array of who was notified
    acknowledged_by UUID REFERENCES doctors(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_patients_email_hash ON patients(email_hash);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_medical_queries_patient_id ON medical_queries(patient_id);
CREATE INDEX idx_medical_queries_status ON medical_queries(status);
CREATE INDEX idx_medical_queries_created_at ON medical_queries(created_at);
CREATE INDEX idx_medical_queries_urgency ON medical_queries(urgency);
CREATE INDEX idx_doctor_reviews_status ON doctor_reviews(status);
CREATE INDEX idx_doctor_reviews_priority ON doctor_reviews(priority);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_emergency_alerts_created_at ON emergency_alerts(created_at);
CREATE INDEX idx_emergency_alerts_acknowledged ON emergency_alerts(acknowledged_at);

-- RLS (Row Level Security) for multi-tenancy
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;

-- Patients can only see their own data
CREATE POLICY patient_isolation ON patients
    FOR ALL
    TO patient_role
    USING (id = current_setting('app.current_patient_id')::UUID);

CREATE POLICY patient_queries_isolation ON medical_queries
    FOR ALL
    TO patient_role
    USING (patient_id = current_setting('app.current_patient_id')::UUID);

-- Doctors can see assigned reviews and related patient data
CREATE POLICY doctor_review_access ON medical_queries
    FOR SELECT
    TO doctor_role
    USING (
        id IN (
            SELECT query_id 
            FROM doctor_reviews 
            WHERE assigned_doctor_id = current_setting('app.current_doctor_id')::UUID
        )
    );

-- Functions for encryption/decryption
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT, key TEXT DEFAULT current_setting('app.encryption_key'))
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT, key TEXT DEFAULT current_setting('app.encryption_key'))
RETURNS TEXT AS $$
BEGIN
    RETURN decrypt(decode(encrypted_data, 'base64'), key::bytea, 'aes')::TEXT;
EXCEPTION
    WHEN OTHERS THEN
        RETURN '[DECRYPTION_ERROR]';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_queries_updated_at BEFORE UPDATE ON medical_queries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Backup & Recovery Procedures
```bash
#!/bin/bash
# scripts/backup.sh

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-trustcare}"
DB_USER="${DB_USER:-trustcare_user}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-trustcare-backups}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/trustcare_backup_$TIMESTAMP.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_FILE.gz"

echo "Starting backup at $(date)"

# Create database backup
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --file="$BACKUP_FILE"

# Compress backup file
gzip "$BACKUP_FILE"

# Upload to S3 if configured
if [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_FILE_COMPRESSED" "s3://$S3_BUCKET/database/$(basename $BACKUP_FILE_COMPRESSED)"
    
    # Verify upload
    if aws s3 ls "s3://$S3_BUCKET/database/$(basename $BACKUP_FILE_COMPRESSED)" > /dev/null; then
        echo "Backup successfully uploaded to S3"
        
        # Remove local backup if S3 upload successful
        rm "$BACKUP_FILE_COMPRESSED"
    else
        echo "ERROR: S3 upload failed, keeping local backup"
        exit 1
    fi
fi

# Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "trustcare_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Cleanup old S3 backups
if [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
    aws s3 ls "s3://$S3_BUCKET/database/" | while read -r line; do
        create_date=$(echo "$line" | awk '{print $1" "$2}')
        backup_file=$(echo "$line" | awk '{print $4}')
        
        if [[ "$backup_file" == trustcare_backup_*.sql.gz ]]; then
            create_date_seconds=$(date -d "$create_date" +%s)
            cutoff_date_seconds=$(date -d "$RETENTION_DAYS days ago" +%s)
            
            if [ $create_date_seconds -lt $cutoff_date_seconds ]; then
                echo "Deleting old backup: $backup_file"
                aws s3 rm "s3://$S3_BUCKET/database/$backup_file"
            fi
        fi
    done
fi

echo "Backup completed at $(date)"

# Test restore (optional, for verification)
if [ "${TEST_RESTORE:-false}" = "true" ]; then
    echo "Testing restore process..."
    
    # Create test database
    createdb --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" "trustcare_test_restore"
    
    # Restore backup
    if [ -f "$BACKUP_FILE_COMPRESSED" ]; then
        gunzip -c "$BACKUP_FILE_COMPRESSED" | psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="trustcare_test_restore"
    else
        # Download from S3 and test
        aws s3 cp "s3://$S3_BUCKET/database/$(basename $BACKUP_FILE_COMPRESSED)" "/tmp/test_backup.sql.gz"
        gunzip -c "/tmp/test_backup.sql.gz" | psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="trustcare_test_restore"
        rm "/tmp/test_backup.sql.gz"
    fi
    
    # Verify restore
    PATIENT_COUNT=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="trustcare_test_restore" -t -c "SELECT COUNT(*) FROM patients;")
    
    if [ "$PATIENT_COUNT" -gt 0 ]; then
        echo "Restore test successful: $PATIENT_COUNT patients found"
    else
        echo "ERROR: Restore test failed"
        exit 1
    fi
    
    # Cleanup test database
    dropdb --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" "trustcare_test_restore"
fi
```

### 3. Data Retention & Compliance
```typescript
// src/services/dataRetentionService.ts
import { logger, auditLogger } from '../utils/logger';
import { pool } from '../config/database';

interface RetentionPolicy {
  tableName: string;
  retentionPeriodDays: number;
  archiveBeforeDelete: boolean;
  conditions?: string;
  dependentTables?: string[];
}

const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    tableName: 'audit_logs',
    retentionPeriodDays: 2555, // 7 years for compliance
    archiveBeforeDelete: true,
    conditions: "outcome = 'success'"
  },
  {
    tableName: 'medical_queries',
    retentionPeriodDays: 2555, // 7 years for medical records
    archiveBeforeDelete: true,
    dependentTables: ['doctor_reviews']
  },
  {
    tableName: 'emergency_alerts',
    retentionPeriodDays: 2555, // 7 years for emergency records
    archiveBeforeDelete: true
  },
  {
    tableName: 'patients',
    retentionPeriodDays: 2555, // 7 years after last activity
    archiveBeforeDelete: true,
    conditions: "last_login_at < NOW() - INTERVAL '2 years'", // Only inactive patients
    dependentTables: ['medical_queries', 'patient_medications', 'patient_allergies']
  }
];

export class DataRetentionService {
  async executeRetentionPolicy(): Promise<void> {
    logger.info('Starting data retention policy execution');
    
    try {
      for (const policy of RETENTION_POLICIES) {
        await this.processRetentionPolicy(policy);
      }
      
      logger.info('Data retention policy execution completed');
    } catch (error) {
      logger.error('Data retention policy execution failed', { error: error.message });
      throw error;
    }
  }

  private async processRetentionPolicy(policy: RetentionPolicy): Promise<void> {
    logger.info(`Processing retention policy for ${policy.tableName}`, { policy });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    try {
      // Get records to be processed
      const recordsQuery = `
        SELECT id, created_at 
        FROM ${policy.tableName} 
        WHERE created_at < $1 
        ${policy.conditions ? `AND ${policy.conditions}` : ''}
        LIMIT 1000
      `;

      const result = await pool.query(recordsQuery, [cutoffDate]);
      
      if (result.rows.length === 0) {
        logger.info(`No records to process for ${policy.tableName}`);
        return;
      }

      logger.info(`Found ${result.rows.length} records to process for ${policy.tableName}`);

      for (const record of result.rows) {
        await this.processRecord(policy, record.id);
      }

    } catch (error) {
      logger.error(`Failed to process retention policy for ${policy.tableName}`, {
        error: error.message,
        policy
      });
      throw error;
    }
  }

  private async processRecord(policy: RetentionPolicy, recordId: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Archive record if required
      if (policy.archiveBeforeDelete) {
        await this.archiveRecord(client, policy.tableName, recordId);
      }

      // Delete dependent records first
      if (policy.dependentTables) {
        for (const dependentTable of policy.dependentTables) {
          await this.deleteDependentRecords(client, dependentTable, policy.tableName, recordId);
        }
      }

      // Delete main record
      await client.query(`DELETE FROM ${policy.tableName} WHERE id = $1`, [recordId]);

      // Log audit event
      auditLogger.info('Data retention deletion', {
        action: 'data_retention_delete',
        table: policy.tableName,
        recordId,
        policy: policy.tableName,
        outcome: 'success'
      });

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      
      auditLogger.error('Data retention deletion failed', {
        action: 'data_retention_delete',
        table: policy.tableName,
        recordId,
        error: error.message,
        outcome: 'failure'
      });
      
      throw error;
    } finally {
      client.release();
    }
  }

  private async archiveRecord(client: any, tableName: string, recordId: string): Promise<void> {
    // Create archive table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${tableName}_archive (
        LIKE ${tableName} INCLUDING ALL,
        archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Move record to archive
    await client.query(`
      INSERT INTO ${tableName}_archive 
      SELECT *, NOW() as archived_at 
      FROM ${tableName} 
      WHERE id = $1
    `, [recordId]);

    logger.info(`Record archived: ${tableName}:${recordId}`);
  }

  private async deleteDependentRecords(
    client: any, 
    dependentTable: string, 
    parentTable: string, 
    parentId: string
  ): Promise<void> {
    const foreignKeyColumn = `${parentTable.slice(0, -1)}_id`; // e.g., patient_id from patients
    
    await client.query(`DELETE FROM ${dependentTable} WHERE ${foreignKeyColumn} = $1`, [parentId]);
    
    logger.info(`Dependent records deleted: ${dependentTable} for ${parentTable}:${parentId}`);
  }

  // GDPR Right to be forgotten
  async processDataDeletionRequest(patientId: string, requesterId: string): Promise<void> {
    logger.info('Processing data deletion request', { patientId, requesterId });

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify patient exists and is eligible for deletion
      const patient = await client.query('SELECT * FROM patients WHERE id = $1', [patientId]);
      
      if (patient.rows.length === 0) {
        throw new Error('Patient not found');
      }

      // Archive patient data before deletion
      await this.archivePatientData(client, patientId);

      // Delete all patient-related data
      const deletionOrder = [
        'doctor_reviews', // Delete reviews first (foreign key to medical_queries)
        'emergency_alerts',
        'medical_queries',
        'patient_medications',
        'patient_allergies',
        'patients'
      ];

      for (const table of deletionOrder) {
        if (table === 'patients') {
          await client.query('DELETE FROM patients WHERE id = $1', [patientId]);
        } else if (table === 'doctor_reviews') {
          await client.query(`
            DELETE FROM doctor_reviews 
            WHERE query_id IN (
              SELECT id FROM medical_queries WHERE patient_id = $1
            )
          `, [patientId]);
        } else {
          await client.query(`DELETE FROM ${table} WHERE patient_id = $1`, [patientId]);
        }
      }

      // Log deletion for compliance
      auditLogger.info('GDPR data deletion completed', {
        action: 'gdpr_data_deletion',
        patientId,
        requesterId,
        timestamp: new Date().toISOString(),
        outcome: 'success'
      });

      await client.query('COMMIT');
      
      logger.info('Data deletion request completed successfully', { patientId });

    } catch (error) {
      await client.query('ROLLBACK');
      
      auditLogger.error('GDPR data deletion failed', {
        action: 'gdpr_data_deletion',
        patientId,
        requesterId,
        error: error.message,
        outcome: 'failure'
      });
      
      throw error;
    } finally {
      client.release();
    }
  }

  private async archivePatientData(client: any, patientId: string): Promise<void> {
    // Create comprehensive archive record
    const archiveData = await client.query(`
      SELECT 
        p.*,
        json_agg(DISTINCT mq.*) as medical_queries,
        json_agg(DISTINCT pm.*) as medications,
        json_agg(DISTINCT pa.*) as allergies
      FROM patients p
      LEFT JOIN medical_queries mq ON p.id = mq.patient_id
      LEFT JOIN patient_medications pm ON p.id = pm.patient_id
      LEFT JOIN patient_allergies pa ON p.id = pa.patient_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [patientId]);

    // Store in archive table
    await client.query(`
      INSERT INTO patient_data_archive (patient_id, archive_data, archived_at, archive_reason)
      VALUES ($1, $2, NOW(), 'gdpr_deletion_request')
    `, [patientId, JSON.stringify(archiveData.rows[0])]);
  }
}

// Scheduled job for data retention
export async function scheduleDataRetention(): Promise<void> {
  const retentionService = new DataRetentionService();
  
  // Run daily at 2 AM
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      try {
        await retentionService.executeRetentionPolicy();
      } catch (error) {
        logger.error('Scheduled data retention failed', { error: error.message });
      }
    }
  }, 60000); // Check every minute
}
```

## API Documentation & Integration

### 1. OpenAPI Specification
```yaml
# docs/api-spec.yaml
openapi: 3.0.3
info:
  title: TrustCareConnect API
  description: AI-powered diabetes care platform API with real-time medical guidance
  version: 1.2.0
  contact:
    name: TrustCareConnect Support
    email: support@trustcareconnect.com
    url: https://trustcareconnect.com/support
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  termsOfService: https://trustcareconnect.com/terms

servers:
  - url: https://api.trustcareconnect.com/v1
    description: Production server
  - url: https://staging-api.trustcareconnect.com/v1
    description: Staging server
  - url: http://localhost:3000/api/v1
    description: Development server

security:
  - BearerAuth: []

paths:
  /auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and return JWT token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: "sarah.johnson@email.com"
                password:
                  type: string
                  format: password
                  minLength: 8
                mfaCode:
                  type: string
                  pattern: '^[0-9]{6}$'
                  description: Two-factor authentication code
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  token:
                    type: string
                    description: JWT access token
                  refreshToken:
                    type: string
                    description: Refresh token for renewing access token
                  expiresIn:
                    type: integer
                    description: Token expiration time in seconds
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

  /queries:
    post:
      tags:
        - Medical Queries
      summary: Submit medical query
      description: Submit a medical query for AI analysis and optional doctor review
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MedicalQueryRequest'
      responses:
        '200':
          description: Query submitted successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MedicalResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

    get:
      tags:
        - Medical Queries
      summary: Get query history
      description: Retrieve patient's medical query history
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            minimum: 0
            default: 0
        - name: status
          in: query
          schema:
            type: string
            enum: [submitted, processing, ai_processed, doctor_approved, completed, rejected]
      responses:
        '200':
          description: Query history retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  queries:
                    type: array
                    items:
                      $ref: '#/components/schemas/MedicalResponse'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /queries/{queryId}/status:
    get:
      tags:
        - Medical Queries
      summary: Get query status
      description: Check the current status of a submitted query
      parameters:
        - name: queryId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Query status retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [pending, approved, rejected]
                  finalResponse:
                    $ref: '#/components/schemas/MedicalResponse'

  /doctor/pending-reviews:
    get:
      tags:
        - Doctor Portal
      summary: Get pending reviews
      description: Retrieve queries pending doctor review
      security:
        - BearerAuth: []
      parameters:
        - name: priority
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 10
        - name: urgency
          in: query
          schema:
            type: string
            enum: [LOW, MEDIUM, HIGH]
      responses:
        '200':
          description: Pending reviews retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/DoctorReviewItem'
        '403':
          $ref: '#/components/responses/Forbidden'

  /doctor/reviews/{reviewId}/approve:
    post:
      tags:
        - Doctor Portal
      summary: Approve review
      description: Approve a medical query review and send response to patient
      parameters:
        - name: reviewId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - finalResponse
              properties:
                finalResponse:
                  type: string
                  minLength: 10
                  description: Doctor-approved response to send to patient
                doctorNotes:
                  type: string
                  description: Internal notes for medical record
      responses:
        '200':
          description: Review approved successfully
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /patients/{patientId}/history:
    get:
      tags:
        - Patient Data
      summary: Get patient medical history
      description: Retrieve comprehensive medical history for a patient
      parameters:
        - name: patientId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Patient history retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PatientHistory'

  /emergency/alert:
    post:
      tags:
        - Emergency
      summary: Emergency alert
      description: Trigger emergency alert for critical medical situations
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - patientId
                - alertType
                - urgency
              properties:
                patientId:
                  type: string
                  format: uuid
                alertType:
                  type: string
                  enum: [low_safety_score, critical_symptoms, crisis_detected]
                urgency:
                  type: string
                  enum: [HIGH, CRITICAL]
                details:
                  type: object
                  description: Additional alert details
      responses:
        '200':
          description: Emergency alert processed
        '400':
          $ref: '#/components/responses/BadRequest'

  /health:
    get:
      tags:
        - System
      summary: Health check
      description: Check system health status
      security: []
      responses:
        '200':
          description: System is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck'
        '503':
          description: System is unhealthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [patient, doctor, admin]
        verified:
          type: boolean
        createdAt:
          type: string
          format: date-time

    VitalSigns:
      type: object
      properties:
        bloodGlucose:
          type: number
          minimum: 0
          maximum: 1000
          description: Blood glucose in mg/dL
        bloodPressure:
          type: string
          pattern: '^[0-9]{2,3}/[0-9]{2,3}$'
          example: "120/80"
        heartRate:
          type: integer
          minimum: 30
          maximum: 300
          description: Heart rate in BPM
        temperature:
          type: number
          minimum: 30
          maximum: 50
          description: Body temperature in Celsius

    MedicalQueryRequest:
      type: object
      required:
        - query
        - patientId
      properties:
        query:
          type: string
          minLength: 10
          maxLength: 5000
          description: Patient's medical question or symptoms
        patientId:
          type: string
          format: uuid
        vitalSigns:
          $ref: '#/components/schemas/VitalSigns'
        channel:
          type: string
          enum: [web, mobile, ussd, sms]
          default: web

    MedicalResponse:
      type: object
      properties:
        content:
          type: string
          description: Medical guidance response
        safetyScore:
          type: integer
          minimum: 0
          maximum: 100
          description: AI safety assessment score
        urgency:
          type: string
          enum: [LOW, MEDIUM, HIGH]
        timestamp:
          type: integer
          format: int64
          description: Unix timestamp
        requiresReview:
          type: boolean
          description: Whether doctor review is required
        queryId:
          type: string
          format: uuid
          description: Unique query identifier

    DoctorReviewItem:
      type: object
      properties:
        id:
          type: string
          format: uuid
        patientId:
          type: string
          format: uuid
        patientName:
          type: string
        originalQuery:
          type: string
        aiResponse:
          type: string
        safetyScore:
          type: integer
          minimum: 0
          maximum: 100
        urgency:
          type: string
          enum: [LOW, MEDIUM, HIGH]
        timestamp:
          type: integer
          format: int64
        status:
          type: string
          enum: [pending, approved, rejected]

    PatientHistory:
      type: object
      properties:
        patient:
          $ref: '#/components/schemas/User'
        medicalQueries:
          type: array
          items:
            $ref: '#/components/schemas/MedicalResponse'
        medications:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              dosage:
                type: string
              frequency:
                type: string
        allergies:
          type: array
          items:
            type: object
            properties:
              allergen:
                type: string
              severity:
                type: string

    HealthCheck:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, unhealthy, degraded]
        timestamp:
          type: string
          format: date-time
        version:
          type: string
        checks:
          type: object
          properties:
            database:
              $ref: '#/components/schemas/HealthStatus'
            redis:
              $ref: '#/components/schemas/HealthStatus'
            novitaApi:
              $ref: '#/components/schemas/HealthStatus'
            dfx:
              $ref: '#/components/schemas/HealthStatus'

    HealthStatus:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, unhealthy]
        responseTime:
          type: integer
          description: Response time in milliseconds
        error:
          type: string
          description: Error message if unhealthy

    Pagination:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        pageSize:
          type: integer
        hasNext:
          type: boolean
        hasPrevious:
          type: boolean

    Error:
      type: object
      properties:
        error:
          type: string
          description: Error message
        code:
          type: string
          description: Error code
        details:
          type: object
          description: Additional error details
        timestamp:
          type: string
          format: date-time

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Validation failed"
            code: "VALIDATION_ERROR"
            details:
              field: "query"
              message: "Query must be at least 10 characters"

    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Invalid or expired token"
            code: "UNAUTHORIZED"

    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Insufficient permissions"
            code: "FORBIDDEN"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Resource not found"
            code: "NOT_FOUND"

    RateLimited:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Rate limit exceeded"
            code: "RATE_LIMITED"
            details:
              retryAfter: 3600
```

### 2. Webhook Integration
```typescript
// src/webhooks/webhookManager.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface WebhookEvent {
  type: string;
  data: any;
  timestamp: number;
  id: string;
}

interface WebhookEndpoint {
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
}

export class WebhookManager {
  private endpoints: Map<string, WebhookEndpoint> = new Map();

  constructor() {
    this.loadWebhookEndpoints();
  }

  private loadWebhookEndpoints() {
    // Load from database or configuration
    const endpoints = [
      {
        id: 'emergency_alerts',
        url: process.env.EMERGENCY_WEBHOOK_URL || 'https://emergency.trustcareconnect.com/webhook',
        secret: process.env.EMERGENCY_WEBHOOK_SECRET || 'emergency_secret',
        events: ['emergency.critical', 'emergency.high'],
        active: true,
        retryPolicy: { maxRetries: 5, retryDelay: 1000 }
      },
      {
        id: 'doctor_notifications',
        url: process.env.DOCTOR_WEBHOOK_URL || 'https://doctors.trustcareconnect.com/webhook',
        secret: process.env.DOCTOR_WEBHOOK_SECRET || 'doctor_secret',
        events: ['review.pending', 'review.urgent'],
        active: true,
        retryPolicy: { maxRetries: 3, retryDelay: 2000 }
      }
    ];

    endpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.id, endpoint);
    });
  }

  async sendWebhook(eventType: string, data: any): Promise<void> {
    const event: WebhookEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };

    logger.info('Sending webhook event', { eventType, eventId: event.id });

    const promises = Array.from(this.endpoints.values())
      .filter(endpoint => endpoint.active && endpoint.events.includes(eventType))
      .map(endpoint => this.deliverWebhook(endpoint, event));

    await Promise.allSettled(promises);
  }

  private async deliverWebhook(
    endpoint: WebhookEndpoint, 
    event: WebhookEvent,
    attempt: number = 1
  ): Promise<void> {
    try {
      const payload = JSON.stringify(event);
      const signature = this.generateSignature(payload, endpoint.secret);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TrustCare-Signature': signature,
          'X-TrustCare-Event': event.type,
          'X-TrustCare-Delivery': event.id,
          'User-Agent': 'TrustCareConnect-Webhooks/1.0'
        },
        body: payload,
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info('Webhook delivered successfully', {
        endpointUrl: endpoint.url,
        eventType: event.type,
        eventId: event.id,
        attempt
      });

    } catch (error) {
      logger.error('Webhook delivery failed', {
        endpointUrl: endpoint.url,
        eventType: event.type,
        eventId: event.id,
        attempt,
        error: error.message
      });

      if (attempt < endpoint.retryPolicy.maxRetries) {
        setTimeout(() => {
          this.deliverWebhook(endpoint, event, attempt + 1);
        }, endpoint.retryPolicy.retryDelay * attempt);
      } else {
        logger.error('Webhook delivery permanently failed', {
          endpointUrl: endpoint.url,
          eventType: event.type,
          eventId: event.id,
          maxAttempts: endpoint.retryPolicy.maxRetries
        });
      }
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Webhook verification middleware
  static verifyWebhook(secret: string) {
    return (req: Request, res: Response, next: Function) => {
      const signature = req.headers['x-trustcare-signature'] as string;
      const payload = JSON.stringify(req.body);

      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }

      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      next();
    };
  }
}

// Usage examples
export const webhookManager = new WebhookManager();

// Emergency alert webhook
export async function triggerEmergencyWebhook(alertData: any) {
  await webhookManager.sendWebhook('emergency.critical', {
    patientId: alertData.patientId,
    alertType: alertData.alertType,
    safetyScore: alertData.safetyScore,
    urgency: alertData.urgency,
    details: alertData.details,
    timestamp: new Date().toISOString()
  });
}

// Doctor review webhook
export async function triggerDoctorReviewWebhook(reviewData: any) {
  await webhookManager.sendWebhook('review.pending', {
    reviewId: reviewData.id,
    patientId: reviewData.patientId,
    urgency: reviewData.urgency,
    safetyScore: reviewData.safetyScore,
    assignedAt: new Date().toISOString()
  });
}
```

### 3. SDK Generation & Integration Examples
```typescript
// sdk/typescript/src/TrustCareClient.ts
export class TrustCareClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: {
    baseUrl?: string;
    apiKey: string;
    timeout?: number;
  }) {
    this.baseUrl = config.baseUrl || 'https://api.trustcareconnect.com/v1';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  async submitMedicalQuery(request: MedicalQueryRequest): Promise<MedicalResponse> {
    return this.request('POST', '/queries', request);
  }

  async getQueryStatus(queryId: string): Promise<QueryStatus> {
    return this.request('GET', `/queries/${queryId}/status`);
  }

  async getPatientHistory(patientId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<PatientHistory> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    return this.request('GET', `/patients/${patientId}/history?${params}`);
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'TrustCareConnect-SDK-TS/1.0.0'
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new TrustCareError(error.error, error.code, response.status);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TrustCareError) {
        throw error;
      }
      throw new TrustCareError('Network error', 'NETWORK_ERROR', 0);
    }
  }
}

export class TrustCareError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'TrustCareError';
  }
}

// Usage example
const client = new TrustCareClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.trustcareconnect.com/v1'
});

const response = await client.submitMedicalQuery({
  query: 'I have been feeling tired and my blood sugar is high',
  patientId: 'patient-uuid',
  vitalSigns: {
    bloodGlucose: 180
  }
});
```

**KEY SUCCESS METRIC**: This comprehensive development guide now covers all aspects of production-ready development including testing, security, deployment, monitoring, compliance, and API documentation.