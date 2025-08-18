// Query Management Service
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Types "../types/common";
import AIService "AIService";

module QueryService {
    
    public class QueryServiceClass(aiService: AIService.AIServiceClass) {
        private var nextQueryId: Nat = 1;
        private var queries = Map.HashMap<Types.QueryId, Types.MedicalQuery>(10, Text.equal, Text.hash);

        // Helper function to generate query ID
        private func generateQueryId(): Types.QueryId {
            let id = "query_" # Int.toText(nextQueryId);
            nextQueryId += 1;
            id
        };

        // Submit a medical query (only if patient is assigned to a doctor)
        public func submitQuery(
            patientId: Types.PatientId, 
            title: Text, 
            description: Text, 
            condition: Text,
            assignedDoctorId: Types.DoctorId
        ): async Result.Result<Types.QueryId, Text> {
            let queryId = generateQueryId();
            let now = Time.now();
            
            // Get AI draft response
            let aiDraft = await aiService.getAIDraftResponse(title # " " # description, condition);
            
            let medicalQuery: Types.MedicalQuery = {
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

        // Get query by ID
        public func getQuery(queryId: Types.QueryId): async ?Types.MedicalQuery {
            queries.get(queryId)
        };

        // Get all queries by patient
        public func getPatientQueries(patientId: Types.PatientId): async [Types.MedicalQuery] {
            let patientQueries = Array.filter<Types.MedicalQuery>(
                Iter.toArray(queries.vals()),
                func(q: Types.MedicalQuery): Bool { q.patientId == patientId }
            );
            patientQueries
        };

        // Get all pending queries
        public func getPendingQueries(): async [Types.MedicalQuery] {
            let pendingQueries = Array.filter<Types.MedicalQuery>(
                Iter.toArray(queries.vals()),
                func(q: Types.MedicalQuery): Bool { q.status == #pending }
            );
            pendingQueries
        };

        // Doctor takes ownership of a pending query (moves to review status)
        public func takeQuery(queryId: Types.QueryId, doctorId: Types.DoctorId): async Result.Result<(), Text> {
            switch (queries.get(queryId)) {
                case null { #err("Query not found") };
                case (?medicalQuery) {
                    if (medicalQuery.status != #pending) {
                        #err("Query is not in pending status")
                    } else {
                        let updatedQuery: Types.MedicalQuery = {
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

        // Doctor adds response and marks query as completed
        public func respondToQuery(queryId: Types.QueryId, doctorId: Types.DoctorId, response: Text): async Result.Result<(), Text> {
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
                                let updatedQuery: Types.MedicalQuery = {
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

        // Get queries assigned to a specific doctor
        public func getDoctorQueries(doctorId: Types.DoctorId): async [Types.MedicalQuery] {
            let doctorQueries = Array.filter<Types.MedicalQuery>(
                Iter.toArray(queries.vals()),
                func(q: Types.MedicalQuery): Bool { 
                    switch (q.doctorId) {
                        case null { false };
                        case (?dId) { dId == doctorId };
                    }
                }
            );
            doctorQueries
        };

        // Get all completed queries
        public func getCompletedQueries(): async [Types.MedicalQuery] {
            let completedQueries = Array.filter<Types.MedicalQuery>(
                Iter.toArray(queries.vals()),
                func(q: Types.MedicalQuery): Bool { q.status == #completed }
            );
            completedQueries
        };

        // Get all queries (for admin/debugging purposes)
        public func getAllQueries(): async [Types.MedicalQuery] {
            Iter.toArray(queries.vals())
        };

        // Get query statistics
        public func getQueryStats(): async (Nat, Nat, Nat) {
            let allQueries = Iter.toArray(queries.vals());
            let pending = Array.filter<Types.MedicalQuery>(allQueries, func(q: Types.MedicalQuery): Bool { q.status == #pending }).size();
            let completed = Array.filter<Types.MedicalQuery>(allQueries, func(q: Types.MedicalQuery): Bool { q.status == #completed }).size();
            (queries.size(), pending, completed)
        };

        // Restore state from stable memory
        public func restoreQueries(entries: [(Types.QueryId, Types.MedicalQuery)], nextId: Nat) {
            queries := Map.fromIter<Types.QueryId, Types.MedicalQuery>(entries.vals(), entries.size(), Text.equal, Text.hash);
            nextQueryId := nextId;
        };

        // Get entries for stable memory
        public func getQueryEntries(): [(Types.QueryId, Types.MedicalQuery)] {
            Iter.toArray(queries.entries())
        };

        public func getNextQueryId(): Nat {
            nextQueryId
        };
    }
}