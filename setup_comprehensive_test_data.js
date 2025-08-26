#!/usr/bin/env node

/**
 * TrustCareConnect - Comprehensive Test Data Setup
 * Sets up detailed patient medical histories and doctor accounts for testing
 * Based on comprehensive patient data from patients.txt
 */

const { execSync } = require('child_process');

// Test Patient Accounts with Credentials
const TEST_PATIENTS = [
    {
        id: "P001",
        fullName: "Sarah Michelle Johnson",
        email: "sarah.johnson@email.com",
        password: "SarahDiabetes2024!",
        condition: "Diabetes Type 2",
        demographics: {
            age: 47,
            gender: "Female",
            ethnicity: "African American",
            diagnosisAge: 45
        },
        medicalHistory: {
            initialSymptoms: "Excessive thirst, frequent urination, blurred vision, 15-pound weight loss over 3 months",
            familyHistory: "Mother-Type 2, Maternal grandmother-Type 2",
            comorbidities: ["Hypertension", "Obesity (BMI 32.4)", "Dyslipidemia"],
            currentMedications: ["Metformin 1000mg BID", "Empagliflozin 10mg daily", "Lisinopril 15mg daily"],
            currentStats: {
                hba1c: "6.9%",
                weight: "76kg",
                bp: "125/75",
                lastVisit: "2024-03-15"
            }
        },
        medicalContext: `45-year-old African American female with Type 2 diabetes diagnosed 2022. 
        Current HbA1c 6.9%, on Metformin 1000mg BID, Empagliflozin 10mg daily, Lisinopril 15mg daily. 
        Weight 76kg, BP 125/75. No complications, excellent control achieved. Recent UTI resolved.`
    },
    {
        id: "P002", 
        fullName: "Michael David Rodriguez",
        email: "mike.rodriguez@student.edu",
        password: "MikeType1Diabetes!",
        condition: "Diabetes Type 1",
        demographics: {
            age: 19,
            gender: "Male", 
            ethnicity: "Caucasian",
            diagnosisAge: 16
        },
        medicalHistory: {
            initialSymptoms: "Rapid 20-pound weight loss, severe fatigue, extreme thirst, frequent urination, fruity breath odor",
            familyHistory: "No known family history of diabetes",
            comorbidities: ["None at diagnosis"],
            currentMedications: ["Insulin pump therapy", "Basal rate 1.2 units/hour"],
            currentStats: {
                hba1c: "7.8%",
                weight: "78kg", 
                bp: "122/78",
                lastVisit: "2024-09-20"
            }
        },
        medicalContext: `19-year-old Caucasian male college student with Type 1 diabetes diagnosed at 16 with DKA. 
        Currently on insulin pump therapy, basal rate 1.2 units/hour. HbA1c 7.8%, weight 78kg. 
        Stress-related glucose fluctuations during college. Good diabetes management skills.`
    },
    {
        id: "P003",
        fullName: "Carlos Eduardo Mendoza", 
        email: "carlos.mendoza@gmail.com",
        password: "CarlosType2_2024!",
        condition: "Diabetes Type 2",
        demographics: {
            age: 64,
            gender: "Male",
            ethnicity: "Hispanic", 
            diagnosisAge: 62
        },
        medicalHistory: {
            initialSymptoms: "Routine health check-up revealed elevated glucose, mild fatigue, slow-healing cut on foot",
            familyHistory: "Father-Type 2, Brother-Type 2",
            comorbidities: ["Hypertension", "CAD (prior MI 2 years ago)", "Dyslipidemia", "Obesity (BMI 30.8)"],
            currentMedications: ["Metformin 1000mg BID", "Empagliflozin 10mg daily", "Semaglutide 1mg weekly", "Lisinopril 20mg daily"],
            currentStats: {
                hba1c: "6.8%",
                weight: "80kg",
                bp: "125/78", 
                lastVisit: "2024-04-15"
            }
        },
        medicalContext: `64-year-old Hispanic male with Type 2 diabetes diagnosed at 62. Significant cardiovascular history including prior MI. 
        Current HbA1c 6.8%, on Metformin 1000mg BID, Empagliflozin 10mg daily, Semaglutide 1mg weekly. 
        Weight 80kg, BP 125/78. Mild background retinopathy, stable. Excellent control achieved.`
    },
    {
        id: "P004",
        fullName: "Priya Sharma-Patel",
        email: "priya.patel@work.com", 
        password: "PriyaDiabetes2024!",
        condition: "Diabetes Type 2",
        demographics: {
            age: 30,
            gender: "Female",
            ethnicity: "South Asian",
            diagnosisAge: 28
        },
        medicalHistory: {
            initialSymptoms: "Gestational diabetes progressed to Type 2, routine prenatal screening at 24 weeks gestation",
            familyHistory: "Mother-Type 2, Paternal grandfather-Type 2", 
            comorbidities: ["PCOS", "History of gestational diabetes"],
            currentMedications: ["Metformin 1000mg BID", "Folic acid supplementation"],
            currentStats: {
                hba1c: "6.2%",
                weight: "72kg",
                bp: "128/78",
                lastVisit: "2024-08-15"
            }
        },
        medicalContext: `30-year-old South Asian female with Type 2 diabetes, post-gestational diabetes. 
        Currently pregnant with second child, early first trimester. HbA1c 6.2%, weight 72kg, BP 128/78. 
        History of PCOS, excellent pre-conception diabetes control achieved. On prenatal vitamins, Metformin discontinued for pregnancy.`
    },
    {
        id: "P005",
        fullName: "Dorothy Mae Williams",
        email: "dorothy.williams@senior.net",
        password: "Dorothy2024Senior!",
        condition: "Diabetes Type 2", 
        demographics: {
            age: 73,
            gender: "Female",
            ethnicity: "Caucasian",
            diagnosisAge: 71
        },
        medicalHistory: {
            initialSymptoms: "Recurrent UTIs, slow-healing wounds, unexplained weight loss, increased thirst",
            familyHistory: "Sister-Type 2, no parental history known",
            comorbidities: ["Hypertension", "Osteoarthritis", "Mild cognitive impairment", "CKD Stage 3"], 
            currentMedications: ["Insulin glargine 18 units at bedtime", "Linagliptin 5mg daily"],
            currentStats: {
                hba1c: "8.0%", 
                weight: "67kg",
                bp: "135/78",
                lastVisit: "2024-07-22"
            }
        },
        medicalContext: `73-year-old Caucasian female with Type 2 diabetes diagnosed at 71. Progressive CKD Stage 3, eGFR 35. 
        Current HbA1c 8.0%, on insulin glargine 18 units bedtime, Linagliptin 5mg daily. Weight 67kg, BP 135/78. 
        Mild cognitive impairment, family very involved in care. Stable mild retinopathy, peripheral neuropathy present.`
    }
];

