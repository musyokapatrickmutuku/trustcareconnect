// Query Controller - handles query-related business logic
import Result "mo:base/Result";
import Text "mo:base/Text";
import Types "../types/common";
import QueryService "../services/QueryService";
import PatientService "../services/PatientService";
import DoctorService "../services/DoctorService";

module QueryController {
    
    public class QueryControllerClass(
        queryService: QueryService.QueryServiceClass,
        patientService: PatientService.PatientServiceClass,
        doctorService: DoctorService.DoctorServiceClass
    ) {

        // Submit a medical query with validation
        public func submitQuery(patientId: Types.PatientId, title: Text, description: Text): async Result.Result<Types.QueryId, Text> {
            // Input validation
            if (title == "" or description == "") {
                return #err("Title and description are required");
            };

            if (title.size() > 200 or description.size() > 1000) {
                return #err("Input fields are too long");
            };

            // Verify patient exists and get patient info
            switch (await patientService.getPatient(patientId)) {
                case null { #err("Patient not found") };
                case (?patient) {
                    // Check if patient is assigned to a doctor
                    switch (patient.assignedDoctorId) {
                        case null { #err("Patient must be assigned to a doctor before submitting queries") };
                        case (?assignedDoctorId) {
                            await queryService.submitQuery(patientId, title, description, patient.condition, assignedDoctorId)
                        };
                    }
                };
            }
        };

        // Get query by ID
        public func getQuery(queryId: Types.QueryId): async ?Types.MedicalQuery {
            await queryService.getQuery(queryId)
        };

        // Get all queries by patient
        public func getPatientQueries(patientId: Types.PatientId): async [Types.MedicalQuery] {
            await queryService.getPatientQueries(patientId)
        };

        // Get all pending queries
        public func getPendingQueries(): async [Types.MedicalQuery] {
            await queryService.getPendingQueries()
        };

        // Doctor takes ownership of a query with validation
        public func takeQuery(queryId: Types.QueryId, doctorId: Types.DoctorId): async Result.Result<(), Text> {
            // Verify doctor exists
            if (not doctorService.doctorExists(doctorId)) {
                return #err("Doctor not found");
            };

            await queryService.takeQuery(queryId, doctorId)
        };

        // Doctor responds to a query with validation
        public func respondToQuery(queryId: Types.QueryId, doctorId: Types.DoctorId, response: Text): async Result.Result<(), Text> {
            // Input validation
            if (response == "") {
                return #err("Response cannot be empty");
            };

            if (response.size() > 2000) {
                return #err("Response is too long");
            };

            // Verify doctor exists
            if (not doctorService.doctorExists(doctorId)) {
                return #err("Doctor not found");
            };

            await queryService.respondToQuery(queryId, doctorId, response)
        };

        // Get queries assigned to a doctor
        public func getDoctorQueries(doctorId: Types.DoctorId): async [Types.MedicalQuery] {
            await queryService.getDoctorQueries(doctorId)
        };

        // Get all completed queries
        public func getCompletedQueries(): async [Types.MedicalQuery] {
            await queryService.getCompletedQueries()
        };

        // Get all queries
        public func getAllQueries(): async [Types.MedicalQuery] {
            await queryService.getAllQueries()
        };
    }
}