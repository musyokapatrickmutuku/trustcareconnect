// TrustCareConnect - Enhanced Type Definitions
import Time "mo:base/Time";
import Result "mo:base/Result";

module Types {

    // ===============================
    // CORE IDENTIFIERS
    // ===============================
    
    public type PatientId = Text;
    public type DoctorId = Text;
    public type QueryId = Text;
    public type AppointmentId = Text;
    public type MedicalRecordId = Text;
    public type PrescriptionId = Text;
    public type InsuranceId = Text;
    public type UserId = Text;

    // ===============================
    // PATIENT DATA STRUCTURES
    // ===============================

    public type Gender = {
        #male;
        #female;
        #other;
        #prefer_not_to_say;
    };

    public type BloodType = {
        #A_positive;
        #A_negative;
        #B_positive;
        #B_negative;
        #AB_positive;
        #AB_negative;
        #O_positive;
        #O_negative;
        #unknown;
    };

    public type EmergencyContact = {
        name: Text;
        relationship: Text;
        phoneNumber: Text;
        email: ?Text;
        address: ?Text;
    };

    public type InsuranceInfo = {
        provider: Text;
        policyNumber: Text;
        groupNumber: ?Text;
        effectiveDate: Text;
        expirationDate: Text;
    };

    public type MedicalHistory = {
        conditions: [Text];
        allergies: [Text];
        medications: [Text];
        surgeries: [Text];
        familyHistory: [Text];
        socialHistory: Text;
        notes: Text;
    };

    public type VitalSigns = {
        height: ?Float;
        weight: ?Float;
        bloodPressureSystolic: ?Nat;
        bloodPressureDiastolic: ?Nat;
        heartRate: ?Nat;
        temperature: ?Float;
        respiratoryRate: ?Nat;
        oxygenSaturation: ?Nat;
        bmi: ?Float;
        lastUpdated: Int;
    };

    public type PatientData = {
        id: PatientId;
        // Basic Information
        firstName: Text;
        lastName: Text;
        dateOfBirth: Text;
        gender: Gender;
        phoneNumber: Text;
        email: Text;
        address: Text;
        city: Text;
        state: Text;
        zipCode: Text;
        country: Text;
        
        // Medical Information
        medicalRecordNumber: Text;
        bloodType: BloodType;
        medicalHistory: MedicalHistory;
        currentVitals: ?VitalSigns;
        
        // Emergency and Insurance
        emergencyContact: EmergencyContact;
        insuranceInfo: ?InsuranceInfo;
        
        // Care Management
        primaryDoctorId: ?DoctorId;
        assignedDoctorIds: [DoctorId];
        isActive: Bool;
        
        // System Fields
        createdAt: Int;
        updatedAt: Int;
        lastVisit: ?Int;
        
        // Privacy and Consent
        consentToTreatment: Bool;
        hipaaAcknowledged: Bool;
        dataProcessingConsent: Bool;
        communicationPreferences: {
            preferredLanguage: Text;
            emailNotifications: Bool;
            smsNotifications: Bool;
            callNotifications: Bool;
            emergencyContactConsent: Bool;
        };
    };

    // ===============================
    // DOCTOR DATA STRUCTURES
    // ===============================

    public type DoctorSpecialty = {
        #general_practice;
        #internal_medicine;
        #pediatrics;
        #cardiology;
        #dermatology;
        #endocrinology;
        #gastroenterology;
        #neurology;
        #oncology;
        #orthopedics;
        #psychiatry;
        #radiology;
        #surgery;
        #emergency_medicine;
        #other: Text;
    };

    public type Credential = {
        credentialType: Text;
        institution: Text;
        obtainedDate: Text;
        expirationDate: ?Text;
        credentialNumber: Text;
        isValid: Bool;
    };