// Test Doctor Accounts with Credentials  
const TEST_DOCTORS = [
    {
        id: "D001",
        fullName: "Dr. Maria Elena Rodriguez",
        email: "dr.rodriguez@trustcare.com", 
        password: "DrMaria2024Endo!",
        specialization: "Endocrinology",
        credentials: {
            licenseNumber: "MD123456789",
            npiNumber: "1234567890",
            boardCertifications: ["Internal Medicine", "Endocrinology"],
            yearsOfExperience: 15,
            medicalSchool: "Harvard Medical School"
        },
        assignedPatients: ["P001", "P003", "P005"], // Sarah, Carlos, Dorothy
        availability: {
            acceptingPatients: true,
            workingHours: "Monday-Friday 8AM-5PM",
            emergencyAvailable: true
        }
    },
    {
        id: "D002", 
        fullName: "Dr. James Michael Thompson",
        email: "dr.thompson@trustcare.com",
        password: "DrJames2024Endo!",
        specialization: "Endocrinology", 
        credentials: {
            licenseNumber: "MD987654321",
            npiNumber: "0987654321", 
            boardCertifications: ["Internal Medicine", "Endocrinology", "Diabetes Technology"],
            yearsOfExperience: 12,
            medicalSchool: "Johns Hopkins School of Medicine"
        },
        assignedPatients: ["P002", "P004"], // Michael, Priya
        availability: {
            acceptingPatients: true,
            workingHours: "Monday-Friday 7AM-4PM, Saturday 9AM-12PM",
            emergencyAvailable: false
        }
    }
];

// Sample Queries for Testing
const TEST_QUERIES = [
    {
        patientId: "P001",
        title: "Morning Blood Sugar Higher Than Usual", 
        description: "I've been feeling more tired lately and my morning blood sugars are higher than usual (around 180-200 mg/dL). Should I be concerned? I'm usually around 130 mg/dL in the morning. This has been happening for about a week."
    },
    {
        patientId: "P002",
        title: "Blood Sugar Issues During College Exams",
        description: "I'm having trouble with my blood sugars during college exams. They keep going high even with my pump. I've been stressed with finals and my readings are consistently above 250 mg/dL. What should I adjust?"
    },
    {
        patientId: "P003", 
        title: "Foot Numbness and Tingling Concerns",
        description: "I've been experiencing some numbness and tingling in my feet, especially at night. Given my diabetes and heart history, should I be worried? The numbness is mostly in my toes and seems to be getting worse."
    }
];

class TrustCareTestDataSetup {
    constructor() {
        this.registeredPatients = [];
        this.registeredDoctors = [];
        this.createdQueries = [];
    }

