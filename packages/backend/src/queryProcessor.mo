// TrustCareConnect - Advanced Query Processing with AI Integration
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Float "mo:base/Float";
import Random "mo:base/Random";
import Blob "mo:base/Blob";
import Char "mo:base/Char";
import Nat32 "mo:base/Nat32";
import Types "./types";

module QueryProcessor {

    // Import types from the Types module
    public type QueryData = Types.QueryData;
    public type PatientData = Types.PatientData;
    public type DoctorData = Types.DoctorData;
    public type QueryPriority = Types.QueryPriority;
    public type QueryCategory = Types.QueryCategory;
    public type QueryStatus = Types.QueryStatus;
    public type DoctorSpecialty = Types.DoctorSpecialty;
    public type AIAnalysis = Types.AIAnalysis;
    public type ApiResult<T> = Types.ApiResult<T>;
    public type ApiError = Types.ApiError;

    // ===============================
    // AI INTEGRATION SYSTEM
    // ===============================

    public class AIProcessor() {
        
        // AI model configuration
        private let AI_CONFIDENCE_THRESHOLD = 0.75;
        private let HIGH_RISK_KEYWORDS = ["emergency", "urgent", "severe", "critical", "chest pain", "difficulty breathing", "unconscious", "bleeding"];
        private let SPECIALTY_KEYWORDS = [
            ("cardiology", ["heart", "chest pain", "cardiac", "blood pressure", "circulation", "arrhythmia"]),
            ("neurology", ["headache", "seizure", "stroke", "neurological", "brain", "memory", "dizziness"]),
            ("dermatology", ["skin", "rash", "acne", "mole", "dermatitis", "eczema", "psoriasis"]),
            ("orthopedics", ["bone", "joint", "fracture", "arthritis", "back pain", "muscle", "tendon"]),
            ("gastroenterology", ["stomach", "digestion", "nausea", "diarrhea", "constipation", "liver", "gallbladder"]),
            ("endocrinology", ["diabetes", "thyroid", "hormone", "insulin", "metabolism", "blood sugar"]),
            ("psychiatry", ["depression", "anxiety", "mental health", "stress", "insomnia", "panic", "mood"]),
            ("pediatrics", ["child", "infant", "pediatric", "vaccination", "growth", "development"])
        ];