    public type DoctorData = {
        id: DoctorId;
        // Basic Information
        firstName: Text;
        lastName: Text;
        email: Text;
        phoneNumber: Text;
        
        // Professional Information
        licenseNumber: Text;
        npiNumber: Text;
        specialties: [DoctorSpecialty];
        credentials: [Credential];
        yearsOfExperience: Nat;
        
        // Practice Information
        hospitalAffiliation: Text;
        department: Text;
        officeAddress: Text;
        consultationFee: ?Float;
        
        // Availability
        isAcceptingPatients: Bool;
        workingHours: Text;
        availableDays: [Text];
        
        // System Fields
        isActive: Bool;
        createdAt: Int;
        updatedAt: Int;
        lastLogin: ?Int;
        
        // Performance Metrics
        totalPatientsManaged: Nat;
        averageResponseTime: ?Float;
        patientSatisfactionRating: ?Float;
        queriesHandled: Nat;
    };

    // ===============================
    // QUERY DATA STRUCTURES
    // ===============================

    public type QueryPriority = {
        #low;
        #normal;
        #high;
        #urgent;
        #emergency;
    };

    public type QueryCategory = {
        #general_inquiry;
        #symptom_assessment;
        #medication_question;
        #follow_up;
        #test_results;
        #prescription_refill;
        #appointment_request;
        #emergency_consultation;
        #second_opinion;
        #other: Text;
    };

    public type QueryStatus = {
        #submitted;
        #pending;
        #assigned;
        #in_review;
        #awaiting_patient_response;
        #resolved;
        #closed;
        #escalated;
    };

    public type AttachmentType = {
        #image;
        #document;
        #lab_result;
        #prescription;
        #medical_record;
    };

    public type Attachment = {
        id: Text;
        fileName: Text;
        fileType: AttachmentType;
        fileSizeBytes: Nat;
        uploadedAt: Int;
        uploadedBy: UserId;
        isEncrypted: Bool;
        accessPermissions: [UserId];
    };

    public type AIAnalysis = {
        confidence: Float;
        recommendedActions: [Text];
        riskAssessment: Text;
        suggestedSpecialty: ?DoctorSpecialty;
        flaggedSymptoms: [Text];
        analysisTimestamp: Int;
        modelVersion: Text;
    };

    public type QueryResponse = {
        id: Text;
        responderId: UserId;
        responseText: Text;
        isOfficial: Bool;
        attachments: [Attachment];
        timestamp: Int;
        readByPatient: Bool;
        readTimestamp: ?Int;
    };

    public type QueryData = {
        id: QueryId;
        // Basic Query Information
        patientId: PatientId;
        title: Text;
        description: Text;
        category: QueryCategory;
        priority: QueryPriority;
        status: QueryStatus;
        
        // Assignment and Routing
        assignedDoctorId: ?DoctorId;
        departmentId: ?Text;
        escalationLevel: Nat;
        
        // AI Processing
        aiAnalysis: ?AIAnalysis;
        aiDraftResponse: ?Text;
        requiresHumanReview: Bool;
        
        // Communication
        responses: [QueryResponse];
        patientMessages: [QueryResponse];
        internalNotes: [QueryResponse];
        
        // Attachments and Supporting Data
        attachments: [Attachment];
        relatedQueryIds: [QueryId];
        followUpRequired: Bool;
        followUpDate: ?Int;
        
        // Compliance and Tracking
        hipaaCompliant: Bool;
        auditTrail: [Text];
        dataClassification: Text;
        
        // Timestamps
        createdAt: Int;
        updatedAt: Int;
        assignedAt: ?Int;
        resolvedAt: ?Int;
        
        // Metrics
        responseTimeMinutes: ?Nat;
        patientSatisfactionRating: ?Nat;
        resolutionComplexity: ?Text;
    };

    // ===============================
    // PLATFORM STATISTICS
    // ===============================

    public type UserActivityMetrics = {
        totalLogins: Nat;
        averageSessionDuration: Float;
        lastLoginDate: ?Int;
        featuresUsed: [Text];
        totalQueriesSubmitted: Nat;
        averageResponseTime: Float;
    };

    public type SystemPerformanceMetrics = {
        averageQueryProcessingTime: Float;
        systemUptime: Float;
        errorRate: Float;
        activeUsers: Nat;
        peakConcurrentUsers: Nat;
        databaseResponseTime: Float;
        apiResponseTime: Float;
    };

