# TrustCareConnect MVP - Healthcare Workflow Documentation

## Overview
Simplified healthcare consultation workflow MVP for proof of concept testing. Demonstrates patient query → **REAL AI HTTP outcall processing** → doctor verification → final response flow using actual patient diabetes data.

## Core Workflow

### 1. Patient Query Submission
- **Actor**: Patient
- **Action**: Submit medical query through patient portal
- **Status**: Query marked as "submitted" → "processing"
- **Data**: Patient ID, query text, timestamp

### 2. **REAL AI Processing via HTTP Outcall**
- **Actor**: System (Novita AI API via HTTP outcall from ICP canister)
- **Action**: Make actual HTTP request to external AI model with patient context
- **Method**: **HTTP outcall** - NOT mock responses
- **Context**: Patient medical history + current query sent to LLM
- **Status**: "processing" → "ai_processed"
- **Output**: **Real AI-generated medical guidance** from external API
- **API**: Novita AI baichuan/baichuan-m2-32b model

### 3. Doctor Review & Verification
- **Actor**: Doctor
- **Action**: Review **real AI response**, edit if needed, approve/reject
- **Interface**: Doctor portal showing pending reviews with actual AI responses
- **Status**: "ai_processed" → "doctor_approved"
- **Capabilities**: Edit AI response, add notes, approve final version

### 4. Final Response Delivery
- **Actor**: System
- **Action**: Deliver doctor-approved response to patient
- **Status**: "doctor_approved" → "completed"
- **Notification**: Patient receives final medical guidance

## Test Patients (From patients.txt)

### Patient 1 - Sarah Michelle Johnson (P001)
```typescript
{
  id: "P001",
  name: "Sarah Michelle Johnson", 
  email: "sarah.johnson@email.com",
  condition: "Diabetes Type 2",
  medicalContext: "45-year-old African American female with Type 2 diabetes diagnosed 2022. Current HbA1c 6.9%, on Metformin 1000mg BID, Empagliflozin 10mg daily, Lisinopril 15mg daily. Weight 76kg, BP 125/75. No complications, excellent control achieved."
}
```

### Patient 2 - Michael David Rodriguez (P002)  
```typescript
{
  id: "P002",
  name: "Michael David Rodriguez",
  email: "mike.rodriguez@student.edu", 
  condition: "Diabetes Type 1",
  medicalContext: "19-year-old Caucasian male college student with Type 1 diabetes diagnosed at 16 with DKA. Currently on insulin pump therapy, basal rate 1.2 units/hour. HbA1c 7.8%, weight 78kg. Stress-related glucose fluctuations during college."
}
```

## **CRITICAL: HTTP Outcall Implementation**

### Backend AI Processing Function
```motoko
public func processPatientQuery(patientId: Text, query: Text): async Text {
  // Get patient medical context from stored data
  let patientContext = getPatientMedicalContext(patientId);
  
  // Construct prompt with patient history + current query
  let fullPrompt = "Patient Medical Context: " # patientContext # 
                   "\n\nPatient Query: " # query #
                   "\n\nProvide medical guidance considering the patient's diabetes history and current medications.";
  
  // Make REAL HTTP outcall to AI API - NOT mock response
  let result = await makeHttpCall(fullPrompt);
  return result;
};
```

### HTTP Outcall Configuration
- **API**: Novita AI baichuan/baichuan-m2-32b
- **Method**: POST request with patient context + query
- **Headers**: Real API authentication
- **Response**: Actual AI model response text
- **No Fallbacks**: Must use real HTTP outcall, no mock responses

## Query States
1. **submitted** - Patient submitted query
2. **processing** - Making real HTTP outcall to AI API
3. **ai_processed** - Real AI response received, waiting for doctor review
4. **doctor_approved** - Doctor approved real AI response
5. **completed** - Response delivered to patient

## Test Scenarios - **REAL AI RESPONSES REQUIRED**

### Scenario 1: Type 2 Diabetes Query (Sarah - P001)
- **Query**: "I've been feeling more tired lately and my morning blood sugars are higher than usual. Should I be concerned?"
- **HTTP Outcall Context**: Full patient medical history sent to AI API
- **Expected**: **Real AI model response** analyzing patient's diabetes management
- **Verification**: Doctor reviews actual AI-generated medical advice

### Scenario 2: Type 1 Insulin Query (Michael - P002)
- **Query**: "I'm having trouble with my blood sugars during college exams. They keep going high even with my pump."
- **HTTP Outcall Context**: Patient's Type 1 diabetes history + insulin pump details sent to AI
- **Expected**: **Real AI model response** with stress management and pump adjustment advice
- **Verification**: Doctor reviews actual AI-generated recommendations

## Implementation Requirements
- **NO Mock Responses**: All AI responses must come from actual HTTP outcalls
- **Real API Integration**: Use existing Novita AI integration in backend
- **Patient Context**: Send full medical history with each query to AI
- **Error Handling**: Handle HTTP outcall failures appropriately
- **Response Validation**: Ensure AI responses are received and processed

## Deployment Strategy
- **Backend**: Deploy existing HTTP outcall functionality with patient data integration
- **Frontend**: Patient/doctor portals for query submission and review
- **Testing**: Verify actual AI responses are generated for patient queries
- **Demo**: Shareable links demonstrating real AI medical consultations

**KEY POINT**: This MVP must demonstrate that real AI models can provide medical guidance when given patient context via HTTP outcalls from ICP canisters.