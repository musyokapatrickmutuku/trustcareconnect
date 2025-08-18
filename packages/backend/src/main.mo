// TrustCareConnect Main Canister - Simplified for Testing
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";

actor TrustCareConnect {

    // Data type definitions
    type PatientId = Text;
    type DoctorId = Text;
    type QueryId = Text;

    // Patient record structure
    type Patient = {
        id: PatientId;
        name: Text;
        condition: Text;
        email: Text;
        assignedDoctorId: ?DoctorId;
        isActive: Bool;
    };

    // Doctor record structure  
    type Doctor = {
        id: DoctorId;
        name: Text;
        specialization: Text;
    };

    // Query status enumeration
    type QueryStatus = {
        #pending;
        #doctor_review;
        #completed;
    };

    // Medical query structure
    type MedicalQuery = {
        id: QueryId;
        patientId: PatientId;
        title: Text;
        description: Text;
        status: QueryStatus;
        doctorId: ?DoctorId;
        response: ?Text;
        aiDraftResponse: ?Text;
        createdAt: Int;
        updatedAt: Int;
    };

    // System statistics type
    type SystemStats = {
        totalPatients: Nat;
        totalDoctors: Nat;
        totalQueries: Nat;
        pendingQueries: Nat;
        completedQueries: Nat;
    };

    // Storage maps using stable memory
    private stable var nextPatientId: Nat = 1;
    private stable var nextDoctorId: Nat = 1;
    private stable var nextQueryId: Nat = 1;

    private stable var patientsEntries: [(PatientId, Patient)] = [];
    private stable var doctorsEntries: [(DoctorId, Doctor)] = [];
    private stable var queriesEntries: [(QueryId, MedicalQuery)] = [];

    // Initialize HashMap storage
    private var patients = Map.fromIter<PatientId, Patient>(patientsEntries.vals(), patientsEntries.size(), Text.equal, Text.hash);
    private var doctors = Map.fromIter<DoctorId, Doctor>(doctorsEntries.vals(), doctorsEntries.size(), Text.equal, Text.hash);
    private var queries = Map.fromIter<QueryId, MedicalQuery>(queriesEntries.vals(), queriesEntries.size(), Text.equal, Text.hash);

    // Pre-upgrade hook to save state
    system func preupgrade() {
        patientsEntries := Iter.toArray(patients.entries());
        doctorsEntries := Iter.toArray(doctors.entries());
        queriesEntries := Iter.toArray(queries.entries());
    };

    // Post-upgrade hook to restore state
    system func postupgrade() {
        patientsEntries := [];
        doctorsEntries := [];
        queriesEntries := [];
    };

    // Helper function to generate patient ID
    private func generatePatientId(): PatientId {
        let id = "patient_" # Int.toText(nextPatientId);
        nextPatientId += 1;
        id
    };

    // Helper function to generate doctor ID
    private func generateDoctorId(): DoctorId {
        let id = "doctor_" # Int.toText(nextDoctorId);
        nextDoctorId += 1;
        id
    };

    // Helper function to generate query ID
    private func generateQueryId(): QueryId {
        let id = "query_" # Int.toText(nextQueryId);
        nextQueryId += 1;
        id
    };

    // Mock AI response function (for testing without HTTP outcalls)
    private func getMockAIDraftResponse(queryText: Text, condition: Text): ?Text {
        let response = "Based on your " # condition # " condition and query '" # queryText # "', I recommend consulting with your healthcare provider. This is a mock AI response for testing.";
        ?response
    };

    // =======================
    // PATIENT MANAGEMENT
    // =======================

    // Register a new patient
    public func registerPatient(name: Text, condition: Text, email: Text): async PatientId {
        let patientId = generatePatientId();
        let patient: Patient = {
            id = patientId;
            name = name;
            condition = condition;
            email = email;
            assignedDoctorId = null;
            isActive = false;
        };
        
        patients.put(patientId, patient);
        patientId
    };

    // Get patient by ID
    public query func getPatient(patientId: PatientId): async ?Patient {
        patients.get(patientId)
    };

    // Find patient by email
    public query func findPatientByEmail(email: Text): async ?Patient {
        let allPatients = Iter.toArray(patients.vals());
        Array.find<Patient>(allPatients, func(p: Patient): Bool { p.email == email })
    };

    // Get unassigned patients
    public query func getUnassignedPatients(): async [Patient] {
        let unassignedPatients = Array.filter<Patient>(
            Iter.toArray(patients.vals()),
            func(p: Patient): Bool { 
                switch (p.assignedDoctorId) {
                    case null { true };
                    case (?_doctorId) { false };
                }
            }
        );
        unassignedPatients
    };

    // Assign patient to doctor
    public func assignPatientToDoctor(patientId: PatientId, doctorId: DoctorId): async Result.Result<(), Text> {
        // Verify doctor exists
        switch (doctors.get(doctorId)) {
            case null { #err("Doctor not found") };
            case (?_doctor) {
                // Verify patient exists
                switch (patients.get(patientId)) {
                    case null { #err("Patient not found") };
                    case (?patient) {
                        let updatedPatient: Patient = {
                            id = patient.id;
                            name = patient.name;
                            condition = patient.condition;
                            email = patient.email;
                            assignedDoctorId = ?doctorId;
                            isActive = true;
                        };
                        patients.put(patientId, updatedPatient);
                        #ok()
                    };
                }
            };
        }
    };

    // Get patients assigned to a doctor
    public query func getDoctorPatients(doctorId: DoctorId): async [Patient] {
        let doctorPatients = Array.filter<Patient>(
            Iter.toArray(patients.vals()),
            func(p: Patient): Bool { 
                switch (p.assignedDoctorId) {
                    case null { false };
                    case (?dId) { dId == doctorId };
                }
            }
        );
        doctorPatients
    };

    // Unassign patient from doctor
    public func unassignPatient(patientId: PatientId, doctorId: DoctorId): async Result.Result<(), Text> {
        switch (patients.get(patientId)) {
            case null { #err("Patient not found") };
            case (?patient) {
                // Validate doctor authorization
                switch (patient.assignedDoctorId) {
                    case null { #err("Patient is not assigned to any doctor") };
                    case (?assignedDoctorId) {
                        if (assignedDoctorId != doctorId) {
                            #err("Patient is not assigned to this doctor")
                        } else {
                            let updatedPatient: Patient = {
                                id = patient.id;
                                name = patient.name;
                                condition = patient.condition;
                                email = patient.email;
                                assignedDoctorId = null;
                                isActive = false;
                            };
                            patients.put(patientId, updatedPatient);
                            #ok()
                        }
                    };
                }
            };
        }
    };

    // =======================
    // DOCTOR MANAGEMENT
    // =======================

    // Register a new doctor
    public func registerDoctor(name: Text, specialization: Text): async DoctorId {
        let doctorId = generateDoctorId();
        let doctor: Doctor = {
            id = doctorId;
            name = name;
            specialization = specialization;
        };
        
        doctors.put(doctorId, doctor);
        doctorId
    };

    // Get doctor by ID
    public query func getDoctor(doctorId: DoctorId): async ?Doctor {
        doctors.get(doctorId)
    };

    // Get all doctors
    public query func getAllDoctors(): async [Doctor] {
        Iter.toArray(doctors.vals())
    };

    // =======================
    // QUERY MANAGEMENT
    // =======================

    // Submit a medical query
    public func submitQuery(patientId: PatientId, title: Text, description: Text): async Result.Result<QueryId, Text> {
        switch (patients.get(patientId)) {
            case null { #err("Patient not found") };
            case (?patient) {
                switch (patient.assignedDoctorId) {
                    case null { #err("Patient must be assigned to a doctor first") };
                    case (?assignedDoctorId) {
                        let queryId = generateQueryId();
                        let now = Time.now();
                        
                        // Get mock AI draft response
                        let aiDraft = getMockAIDraftResponse(title # " " # description, patient.condition);
                        
                        let medicalQuery: MedicalQuery = {
                            id = queryId;
                            patientId = patientId;
                            title = title;
                            description = description;
                            status = #pending;
                            doctorId = ?assignedDoctorId;
                            response = null;
                            aiDraftResponse = aiDraft;
                            createdAt = now;
                            updatedAt = now;
                        };
                        
                        queries.put(queryId, medicalQuery);
                        #ok(queryId)
                    };
                }
            };
        }
    };

    // Get query by ID
    public query func getQuery(queryId: QueryId): async ?MedicalQuery {
        queries.get(queryId)
    };

    // Get patient queries
    public query func getPatientQueries(patientId: PatientId): async [MedicalQuery] {
        let patientQueries = Array.filter<MedicalQuery>(
            Iter.toArray(queries.vals()),
            func(q: MedicalQuery): Bool { q.patientId == patientId }
        );
        patientQueries
    };

    // Get pending queries
    public query func getPendingQueries(): async [MedicalQuery] {
        let pendingQueries = Array.filter<MedicalQuery>(
            Iter.toArray(queries.vals()),
            func(q: MedicalQuery): Bool { q.status == #pending }
        );
        pendingQueries
    };

    // Doctor takes a query
    public func takeQuery(queryId: QueryId, doctorId: DoctorId): async Result.Result<(), Text> {
        switch (queries.get(queryId)) {
            case null { #err("Query not found") };
            case (?medicalQuery) {
                if (medicalQuery.status != #pending) {
                    #err("Query is not pending")
                } else {
                    let updatedQuery: MedicalQuery = {
                        id = medicalQuery.id;
                        patientId = medicalQuery.patientId;
                        title = medicalQuery.title;
                        description = medicalQuery.description;
                        status = #doctor_review;
                        doctorId = ?doctorId;
                        response = medicalQuery.response;
                        aiDraftResponse = medicalQuery.aiDraftResponse;
                        createdAt = medicalQuery.createdAt;
                        updatedAt = Time.now();
                    };
                    queries.put(queryId, updatedQuery);
                    #ok()
                }
            };
        }
    };

    // Doctor responds to query
    public func respondToQuery(queryId: QueryId, doctorId: DoctorId, response: Text): async Result.Result<(), Text> {
        switch (queries.get(queryId)) {
            case null { #err("Query not found") };
            case (?medicalQuery) {
                // Validate doctor authorization
                switch (medicalQuery.doctorId) {
                    case null { #err("Query is not assigned to any doctor") };
                    case (?assignedDoctorId) {
                        if (assignedDoctorId != doctorId) {
                            #err("This query is not assigned to you")
                        } else {
                            let updatedQuery: MedicalQuery = {
                                id = medicalQuery.id;
                                patientId = medicalQuery.patientId;
                                title = medicalQuery.title;
                                description = medicalQuery.description;
                                status = #completed;
                                doctorId = medicalQuery.doctorId;
                                response = ?response;
                                aiDraftResponse = medicalQuery.aiDraftResponse;
                                createdAt = medicalQuery.createdAt;
                                updatedAt = Time.now();
                            };
                            queries.put(queryId, updatedQuery);
                            #ok()
                        }
                    };
                }
            };
        }
    };

    // Get doctor queries
    public query func getDoctorQueries(doctorId: DoctorId): async [MedicalQuery] {
        let doctorQueries = Array.filter<MedicalQuery>(
            Iter.toArray(queries.vals()),
            func(q: MedicalQuery): Bool { 
                switch (q.doctorId) {
                    case null { false };
                    case (?dId) { dId == doctorId };
                }
            }
        );
        doctorQueries
    };

    // =======================
    // SYSTEM FUNCTIONS
    // =======================

    // Health check
    public query func healthCheck(): async Text {
        "TrustCareConnect backend is running! Patients: " # 
        Int.toText(patients.size()) # 
        ", Doctors: " # Int.toText(doctors.size()) # 
        ", Queries: " # Int.toText(queries.size())
    };

    // Get system statistics
    public query func getStats(): async SystemStats {
        let allQueries = Iter.toArray(queries.vals());
        let pending = Array.filter<MedicalQuery>(allQueries, func(q: MedicalQuery): Bool { q.status == #pending }).size();
        let completed = Array.filter<MedicalQuery>(allQueries, func(q: MedicalQuery): Bool { q.status == #completed }).size();

        {
            totalPatients = patients.size();
            totalDoctors = doctors.size();
            totalQueries = queries.size();
            pendingQueries = pending;
            completedQueries = completed;
        }
    };
}