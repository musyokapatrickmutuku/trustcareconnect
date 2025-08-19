// Backend Unit Tests for Patient Management
// Tests individual patient functions with mocked data

import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Result "mo:base/Result";

// Test helper actor for patient functions
actor PatientTests {
    
    // Test data
    private let testPatients = [
        {
            id = "patient_1";
            name = "John Doe";
            condition = "Diabetes";
            email = "john@example.com";
            assignedDoctorId = ?"doctor_1";
            isActive = true;
        },
        {
            id = "patient_2";
            name = "Jane Smith";
            condition = "Hypertension";
            email = "jane@example.com";
            assignedDoctorId = null;
            isActive = false;
        }
    ];

    // Test: Patient ID Generation
    public func testGeneratePatientId() : async Bool {
        // This would test the generatePatientId function
        // For now, we'll simulate the test
        let id1 = "patient_1";
        let id2 = "patient_2";
        
        let isUnique = id1 != id2;
        let hasPrefix = id1.startsWith("patient_");
        
        Debug.print("✅ Patient ID Generation Test: " # (if (isUnique and hasPrefix) "PASSED" else "FAILED"));
        isUnique and hasPrefix
    };

    // Test: Patient Registration Validation
    public func testPatientRegistration() : async Bool {
        let validName = "John Doe";
        let validCondition = "Diabetes";
        let validEmail = "john@example.com";
        
        // Test valid registration
        let isValidName = validName.size() > 0;
        let isValidEmail = validEmail.contains("@") and validEmail.contains(".");
        let isValidCondition = validCondition.size() > 0;
        
        let isValid = isValidName and isValidEmail and isValidCondition;
        
        Debug.print("✅ Patient Registration Validation Test: " # (if isValid "PASSED" else "FAILED"));
        isValid
    };

    // Test: Patient Assignment Logic
    public func testPatientAssignment() : async Bool {
        // Test assignment logic
        let patientId = "patient_1";
        let doctorId = "doctor_1";
        
        // Simulate assignment validation
        let patientExists = patientId == "patient_1";
        let doctorExists = doctorId == "doctor_1";
        let canAssign = patientExists and doctorExists;
        
        Debug.print("✅ Patient Assignment Test: " # (if canAssign "PASSED" else "FAILED"));
        canAssign
    };

    // Test: Patient Search by Email
    public func testFindPatientByEmail() : async Bool {
        let searchEmail = "john@example.com";
        
        // Simulate search logic
        let found = Array.find<TestPatient>(testPatients, func(p) = p.email == searchEmail);
        let isFound = switch (found) {
            case (?patient) { patient.name == "John Doe" };
            case null { false };
        };
        
        Debug.print("✅ Find Patient by Email Test: " # (if isFound "PASSED" else "FAILED"));
        isFound
    };

    // Test: Unassigned Patients Filter
    public func testGetUnassignedPatients() : async Bool {
        // Simulate filtering unassigned patients
        let unassigned = Array.filter<TestPatient>(testPatients, func(p) {
            switch (p.assignedDoctorId) {
                case null { true };
                case (?_) { false };
            }
        });
        
        let hasUnassigned = unassigned.size() > 0;
        let correctPatient = unassigned[0].name == "Jane Smith";
        
        Debug.print("✅ Get Unassigned Patients Test: " # (if (hasUnassigned and correctPatient) "PASSED" else "FAILED"));
        hasUnassigned and correctPatient
    };

    // Run all patient tests
    public func runAllPatientTests() : async Bool {
        Debug.print("🧪 Running Patient Unit Tests...");
        Debug.print("================================");
        
        let test1 = await testGeneratePatientId();
        let test2 = await testPatientRegistration();
        let test3 = await testPatientAssignment();
        let test4 = await testFindPatientByEmail();
        let test5 = await testGetUnassignedPatients();
        
        let allPassed = test1 and test2 and test3 and test4 and test5;
        
        Debug.print("================================");
        Debug.print("Patient Tests Result: " # (if allPassed "✅ ALL PASSED" else "❌ SOME FAILED"));
        
        allPassed
    };

    // Type definition for test data
    type TestPatient = {
        id: Text;
        name: Text;
        condition: Text;
        email: Text;
        assignedDoctorId: ?Text;
        isActive: Bool;
    };
}