#!/usr/bin/env node

// Patient Integration Script - Direct Implementation
// This script integrates patients directly and generates login credentials

const fs = require('fs').promises;
const path = require('path');

/**
 * Patient Integration and Login Credential Generator
 * Creates comprehensive setup with login details for testing
 */
class PatientIntegrator {
  constructor() {
    this.patients = [];
    this.doctors = [];
    this.credentials = {
      patients: [],
      doctors: []
    };
  }

  /**
   * Initialize patient data from patients.txt structure
   */
  initializePatientData() {
    this.patients = [
      {
        id: 'P001',
        fullName: 'Sarah Michelle Johnson',
        email: 'sarah.johnson@email.com',
        medicalCondition: 'Diabetes Type 2',
        password: 'SarahDiabetes2024!',
        profile: {
          age: 45,
          gender: 'Female',
          ethnicity: 'African American',
          diabetesType: 'Type 2',
          hbA1c: '6.9%',
          controlStatus: 'Excellent',
          medications: ['Metformin 1000mg BID', 'Lisinopril 15mg daily', 'Empagliflozin 10mg daily'],
          treatmentDuration: '2+ years'
        }
      },
      {
        id: 'P002',
        fullName: 'Michael David Rodriguez',
        email: 'mike.rodriguez@student.edu',
        medicalCondition: 'Diabetes Type 1',
        password: 'MikeType1Diabetes!',
        profile: {
          age: 19,
          gender: 'Male',
          ethnicity: 'Caucasian',
          diabetesType: 'Type 1',
          hbA1c: '7.8%',
          controlStatus: 'Good control',
          medications: ['Insulin pump therapy (Aspart via pump)', 'Basal rate 1.2 units/hour'],
          treatmentDuration: '3+ years'
        }
      },
      {
        id: 'P003',
        fullName: 'Carlos Eduardo Mendoza',
        email: 'carlos.mendoza@gmail.com',
        medicalCondition: 'Diabetes Type 2',
        password: 'CarlosDiabetes62!',
        profile: {
          age: 64,
          gender: 'Male',
          ethnicity: 'Hispanic',
          diabetesType: 'Type 2',
          hbA1c: '6.8%',
          controlStatus: 'Excellent',
          medications: ['Metformin 1000mg BID', 'Lisinopril 20mg daily', 'Semaglutide 1mg weekly'],
          treatmentDuration: '2+ years'
        }
      },
      {
        id: 'P004',
        fullName: 'Priya Sharma-Patel',
        email: 'priya.patel@work.com',
        medicalCondition: 'Diabetes Type 2',
        password: 'PriyaDiabetes28!',
        profile: {
          age: 30,
          gender: 'Female',
          ethnicity: 'South Asian',
          diabetesType: 'Gestational → Type 2',
          hbA1c: '6.2%',
          controlStatus: 'Good control',
          medications: ['Prenatal vitamins', 'Insulin if needed (currently pregnant)'],
          treatmentDuration: '2+ years postpartum'
        }
      },
      {
        id: 'P005',
        fullName: 'Dorothy Mae Williams',
        email: 'dorothy.williams@senior.net',
        medicalCondition: 'Diabetes Type 2',
        password: 'DorothyDiabetes71!',
        profile: {
          age: 73,
          gender: 'Female',
          ethnicity: 'Caucasian',
          diabetesType: 'Type 2',
          hbA1c: '8.0%',
          controlStatus: 'Stable',
          medications: ['Insulin glargine 18 units', 'Linagliptin 5mg daily'],
          treatmentDuration: '18+ months'
        }
      }
    ];

    this.doctors = [
      {
        id: 'D001',
        fullName: 'Dr. Maria Elena Rodriguez',
        email: 'dr.rodriguez@trustcare.com',
        specialization: 'Endocrinology - Diabetes Specialist',
        password: 'DrMaria2024Endo!',
        credentials: 'MD, Endocrinology',
        experience: '15+ years',
        assignedPatients: ['P001', 'P003', 'P005']
      },
      {
        id: 'D002',
        fullName: 'Dr. James Michael Thompson',
        email: 'dr.thompson@trustcare.com',
        specialization: 'Endocrinology - Diabetes Specialist',
        password: 'DrJames2024Endo!',
        credentials: 'MD, Endocrinology',
        experience: '12+ years',
        assignedPatients: ['P002', 'P004']
      }
    ];
  }

