import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Debug "mo:base/Debug";

actor AssistAI {
    // Types for our medical AI system
    public type PatientProfile = {
        id: Text;
        name: Text;
        age: Nat;
        diabetes_type: Text;
        hba1c: Text;
        medications: [Text];
    };

    public type Query = {
        id: Text;
        timestamp: Int;
        patient_id: Text;
        original_query: Text;
        ai_response: ?Text;
        doctor_response: ?Text;
        status: Text; // "pending", "reviewed", "completed"
        urgency_level: Text; // "low", "medium", "high"
        safety_score: ?Nat;
        confidence_score: ?Nat;
    };

    public type QueryInput = {
        patient_id: Text;
        query: Text;
    };

    public type AIResponse = {
        response: Text;
        safety_score: Nat;
        confidence_score: Nat;
        urgency_level: Text;
    };

    // Stable storage for persistence
    private stable var patients_entries : [(Text, PatientProfile)] = [];
    private stable var queries_entries : [(Text, Query)] = [];
    private stable var query_counter : Nat = 0;

    // Runtime storage
    private var patients = HashMap.HashMap<Text, PatientProfile>(10, Text.equal, Text.hash);
    private var queries = HashMap.HashMap<Text, Query>(10, Text.equal, Text.hash);

    // Initialize demo patient data
    system func preupgrade() {
        patients_entries := Iter.toArray(patients.entries());
        queries_entries := Iter.toArray(queries.entries());
    };

    system func postupgrade() {
        patients := HashMap.fromIter<Text, PatientProfile>(patients_entries.vals(), patients_entries.size(), Text.equal, Text.hash);
        queries := HashMap.fromIter<Text, Query>(queries_entries.vals(), queries_entries.size(), Text.equal, Text.hash);
        patients_entries := [];
        queries_entries := [];
    };

    // Initialize with demo patients
    private func init_demo_data() {
        let patient1 : PatientProfile = {
            id = "P001";
            name = "Sarah Johnson";
            age = 47;
            diabetes_type = "Type 2";
            hba1c = "6.9%";
            medications = ["Metformin 1000mg BID", "Lisinopril 15mg daily", "Empagliflozin 10mg daily"];
        };

        let patient2 : PatientProfile = {
            id = "P002";
            name = "Michael Thompson";
            age = 19;
            diabetes_type = "Type 1";
            hba1c = "7.8%";
            medications = ["Insulin Pump (Aspart)", "Basal 1.2 units/hour"];
        };

        let patient3 : PatientProfile = {
            id = "P003";
            name = "Carlos Rodriguez";
            age = 64;
            diabetes_type = "Type 2";
            hba1c = "6.8%";
            medications = ["Metformin 1000mg BID", "Semaglutide 1mg weekly", "Lisinopril 20mg daily"];
        };

        patients.put("P001", patient1);
        patients.put("P002", patient2);
        patients.put("P003", patient3);
    };

    // Initialize demo data on first deployment
    init_demo_data();

    // Public functions for the medical AI system

    // Get all patients (for demo purposes)
    public query func getAllPatients() : async [PatientProfile] {
        Array.map<(Text, PatientProfile), PatientProfile>(
            Iter.toArray(patients.entries()),
            func((id, profile)) = profile
        )
    };

    // Get specific patient data
    public query func getPatient(patient_id: Text) : async ?PatientProfile {
        patients.get(patient_id)
    };

    // Core AI processing function
    public func processQuery(input: QueryInput) : async Result.Result<Query, Text> {
        // Validate patient exists
        let patient_opt = patients.get(input.patient_id);
        switch (patient_opt) {
            case null { #err("Patient not found") };
            case (?patient) {
                // Generate AI response with safety scoring
                let ai_response = generateAIResponse(input.query, patient);
                
                // Create unique query ID
                query_counter += 1;
                let query_id = "Q" # Nat.toText(query_counter);

                // Create query record
                let query : Query = {
                    id = query_id;
                    timestamp = Time.now();
                    patient_id = input.patient_id;
                    original_query = input.query;
                    ai_response = ?ai_response.response;
                    doctor_response = null;
                    status = "pending_review";
                    urgency_level = ai_response.urgency_level;
                    safety_score = ?ai_response.safety_score;
                    confidence_score = ?ai_response.confidence_score;
                };

                // Save query for doctor review
                queries.put(query_id, query);
                #ok(query)
            };
        }
    };

    // Generate AI response with safety scoring
    private func generateAIResponse(query_text: Text, patient: PatientProfile) : AIResponse {
        let query_lower = Text.toLowercase(query_text);
        
        // Simple medical AI response generation
        let response = if (Text.contains(query_lower, #text "blood sugar") and Text.contains(query_lower, #text "high")) {
            "I understand your concern about elevated blood sugar. Based on your profile as a " # patient.diabetes_type # " diabetes patient with HbA1c of " # patient.hba1c # ", here are some general recommendations:\n\n" #
            "1. Check for ketones if you have testing strips\n" #
            "2. Stay well hydrated with water\n" #
            "3. Consider light activity like walking if you feel well\n" #
            "4. Review recent factors: meals, medications, stress\n\n" #
            "If readings remain elevated or you have symptoms like excessive thirst or nausea, please contact your healthcare provider promptly."
        } else if (Text.contains(query_lower, #text "low") and Text.contains(query_lower, #text "dizzy")) {
            "Dizziness with low blood sugar requires immediate attention. If your glucose is below 70 mg/dL:\n\n" #
            "1. Follow the 15-15 rule: 15g fast-acting carbs, recheck in 15 minutes\n" #
            "2. Options: 4 glucose tablets, 1/2 cup juice, 1 tbsp honey\n" #
            "3. Once normalized, have a small snack with protein\n\n" #
            "If symptoms persist or worsen, seek emergency care. Please inform your doctor about this episode."
        } else {
            "Thank you for your question about diabetes management. While I cannot provide specific medical advice, I recommend:\n\n" #
            "1. Monitor your symptoms closely\n" #
            "2. Follow your current treatment plan with " # Text.join(", ", patient.medications.vals()) # "\n" #
            "3. Contact your healthcare provider if symptoms persist\n" #
            "4. Seek immediate medical attention for emergency symptoms\n\n" #
            "Your healthcare team is best equipped to provide personalized guidance."
        };

        // Calculate safety and confidence scores
        let safety_score = calculateSafetyScore(response);
        let confidence_score = calculateConfidenceScore(query_text, patient);
        let urgency_level = determineUrgencyLevel(query_text);

        {
            response = response;
            safety_score = safety_score;
            confidence_score = confidence_score;
            urgency_level = urgency_level;
        }
    };

    // Safety scoring logic
    private func calculateSafetyScore(response: Text) : Nat {
        var score = 100;
        let response_lower = Text.toLowercase(response);
        
        // Reduce score for potentially dangerous phrases
        if (Text.contains(response_lower, #text "stop taking")) score -= 30;
        if (Text.contains(response_lower, #text "change your dose")) score -= 30;
        
        // Increase score for safety phrases
        if (Text.contains(response_lower, #text "contact your healthcare provider")) score += 10;
        if (Text.contains(response_lower, #text "seek immediate")) score += 10;
        
        if (score > 100) 100 else if (score < 0) 0 else score
    };

    // Confidence scoring logic
    private func calculateConfidenceScore(query: Text, patient: PatientProfile) : Nat {
        var score = 85; // Base confidence
        let query_lower = Text.toLowercase(query);
        
        // Reduce confidence for complex cases
        if (Text.contains(query_lower, #text "emergency")) score -= 20;
        if (Text.contains(query_lower, #text "severe")) score -= 15;
        
        // Adjust based on patient complexity
        if (patient.age > 65) score -= 5;
        if (Text.contains(patient.diabetes_type, #text "Type 1")) score -= 5;
        
        if (score > 100) 100 else if (score < 0) 0 else score
    };

    // Urgency level determination
    private func determineUrgencyLevel(query: Text) : Text {
        let query_lower = Text.toLowercase(query);
        
        if (Text.contains(query_lower, #text "chest pain") or 
            Text.contains(query_lower, #text "can't breathe") or
            Text.contains(query_lower, #text "unconscious") or
            Text.contains(query_lower, #text "emergency")) {
            "high"
        } else if (Text.contains(query_lower, #text "dizzy") or
                   Text.contains(query_lower, #text "nausea") or
                   Text.contains(query_lower, #text "high blood sugar") or
                   Text.contains(query_lower, #text "low blood sugar")) {
            "medium"
        } else {
            "low"
        }
    };

    // Doctor functions

    // Get all queries pending review
    public query func getPendingQueries() : async [Query] {
        Array.filter<Query>(
            Array.map<(Text, Query), Query>(
                Iter.toArray(queries.entries()),
                func((id, query)) = query
            ),
            func(query) = query.status == "pending_review"
        )
    };

    // Get specific query details
    public query func getQuery(query_id: Text) : async ?Query {
        queries.get(query_id)
    };

    // Doctor approves/edits response
    public func reviewQuery(query_id: Text, doctor_response: Text, approved: Bool) : async Result.Result<Query, Text> {
        switch (queries.get(query_id)) {
            case null { #err("Query not found") };
            case (?existing_query) {
                let updated_query : Query = {
                    id = existing_query.id;
                    timestamp = existing_query.timestamp;
                    patient_id = existing_query.patient_id;
                    original_query = existing_query.original_query;
                    ai_response = existing_query.ai_response;
                    doctor_response = ?doctor_response;
                    status = if (approved) "completed" else "reviewed";
                    urgency_level = existing_query.urgency_level;
                    safety_score = existing_query.safety_score;
                    confidence_score = existing_query.confidence_score;
                };
                
                queries.put(query_id, updated_query);
                #ok(updated_query)
            };
        }
    };

    // Get patient's query history
    public query func getPatientQueries(patient_id: Text) : async [Query] {
        Array.filter<Query>(
            Array.map<(Text, Query), Query>(
                Iter.toArray(queries.entries()),
                func((id, query)) = query
            ),
            func(query) = query.patient_id == patient_id
        )
    };

    // System info
    public query func getSystemInfo() : async {total_patients: Nat; total_queries: Nat; pending_reviews: Nat} {
        let all_queries = Array.map<(Text, Query), Query>(
            Iter.toArray(queries.entries()),
            func((id, query)) = query
        );
        
        let pending_count = Array.size(Array.filter<Query>(all_queries, func(q) = q.status == "pending_review"));
        
        {
            total_patients = patients.size();
            total_queries = queries.size();
            pending_reviews = pending_count;
        }
    };
}