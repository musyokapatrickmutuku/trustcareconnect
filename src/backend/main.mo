import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Error "mo:base/Error";

actor TrustCareConnect {

    // Data type definitions
    type PatientId = Text;
    type DoctorId = Text;
    type QueryId = Text;

    // Patient record structure
    type Patient = {
        id: PatientId;
        name: Text;
        condition: Text;  // e.g., "diabetes", "hypertension"
        email: Text;
        assignedDoctorId: ?DoctorId;  // Optional - assigned by doctor
        isActive: Bool;  // Active in treatment
    };

    // Doctor record structure  
    type Doctor = {
        id: DoctorId;
        name: Text;
        specialization: Text;  // e.g., "endocrinologist", "cardiologist"
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
        doctorId: ?DoctorId;  // Optional - assigned when doctor takes the query
        response: ?Text;      // Optional - doctor's final response
        aiDraftResponse: ?Text;  // AI-generated draft response
        createdAt: Int;       // Timestamp
        updatedAt: Int;       // Last update timestamp
    };

    // HTTP outcall types for AI proxy integration
    type HttpHeader = {
        name: Text;
        value: Text;
    };

    type HttpMethod = {
        #get;
        #post;
        #head;
    };

    type HttpRequestArgs = {
        url: Text;
        max_response_bytes: ?Nat64;
        headers: [HttpHeader];
        body: ?Blob;
        method: HttpMethod;
        transform: ?{
            function: shared (response: HttpResponsePayload) -> async HttpResponsePayload;
        };
    };

    type HttpResponsePayload = {
        status: Nat;
        headers: [HttpHeader];
        body: Blob;
    };

    type HttpResponse = {
        status: Nat;
        headers: [HttpHeader];
        body: Blob;
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

    // AI Proxy integration
    let ic : actor {
        http_request : HttpRequestArgs -> async HttpResponse;
    } = actor "aaaaa-aa";

    // Function to call AI proxy for draft response
    private func getAIDraftResponse(queryText: Text, condition: Text): async ?Text {
        try {
            let host = "localhost:3001";
            let url = "http://" # host # "/api/query";
            
            // JSON payload for AI proxy
            let jsonPayload = "{\"queryText\":\"" # queryText # "\",\"condition\":\"" # condition # "\",\"provider\":\"mock\"}";
            let requestBodyAsBlob = Text.encodeUtf8(jsonPayload);

            let requestArgs: HttpRequestArgs = {
                url = url;
                max_response_bytes = ?2048;
                headers = [
                    {name = "Content-Type"; value = "application/json"},
                    {name = "Host"; value = host}
                ];
                body = ?requestBodyAsBlob;
                method = #post;
                transform = null;
            };

            let httpResponse = await (with cycles = 20_949_972_000) ic.http_request(requestArgs);

            if (httpResponse.status == 200) {
                let responseText = switch (Text.decodeUtf8(httpResponse.body)) {
                    case null { "" };
                    case (?text) { text };
                };
                // Simple JSON parsing to extract response (production should use proper JSON parser)
                if (Text.contains(responseText, #text "\"success\":true")) {
                    // Extract response from JSON - this is a simplified approach
                    let parts = Text.split(responseText, #text "\"response\":\"");
                    switch(parts.next()) {
                        case null { null };
                        case (?_first) {
                            switch(parts.next()) {
                                case null { null };
                                case (?second) {
                                    let responseParts = Text.split(second, #text "\",\"metadata\"");
                                    switch(responseParts.next()) {
                                        case null { null };
                                        case (?response) { ?response };
                                    };
                                };
                            };
                        };
                    };
                } else {
                    null
                };
            } else {
                Debug.print("AI Proxy HTTP Error: " # Int.toText(httpResponse.status));
                null
            };
        } catch (error) {
            Debug.print("AI Proxy Call Failed: " # Error.message(error));
            null
        };
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

    // =======================
    // PATIENT MANAGEMENT
    // =======================

    // Register a new patient (initially unassigned)
    public func registerPatient(name: Text, condition: Text, email: Text): async PatientId {
        let patientId = generatePatientId();
        let patient: Patient = {
            id = patientId;
            name = name;
            condition = condition;
            email = email;
            assignedDoctorId = null;
            isActive = false;  // Not active until assigned to doctor
        };
        
        patients.put(patientId, patient);
        patientId
    };

    // Get patient by ID
    public query func getPatient(patientId: PatientId): async ?Patient {
        patients.get(patientId)
    };

    // Get all patients (for admin/debugging purposes)
    public query func getAllPatients(): async [Patient] {
        Iter.toArray(patients.vals())
    };

    // Get unassigned patients (for doctor assignment)
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

    // Doctor assigns a patient to themselves
    public func assignPatientToDoctor(patientId: PatientId, doctorId: DoctorId): async Result.Result<(), Text> {
        // Verify doctor exists
        switch (doctors.get(doctorId)) {
            case null { #err("Doctor not found") };
            case (?_doctor) {
                // Verify patient exists
                switch (patients.get(patientId)) {
                    case null { #err("Patient not found") };
                    case (?patient) {
                        // Check if patient is already assigned
                        switch (patient.assignedDoctorId) {
                            case (?existingDoctorId) { #err("Patient already assigned to doctor: " # existingDoctorId) };
                            case null {
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
        }
    };

    // Get patients assigned to a specific doctor
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

    // Unassign patient from doctor (for patient transfer)
    public func unassignPatient(patientId: PatientId, doctorId: DoctorId): async Result.Result<(), Text> {
        // Verify doctor exists
        switch (doctors.get(doctorId)) {
            case null { #err("Doctor not found") };
            case (?_doctor) {
                // Verify patient exists and is assigned to this doctor
                switch (patients.get(patientId)) {
                    case null { #err("Patient not found") };
                    case (?patient) {
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

    // Patient submits a medical query (only if assigned to a doctor)
    public func submitQuery(patientId: PatientId, title: Text, description: Text): async Result.Result<QueryId, Text> {
        // Verify patient exists
        switch (patients.get(patientId)) {
            case null { #err("Patient not found") };
            case (?patient) {
                // Check if patient is assigned to a doctor
                switch (patient.assignedDoctorId) {
                    case null { #err("Patient must be assigned to a doctor before submitting queries") };
                    case (?assignedDoctorId) {
                        let queryId = generateQueryId();
                        let now = Time.now();
                        
                        // Get AI draft response
                        let aiDraft = await getAIDraftResponse(title # " " # description, patient.condition);
                        
                        let medicalQuery: MedicalQuery = {
                            id = queryId;
                            patientId = patientId;
                            title = title;
                            description = description;
                            status = #pending;
                            doctorId = ?assignedDoctorId;  // Pre-assign to patient's doctor
                            response = null;
                            aiDraftResponse = aiDraft;  // Store AI draft response
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

    // Get all queries by patient
    public query func getPatientQueries(patientId: PatientId): async [MedicalQuery] {
        let patientQueries = Array.filter<MedicalQuery>(
            Iter.toArray(queries.vals()),
            func(q: MedicalQuery): Bool { q.patientId == patientId }
        );
        patientQueries
    };

    // Doctor fetches all pending queries
    public query func getPendingQueries(): async [MedicalQuery] {
        let pendingQueries = Array.filter<MedicalQuery>(
            Iter.toArray(queries.vals()),
            func(q: MedicalQuery): Bool { q.status == #pending }
        );
        pendingQueries
    };

    // Doctor takes ownership of a pending query (moves to review status)
    public func takeQuery(queryId: QueryId, doctorId: DoctorId): async Result.Result<(), Text> {
        // Verify doctor exists
        switch (doctors.get(doctorId)) {
            case null { #err("Doctor not found") };
            case (?_doctor) {
                // Verify query exists and is pending
                switch (queries.get(queryId)) {
                    case null { #err("Query not found") };
                    case (?medicalQuery) {
                        if (medicalQuery.status != #pending) {
                            #err("Query is not in pending status")
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
        }
    };

    // Doctor adds response and marks query as completed
    public func respondToQuery(queryId: QueryId, doctorId: DoctorId, response: Text): async Result.Result<(), Text> {
        // Verify doctor exists
        switch (doctors.get(doctorId)) {
            case null { #err("Doctor not found") };
            case (?_doctor) {
                // Verify query exists and is assigned to this doctor
                switch (queries.get(queryId)) {
                    case null { #err("Query not found") };
                    case (?medicalQuery) {
                        switch (medicalQuery.doctorId) {
                            case null { #err("Query not assigned to any doctor") };
                            case (?assignedDoctorId) {
                                if (assignedDoctorId != doctorId) {
                                    #err("Query not assigned to this doctor")
                                } else if (medicalQuery.status == #completed) {
                                    #err("Query already completed")
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
        }
    };

    // Get queries assigned to a specific doctor
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

    // Get all completed queries
    public query func getCompletedQueries(): async [MedicalQuery] {
        let completedQueries = Array.filter<MedicalQuery>(
            Iter.toArray(queries.vals()),
            func(q: MedicalQuery): Bool { q.status == #completed }
        );
        completedQueries
    };

    // Get all queries (for admin/debugging purposes)
    public query func getAllQueries(): async [MedicalQuery] {
        Iter.toArray(queries.vals())
    };

    // =======================
    // SYSTEM FUNCTIONS
    // =======================

    // Health check function
    public query func healthCheck(): async Text {
        "TrustCareConnect backend is running! Patients: " # 
        Int.toText(patients.size()) # 
        ", Doctors: " # Int.toText(doctors.size()) # 
        ", Queries: " # Int.toText(queries.size())
    };

    // Get system statistics
    public query func getStats(): async {
        totalPatients: Nat;
        totalDoctors: Nat;
        totalQueries: Nat;
        pendingQueries: Nat;
        completedQueries: Nat;
    } {
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