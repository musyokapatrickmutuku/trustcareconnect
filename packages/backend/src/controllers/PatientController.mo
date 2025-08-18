// Patient Controller - handles patient-related business logic
import Result "mo:base/Result";
import Types "../types/common";
import PatientService "../services/PatientService";
import DoctorService "../services/DoctorService";

module PatientController {
    
    public class PatientControllerClass(
        patientService: PatientService.PatientServiceClass,
        doctorService: DoctorService.DoctorServiceClass
    ) {

        // Register a new patient with validation
        public func registerPatient(name: Text, condition: Text, email: Text): async Result.Result<Types.PatientId, Text> {
            // Input validation
            if (name == "" or condition == "" or email == "") {
                return #err("All fields are required");
            };

            if (name.size() > 100 or condition.size() > 100 or email.size() > 100) {
                return #err("Input fields are too long");
            };

            // Basic email validation
            if (not Text.contains(email, #text "@")) {
                return #err("Invalid email format");
            };

            let patientId = await patientService.registerPatient(name, condition, email);
            #ok(patientId)
        };

        // Get patient by ID
        public func getPatient(patientId: Types.PatientId): async ?Types.Patient {
            await patientService.getPatient(patientId)
        };

        // Get all patients
        public func getAllPatients(): async [Types.Patient] {
            await patientService.getAllPatients()
        };

        // Get unassigned patients
        public func getUnassignedPatients(): async [Types.Patient] {
            await patientService.getUnassignedPatients()
        };

        // Assign patient to doctor with validation
        public func assignPatientToDoctor(patientId: Types.PatientId, doctorId: Types.DoctorId): async Result.Result<(), Text> {
            // Verify doctor exists
            if (not doctorService.doctorExists(doctorId)) {
                return #err("Doctor not found");
            };

            await patientService.assignPatientToDoctor(patientId, doctorId)
        };

        // Get patients assigned to a doctor
        public func getDoctorPatients(doctorId: Types.DoctorId): async [Types.Patient] {
            await patientService.getDoctorPatients(doctorId)
        };

        // Unassign patient from doctor with validation
        public func unassignPatient(patientId: Types.PatientId, doctorId: Types.DoctorId): async Result.Result<(), Text> {
            // Verify doctor exists
            if (not doctorService.doctorExists(doctorId)) {
                return #err("Doctor not found");
            };

            await patientService.unassignPatient(patientId, doctorId)
        };
    }
}