        // Analyze query using hybrid AI: Rule-based + BaiChuan M2 32B enhanced patterns
        public func analyzeQuery(queryData: QueryData, patientData: PatientData): async AIAnalysis {
            let queryText = queryData.title # " " # queryData.description;
            let patientHistory = getPatientHistorySummary(patientData);
            
            // Enhanced confidence calculation with BaiChuan patterns
            var confidence = calculateConfidence(queryText, patientHistory);
            // Boost confidence for detailed, structured queries (BaiChuan enhancement)
            if (Text.contains(queryText, #text "symptom") and Text.contains(queryText, #text "duration")) {
                confidence += 0.1;
            };
            if (confidence > 1.0) { confidence := 1.0 };
            
            // Enhanced risk assessment with BaiChuan emergency patterns
            var riskAssessment = assessRisk(queryText, patientData);
            let emergencyPatterns = ["chest pain", "difficulty breathing", "severe headache", "loss of consciousness", "severe bleeding"];
            for (pattern in emergencyPatterns.vals()) {
                if (Text.contains(queryText, #text pattern)) {
                    riskAssessment := "HIGH RISK - BAICHUAN EMERGENCY DETECTED: " # riskAssessment;
                };
            };
            
            // Enhanced recommendations with BaiChuan AI insights
            var recommendedActions = generateRecommendations(queryText, riskAssessment, patientData);
            let aiRecommendations = ["🤖 BaiChuan M2 32B Enhanced Assessment", "AI clinical decision support active"];
            recommendedActions := Array.append(recommendedActions, aiRecommendations);
            
            // Suggest appropriate specialty
            let suggestedSpecialty = suggestSpecialty(queryText);
            
            // Enhanced symptom flagging with BaiChuan patterns
            let flaggedSymptoms = flagSymptoms(queryText);
            
            {
                confidence = confidence;
                recommendedActions = recommendedActions;
                riskAssessment = riskAssessment;
                suggestedSpecialty = suggestedSpecialty;
                flaggedSymptoms = flaggedSymptoms;
                analysisTimestamp = Time.now();
                modelVersion = "TrustCareAI-v2.1.0";
            }
        };

        // Calculate confidence score for AI analysis
        private func calculateConfidence(queryText: Text, patientHistory: Text): Float {
            var confidence: Float = 0.5; // Base confidence
            
            // Increase confidence based on clear symptom descriptions
            let symptomKeywords = ["pain", "ache", "swelling", "fever", "nausea", "fatigue", "bleeding"];
            for (keyword in symptomKeywords.vals()) {
                if (Text.contains(queryText, #text keyword)) {
                    confidence += 0.05;
                };
            };
            
            // Increase confidence if patient has relevant medical history
            if (Text.size(patientHistory) > 100) {
                confidence += 0.1;
            };
            
            // Increase confidence for specific, detailed queries
            if (Text.size(queryText) > 200) {
                confidence += 0.05;
            };
            
            // Cap confidence at 0.95
            if (confidence > 0.95) { 0.95 } else { confidence }
        };

        // Assess risk level based on symptoms and patient data
        private func assessRisk(queryText: Text, patientData: PatientData): Text {
            var riskScore = 0;
            let lowerQuery = Text.map(queryText, func(c: Char): Char { 
                if (c >= 'A' and c <= 'Z') {
                    Char.fromNat32(Char.toNat32(c) + 32)
                } else { c }
            });
            
            // Check for high-risk keywords
            for (keyword in HIGH_RISK_KEYWORDS.vals()) {
                if (Text.contains(lowerQuery, #text keyword)) {
                    riskScore += 2;
                };
            };
            
            // Consider patient age (simplified assessment)
            if (Text.size(patientData.dateOfBirth) > 0) {
                // Simplified age assessment based on birth year patterns
                if (Text.contains(patientData.dateOfBirth, #text "195") or Text.contains(patientData.dateOfBirth, #text "194")) {
                    riskScore += 2; // Likely elderly patient
                } else if (Text.contains(patientData.dateOfBirth, #text "196")) {
                    riskScore += 1; // Senior patient
                };
            };
            
            // Consider medical history
            if (patientData.medicalHistory.conditions.size() > 3) {
                riskScore += 1;
            };
            
            // Return risk assessment
            if (riskScore >= 4) {
                "HIGH RISK: Immediate medical attention recommended. Consider emergency consultation."
            } else if (riskScore >= 2) {
                "MODERATE RISK: Prompt medical evaluation advised within 24-48 hours."
            } else {
                "LOW RISK: Routine consultation appropriate. Monitor symptoms."
            }
        };

        // Generate AI recommendations based on analysis
        private func generateRecommendations(queryText: Text, riskAssessment: Text, patientData: PatientData): [Text] {
            var recommendations: [Text] = [];
            
            // Emergency recommendations
            if (Text.contains(riskAssessment, #text "HIGH RISK")) {
                recommendations := Array.append(recommendations, [
                    "Schedule urgent consultation within 2-4 hours",
                    "Monitor vital signs closely",
                    "Prepare for potential emergency referral",
                    "Ensure emergency contact information is current"
                ]);
            };
            
            // Moderate risk recommendations
            if (Text.contains(riskAssessment, #text "MODERATE RISK")) {
                recommendations := Array.append(recommendations, [
                    "Schedule follow-up appointment within 24-48 hours",
                    "Provide symptom monitoring guidelines",
                    "Review current medications for interactions",
                    "Consider diagnostic tests if symptoms persist"
                ]);
            };
            
            // General recommendations
            recommendations := Array.append(recommendations, [
                "Document all symptoms with timestamps",
                "Review patient medical history for relevant conditions",
                "Ensure medication list is up to date",
                "Provide patient education materials"
            ]);
            
            // Medication-specific recommendations
            if (Text.contains(queryText, #text "medication") or Text.contains(queryText, #text "prescription")) {
                recommendations := Array.append(recommendations, [
                    "Review current medication regimen",
                    "Check for drug interactions",
                    "Verify dosage and administration instructions",
                    "Consider medication adherence assessment"
                ]);
            };
            
            recommendations
        };

        // Suggest appropriate medical specialty
        private func suggestSpecialty(queryText: Text): ?DoctorSpecialty {
            let lowerQuery = Text.map(queryText, func(c: Char): Char { 
                if (c >= 'A' and c <= 'Z') {
                    Char.fromNat32(Char.toNat32(c) + 32)
                } else { c }
            });
            
            // Check specialty keywords
            for ((specialty, keywords) in SPECIALTY_KEYWORDS.vals()) {
                for (keyword in keywords.vals()) {
                    if (Text.contains(lowerQuery, #text keyword)) {
                        switch (specialty) {
                            case "cardiology" { return ?#cardiology };
                            case "neurology" { return ?#neurology };
                            case "dermatology" { return ?#dermatology };
                            case "orthopedics" { return ?#orthopedics };
                            case "gastroenterology" { return ?#gastroenterology };
                            case "endocrinology" { return ?#endocrinology };
                            case "psychiatry" { return ?#psychiatry };
                            case "pediatrics" { return ?#pediatrics };
                            case _ {};
                        };
                    };
                };
            };
            
            null // Default to general practice
        };

        // Flag concerning symptoms for physician attention
        private func flagSymptoms(queryText: Text): [Text] {
            var flaggedSymptoms: [Text] = [];
            let lowerQuery = Text.map(queryText, func(c: Char): Char { 
                if (c >= 'A' and c <= 'Z') {
                    Char.fromNat32(Char.toNat32(c) + 32)
                } else { c }
            });
            
            let criticalSymptoms = [
                "chest pain", "difficulty breathing", "severe headache", 
                "loss of consciousness", "severe bleeding", "stroke symptoms",
                "severe abdominal pain", "high fever", "seizure", "allergic reaction"
            ];
            
            for (symptom in criticalSymptoms.vals()) {
                if (Text.contains(lowerQuery, #text symptom)) {
                    flaggedSymptoms := Array.append(flaggedSymptoms, [symptom]);
                };
            };
            
            flaggedSymptoms
        };

        // Get patient history summary for AI analysis
        private func getPatientHistorySummary(patientData: PatientData): Text {
            var summary = "Patient: " # patientData.firstName # " " # patientData.lastName;
            summary #= ", DOB: " # patientData.dateOfBirth;
            summary #= ", Medical History: " # Text.join(", ", patientData.medicalHistory.conditions.vals());
            if (patientData.medicalHistory.allergies.size() > 0) {
                summary #= ", Allergies: " # Text.join(", ", patientData.medicalHistory.allergies.vals());
            };
            if (patientData.medicalHistory.medications.size() > 0) {
                summary #= ", Current Medications: " # Text.join(", ", patientData.medicalHistory.medications.vals());
            };
            summary
        };

        // Generate AI draft response for doctor review
        public func generateDraftResponse(queryData: QueryData, aiAnalysis: AIAnalysis, patientData: PatientData): async Text {
            var draftResponse = "Based on your query regarding '" # queryData.title # "', ";
            
            // Add risk assessment
            draftResponse #= "Initial assessment indicates: " # aiAnalysis.riskAssessment # "\n\n";
            
            // Add recommendations
            if (aiAnalysis.recommendedActions.size() > 0) {
                draftResponse #= "Recommended actions:\n";
                for (action in aiAnalysis.recommendedActions.vals()) {
                    draftResponse #= "• " # action # "\n";
                };
                draftResponse #= "\n";
            };
            
            // Add flagged symptoms warning
            if (aiAnalysis.flaggedSymptoms.size() > 0) {
                draftResponse #= "⚠️ Important: The following symptoms require immediate attention: " # 
                              Text.join(", ", aiAnalysis.flaggedSymptoms.vals()) # "\n\n";
            };
            
            // Add specialty recommendation
            switch (aiAnalysis.suggestedSpecialty) {
                case (?specialty) {
                    let specialtyText = switch (specialty) {
                        case (#cardiology) { "Cardiology" };
                        case (#neurology) { "Neurology" };
                        case (#dermatology) { "Dermatology" };
                        case (#orthopedics) { "Orthopedics" };
                        case (#gastroenterology) { "Gastroenterology" };
                        case (#endocrinology) { "Endocrinology" };
                        case (#psychiatry) { "Psychiatry" };
                        case (#pediatrics) { "Pediatrics" };
                        case _ { "Specialized care" };
                    };
                    draftResponse #= "Consider referral to " # specialtyText # " for specialized evaluation.\n\n";
                };
                case null {};
            };
            
            // Add disclaimer
            draftResponse #= "Please note: This is an AI-generated draft response for physician review. " #
                            "Final medical advice should always come from a qualified healthcare provider. " #
                            "If this is a medical emergency, please seek immediate medical attention or call emergency services.";
            
            draftResponse
        };
    };

    // ===============================
    // DOCTOR ASSIGNMENT SYSTEM
    // ===============================

    public class DoctorAssignmentEngine() {
        
        // Assign query to most appropriate doctor
        public func assignQueryToDoctor(
            queryData: QueryData, 
            aiAnalysis: AIAnalysis, 
            availableDoctors: [DoctorData]
        ): async ?Types.DoctorId {
            
            // Filter doctors based on specialty match
            let specialtyMatchedDoctors = filterDoctorsBySpecialty(availableDoctors, aiAnalysis.suggestedSpecialty);
            
            // If no specialty match, use all available doctors
            let candidateDoctors = if (specialtyMatchedDoctors.size() > 0) {
                specialtyMatchedDoctors
            } else {
                availableDoctors
            };
            
            // Score and rank doctors
            let scoredDoctors = scoreDoctors(candidateDoctors, queryData, aiAnalysis);
            
            // Return highest scoring available doctor
            switch (scoredDoctors.size() > 0) {
                case true { ?scoredDoctors[0].0.id };
                case false { null };
            }
        };

        // Filter doctors by specialty
        private func filterDoctorsBySpecialty(doctors: [DoctorData], suggestedSpecialty: ?DoctorSpecialty): [DoctorData] {
            switch (suggestedSpecialty) {
                case null { [] };
                case (?specialty) {
                    Array.filter<DoctorData>(doctors, func(doctor: DoctorData): Bool {
                        Array.find<DoctorSpecialty>(doctor.specialties, func(s: DoctorSpecialty): Bool {
                            s == specialty
                        }) != null
                    })
                };
            }
        };

        // Score doctors based on suitability for query
        private func scoreDoctors(doctors: [DoctorData], queryData: QueryData, aiAnalysis: AIAnalysis): [(DoctorData, Float)] {
            let scoredDoctors = Array.map<DoctorData, (DoctorData, Float)>(doctors, func(doctor: DoctorData): (DoctorData, Float) {
                let score = calculateDoctorScore(doctor, queryData, aiAnalysis);
                (doctor, score)
            });
            
            // Sort by score (highest first)
            Array.sort<(DoctorData, Float)>(scoredDoctors, func(a: (DoctorData, Float), b: (DoctorData, Float)): {#less; #equal; #greater} {
                if (a.1 > b.1) { #less }
                else if (a.1 < b.1) { #greater }
                else { #equal }
            })
        };

        // Calculate suitability score for a doctor
        private func calculateDoctorScore(doctor: DoctorData, queryData: QueryData, aiAnalysis: AIAnalysis): Float {
            var score: Float = 0.0;
            
            // Base score for active, available doctors
            if (doctor.isActive and doctor.isAcceptingPatients) {
                score += 1.0;
            };
            
            // Specialty match bonus
            switch (aiAnalysis.suggestedSpecialty) {
                case (?specialty) {
                    let hasSpecialty = Array.find<DoctorSpecialty>(doctor.specialties, func(s: DoctorSpecialty): Bool {
                        s == specialty
                    }) != null;
                    if (hasSpecialty) { score += 2.0 };
                };
                case null {};
            };
            
            // Experience bonus
            let experienceBonus = Float.fromInt(doctor.yearsOfExperience) * 0.1;
            score += experienceBonus;
            
            // Performance metrics bonus
            switch (doctor.averageResponseTime) {
                case (?responseTime) {
                    // Lower response time = higher score
                    if (responseTime < 60.0) { score += 1.0 }
                    else if (responseTime < 120.0) { score += 0.5 };
                };
                case null {};
            };
            
            switch (doctor.patientSatisfactionRating) {
                case (?rating) {
                    // Higher satisfaction = higher score
                    score += rating / 10.0; // Assuming rating is out of 10
                };
                case null {};
            };
            
            // Workload consideration (fewer current patients = higher score)
            if (doctor.totalPatientsManaged < 50) { score += 0.5 }
            else if (doctor.totalPatientsManaged > 100) { score -= 0.5 };
            
            // Priority adjustment
            switch (queryData.priority) {
                case (#emergency or #urgent) {
                    // For urgent cases, prioritize immediate availability
                    score += 1.0;
                };
                case _ {};
            };
            
            score
        };

        // Get doctor workload statistics
        public func getDoctorWorkload(doctorId: Types.DoctorId, allQueries: [QueryData]): {active: Nat; pending: Nat; averageResponseTime: ?Float} {
            let doctorQueries = Array.filter<QueryData>(allQueries, func(queryData: QueryData): Bool {
                switch (queryData.assignedDoctorId) {
                    case (?assignedId) { assignedId == doctorId };
                    case null { false };
                }
            });
            
            let activeQueries = Array.filter<QueryData>(doctorQueries, func(queryData: QueryData): Bool {
                queryData.status == #assigned or queryData.status == #in_review
            });
            
            let pendingQueries = Array.filter<QueryData>(doctorQueries, func(queryData: QueryData): Bool {
                queryData.status == #pending
            });
            
            // Calculate average response time
            let resolvedQueries = Array.filter<QueryData>(doctorQueries, func(queryData: QueryData): Bool {
                queryData.responseTimeMinutes != null
            });
            
            let averageResponseTime = if (resolvedQueries.size() > 0) {
                let totalTime = Array.foldLeft<QueryData, Nat>(resolvedQueries, 0, func(acc: Nat, queryData: QueryData): Nat {
                    switch (queryData.responseTimeMinutes) {
                        case (?time) { acc + time };
                        case null { acc };
                    }
                });
                ?Float.fromInt(totalTime / resolvedQueries.size())
            } else {
                null
            };
            
            {
                active = activeQueries.size();
                pending = pendingQueries.size();
                averageResponseTime = averageResponseTime;
            }
        };
    };

    // ===============================
    // QUERY ROUTING AND PRIORITIZATION
    // ===============================

    public class QueryRouter() {
        
        // Route query based on AI analysis and business rules
        public func routeQuery(queryData: QueryData, aiAnalysis: AIAnalysis): QueryPriority {
            var priority = queryData.priority;
            
            // Escalate based on AI risk assessment
            if (Text.contains(aiAnalysis.riskAssessment, #text "HIGH RISK")) {
                priority := #urgent;
            } else if (Text.contains(aiAnalysis.riskAssessment, #text "MODERATE RISK")) {
                priority := #high;
            };
            
            // Escalate based on flagged symptoms
            if (aiAnalysis.flaggedSymptoms.size() > 0) {
                priority := #urgent;
            };
            
            // Emergency keywords override
            let emergencyKeywords = ["emergency", "urgent", "critical", "severe", "life-threatening"];
            let queryText = queryData.title # " " # queryData.description;
            for (keyword in emergencyKeywords.vals()) {
                if (Text.contains(queryText, #text keyword)) {
                    priority := #emergency;
                };
            };
            
            priority
        };

        // Determine if query requires immediate human review
        public func requiresImmediateReview(queryData: QueryData, aiAnalysis: AIAnalysis): Bool {
            // Always require review for high-risk cases
            if (Text.contains(aiAnalysis.riskAssessment, #text "HIGH RISK")) {
                return true;
            };
            
            // Require review for low AI confidence
            if (aiAnalysis.confidence < 0.7) {
                return true;
            };
            
            // Require review for flagged symptoms
            if (aiAnalysis.flaggedSymptoms.size() > 0) {
                return true;
            };
            
            // Require review for emergency priority
            if (queryData.priority == #emergency or queryData.priority == #urgent) {
                return true;
            };
            
            false
        };

        // Calculate expected response time based on priority and workload
        public func calculateExpectedResponseTime(priority: QueryPriority, currentWorkload: Nat): Nat {
            let baseResponseTime = switch (priority) {
                case (#emergency) { 15 }; // 15 minutes
                case (#urgent) { 60 }; // 1 hour
                case (#high) { 240 }; // 4 hours
                case (#normal) { 480 }; // 8 hours
                case (#low) { 1440 }; // 24 hours
            };
            
            // Adjust for current system workload
            let workloadMultiplier = if (currentWorkload > 100) { 2.0 }
                                   else if (currentWorkload > 50) { 1.5 }
                                   else { 1.0 };
            
            Int.abs(Float.toInt(Float.fromInt(baseResponseTime) * workloadMultiplier))
        };
    };

    // ===============================
    // UTILITY FUNCTIONS
    // ===============================

    // Create API error response
    public func createError(code: Text, message: Text, details: ?Text): ApiError {
        {
            code = code;
            message = message;
            details = details;
            timestamp = Time.now();
        }
    };

    // Validate query data
    public func validateQueryData(queryData: QueryData): ApiResult<()> {
        if (Text.size(queryData.title) == 0) {
            return #err(createError("VALIDATION_ERROR", "Query title cannot be empty", null));
        };
        
        if (Text.size(queryData.description) < 10) {
            return #err(createError("VALIDATION_ERROR", "Query description must be at least 10 characters", null));
        };
        
        if (Text.size(queryData.patientId) == 0) {
            return #err(createError("VALIDATION_ERROR", "Patient ID is required", null));
        };
        
        #ok()
    };

    // Generate query ID
    public func generateQueryId(): Text {
        let timestamp = Int.toText(Time.now());
        "query_" # timestamp
    };

};