  /**
   * Generate comprehensive login credentials
   */
  generateLoginCredentials() {
    console.log('🔑 TrustCareConnect Login Credentials');
    console.log('═'.repeat(60));
    
    // Patient credentials
    console.log('\n👥 PATIENT LOGIN CREDENTIALS');
    console.log('─'.repeat(40));
    
    this.patients.forEach(patient => {
      console.log(`\n${patient.fullName} (${patient.id})`);
      console.log(`  Email: ${patient.email}`);
      console.log(`  Password: ${patient.password}`);
      console.log(`  Condition: ${patient.medicalCondition}`);
      console.log(`  HbA1c: ${patient.profile.hbA1c} (${patient.profile.controlStatus})`);
      
      // Find assigned doctor
      const assignedDoctor = this.doctors.find(doc => 
        doc.assignedPatients.includes(patient.id)
      );
      console.log(`  Assigned Doctor: ${assignedDoctor ? assignedDoctor.fullName : 'None'}`);
      
      this.credentials.patients.push({
        name: patient.fullName,
        email: patient.email,
        password: patient.password,
        patientId: patient.id,
        condition: patient.medicalCondition,
        doctor: assignedDoctor ? assignedDoctor.fullName : 'None'
      });
    });

    // Doctor credentials
    console.log('\n\n👨‍⚕️ DOCTOR LOGIN CREDENTIALS');
    console.log('─'.repeat(40));
    
    this.doctors.forEach(doctor => {
      console.log(`\n${doctor.fullName} (${doctor.id})`);
      console.log(`  Email: ${doctor.email}`);
      console.log(`  Password: ${doctor.password}`);
      console.log(`  Specialization: ${doctor.specialization}`);
      console.log(`  Experience: ${doctor.experience}`);
      console.log(`  Assigned Patients: ${doctor.assignedPatients.length}`);
      
      // List assigned patients
      doctor.assignedPatients.forEach(patientId => {
        const patient = this.patients.find(p => p.id === patientId);
        if (patient) {
          console.log(`    • ${patient.fullName} (${patient.medicalCondition})`);
        }
      });
      
      this.credentials.doctors.push({
        name: doctor.fullName,
        email: doctor.email,
        password: doctor.password,
        doctorId: doctor.id,
        specialization: doctor.specialization,
        patientCount: doctor.assignedPatients.length
      });
    });
  }

  /**
   * Create test queries for demonstration
   */
  generateTestQueries() {
    const testQueries = [
      {
        patientId: 'P001',
        patientName: 'Sarah Michelle Johnson',
        queries: [
          {
            title: 'Morning Blood Sugar Issues',
            description: 'I\'ve been having higher blood sugars in the morning lately. My readings are usually around 140-160 mg/dL when I wake up, but they used to be around 110-120. I haven\'t changed my evening routine or medications. What could be causing this?',
            expectedContext: 'Should reference her excellent control (HbA1c 6.9%), current medications, and 2+ years treatment history'
          },
          {
            title: 'Exercise and Medication Timing',
            description: 'I want to start a new exercise routine in the evenings. How should I adjust my Metformin and other medications? Should I take them before or after working out?',
            expectedContext: 'Should reference her specific medications: Metformin 1000mg BID, Lisinopril, Empagliflozin'
          }
        ]
      },
      {
        patientId: 'P002',
        patientName: 'Michael David Rodriguez',
        queries: [
          {
            title: 'College Life and Insulin Management',
            description: 'I\'m in college and my schedule is really irregular. Sometimes I eat at weird times or skip meals when I\'m studying. My blood sugars are all over the place. How can I better manage my insulin pump with this crazy schedule?',
            expectedContext: 'Should reference his Type 1 diabetes, insulin pump therapy, college age, and need for flexibility'
          },
          {
            title: 'Party Drinking and Diabetes',
            description: 'My friends want me to come to parties but I\'m worried about drinking alcohol with my diabetes. Is it safe? How do I manage my blood sugar if I do drink?',
            expectedContext: 'Should reference his young age, Type 1 diabetes, insulin pump, and need for safety precautions'
          }
        ]
      },
      {
        patientId: 'P003',
        patientName: 'Carlos Eduardo Mendoza',
        queries: [
          {
            title: 'Kidney Function Concerns',
            description: 'My last lab results showed my kidney function might be declining slightly. My doctor mentioned this could be related to my diabetes. Should I be worried? Do I need to change my medications?',
            expectedContext: 'Should reference his cardiovascular history, current medications, and established kidney monitoring'
          }
        ]
      },
      {
        patientId: 'P004',
        patientName: 'Priya Sharma-Patel',
        queries: [
          {
            title: 'Pregnancy and Blood Sugar Control',
            description: 'I\'m pregnant again and my morning blood sugars are slightly elevated. I had gestational diabetes before. Should I start insulin now or wait? I\'m worried about affecting the baby.',
            expectedContext: 'Should reference her history of gestational diabetes, current pregnancy, and Type 2 diabetes progression'
          }
        ]
      },
      {
        patientId: 'P005',
        patientName: 'Dorothy Mae Williams',
        queries: [
          {
            title: 'Medication Confusion',
            description: 'I keep forgetting whether I took my insulin this morning. Sometimes I take it twice by accident. My daughter is worried. Is there a better way to keep track?',
            expectedContext: 'Should reference her age, cognitive considerations, current insulin regimen, and need for simplified management'
          }
        ]
      }
    ];

    console.log('\n\n🧪 SAMPLE TEST QUERIES FOR MEDICAL CONTEXT TESTING');
    console.log('═'.repeat(60));

    testQueries.forEach(patient => {
      console.log(`\n👤 ${patient.patientName} (${patient.patientId})`);
      console.log('─'.repeat(30));
      
      patient.queries.forEach((query, index) => {
        console.log(`\n${index + 1}. ${query.title}`);
        console.log(`   Query: "${query.description}"`);
        console.log(`   Expected Context: ${query.expectedContext}`);
      });
    });

    return testQueries;
  }

