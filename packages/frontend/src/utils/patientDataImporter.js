// Patient Data Importer - Mock Database Integration
// Links patients.txt file data to TrustCareConnect platform for deployment testing

import trustCareAPI from '../api/trustcare.js';

/**
 * Patient Data Importer Class
 * Handles importing patient data from patients.txt mock database
 * and linking them to diabetes specialists in the platform
 */
class PatientDataImporter {
  constructor() {
    this.importedPatients = [];
    this.diabetesSpecialists = [];
    this.patientMedicalHistory = new Map();
  }

  /**
   * Patient data extracted from patients.txt file
   * Contains registration data and medical history for each patient
   */
  getPatientTestData() {
    return [
      {
        // Registration Data
        fullName: "Sarah Michelle Johnson",
        email: "sarah.johnson@email.com",
        medicalCondition: "Diabetes Type 2",
        expectedPatientId: "P001",
        
        // Medical History Summary from patients.txt
        medicalHistory: {
          patientId: "P001",
          ageAtDiagnosis: 45,
          gender: "Female",
          ethnicity: "African American",
          diabetesType: "Type 2",
          initialSymptoms: "Excessive thirst, frequent urination, blurred vision, unexplained 15-pound weight loss over 3 months",
          familyHistory: "Mother-Type 2, Maternal grandmother-Type 2",
          comorbidities: ["Hypertension", "Obesity (BMI 32.4)", "Dyslipidemia"],
          baselineHbA1c: "9.8%",
          currentHbA1c: "6.9%",
          lastVisit: "15-03-2024",
          currentMedications: ["Metformin 1000mg BID", "Lisinopril 15mg daily", "Empagliflozin 10mg daily"],
          treatmentDuration: "2+ years",
          complications: "None currently, normal retinal screening",
          controlStatus: "Excellent control achieved"
        }
      },
      {
        fullName: "Michael David Rodriguez",
        email: "mike.rodriguez@student.edu",
        medicalCondition: "Diabetes Type 1",
        expectedPatientId: "P002",
        
        medicalHistory: {
          patientId: "P002",
          ageAtDiagnosis: 16,
          gender: "Male",
          ethnicity: "Caucasian",
          diabetesType: "Type 1",
          initialSymptoms: "Rapid 20-pound weight loss, severe fatigue, extreme thirst, frequent urination, fruity breath odor",
          familyHistory: "No known family history of diabetes",
          comorbidities: [],
          baselineHbA1c: "12.5%",
          currentHbA1c: "7.8%",
          lastVisit: "20-09-2024",
          currentMedications: ["Insulin pump therapy (Aspart via pump)", "Basal rate 1.2 units/hour"],
          treatmentDuration: "3+ years",
          complications: "None currently, normal retinal exam",
          controlStatus: "Good overall control, college lifestyle adaptation needed"
        }
      },
      {
        fullName: "Carlos Eduardo Mendoza",
        email: "carlos.mendoza@gmail.com",
        medicalCondition: "Diabetes Type 2",
        expectedPatientId: "P003",
        
        medicalHistory: {
          patientId: "P003",
          ageAtDiagnosis: 62,
          gender: "Male",
          ethnicity: "Hispanic",
          diabetesType: "Type 2",
          initialSymptoms: "Routine health check-up revealed elevated glucose, mild fatigue, slow-healing cut on foot",
          familyHistory: "Father-Type 2, Brother-Type 2",
          comorbidities: ["Hypertension", "CAD (prior MI 2 years ago)", "Dyslipidemia", "CKD Stage 3"],
          baselineHbA1c: "8.2%",
          currentHbA1c: "6.8%",
          lastVisit: "15-04-2024",
          currentMedications: ["Metformin 1000mg BID", "Lisinopril 20mg daily", "Semaglutide 1mg weekly"],
          treatmentDuration: "2+ years",
          complications: "Mild background retinopathy (stable), no neuropathy",
          controlStatus: "Excellent control maintained"
        }
      },
      {
        fullName: "Priya Sharma-Patel",
        email: "priya.patel@work.com",
        medicalCondition: "Diabetes Type 2",
        expectedPatientId: "P004",
        
        medicalHistory: {
          patientId: "P004",
          ageAtDiagnosis: 28,
          gender: "Female",
          ethnicity: "South Asian",
          diabetesType: "Gestational Diabetes → Type 2",
          initialSymptoms: "Routine prenatal screening at 24 weeks gestation showed elevated glucose",
          familyHistory: "Mother-Type 2, Paternal grandfather-Type 2",
          comorbidities: ["PCOS", "History of gestational diabetes"],
          baselineHbA1c: "7.1%",
          currentHbA1c: "6.2%",
          lastVisit: "15-08-2024",
          currentMedications: ["Prenatal vitamins", "Insulin if needed (currently pregnant)"],
          treatmentDuration: "2+ years postpartum",
          complications: "None currently",
          controlStatus: "Good control, second pregnancy achieved"
        }
      },
      {
        fullName: "Dorothy Mae Williams",
        email: "dorothy.williams@senior.net",
        medicalCondition: "Diabetes Type 2",
        expectedPatientId: "P005",
        
        medicalHistory: {
          patientId: "P005",
          ageAtDiagnosis: 71,
          gender: "Female",
          ethnicity: "Caucasian",
          diabetesType: "Type 2",
          initialSymptoms: "Recurrent UTIs, slow-healing wounds, unexplained weight loss, increased thirst",
          familyHistory: "Sister-Type 2, no parental history known",
          comorbidities: ["Hypertension", "Osteoarthritis", "Mild cognitive impairment", "CKD Stage 3B"],
          baselineHbA1c: "10.4%",
          currentHbA1c: "8.0%",
          lastVisit: "22-07-2024",
          currentMedications: ["Insulin glargine 18 units", "Linagliptin 5mg daily"],
          treatmentDuration: "18+ months",
          complications: "Mild NPDR, peripheral neuropathy present",
          controlStatus: "Steady state with palliative approach"
        }
      }
    ];
  }

