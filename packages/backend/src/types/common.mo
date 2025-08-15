// Common type definitions for TrustCareConnect backend

module Types {
    // Identifier types
    public type PatientId = Text;
    public type DoctorId = Text;
    public type QueryId = Text;

    // Patient record structure
    public type Patient = {
        id: PatientId;
        name: Text;
        condition: Text;  // e.g., "diabetes", "hypertension"
        email: Text;
        assignedDoctorId: ?DoctorId;  // Optional - assigned by doctor
        isActive: Bool;  // Active in treatment
    };

    // Doctor record structure  
    public type Doctor = {
        id: DoctorId;
        name: Text;
        specialization: Text;  // e.g., "endocrinologist", "cardiologist"
    };

    // Query status enumeration
    public type QueryStatus = {
        #pending;
        #doctor_review;
        #completed;
    };

    // Medical query structure
    public type MedicalQuery = {
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

    // System statistics type
    public type SystemStats = {
        totalPatients: Nat;
        totalDoctors: Nat;
        totalQueries: Nat;
        pendingQueries: Nat;
        completedQueries: Nat;
    };

    // HTTP outcall types for AI proxy integration
    public type HttpHeader = {
        name: Text;
        value: Text;
    };

    public type HttpMethod = {
        #get;
        #post;
        #head;
    };

    public type HttpRequestArgs = {
        url: Text;
        max_response_bytes: ?Nat64;
        headers: [HttpHeader];
        body: ?Blob;
        method: HttpMethod;
        transform: ?{
            function: shared (response: HttpResponsePayload) -> async HttpResponsePayload;
        };
    };

    public type HttpResponsePayload = {
        status: Nat;
        headers: [HttpHeader];
        body: Blob;
    };

    public type HttpResponse = {
        status: Nat;
        headers: [HttpHeader];
        body: Blob;
    };
}