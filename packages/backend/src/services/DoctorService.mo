// Doctor Management Service
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Types "../types/common";

module DoctorService {
    
    public class DoctorServiceClass() {
        private var nextDoctorId: Nat = 1;
        private var doctors = Map.HashMap<Types.DoctorId, Types.Doctor>(10, Text.equal, Text.hash);

        // Helper function to generate doctor ID
        private func generateDoctorId(): Types.DoctorId {
            let id = "doctor_" # Int.toText(nextDoctorId);
            nextDoctorId += 1;
            id
        };

        // Register a new doctor
        public func registerDoctor(name: Text, specialization: Text): async Types.DoctorId {
            let doctorId = generateDoctorId();
            let doctor: Types.Doctor = {
                id = doctorId;
                name = name;
                specialization = specialization;
            };
            
            doctors.put(doctorId, doctor);
            doctorId
        };

        // Get doctor by ID
        public func getDoctor(doctorId: Types.DoctorId): async ?Types.Doctor {
            doctors.get(doctorId)
        };

        // Get all doctors
        public func getAllDoctors(): async [Types.Doctor] {
            Iter.toArray(doctors.vals())
        };

        // Check if doctor exists
        public func doctorExists(doctorId: Types.DoctorId): Bool {
            switch (doctors.get(doctorId)) {
                case null { false };
                case (?_doctor) { true };
            }
        };

        // Get total doctor count
        public func getDoctorCount(): async Nat {
            doctors.size()
        };

        // Restore state from stable memory
        public func restoreDoctors(entries: [(Types.DoctorId, Types.Doctor)], nextId: Nat) {
            doctors := Map.fromIter<Types.DoctorId, Types.Doctor>(entries.vals(), entries.size(), Text.equal, Text.hash);
            nextDoctorId := nextId;
        };

        // Get entries for stable memory
        public func getDoctorEntries(): [(Types.DoctorId, Types.Doctor)] {
            Iter.toArray(doctors.entries())
        };

        public func getNextDoctorId(): Nat {
            nextDoctorId
        };
    }
}