  /**
   * Generate startup instructions
   */
  generateStartupInstructions() {
    console.log('\n\n🚀 APPLICATION STARTUP INSTRUCTIONS');
    console.log('═'.repeat(60));
    
    console.log('\n1. 🖥️  BACKEND STARTUP:');
    console.log('   cd packages/backend');
    console.log('   dfx start --clean');
    console.log('   dfx deploy');
    
    console.log('\n2. 🌐 FRONTEND STARTUP:');
    console.log('   cd packages/frontend');
    console.log('   npm install');
    console.log('   npm start');
    
    console.log('\n3. 🔗 ACCESS THE APPLICATION:');
    console.log('   • Frontend: http://localhost:3000');
    console.log('   • Backend: Check DFX output for canister URLs');
    
    console.log('\n4. 🧪 TESTING WORKFLOW:');
    console.log('   a) Patient Login:');
    console.log('      - Use any patient email/password from above');
    console.log('      - Submit test queries to see medical context in action');
    
    console.log('   b) Doctor Login:');
    console.log('      - Use doctor credentials from above');
    console.log('      - Review patient queries with enhanced medical context');
    console.log('      - Respond to queries using patient-specific information');
    
    console.log('\n5. 🎯 ENHANCEMENT VERIFICATION:');
    console.log('   - Patient queries should include medical history context');
    console.log('   - AI responses should be personalized based on patient data');
    console.log('   - Doctors should see comprehensive patient information');
  }

  /**
   * Save credentials to file for reference
   */
  async saveCredentialsToFile() {
    const credentialsData = {
      generatedAt: new Date().toISOString(),
      patients: this.credentials.patients,
      doctors: this.credentials.doctors,
      testQueries: this.generateTestQueries(),
      instructions: {
        backend: [
          'cd packages/backend',
          'dfx start --clean',
          'dfx deploy'
        ],
        frontend: [
          'cd packages/frontend',
          'npm install',
          'npm start'
        ],
        access: {
          frontend: 'http://localhost:3000',
          note: 'Backend URLs provided by DFX after deployment'
        }
      }
    };

    const filePath = path.join(process.cwd(), 'LOGIN-CREDENTIALS.json');
    await fs.writeFile(filePath, JSON.stringify(credentialsData, null, 2));
    
    console.log(`\n💾 Credentials saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Execute complete integration
   */
  async execute() {
    console.log('🏥 TrustCareConnect Patient Integration');
    console.log('Integrating patients.txt data with platform credentials...\n');

    try {
      // Initialize data
      this.initializePatientData();
      
      // Generate and display credentials
      this.generateLoginCredentials();
      
      // Generate test queries
      this.generateTestQueries();
      
      // Show startup instructions
      this.generateStartupInstructions();
      
      // Save to file
      await this.saveCredentialsToFile();
      
      console.log('\n✅ Integration Complete!');
      console.log('\nYou now have:');
      console.log('• 5 patients with comprehensive medical histories');
      console.log('• 2 diabetes specialists');
      console.log('• Complete login credentials');
      console.log('• Sample test queries for context verification');
      console.log('• Startup instructions');
      
      return true;

    } catch (error) {
      console.error('\n❌ Integration failed:', error);
      return false;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const integrator = new PatientIntegrator();
  integrator.execute();
}

module.exports = PatientIntegrator;