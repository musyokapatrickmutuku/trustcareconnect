// Patient Management Service
import Map "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Types "../types/common";

module PatientService {
    
    public class PatientServiceClass() {
        private var nextPatientId: Nat = 1;
        private var patients = Map.HashMap<Types.PatientId, Types.Patient>(10, Text.equal, Text.hash);

        // Helper function to generate patient ID
        private func generatePatientId(): Types.PatientId {
            let id = "patient_" # Int.toText(nextPatientId);
            nextPatientId += 1;
            id
        };

        // Register a new patient (initially unassigned)
        public func registerPatient(name: Text, condition: Text, email: Text): async Types.PatientId {
            let patientId = generatePatientId();
            let patient: Types.Patient = {
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
        public func getPatient(patientId: Types.PatientId): async ?Types.Patient {
            patients.get(patientId)
        };

        // Get all patients (for admin/debugging purposes)
        public func getAllPatients(): async [Types.Patient] {
            Iter.toArray(patients.vals())
        };

        // Get unassigned patients (for doctor assignment)
        public func getUnassignedPatients(): async [Types.Patient] {
            let unassignedPatients = Array.filter<Types.Patient>(
                Iter.toArray(patients.vals()),
                func(p: Types.Patient): Bool { 
                    switch (p.assignedDoctorId) {
                        case null { true };
                        case (?_doctorId) { false };
                    }
                }
            );
            unassignedPatients
        };

        // Assign patient to doctor
        public func assignPatientToDoctor(patientId: Types.PatientId, doctorId: Types.DoctorId): async Result.Result<(), Text> {
            switch (patients.get(patientId)) {
                case null { #err("Patient not found") };
                case (?patient) {
                    // Check if patient is already assigned
                    switch (patient.assignedDoctorId) {
                        case (?existingDoctorId) { #err("Patient already assigned to doctor: " # existingDoctorId) };
                        case null {
                            let updatedPatient: Types.Patient = {
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

        // Get patients assigned to a specific doctor
        public func getDoctorPatients(doctorId: Types.DoctorId): async [Types.Patient] {
            let doctorPatients = Array.filter<Types.Patient>(
                Iter.toArray(patients.vals()),
                func(p: Types.Patient): Bool { 
                    switch (p.assignedDoctorId) {
                        case null { false };
                        case (?dId) { dId == doctorId };
                    }
                }
            );
            doctorPatients
        };

        // Unassign patient from doctor
        public func unassignPatient(patientId: Types.PatientId, doctorId: Types.DoctorId): async Result.Result<(), Text> {
            switch (patients.get(patientId)) {
                case null { #err("Patient not found") };
                case (?patient) {
                    switch (patient.assignedDoctorId) {
                        case null { #err("Patient is not assigned to any doctor") };
                        case (?assignedDoctorId) {
                            if (assignedDoctorId != doctorId) {
                                #err("Patient is not assigned to this doctor")
                            } else {
                                let updatedPatient: Types.Patient = {
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

        // Get total patient count
        public func getPatientCount(): async Nat {
            patients.size()
        };

        // Restore state from stable memory
        public func restorePatients(entries: [(Types.PatientId, Types.Patient)], nextId: Nat) {
            patients := Map.fromIter<Types.PatientId, Types.Patient>(entries.vals(), entries.size(), Text.equal, Text.hash);
            nextPatientId := nextId;
        };

        // Get entries for stable memory
        public func getPatientEntries(): [(Types.PatientId, Types.Patient)] {
            Iter.toArray(patients.entries())
        };

        public func getNextPatientId(): Nat {
            nextPatientId
        };
    }
}