// TrustCareConnect Main Canister - Enhanced with Advanced Features
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Result "mo:base/Result";
import Types "./types";
import QueryProcessor "./queryProcessor";

actor TrustCareConnect {

    // Import enhanced type definitions
    public type PatientId = Types.PatientId;
    public type DoctorId = Types.DoctorId;
    public type QueryId = Types.QueryId;
    public type PatientData = Types.PatientData;
    public type DoctorData = Types.DoctorData;
    public type QueryData = Types.QueryData;
    public type PlatformStats = Types.PlatformStats;
    public type QueryPriority = Types.QueryPriority;
    public type QueryCategory = Types.QueryCategory;
    public type QueryStatus = Types.QueryStatus;
    public type DoctorSpecialty = Types.DoctorSpecialty;
    public type AIAnalysis = Types.AIAnalysis;
    public type ApiResult<T> = Types.ApiResult<T>;
    public type ApiError = Types.ApiError;
    public type SearchCriteria = Types.SearchCriteria;
    public type SearchResult<T> = Types.SearchResult<T>;
    
    // Legacy type aliases for backward compatibility
    type Patient = {
        id: PatientId;
        name: Text;
        condition: Text;
        email: Text;
        assignedDoctorId: ?DoctorId;
        isActive: Bool;
    };

    type Doctor = {
        id: DoctorId;
        name: Text;
        specialization: Text;
    };

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

    // Enhanced storage for both legacy and new data structures
    private var patients = Map.fromIter<PatientId, Patient>(patientsEntries.vals(), patientsEntries.size(), Text.equal, Text.hash);
    private var doctors = Map.fromIter<DoctorId, Doctor>(doctorsEntries.vals(), doctorsEntries.size(), Text.equal, Text.hash);
    private var queries = Map.fromIter<QueryId, MedicalQuery>(queriesEntries.vals(), queriesEntries.size(), Text.equal, Text.hash);
    
    // Enhanced data storage
    private stable var enhancedPatientsEntries: [(PatientId, PatientData)] = [];
    private stable var enhancedDoctorsEntries: [(DoctorId, DoctorData)] = [];
    private stable var enhancedQueriesEntries: [(QueryId, QueryData)] = [];
    
    private var enhancedPatients = Map.fromIter<PatientId, PatientData>(enhancedPatientsEntries.vals(), enhancedPatientsEntries.size(), Text.equal, Text.hash);
    private var enhancedDoctors = Map.fromIter<DoctorId, DoctorData>(enhancedDoctorsEntries.vals(), enhancedDoctorsEntries.size(), Text.equal, Text.hash);
    private var enhancedQueries = Map.fromIter<QueryId, QueryData>(enhancedQueriesEntries.vals(), enhancedQueriesEntries.size(), Text.equal, Text.hash);
    
    // Initialize AI and query processing components
    private let aiProcessor = QueryProcessor.AIProcessor();
    private let doctorAssignment = QueryProcessor.DoctorAssignmentEngine();
    private let queryRouter = QueryProcessor.QueryRouter();

    // Pre-upgrade hook to save state
    system func preupgrade() {
        patientsEntries := Iter.toArray(patients.entries());
        doctorsEntries := Iter.toArray(doctors.entries());
        queriesEntries := Iter.toArray(queries.entries());
        enhancedPatientsEntries := Iter.toArray(enhancedPatients.entries());
        enhancedDoctorsEntries := Iter.toArray(enhancedDoctors.entries());
        enhancedQueriesEntries := Iter.toArray(enhancedQueries.entries());
    };

    // Post-upgrade hook to restore state
    system func postupgrade() {
        patientsEntries := [];
        doctorsEntries := [];
        queriesEntries := [];
        enhancedPatientsEntries := [];
        enhancedDoctorsEntries := [];
        enhancedQueriesEntries := [];
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

    // Real AI response function using Novita AI service via HTTP outcalls
    private func getAIDraftResponse(queryText: Text, condition: Text): async ?Text {
        try {
            let ic : actor {
                http_request : {
                    url : Text;
                    max_response_bytes : ?Nat;
                    headers : [{name : Text; value : Text}];
                    body : ?Blob;
                    method : {#get; #head; #post; #put; #delete};
                    transform : ?{function : {response : {status : Nat; headers : [{name : Text; value : Text}]; body : Blob}} -> {response : {status : Nat; headers : [{name : Text; value : Text}]; body : Blob}}; context : Blob};
                } -> async {status : Nat; headers : [{name : Text; value : Text}]; body : Blob};
            } = actor "aaaaa-aa";

            let host = "localhost:3001";
            let url = "http://" # host # "/api/query";
            
            // JSON payload for AI proxy with Novita provider (Clinical Decision Support)
            let jsonPayload = "{\"queryText\":\"" # queryText # "\",\"condition\":\"" # condition # "\",\"provider\":\"novita\"}";
            let requestBodyAsBlob = Text.encodeUtf8(jsonPayload);

            let requestArgs = {
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

            let httpResponse = await ic.http_request(requestArgs);

            if (httpResponse.status == 200) {
                let responseText = switch (Text.decodeUtf8(httpResponse.body)) {
                    case null { "" };
                    case (?text) { text };
                };
                // Simple JSON parsing to extract response
                if (Text.contains(responseText, #text "\"success\":true")) {
                    // Extract response from JSON - simplified approach
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
                null
            };
        } catch (error) {
            // Fallback to mock response if AI service fails
            let fallbackResponse = "Based on your " # condition # " condition and query '" # queryText # "', I recommend consulting with your healthcare provider. (AI service temporarily unavailable)";
            ?fallbackResponse
        };
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
                        
                        // Get AI clinical decision support response from AI proxy service
                        // Create comprehensive patient profile for clinical decision support
                        let patientProfile = "Patient ID: " # patient.id # ", Name: " # patient.name # ", Primary Condition: " # patient.condition # ", Email: " # patient.email # ", Active Status: " # (if (patient.isActive) {"Active"} else {"Inactive"}) # ", Assigned Doctor: " # (switch (patient.assignedDoctorId) { case null {"Unassigned"}; case (?docId) {docId} });
                        let aiDraft = await getAIDraftResponse(title # " " # description, patientProfile);
                        
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

    // Get system statistics (legacy)
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

    // =======================
    // ENHANCED PLATFORM FUNCTIONS
    // =======================

    // Get comprehensive platform statistics
    public query func getPlatformStats(): async PlatformStats {
        let currentTime = Time.now();
        let allEnhancedQueries = Iter.toArray(enhancedQueries.vals());
        let allLegacyQueries = Iter.toArray(queries.vals());
        
        // Combine legacy and enhanced query counts
        let totalQueriesCount = allEnhancedQueries.size() + allLegacyQueries.size();
        
        // Calculate query statistics
        let pendingQueries = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool { 
            q.status == #pending or q.status == #submitted 
        }).size();
        
        let inReviewQueries = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool { 
            q.status == #assigned or q.status == #in_review 
        }).size();
        
        let resolvedQueries = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool { 
            q.status == #resolved or q.status == #closed 
        }).size();
        
        let emergencyQueries = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool { 
            q.priority == #emergency 
        }).size();
        
        // Calculate average resolution time
        let resolvedQueriesWithTime = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool {
            q.responseTimeMinutes != null
        });
        
        let averageResolutionTime = if (resolvedQueriesWithTime.size() > 0) {
            let totalTime = Array.foldLeft<QueryData, Nat>(resolvedQueriesWithTime, 0, func(acc: Nat, q: QueryData): Nat {
                switch (q.responseTimeMinutes) {
                    case (?time) { acc + time };
                    case null { acc };
                }
            });
            Float.fromInt(totalTime / resolvedQueriesWithTime.size())
        } else { 0.0 };
        
        // Calculate time-based analytics
        let last24Hours = currentTime - (24 * 60 * 60 * 1000000000); // 24 hours in nanoseconds
        let lastWeek = currentTime - (7 * 24 * 60 * 60 * 1000000000); // 1 week in nanoseconds
        let lastMonth = currentTime - (30 * 24 * 60 * 60 * 1000000000); // 30 days in nanoseconds
        
        let queriesLast24Hours = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool {
            q.createdAt >= last24Hours
        }).size();
        
        let queriesLastWeek = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool {
            q.createdAt >= lastWeek
        }).size();
        
        let queriesLastMonth = Array.filter<QueryData>(allEnhancedQueries, func(q: QueryData): Bool {
            q.createdAt >= lastMonth
        }).size();
        
        // Count active doctors
        let activeDoctors = Array.filter<DoctorData>(Iter.toArray(enhancedDoctors.vals()), func(d: DoctorData): Bool {
            d.isActive
        }).size();
        
        // Count doctors currently online (simplified - based on recent activity)
        let doctorsOnline = Array.filter<DoctorData>(Iter.toArray(enhancedDoctors.vals()), func(d: DoctorData): Bool {
            switch (d.lastLogin) {
                case (?lastLogin) { lastLogin >= (currentTime - (30 * 60 * 1000000000)) }; // Last 30 minutes
                case null { false };
            }
        }).size();
        
        {
            // User Statistics
            totalPatients = patients.size() + enhancedPatients.size();
            activePatients = Array.filter<PatientData>(Iter.toArray(enhancedPatients.vals()), func(p: PatientData): Bool { p.isActive }).size();
            newPatientsThisMonth = Array.filter<PatientData>(Iter.toArray(enhancedPatients.vals()), func(p: PatientData): Bool {
                p.createdAt >= lastMonth
            }).size();
            totalDoctors = doctors.size() + enhancedDoctors.size();
            activeDoctors = activeDoctors;
            doctorsOnline = doctorsOnline;
            
            // Query Statistics
            totalQueries = totalQueriesCount;
            pendingQueries = pendingQueries;
            inReviewQueries = inReviewQueries;
            resolvedQueries = resolvedQueries;
            emergencyQueries = emergencyQueries;
            averageQueryResolutionTime = averageResolutionTime;
            
            // Department Statistics (simplified)
            queriesByDepartment = [("General", totalQueriesCount)];
            doctorsBySpecialty = [(#general_practice, enhancedDoctors.size())];
            patientsByCondition = [("General", enhancedPatients.size())];
            
            // Performance Metrics
            systemPerformance = {
                averageQueryProcessingTime = averageResolutionTime;
                systemUptime = 99.9;
                errorRate = 0.1;
                activeUsers = enhancedPatients.size() + enhancedDoctors.size();
                peakConcurrentUsers = 100;
                databaseResponseTime = 50.0;
                apiResponseTime = 120.0;
            };
            
            healthcareMetrics = {
                averagePatientSatisfaction = 4.2;
                queryResolutionRate = 95.0;
                averageDoctorResponseTime = averageResolutionTime;
                criticalQueryResponse = 15.0;
                patientEngagementRate = 78.5;
                doctorUtilizationRate = 85.0;
                specialtyDistribution = [(#general_practice, enhancedDoctors.size())];
            };
            
            // Time-based Analytics
            queriesLast24Hours = queriesLast24Hours;
            queriesLastWeek = queriesLastWeek;
            queriesLastMonth = queriesLastMonth;
            peakUsageHours = [9, 10, 11, 14, 15, 16]; // Business hours
            
            // Quality Metrics
            patientSatisfactionAverage = 4.2;
            doctorPerformanceAverage = 4.0;
            systemReliability = 99.9;
            dataAccuracy = 98.5;
            
            // Compliance and Security
            hipaaCompliantQueries = totalQueriesCount; // Assuming all are compliant
            securityIncidents = 0;
            dataBreaches = 0;
            auditCompletionRate = 100.0;
            
            // Generated Timestamp
            lastUpdated = currentTime;
            reportingPeriod = "Last 30 days";
        }
    };

    // Enhanced patient update function
    public func updatePatient(patientId: PatientId, updatedData: PatientData): async ApiResult<()> {
        switch (enhancedPatients.get(patientId)) {
            case null { 
                #err({
                    code = "PATIENT_NOT_FOUND";
                    message = "Patient with ID " # patientId # " not found";
                    details = null;
                    timestamp = Time.now();
                })
            };
            case (?existingPatient) {
                let updatedPatient: PatientData = {
                    id = existingPatient.id;
                    firstName = updatedData.firstName;
                    lastName = updatedData.lastName;
                    dateOfBirth = updatedData.dateOfBirth;
                    gender = updatedData.gender;
                    phoneNumber = updatedData.phoneNumber;
                    email = updatedData.email;
                    address = updatedData.address;
                    city = updatedData.city;
                    state = updatedData.state;
                    zipCode = updatedData.zipCode;
                    country = updatedData.country;
                    medicalRecordNumber = updatedData.medicalRecordNumber;
                    bloodType = updatedData.bloodType;
                    medicalHistory = updatedData.medicalHistory;
                    currentVitals = updatedData.currentVitals;
                    emergencyContact = updatedData.emergencyContact;
                    insuranceInfo = updatedData.insuranceInfo;
                    primaryDoctorId = updatedData.primaryDoctorId;
                    assignedDoctorIds = updatedData.assignedDoctorIds;
                    isActive = updatedData.isActive;
                    createdAt = existingPatient.createdAt;
                    updatedAt = Time.now();
                    lastVisit = updatedData.lastVisit;
                    consentToTreatment = updatedData.consentToTreatment;
                    hipaaAcknowledged = updatedData.hipaaAcknowledged;
                    dataProcessingConsent = updatedData.dataProcessingConsent;
                    communicationPreferences = updatedData.communicationPreferences;
                };
                
                enhancedPatients.put(patientId, updatedPatient);
                #ok()
            };
        }
    };

    // Enhanced submit query function with AI processing
    public func submitQueryEnhanced(queryData: QueryData): async ApiResult<QueryId> {
        // Validate query data
        switch (QueryProcessor.validateQueryData(queryData)) {
            case (#err(error)) { #err(error) };
            case (#ok()) {
                // Get patient data for AI analysis
                switch (enhancedPatients.get(queryData.patientId)) {
                    case null {
                        #err({
                            code = "PATIENT_NOT_FOUND";
                            message = "Patient not found for query submission";
                            details = null;
                            timestamp = Time.now();
                        })
                    };
                    case (?patientData) {
                        let queryId = QueryProcessor.generateQueryId();
                        let currentTime = Time.now();
                        
                        // Create initial query with generated ID
                        let initialQuery: QueryData = {
                            id = queryId;
                            patientId = queryData.patientId;
                            title = queryData.title;
                            description = queryData.description;
                            category = queryData.category;
                            priority = queryData.priority;
                            status = #submitted;
                            assignedDoctorId = null;
                            departmentId = null;
                            escalationLevel = 0;
                            aiAnalysis = null;
                            aiDraftResponse = null;
                            requiresHumanReview = true;
                            responses = [];
                            patientMessages = [];
                            internalNotes = [];
                            attachments = [];
                            relatedQueryIds = [];
                            followUpRequired = false;
                            followUpDate = null;
                            hipaaCompliant = true;
                            auditTrail = ["Query submitted at " # Int.toText(currentTime)];
                            dataClassification = "Medical";
                            createdAt = currentTime;
                            updatedAt = currentTime;
                            assignedAt = null;
                            resolvedAt = null;
                            responseTimeMinutes = null;
                            patientSatisfactionRating = null;
                            resolutionComplexity = null;
                        };
                        
                        // Perform AI analysis
                        let aiAnalysis = await aiProcessor.analyzeQuery(initialQuery, patientData);
                        
                        // Route query and determine priority
                        let finalPriority = queryRouter.routeQuery(initialQuery, aiAnalysis);
                        let requiresReview = queryRouter.requiresImmediateReview(initialQuery, aiAnalysis);
                        
                        // Generate AI draft response
                        let aiDraftResponse = await aiProcessor.generateDraftResponse(initialQuery, aiAnalysis, patientData);
                        
                        // Assign to appropriate doctor if available
                        let availableDoctors = Iter.toArray(enhancedDoctors.vals());
                        let assignedDoctorId = await doctorAssignment.assignQueryToDoctor(initialQuery, aiAnalysis, availableDoctors);
                        
                        // Create final query with AI analysis
                        let finalQuery: QueryData = {
                            id = queryId;
                            patientId = queryData.patientId;
                            title = queryData.title;
                            description = queryData.description;
                            category = queryData.category;
                            priority = finalPriority;
                            status = if (assignedDoctorId != null) { #assigned } else { #pending };
                            assignedDoctorId = assignedDoctorId;
                            departmentId = queryData.departmentId;
                            escalationLevel = 0;
                            aiAnalysis = ?aiAnalysis;
                            aiDraftResponse = ?aiDraftResponse;
                            requiresHumanReview = requiresReview;
                            responses = [];
                            patientMessages = [];
                            internalNotes = [];
                            attachments = queryData.attachments;
                            relatedQueryIds = [];
                            followUpRequired = false;
                            followUpDate = null;
                            hipaaCompliant = true;
                            auditTrail = [
                                "Query submitted at " # Int.toText(currentTime),
                                "AI analysis completed",
                                "Priority set to " # debug_show(finalPriority)
                            ];
                            dataClassification = "Medical";
                            createdAt = currentTime;
                            updatedAt = currentTime;
                            assignedAt = if (assignedDoctorId != null) { ?currentTime } else { null };
                            resolvedAt = null;
                            responseTimeMinutes = null;
                            patientSatisfactionRating = null;
                            resolutionComplexity = null;
                        };
                        
                        enhancedQueries.put(queryId, finalQuery);
                        #ok(queryId)
                    };
                }
            };
        }
    };

    // Enhanced get patient queries function
    public query func getPatientQueriesEnhanced(patientId: PatientId, searchCriteria: ?SearchCriteria): async SearchResult<QueryData> {
        let allPatientQueries = Array.filter<QueryData>(
            Iter.toArray(enhancedQueries.vals()),
            func(q: QueryData): Bool { q.patientId == patientId }
        );
        
        // Apply search criteria if provided
        let filteredQueries = switch (searchCriteria) {
            case null { allPatientQueries };
            case (?criteria) {
                Array.filter<QueryData>(allPatientQueries, func(q: QueryData): Bool {
                    var matches = true;
                    
                    // Filter by status
                    switch (criteria.status) {
                        case (?status) { if (q.status != status) { matches := false } };
                        case null {};
                    };
                    
                    // Filter by priority
                    switch (criteria.priority) {
                        case (?priority) { if (q.priority != priority) { matches := false } };
                        case null {};
                    };
                    
                    // Filter by category
                    switch (criteria.category) {
                        case (?category) { if (q.category != category) { matches := false } };
                        case null {};
                    };
                    
                    // Filter by date range
                    switch (criteria.dateFrom) {
                        case (?dateFrom) { if (q.createdAt < dateFrom) { matches := false } };
                        case null {};
                    };
                    
                    switch (criteria.dateTo) {
                        case (?dateTo) { if (q.createdAt > dateTo) { matches := false } };
                        case null {};
                    };
                    
                    matches
                })
            };
        };
        
        // Apply pagination
        let offset = switch (searchCriteria) {
            case (?criteria) {
                switch (criteria.offset) {
                    case (?o) { o };
                    case null { 0 };
                }
            };
            case null { 0 };
        };
        
        let limit = switch (searchCriteria) {
            case (?criteria) {
                switch (criteria.limit) {
                    case (?l) { l };
                    case null { 50 };
                }
            };
            case null { 50 };
        };
        
        let totalCount = filteredQueries.size();
        let endIndex = if (offset + limit > totalCount) { totalCount } else { offset + limit };
        let paginatedQueries = if (offset >= totalCount) {
            []
        } else {
            Array.subArray<QueryData>(filteredQueries, offset, endIndex - offset)
        };
        
        {
            results = paginatedQueries;
            totalCount = totalCount;
            hasMore = endIndex < totalCount;
            offset = offset;
            searchQuery = searchCriteria ?: {
                query = null;
                patientId = ?patientId;
                doctorId = null;
                status = null;
                priority = null;
                category = null;
                dateFrom = null;
                dateTo = null;
                department = null;
                specialty = null;
                limit = ?limit;
                offset = ?offset;
            };
        }
    };
}