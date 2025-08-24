# TrustCareConnect Deployment Setup Guide

## Mock Database Integration - patients.txt

This guide explains how to set up the TrustCareConnect platform for deployment testing using the `patients.txt` file as a mock database containing comprehensive diabetes patient medical histories.

## 📋 Overview

The integration system provides:
- **5 comprehensive diabetes patient profiles** with detailed medical histories
- **2 diabetes specialists** for patient assignment  
- **Automated patient registration** and specialist linking
- **Medical history context** for AI query processing
- **Complete testing environment** for deployment validation

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
cd packages/frontend/src/scripts
node setupTestEnvironment.js
```

This single command will:
- Create 2 diabetes specialists (Dr. Maria Elena Rodriguez & Dr. James Michael Thompson)
- Register 5 patients from patients.txt data
- Assign patients evenly between specialists
- Verify the complete setup

### 2. Expected Output

```
🏥 TrustCareConnect Test Environment Setup
==========================================

📋 Step 1: Creating diabetes specialists...
✓ Successfully created: Dr. Maria Elena Rodriguez
✓ Successfully created: Dr. James Michael Thompson

👥 Step 2: Importing patients from test data...
✓ Successfully imported: Sarah Michelle Johnson -> ID: P001
✓ Successfully imported: Michael David Rodriguez -> ID: P002
✓ Successfully imported: Carlos Eduardo Mendoza -> ID: P003
✓ Successfully imported: Priya Sharma-Patel -> ID: P004
✓ Successfully imported: Dorothy Mae Williams -> ID: P005

🔗 Step 3: Linking patients to diabetes specialists...
✓ Successfully assigned: Sarah Michelle Johnson -> Dr. Maria Elena Rodriguez
✓ Successfully assigned: Michael David Rodriguez -> Dr. James Michael Thompson
✓ Successfully assigned: Carlos Eduardo Mendoza -> Dr. Maria Elena Rodriguez
✓ Successfully assigned: Priya Sharma-Patel -> Dr. James Michael Thompson
✓ Successfully assigned: Dorothy Mae Williams -> Dr. Maria Elena Rodriguez

✅ Verification passed - All patients found and assigned
```

## 👤 Patient Login Information

After setup, these patients can log in using their email addresses:

| Patient Name | Email | Diabetes Type | Platform ID | Assigned Specialist |
|-------------|-------|--------------|-------------|-------------------|
| Sarah Michelle Johnson | sarah.johnson@email.com | Type 2 | P001 | Dr. Maria Elena Rodriguez |
| Michael David Rodriguez | mike.rodriguez@student.edu | Type 1 | P002 | Dr. James Michael Thompson |
| Carlos Eduardo Mendoza | carlos.mendoza@gmail.com | Type 2 | P003 | Dr. Maria Elena Rodriguez |
| Priya Sharma-Patel | priya.patel@work.com | Type 2 | P004 | Dr. James Michael Thompson |
| Dorothy Mae Williams | dorothy.williams@senior.net | Type 2 | P005 | Dr. Maria Elena Rodriguez |

## 🏥 Medical History Context

Each patient has comprehensive medical history available for AI context:

### Sarah Michelle Johnson (P001)
- **Profile**: 45-year-old African American female, Type 2 diabetes
- **Status**: Excellent control (HbA1c: 6.9%, down from 9.8%)
- **Medications**: Metformin, Lisinopril, Empagliflozin
- **History**: 2+ years of treatment, significant improvement

### Michael David Rodriguez (P002)
- **Profile**: 16-year-old Caucasian male, Type 1 diabetes  
- **Status**: Good control (HbA1c: 7.8%, down from 12.5%)
- **Medications**: Insulin pump therapy
- **History**: 3+ years, college lifestyle adaptation

### Carlos Eduardo Mendoza (P003)
- **Profile**: 62-year-old Hispanic male, Type 2 diabetes
- **Status**: Excellent control (HbA1c: 6.8%, down from 8.2%)
- **Medications**: Metformin, Lisinopril, Semaglutide
- **History**: 2+ years, cardiovascular comorbidities

### Priya Sharma-Patel (P004)
- **Profile**: 28-year-old South Asian female, Gestational→Type 2
- **Status**: Good control (HbA1c: 6.2%), currently pregnant
- **Medications**: Prenatal vitamins, insulin if needed
- **History**: Post-gestational diabetes, PCOS

### Dorothy Mae Williams (P005)
- **Profile**: 71-year-old Caucasian female, Type 2 diabetes
- **Status**: Stable (HbA1c: 8.0%, down from 10.4%)
- **Medications**: Insulin glargine, Linagliptin
- **History**: 18+ months, cognitive considerations, CKD

## 🧪 Testing the Integration

### 1. Patient Portal Testing

```javascript
// Example patient login and query submission
import trustCareAPI from './src/api/trustcare.js';

// Patient logs in
const patient = await trustCareAPI.findPatientByEmail('sarah.johnson@email.com');

// Submit a diabetes-related query
const query = await trustCareAPI.submitQuery(
  patient.data, 
  'Blood Sugar Management',
  'I\'ve been having higher blood sugars in the morning. What should I do?'
);
```

### 2. AI Context Integration

```javascript
// Example medical history context for AI
import medicalHistoryProvider from './src/utils/medicalHistoryProvider.js';

