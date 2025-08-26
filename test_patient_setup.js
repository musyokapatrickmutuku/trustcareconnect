// TrustCareConnect - Test Patient Setup and HTTP Outcall Verification
// This script tests the full workflow with actual HTTP outcalls to AI models

const { Actor, HttpAgent } = require('@dfinity/agent');
const fetch = require('isomorphic-fetch');

// Backend canister interface (simplified for testing)
const idlFactory = ({ IDL }) => {
  const PatientId = IDL.Text;
  const DoctorId = IDL.Text;
  const QueryId = IDL.Text;
  
  const Patient = IDL.Record({
    'id': PatientId,
    'name': IDL.Text,
    'condition': IDL.Text,
    'email': IDL.Text,
    'assignedDoctorId': IDL.Opt(DoctorId),
    'isActive': IDL.Bool,
  });
  
  const Doctor = IDL.Record({
    'id': DoctorId,
    'name': IDL.Text,
    'specialization': IDL.Text,
  });
  
  const QueryStatus = IDL.Variant({
    'pending': IDL.Null,
    'in_review': IDL.Null,
    'resolved': IDL.Null,
  });
  
  const MedicalQuery = IDL.Record({
    'id': QueryId,
    'patientId': PatientId,
    'title': IDL.Text,
    'description': IDL.Text,
    'status': QueryStatus,
    'doctorId': IDL.Opt(DoctorId),
    'response': IDL.Opt(IDL.Text),
    'aiDraftResponse': IDL.Opt(IDL.Text),
    'createdAt': IDL.Int,
    'updatedAt': IDL.Int,
  });
  
  return IDL.Service({
    // Patient management
    'registerPatient': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [PatientId], []),
    'getPatient': IDL.Func([PatientId], [IDL.Opt(Patient)], ['query']),
    'assignPatientToDoctor': IDL.Func([PatientId, DoctorId], [IDL.Variant({ 'ok': IDL.Null, 'err': IDL.Text })], []),
    
    // Doctor management
    'registerDoctor': IDL.Func([IDL.Text, IDL.Text], [DoctorId], []),
    'getDoctor': IDL.Func([DoctorId], [IDL.Opt(Doctor)], ['query']),
    
    // Query management
    'submitQuery': IDL.Func([PatientId, IDL.Text, IDL.Text], [IDL.Variant({ 'ok': QueryId, 'err': IDL.Text })], []),
    'getQuery': IDL.Func([QueryId], [IDL.Opt(MedicalQuery)], ['query']),
    'getPendingQueries': IDL.Func([], [IDL.Vec(MedicalQuery)], ['query']),
    
    // System
    'healthCheck': IDL.Func([], [IDL.Text], ['query']),
  });
};

// Sample patient data from patients.txt
const SAMPLE_PATIENTS = [
  {
    name: "Sarah Michelle Johnson",
    email: "sarah.johnson@email.com",
    condition: "Diabetes Type 2",
    medicalContext: `45-year-old African American female with Type 2 diabetes diagnosed 2022. 
    Current HbA1c 6.9%, on Metformin 1000mg BID, Empagliflozin 10mg daily, Lisinopril 15mg daily. 
    Weight 76kg, BP 125/75. No complications, excellent control achieved. Recent UTI resolved.`,
    testQuery: {
      title: "Morning Blood Sugar Higher Than Usual",
      description: "I've been feeling more tired lately and my morning blood sugars are higher than usual (around 180-200 mg/dL). Should I be concerned? I'm usually around 130 mg/dL in the morning. This has been happening for about a week."
    }
  },
  {
    name: "Michael David Rodriguez",
    email: "mike.rodriguez@student.edu",
    condition: "Diabetes Type 1",
    medicalContext: `19-year-old Caucasian male college student with Type 1 diabetes diagnosed at 16 with DKA. 
    Currently on insulin pump therapy, basal rate 1.2 units/hour. HbA1c 7.8%, weight 78kg. 
    Stress-related glucose fluctuations during college. Good diabetes management skills.`,
    testQuery: {
      title: "Blood Sugar Issues During Exams",
      description: "I'm having trouble with my blood sugars during college exams. They keep going high even with my pump. I've been stressed with finals and my readings are consistently above 250 mg/dL. What should I adjust?"
    }
  }
];

// Sample doctor data
const SAMPLE_DOCTORS = [
  {
    name: "Dr. Emily Chen",
    specialization: "Endocrinology"
  },
  {
    name: "Dr. Michael Rodriguez",
    specialization: "Internal Medicine"
  }
];

class TrustCareTestRunner {
  constructor() {
    this.agent = null;
    this.backend = null;
    this.patients = [];
    this.doctors = [];
    this.queries = [];
  }

  async initialize() {
    console.log('🚀 Initializing TrustCareConnect Test Runner...');
    
    // Create HTTP agent (adjust for local development)
    this.agent = new HttpAgent({
      fetch,
      host: 'http://localhost:4943', // Adjust to your local replica host
    });
    
    // Disable certificate verification for local development
    await this.agent.fetchRootKey();
    
    // Replace with your actual canister ID
    const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai'; // Default for local development
    
    try {
      this.backend = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: canisterId,
      });
      
      console.log('✅ Connected to backend canister');
      