  /**
   * Create two diabetes specialists for testing
   * These doctors will be assigned to the imported patients
   */
  async createDiabetesSpecialists() {
    try {
      console.log('Creating diabetes specialists...');

      // Register two diabetes specialists
      const specialist1 = await trustCareAPI.registerDoctor(
        "Dr. Maria Elena Rodriguez",
        "Endocrinology - Diabetes Specialist"
      );

      const specialist2 = await trustCareAPI.registerDoctor(
        "Dr. James Michael Thompson",
        "Endocrinology - Diabetes Specialist"
      );

      if (specialist1.success && specialist2.success) {
        this.diabetesSpecialists = [
          { id: specialist1.data, name: "Dr. Maria Elena Rodriguez" },
          { id: specialist2.data, name: "Dr. James Michael Thompson" }
        ];
        
        console.log('Diabetes specialists created successfully:', this.diabetesSpecialists);
        return { success: true, specialists: this.diabetesSpecialists };
      } else {
        throw new Error(`Failed to create specialists: ${specialist1.error || specialist2.error}`);
      }
    } catch (error) {
      console.error('Error creating diabetes specialists:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import all patients from the test data
   */
  async importPatientsFromTestData() {
    try {
      console.log('Starting patient import from test data...');
      const patients = this.getPatientTestData();
      const importResults = [];

      for (const patient of patients) {
        try {
          console.log(`Registering patient: ${patient.fullName}`);
          
          const result = await trustCareAPI.registerPatient(
            patient.fullName,
            patient.medicalCondition,
            patient.email
          );

          if (result.success) {
            const importedPatient = {
              platformId: result.data,
              expectedId: patient.expectedPatientId,
              fullName: patient.fullName,
              email: patient.email,
              medicalCondition: patient.medicalCondition,
              imported: true
            };

            this.importedPatients.push(importedPatient);
            this.patientMedicalHistory.set(result.data, patient.medicalHistory);

            importResults.push({
              success: true,
              patient: importedPatient,
              message: `Successfully imported ${patient.fullName} with ID ${result.data}`
            });

            console.log(`✓ Successfully imported: ${patient.fullName} -> ID: ${result.data}`);
          } else {
            importResults.push({
              success: false,
              patient: patient.fullName,
              error: result.error
            });
            console.error(`✗ Failed to import ${patient.fullName}: ${result.error}`);
          }
        } catch (error) {
          importResults.push({
            success: false,
            patient: patient.fullName,
            error: error.message
          });
          console.error(`✗ Error importing ${patient.fullName}:`, error);
        }
      }

      return {
        success: true,
        imported: this.importedPatients.length,
        results: importResults,
        patients: this.importedPatients
      };
    } catch (error) {
      console.error('Error during patient import:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign imported patients to diabetes specialists
   * Distributes patients evenly between the two specialists
   */
  async linkPatientsToSpecialists() {
    try {
      console.log('Linking patients to diabetes specialists...');

      if (this.importedPatients.length === 0) {
        throw new Error('No patients imported yet. Please import patients first.');
      }

      if (this.diabetesSpecialists.length === 0) {
        throw new Error('No diabetes specialists available. Please create specialists first.');
      }

      const assignmentResults = [];
      
      // Distribute patients evenly between specialists
      for (let i = 0; i < this.importedPatients.length; i++) {
        const patient = this.importedPatients[i];
        const specialist = this.diabetesSpecialists[i % this.diabetesSpecialists.length];

        try {
          console.log(`Assigning ${patient.fullName} to ${specialist.name}`);
          
          const result = await trustCareAPI.assignPatientToDoctor(
            patient.platformId,
            specialist.id
          );

          if (result.success) {
            // Update patient record with assigned specialist
            patient.assignedSpecialist = {
              id: specialist.id,
              name: specialist.name
            };

            assignmentResults.push({
              success: true,
              patient: patient.fullName,
              specialist: specialist.name,
              message: `Successfully assigned ${patient.fullName} to ${specialist.name}`
            });

            console.log(`✓ Successfully assigned: ${patient.fullName} -> ${specialist.name}`);
          } else {
            assignmentResults.push({
              success: false,
              patient: patient.fullName,
              specialist: specialist.name,
              error: result.error
            });
            console.error(`✗ Failed to assign ${patient.fullName} to ${specialist.name}: ${result.error}`);
          }
        } catch (error) {
          assignmentResults.push({
            success: false,
            patient: patient.fullName,
            specialist: specialist.name,
            error: error.message
          });
          console.error(`✗ Error assigning ${patient.fullName}:`, error);
        }
      }

      return {
        success: true,
        assignments: assignmentResults,
        summary: this.getAssignmentSummary()
      };
    } catch (error) {
      console.error('Error linking patients to specialists:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete import and linking process
   * This is the main method to execute the full workflow
   */
  async executeFullImport() {
    console.log('🚀 Starting complete patient data import and linking process...');

    try {
      // Step 1: Create diabetes specialists
      console.log('\n📋 Step 1: Creating diabetes specialists...');
      const specialistResult = await this.createDiabetesSpecialists();
      if (!specialistResult.success) {
        throw new Error(`Specialist creation failed: ${specialistResult.error}`);
      }

      // Step 2: Import patients from test data
      console.log('\n👥 Step 2: Importing patients from test data...');
      const importResult = await this.importPatientsFromTestData();
      if (!importResult.success) {
        throw new Error(`Patient import failed: ${importResult.error}`);
      }

      // Step 3: Link patients to specialists
      console.log('\n🔗 Step 3: Linking patients to diabetes specialists...');
      const linkResult = await this.linkPatientsToSpecialists();
      if (!linkResult.success) {
        throw new Error(`Patient linking failed: ${linkResult.error}`);
      }

      // Step 4: Generate final report
      const report = this.generateImportReport();

      console.log('\n✅ Import process completed successfully!');
      console.log('\n📊 Final Report:');
      console.log(JSON.stringify(report, null, 2));

      return {
        success: true,
        report: report,
        importedPatients: this.importedPatients,
        specialists: this.diabetesSpecialists,
        medicalHistory: Object.fromEntries(this.patientMedicalHistory)
      };

    } catch (error) {
      console.error('❌ Import process failed:', error);
      return {
        success: false,
        error: error.message,
        partialResults: {
          specialists: this.diabetesSpecialists,
          importedPatients: this.importedPatients
        }
      };
    }
  }

  /**
   * Get assignment summary for reporting
   */
  getAssignmentSummary() {
    const summary = {
      totalPatients: this.importedPatients.length,
      totalSpecialists: this.diabetesSpecialists.length,
      assignments: {}
    };

    this.diabetesSpecialists.forEach(specialist => {
      const assignedPatients = this.importedPatients.filter(
        patient => patient.assignedSpecialist?.id === specialist.id
      );
      summary.assignments[specialist.name] = {
        count: assignedPatients.length,
        patients: assignedPatients.map(p => ({
          name: p.fullName,
          condition: p.medicalCondition,
          platformId: p.platformId
        }))
      };
    });

    return summary;
  }

  /**
   * Generate comprehensive import report
   */
  generateImportReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        specialistsCreated: this.diabetesSpecialists.length,
        patientsImported: this.importedPatients.length,
        successfulAssignments: this.importedPatients.filter(p => p.assignedSpecialist).length,
        totalMedicalRecords: this.patientMedicalHistory.size
      },
      specialists: this.diabetesSpecialists,
      patients: this.importedPatients,
      assignments: this.getAssignmentSummary(),
      nextSteps: [
        'Patients can now log in using their registered email addresses',
        'Patients can submit queries that will be answered using their medical history context',
        'Specialists can review and respond to patient queries',
        'Medical history data is available for AI context generation',
        'Test the query submission and response workflow'
      ]
    };
  }

  /**
   * Get patient medical history by platform ID
   */
  getPatientMedicalHistory(platformId) {
    return this.patientMedicalHistory.get(platformId) || null;
  }

  /**
   * Get all imported patients with their assignments
   */
  getImportedPatientsStatus() {
    return {
      total: this.importedPatients.length,
      assigned: this.importedPatients.filter(p => p.assignedSpecialist).length,
      unassigned: this.importedPatients.filter(p => !p.assignedSpecialist).length,
      patients: this.importedPatients
    };
  }

  /**
   * Helper method to verify system setup after import
   */
  async verifyImportSetup() {
    try {
      console.log('🔍 Verifying import setup...');

      // Check if all patients are registered
      const verificationResults = [];
      
      for (const patient of this.importedPatients) {
        const result = await trustCareAPI.getPatient(patient.platformId);
        verificationResults.push({
          patient: patient.fullName,
          platformId: patient.platformId,
          found: result.success && result.data,
          assigned: patient.assignedSpecialist ? true : false,
          specialist: patient.assignedSpecialist?.name || 'None'
        });
      }

      return {
        success: true,
        verification: verificationResults,
        allPatientsFound: verificationResults.every(r => r.found),
        allPatientsAssigned: verificationResults.every(r => r.assigned)
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const patientDataImporter = new PatientDataImporter();

// Named exports for different usage patterns
export { PatientDataImporter };
export default patientDataImporter;

// Convenience functions for direct usage
export const importPatientTestData = () => patientDataImporter.executeFullImport();
export const getPatientHistory = (platformId) => patientDataImporter.getPatientMedicalHistory(platformId);
export const verifySetup = () => patientDataImporter.verifyImportSetup();