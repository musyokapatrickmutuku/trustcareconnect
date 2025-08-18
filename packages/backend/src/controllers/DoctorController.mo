// Doctor Controller - handles doctor-related business logic
import Result "mo:base/Result";
import Text "mo:base/Text";
import Types "../types/common";
import DoctorService "../services/DoctorService";

module DoctorController {
    
    public class DoctorControllerClass(doctorService: DoctorService.DoctorServiceClass) {

        // Register a new doctor with validation
        public func registerDoctor(name: Text, specialization: Text): async Result.Result<Types.DoctorId, Text> {
            // Input validation
            if (name == "" or specialization == "") {
                return #err("All fields are required");
            };

            if (name.size() > 100 or specialization.size() > 100) {
                return #err("Input fields are too long");
            };

            let doctorId = await doctorService.registerDoctor(name, specialization);
            #ok(doctorId)
        };

        // Get doctor by ID
        public func getDoctor(doctorId: Types.DoctorId): async ?Types.Doctor {
            await doctorService.getDoctor(doctorId)
        };

        // Get all doctors
        public func getAllDoctors(): async [Types.Doctor] {
            await doctorService.getAllDoctors()
        };

        // Check if doctor exists
        public func doctorExists(doctorId: Types.DoctorId): Bool {
            doctorService.doctorExists(doctorId)
        };
    }
}