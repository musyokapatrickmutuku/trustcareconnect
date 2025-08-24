#!/usr/bin/env node

// Test Environment Setup Script
// Executes the complete patient data import and specialist assignment process
// for deployment testing with patients.txt mock database

import patientDataImporter from '../utils/patientDataImporter.js';

/**
 * Test Environment Setup Script
 * This script prepares the TrustCareConnect platform for testing by:
 * 1. Creating diabetes specialists
 * 2. Importing patient data from patients.txt
 * 3. Linking patients to specialists
 * 4. Verifying the setup
 */

async function setupTestEnvironment() {
  console.log('🏥 TrustCareConnect Test Environment Setup');
  console.log('==========================================');
  console.log('Setting up mock database environment for deployment testing...\n');

  try {
    // Execute the full import process
    const result = await patientDataImporter.executeFullImport();

    if (result.success) {
      console.log('\n🎉 Test environment setup completed successfully!');
      
      // Display setup summary
      console.log('\n📋 Setup Summary:');
      console.log('─'.repeat(50));
      console.log(`✅ Specialists Created: ${result.report.summary.specialistsCreated}`);
      console.log(`✅ Patients Imported: ${result.report.summary.patientsImported}`);
      console.log(`✅ Assignments Made: ${result.report.summary.successfulAssignments}`);
      console.log(`✅ Medical Records: ${result.report.summary.totalMedicalRecords}`);

      // Display specialist assignments
      console.log('\n👨‍⚕️ Specialist Assignments:');
      console.log('─'.repeat(50));
      Object.entries(result.report.assignments.assignments).forEach(([specialist, info]) => {
        console.log(`\n${specialist}: ${info.count} patients`);
        info.patients.forEach(patient => {
          console.log(`  • ${patient.name} (${patient.condition}) - ID: ${patient.platformId}`);
        });
      });

      // Display patient login information
      console.log('\n🔑 Patient Login Information:');
      console.log('─'.repeat(50));
      result.importedPatients.forEach(patient => {
        console.log(`• ${patient.fullName}`);
        console.log(`  Email: ${patient.email}`);
        console.log(`  Platform ID: ${patient.platformId}`);
        console.log(`  Assigned to: ${patient.assignedSpecialist?.name || 'None'}`);
        console.log('');
      });

      // Display next steps
      console.log('\n📝 Next Steps for Testing:');
      console.log('─'.repeat(50));
      result.report.nextSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });

      // Perform verification
      console.log('\n🔍 Verifying Setup...');
      const verification = await patientDataImporter.verifyImportSetup();
      
      if (verification.success && verification.allPatientsFound && verification.allPatientsAssigned) {
        console.log('✅ Verification passed - All patients found and assigned');
      } else {
        console.log('⚠️  Verification issues detected:');
        verification.verification.forEach(result => {
          const status = result.found && result.assigned ? '✅' : '❌';
          console.log(`  ${status} ${result.patient} - Found: ${result.found}, Assigned: ${result.assigned}`);
        });
      }

    } else {
      console.error('\n❌ Setup failed:', result.error);
      
      if (result.partialResults) {
        console.log('\n📋 Partial Results:');
        console.log(`Specialists created: ${result.partialResults.specialists.length}`);
        console.log(`Patients imported: ${result.partialResults.importedPatients.length}`);
      }
    }

  } catch (error) {
    console.error('\n💥 Unexpected error during setup:', error);
    process.exit(1);
  }
}

/**
 * Display usage instructions for testing
 */
function displayTestingInstructions() {
  console.log('\n🧪 Testing Instructions:');
  console.log('═'.repeat(60));
  
  console.log('\n1. 📱 Patient Portal Testing:');
  console.log('   • Navigate to the patient portal');
  console.log('   • Use any of the email addresses from the login information above');
  console.log('   • Submit medical queries related to diabetes management');
  
  console.log('\n2. 👨‍⚕️ Doctor Portal Testing:');
  console.log('   • Log in as one of the created diabetes specialists');
  console.log('   • Dr. Maria Elena Rodriguez (Endocrinology)');
  console.log('   • Dr. James Michael Thompson (Endocrinology)');
  
  console.log('\n3. 🤖 AI Context Testing:');
  console.log('   • Patient queries will be answered using their medical history');
  console.log('   • The AI has access to detailed diabetes management data');
  console.log('   • Test with diabetes-related questions for realistic responses');
  
  console.log('\n4. 📊 Data Verification:');
  console.log('   • Check that patient assignments are working correctly');
  console.log('   • Verify that medical history context is being used');
  console.log('   • Test the complete query → AI response → doctor review workflow');
}

/**
 * Main execution
 */
async function main() {
  try {
    await setupTestEnvironment();
    displayTestingInstructions();
    
    console.log('\n🎯 Environment ready for deployment testing!');
    console.log('The patients.txt data is now integrated as a mock database.');
    
  } catch (error) {
    console.error('Setup script failed:', error);
    process.exit(1);
  }
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default setupTestEnvironment;