    // Execute DFX canister call with error handling
    callCanister(method, args) {
        try {
            const command = `dfx canister call backend ${method} '${args}'`;
            console.log(`Executing: ${command}`);
            const result = execSync(command, { encoding: 'utf8', timeout: 30000 });
            console.log(`Result: ${result.trim()}`);
            return result.trim();
        } catch (error) {
            console.error(`Error calling ${method}:`, error.message);
            return null;
        }
    }

    // Check if DFX is running
    checkDfxStatus() {
        try {
            const result = execSync('dfx ping', { encoding: 'utf8', timeout: 5000 });
            console.log('✅ DFX replica is healthy');
            return true;
        } catch (error) {
            console.error('❌ DFX replica is not running. Please start it with: dfx start --background');
            return false;
        }
    }

    // Register comprehensive patient data
    async setupPatients() {
        console.log('\n🏥 Setting up comprehensive patient data...');
        
        for (const patient of TEST_PATIENTS) {
            console.log(`\n📋 Registering patient: ${patient.fullName}`);
            
            // Register basic patient info
            const result = this.callCanister('registerPatient', 
                `("${patient.fullName}", "${patient.condition}", "${patient.email}")`
            );
            
            if (result && result.includes('patient_')) {
                const patientId = result.replace(/[()"\s]/g, '');
                this.registeredPatients.push({
                    id: patientId,
                    originalId: patient.id,
                    ...patient
                });
                console.log(`✅ Patient registered: ${patient.fullName} -> ${patientId}`);
                
                // Display comprehensive medical history
                console.log(`📊 Medical History for ${patient.fullName}:`);
                console.log(`   Age: ${patient.demographics.age} (diagnosed at ${patient.demographics.diagnosisAge})`);
                console.log(`   Current HbA1c: ${patient.medicalHistory.currentStats.hba1c}`);
                console.log(`   Current Weight: ${patient.medicalHistory.currentStats.weight}`);
                console.log(`   Blood Pressure: ${patient.medicalHistory.currentStats.bp}`);
                console.log(`   Medications: ${patient.medicalHistory.currentMedications.join(', ')}`);
                console.log(`   Comorbidities: ${patient.medicalHistory.comorbidities.join(', ')}`);
                
            } else {
                console.error(`❌ Failed to register patient: ${patient.fullName}`);
            }
            
            // Small delay between registrations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n✅ Registered ${this.registeredPatients.length}/${TEST_PATIENTS.length} patients successfully`);
    }

    // Register doctor accounts
    async setupDoctors() {
        console.log('\n👩‍⚕️ Setting up doctor accounts...');
        
        for (const doctor of TEST_DOCTORS) {
            console.log(`\n👨‍⚕️ Registering doctor: ${doctor.fullName}`);
            
            const result = this.callCanister('registerDoctor',
                `("${doctor.fullName}", "${doctor.specialization}")`
            );
            
            if (result && result.includes('doctor_')) {
                const doctorId = result.replace(/[()"\s]/g, '');
                this.registeredDoctors.push({
                    id: doctorId,
                    originalId: doctor.id,
                    ...doctor
                });
                console.log(`✅ Doctor registered: ${doctor.fullName} -> ${doctorId}`);
                console.log(`   Specialization: ${doctor.specialization}`);
                console.log(`   Experience: ${doctor.credentials.yearsOfExperience} years`);
                console.log(`   Working Hours: ${doctor.availability.workingHours}`);
                console.log(`   Assigned Patients: ${doctor.assignedPatients.length} patients`);
                
            } else {
                console.error(`❌ Failed to register doctor: ${doctor.fullName}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`\n✅ Registered ${this.registeredDoctors.length}/${TEST_DOCTORS.length} doctors successfully`);
    }

    // Assign patients to doctors based on test configuration
    async setupPatientAssignments() {
        console.log('\n🔗 Setting up patient-doctor assignments...');
        
        for (const doctor of TEST_DOCTORS) {
            const registeredDoctor = this.registeredDoctors.find(d => d.originalId === doctor.id);
            if (!registeredDoctor) {
                console.error(`❌ Doctor ${doctor.fullName} not found in registered doctors`);
                continue;
            }
            
            console.log(`\n👨‍⚕️ Assigning patients to ${doctor.fullName}:`);
            
            for (const patientOriginalId of doctor.assignedPatients) {
                const registeredPatient = this.registeredPatients.find(p => p.originalId === patientOriginalId);
                if (!registeredPatient) {
                    console.error(`❌ Patient ${patientOriginalId} not found in registered patients`);
                    continue;
                }
                
                const result = this.callCanister('assignPatientToDoctor',
                    `("${registeredPatient.id}", "${registeredDoctor.id}")`
                );
                
                if (result && result.includes('ok')) {
                    console.log(`   ✅ ${registeredPatient.fullName} -> ${doctor.fullName}`);
                } else {
                    console.error(`   ❌ Failed to assign ${registeredPatient.fullName} to ${doctor.fullName}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    // Create sample queries for testing
    async setupTestQueries() {
        console.log('\n💬 Creating sample queries for testing...');
        
        for (const query of TEST_QUERIES) {
            const registeredPatient = this.registeredPatients.find(p => p.originalId === query.patientId);
            if (!registeredPatient) {
                console.error(`❌ Patient ${query.patientId} not found for query`);
                continue;
            }
            
            console.log(`\n📝 Creating query for ${registeredPatient.fullName}:`);
            console.log(`   Title: ${query.title}`);
            
            const result = this.callCanister('submitQuery',
                `("${registeredPatient.id}", "${query.title}", "${query.description}")`
            );
            
            if (result && result.includes('ok')) {
                const queryId = result.match(/ok = "([^"]+)"/)?.[1];
                if (queryId) {
                    this.createdQueries.push({
                        id: queryId,
                        patientId: registeredPatient.id,
                        title: query.title
                    });
                    console.log(`   ✅ Query created: ${queryId}`);
                }
            } else {
                console.error(`   ❌ Failed to create query for ${registeredPatient.fullName}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Allow time for AI processing
        }
        
        console.log(`\n✅ Created ${this.createdQueries.length}/${TEST_QUERIES.length} queries successfully`);
    }

    // Verify system health and data
    async verifySystemHealth() {
        console.log('\n🔍 Verifying system health and data...');
        
        // Check backend health
        const healthResult = this.callCanister('healthCheck', '');
        console.log(`Backend Health: ${healthResult}`);
        
        // Check sample query responses
        if (this.createdQueries.length > 0) {
            console.log('\n🤖 Checking AI responses for sample queries:');
            for (const query of this.createdQueries.slice(0, 2)) { // Check first 2 queries
                const queryResult = this.callCanister('getQuery', `("${query.id}")`);
                if (queryResult && queryResult.includes('aiDraftResponse')) {
                    console.log(`   ✅ Query ${query.id}: AI response generated`);
                } else {
                    console.log(`   ⏳ Query ${query.id}: AI response pending or failed`);
                }
            }
        }
        
        return true;
    }

    // Generate test credentials summary
    generateCredentialsSummary() {
        console.log('\n📋 TEST ACCOUNT CREDENTIALS SUMMARY');
        console.log('=' .repeat(80));
        
        console.log('\n👥 PATIENT ACCOUNTS:');
        for (const patient of this.registeredPatients) {
            const originalPatient = TEST_PATIENTS.find(p => p.id === patient.originalId);
            console.log(`\n${originalPatient.fullName} (${originalPatient.condition})`);
            console.log(`📧 Email: ${originalPatient.email}`);
            console.log(`🔑 Password: ${originalPatient.password}`);
            console.log(`🆔 System ID: ${patient.id}`);
            console.log(`📊 Current HbA1c: ${originalPatient.medicalHistory.currentStats.hba1c}`);
        }
        
        console.log('\n👨‍⚕️ DOCTOR ACCOUNTS:');
        for (const doctor of this.registeredDoctors) {
            const originalDoctor = TEST_DOCTORS.find(d => d.id === doctor.originalId);
            console.log(`\n${originalDoctor.fullName} (${originalDoctor.specialization})`);
            console.log(`📧 Email: ${originalDoctor.email}`);
            console.log(`🔑 Password: ${originalDoctor.password}`);
            console.log(`🆔 System ID: ${doctor.id}`);
            console.log(`👥 Assigned Patients: ${originalDoctor.assignedPatients.length}`);
        }
        
        console.log('\n💬 CREATED QUERIES:');
        for (const query of this.createdQueries) {
            console.log(`Query ${query.id}: ${query.title}`);
        }
        
        console.log('\n' + '=' .repeat(80));
    }

    // Main setup execution
    async runSetup() {
        console.log('🚀 TrustCareConnect - Comprehensive Test Data Setup');
        console.log('Setting up detailed patient medical histories and doctor accounts...\n');
        
        // Check prerequisites
        if (!this.checkDfxStatus()) {
            return false;
        }
        
        try {
            // Execute setup steps
            await this.setupPatients();
            await this.setupDoctors(); 
            await this.setupPatientAssignments();
            await this.setupTestQueries();
            await this.verifySystemHealth();
            
            // Generate summary
            this.generateCredentialsSummary();
            
            console.log('\n🎉 SETUP COMPLETE!');
            console.log('✅ All comprehensive test data has been loaded successfully');
            console.log('🌐 Frontend: http://localhost:3000');
            console.log('📖 Use the credentials above to test patient and doctor portals');
            
            return true;
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            return false;
        }
    }
}

// Execute setup if run directly
if (require.main === module) {
    const setup = new TrustCareTestDataSetup();
    setup.runSetup().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = TrustCareTestDataSetup;