      // Health check
      const healthStatus = await this.backend.healthCheck();
      console.log('🔍 Health check:', healthStatus);
      
    } catch (error) {
      console.error('❌ Failed to connect to backend:', error);
      console.log('📝 Note: Make sure dfx is running locally and the canister is deployed');
      throw error;
    }
  }

  async setupDoctors() {
    console.log('\n👩‍⚕️ Setting up sample doctors...');
    
    for (const doctorData of SAMPLE_DOCTORS) {
      try {
        const doctorId = await this.backend.registerDoctor(
          doctorData.name,
          doctorData.specialization
        );
        
        console.log(`✅ Registered doctor: ${doctorData.name} (${doctorId})`);
        this.doctors.push({ id: doctorId, ...doctorData });
        
      } catch (error) {
        console.error(`❌ Failed to register doctor ${doctorData.name}:`, error);
      }
    }
  }

  async setupPatients() {
    console.log('\n🏥 Setting up sample patients...');
    
    for (const patientData of SAMPLE_PATIENTS) {
      try {
        const patientId = await this.backend.registerPatient(
          patientData.name,
          patientData.condition,
          patientData.email
        );
        
        console.log(`✅ Registered patient: ${patientData.name} (${patientId})`);
        this.patients.push({ id: patientId, ...patientData });
        
        // Assign to the first available doctor
        if (this.doctors.length > 0) {
          const assignmentResult = await this.backend.assignPatientToDoctor(
            patientId, 
            this.doctors[0].id
          );
          
          if ('ok' in assignmentResult) {
            console.log(`✅ Assigned ${patientData.name} to ${this.doctors[0].name}`);
          } else {
            console.error(`❌ Failed to assign patient: ${assignmentResult.err}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Failed to register patient ${patientData.name}:`, error);
      }
    }
  }

  async testHttpOutcalls() {
    console.log('\n🤖 Testing HTTP Outcalls with Real AI Queries...');
    
    for (const patient of this.patients) {
      try {
        console.log(`\n📝 Submitting query for ${patient.name}...`);
        console.log(`Query: "${patient.testQuery.title}"`);
        console.log(`Description: "${patient.testQuery.description}"`);
        
        const queryResult = await this.backend.submitQuery(
          patient.id,
          patient.testQuery.title,
          patient.testQuery.description
        );
        
        if ('ok' in queryResult) {
          const queryId = queryResult.ok;
          console.log(`✅ Query submitted successfully (${queryId})`);
          
          // Wait a moment for processing
          console.log('⏳ Waiting for AI processing...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Retrieve the query to see the AI response
          const queryData = await this.backend.getQuery(queryId);
          if (queryData && queryData[0]) {
            const query = queryData[0];
            this.queries.push(query);
            
            console.log('\n🤖 AI Draft Response Generated:');
            console.log('=' .repeat(80));
            if (query.aiDraftResponse && query.aiDraftResponse[0]) {
              console.log(query.aiDraftResponse[0]);
              
              // Check if this is a real AI response vs fallback
              const aiResponse = query.aiDraftResponse[0];
              if (aiResponse.includes('BaiChuan M2 32B Clinical Assessment via Novita AI')) {
                console.log('\n✅ REAL AI HTTP OUTCALL DETECTED!');
                console.log('🎉 Successfully connected to Novita AI BaiChuan M2 32B model');
              } else if (aiResponse.includes('Clinical Decision Support System - BaiChuan M2 32B Enhanced')) {
                console.log('\n⚠️  Using enhanced fallback response (API may be down)');
                console.log('💡 This demonstrates the clinical reasoning system is working');
              } else {
                console.log('\n❓ Response format unexpected - please verify HTTP outcall configuration');
              }
            } else {
              console.log('❌ No AI draft response generated');
            }
            console.log('=' .repeat(80));
            
          } else {
            console.log('❌ Failed to retrieve query data');
          }
          
        } else {
          console.error(`❌ Query submission failed: ${queryResult.err}`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing query for ${patient.name}:`, error);
      }
    }
  }

  async verifySystemState() {
    console.log('\n📊 Verifying System State...');
    
    try {
      const pendingQueries = await this.backend.getPendingQueries();
      console.log(`📋 Pending queries: ${pendingQueries.length}`);
      
      for (const patient of this.patients) {
        const patientData = await this.backend.getPatient(patient.id);
        if (patientData && patientData[0]) {
          const p = patientData[0];
          console.log(`👤 Patient: ${p.name} - Active: ${p.isActive} - Doctor: ${p.assignedDoctorId[0] || 'None'}`);
        }
      }
      
      for (const doctor of this.doctors) {
        const doctorData = await this.backend.getDoctor(doctor.id);
        if (doctorData && doctorData[0]) {
          const d = doctorData[0];
          console.log(`👩‍⚕️ Doctor: ${d.name} - Specialization: ${d.specialization}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error verifying system state:', error);
    }
  }

  async runFullTest() {
    try {
      await this.initialize();
      await this.setupDoctors();
      await this.setupPatients();
      await this.testHttpOutcalls();
      await this.verifySystemState();
      
      console.log('\n🎉 Test Complete!');
      console.log('\n📝 Summary:');
      console.log(`- Registered ${this.doctors.length} doctors`);
      console.log(`- Registered ${this.patients.length} patients`);
      console.log(`- Submitted ${this.queries.length} queries for AI processing`);
      console.log('\n✅ HTTP Outcall Testing Complete - Check responses above for AI model integration');
      
    } catch (error) {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const testRunner = new TrustCareTestRunner();
  testRunner.runFullTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TrustCareTestRunner;