// Get patient context for AI query processing
const context = medicalHistoryProvider.getEnhancedContextForQuery(
  'P001', 
  'I\'ve been having higher blood sugars in the morning. What should I do?'
);

console.log(context.fullContext);
// Returns comprehensive medical history context for AI processing
```

### 3. Doctor Portal Testing

```javascript
// Example doctor workflow
import trustCareAPI from './src/api/trustcare.js';

// Get pending queries
const pendingQueries = await trustCareAPI.getPendingQueries();

// Doctor takes a query
await trustCareAPI.takeQuery(queryId, doctorId);

// Doctor responds with medical history context
await trustCareAPI.respondToQuery(queryId, doctorId, response);
```

## 🔧 Manual Integration (Alternative)

If you prefer manual setup or need to integrate step-by-step:

### Step 1: Import the Patient Data Importer

```javascript
import patientDataImporter from './packages/frontend/src/utils/patientDataImporter.js';
```

### Step 2: Create Specialists

```javascript
const specialists = await patientDataImporter.createDiabetesSpecialists();
```

### Step 3: Import Patients

```javascript
const patients = await patientDataImporter.importPatientsFromTestData();
```

### Step 4: Link Patients to Specialists

```javascript
const assignments = await patientDataImporter.linkPatientsToSpecialists();
```

### Step 5: Verify Setup

```javascript
const verification = await patientDataImporter.verifyImportSetup();
```

## 📊 API Integration Points

### Patient Registration API
- `registerPatient(name, condition, email)` - Register new patients
- `findPatientByEmail(email)` - Find patient by email for login
- `getPatient(patientId)` - Get patient details

### Doctor Management API
- `registerDoctor(name, specialization)` - Register diabetes specialists
- `assignPatientToDoctor(patientId, doctorId)` - Link patients to specialists
- `getDoctorPatients(doctorId)` - Get doctor's assigned patients

### Query Processing API
- `submitQuery(patientId, title, description)` - Submit patient query
- `getPatientQueries(patientId)` - Get patient's query history
- `takeQuery(queryId, doctorId)` - Doctor takes query ownership
- `respondToQuery(queryId, doctorId, response)` - Doctor responds

### Medical History Context API
- `getPatientHistory(platformId)` - Get patient medical history
- `getPatientContext(platformId, queryText)` - Get AI context for query
- `generateAIContext(platformId, queryType, queryText)` - Generate formatted context

## 🎯 Testing Scenarios

### Scenario 1: Type 1 Diabetes Young Adult
- **Patient**: Michael David Rodriguez
- **Test Query**: "I'm starting college and my blood sugars are all over the place. Help!"
- **Expected Context**: Insulin pump management, college lifestyle, hypoglycemia prevention

### Scenario 2: Type 2 Diabetes with Complications
- **Patient**: Carlos Eduardo Mendoza  
- **Test Query**: "My doctor mentioned kidney function. Should I be worried?"
- **Expected Context**: CKD considerations, medication adjustments, cardiovascular protection

### Scenario 3: Gestational/Type 2 Diabetes
- **Patient**: Priya Sharma-Patel
- **Test Query**: "I'm pregnant again and worried about my diabetes."
- **Expected Context**: Pregnancy diabetes management, PCOS considerations, medication safety

### Scenario 4: Elderly Type 2 Diabetes
- **Patient**: Dorothy Mae Williams
- **Test Query**: "I keep forgetting my medications. What should I do?"
- **Expected Context**: Cognitive considerations, simplified regimen, family support

### Scenario 5: Well-Controlled Type 2 
- **Patient**: Sarah Michelle Johnson
- **Test Query**: "Can I reduce my medications since my numbers are good?"
- **Expected Context**: Excellent control maintenance, medication continuation, lifestyle factors

## 📝 Verification Checklist

After deployment setup, verify:

- [ ] All 5 patients can log in with their email addresses
- [ ] Both diabetes specialists are registered and available
- [ ] Patient-specialist assignments are working correctly
- [ ] Medical history context is available for AI queries
- [ ] Query submission and response workflow functions
- [ ] AI responses include personalized medical history context
- [ ] Doctor can see assigned patients and respond to queries

## 🔍 Troubleshooting

### Common Issues:

1. **Patients not importing**: Check backend canister is running
2. **Specialists not created**: Verify doctor registration API is working  
3. **Assignments failing**: Ensure both patients and doctors exist before assignment
4. **Medical history missing**: Check patientDataImporter is properly initialized
5. **AI context empty**: Verify medical history provider has patient data

### Debug Commands:

```javascript
// Check imported patients status
const status = patientDataImporter.getImportedPatientsStatus();

// Test medical history integration
const test = await medicalHistoryProvider.testHistoryIntegration();

// Verify setup
const verification = await patientDataImporter.verifyImportSetup();
```

## 🎉 Ready for Testing!

Once setup is complete, your TrustCareConnect platform will have:
- **Realistic patient data** with comprehensive medical histories
- **Diabetes specialists** ready to manage patient care
- **AI context system** that uses patient history for personalized responses  
- **Complete testing environment** that simulates real-world diabetes care scenarios

The `patients.txt` file now serves as your mock database, providing rich context for AI responses and enabling thorough testing of the complete care workflow.