    public type HealthcareMetrics = {
        averagePatientSatisfaction: Float;
        queryResolutionRate: Float;
        averageDoctorResponseTime: Float;
        criticalQueryResponse: Float;
        patientEngagementRate: Float;
        doctorUtilizationRate: Float;
        specialtyDistribution: [(DoctorSpecialty, Nat)];
    };

    public type PlatformStats = {
        // User Statistics
        totalPatients: Nat;
        activePatients: Nat;
        newPatientsThisMonth: Nat;
        totalDoctors: Nat;
        activeDoctors: Nat;
        doctorsOnline: Nat;
        
        // Query Statistics
        totalQueries: Nat;
        pendingQueries: Nat;
        inReviewQueries: Nat;
        resolvedQueries: Nat;
        emergencyQueries: Nat;
        averageQueryResolutionTime: Float;
        
        // Department Statistics
        queriesByDepartment: [(Text, Nat)];
        doctorsBySpecialty: [(DoctorSpecialty, Nat)];
        patientsByCondition: [(Text, Nat)];
        
        // Performance Metrics
        systemPerformance: SystemPerformanceMetrics;
        healthcareMetrics: HealthcareMetrics;
        
        // Time-based Analytics
        queriesLast24Hours: Nat;
        queriesLastWeek: Nat;
        queriesLastMonth: Nat;
        peakUsageHours: [Nat];
        
        // Quality Metrics
        patientSatisfactionAverage: Float;
        doctorPerformanceAverage: Float;
        systemReliability: Float;
        dataAccuracy: Float;
        
        // Compliance and Security
        hipaaCompliantQueries: Nat;
        securityIncidents: Nat;
        dataBreaches: Nat;
        auditCompletionRate: Float;
        
        // Generated Timestamp
        lastUpdated: Int;
        reportingPeriod: Text;
    };

    // ===============================
    // RESULT TYPES
    // ===============================

    public type ApiResult<T> = Result.Result<T, ApiError>;
    
    public type ApiError = {
        code: Text;
        message: Text;
        details: ?Text;
        timestamp: Int;
    };

    // ===============================
    // COMMUNICATION TYPES
    // ===============================

    public type NotificationType = {
        #query_update;
        #appointment_reminder;
        #prescription_ready;
        #test_results;
        #system_alert;
        #security_notice;
    };

    public type Notification = {
        id: Text;
        recipientId: UserId;
        notificationType: NotificationType;
        title: Text;
        message: Text;
        isRead: Bool;
        priority: QueryPriority;
        actionRequired: Bool;
        expirationTime: ?Int;
        createdAt: Int;
        readAt: ?Int;
    };

    // ===============================
    // AUDIT AND COMPLIANCE
    // ===============================

    public type AuditEventType = {
        #user_login;
        #user_logout;
        #data_access;
        #data_modification;
        #query_submission;
        #query_assignment;
        #query_resolution;
        #system_configuration;
        #security_event;
        #error_event;
    };

    public type AuditEvent = {
        id: Text;
        eventType: AuditEventType;
        userId: ?UserId;
        targetResourceId: ?Text;
        targetResourceType: ?Text;
        description: Text;
        ipAddress: ?Text;
        userAgent: ?Text;
        sessionId: ?Text;
        timestamp: Int;
        severity: QueryPriority;
        compliance: {
            hipaaCompliant: Bool;
            dataClassification: Text;
            retentionPeriod: ?Int;
        };
    };

    // ===============================
    // SEARCH AND FILTERING
    // ===============================

    public type SearchCriteria = {
        searchQuery: ?Text;
        patientId: ?PatientId;
        doctorId: ?DoctorId;
        status: ?QueryStatus;
        priority: ?QueryPriority;
        category: ?QueryCategory;
        dateFrom: ?Int;
        dateTo: ?Int;
        department: ?Text;
        specialty: ?DoctorSpecialty;
        limit: ?Nat;
        offset: ?Nat;
    };

    public type SortOption = {
        field: Text;
        ascending: Bool;
    };

    public type SearchResult<T> = {
        results: [T];
        totalCount: Nat;
        hasMore: Bool;
        offset: Nat;
        searchQuery: SearchCriteria;
    };
};