import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AIAnalysis {
  'flaggedSymptoms' : Array<string>,
  'suggestedSpecialty' : [] | [DoctorSpecialty],
  'recommendedActions' : Array<string>,
  'modelVersion' : string,
  'confidence' : number,
  'analysisTimestamp' : bigint,
  'riskAssessment' : string,
}
export interface ApiError {
  'code' : string,
  'message' : string,
  'timestamp' : bigint,
  'details' : [] | [string],
}
export type ApiResult = { 'ok' : null } |
  { 'err' : ApiError };
export type ApiResult_1 = { 'ok' : QueryId } |
  { 'err' : ApiError };
export interface Attachment {
  'id' : string,
  'isEncrypted' : boolean,
  'fileSizeBytes' : bigint,
  'fileName' : string,
  'fileType' : AttachmentType,
  'accessPermissions' : Array<UserId>,
  'uploadedAt' : bigint,
  'uploadedBy' : UserId,
}
export type AttachmentType = { 'prescription' : null } |
  { 'lab_result' : null } |
  { 'document' : null } |
  { 'image' : null } |
  { 'medical_record' : null };
export type BloodType = { 'B_negative' : null } |
  { 'AB_positive' : null } |
  { 'O_positive' : null } |
  { 'A_negative' : null } |
  { 'B_positive' : null } |
  { 'unknown' : null } |
  { 'AB_negative' : null } |
  { 'A_positive' : null } |
  { 'O_negative' : null };
export interface Doctor {
  'id' : DoctorId,
  'name' : string,
  'specialization' : string,
}
export type DoctorId = string;
export type DoctorSpecialty = { 'radiology' : null } |
  { 'cardiology' : null } |
  { 'other' : string } |
  { 'general_practice' : null } |
  { 'psychiatry' : null } |
  { 'surgery' : null } |
  { 'gastroenterology' : null } |
  { 'oncology' : null } |
  { 'emergency_medicine' : null } |
  { 'orthopedics' : null } |
  { 'internal_medicine' : null } |
  { 'pediatrics' : null } |
  { 'endocrinology' : null } |
  { 'dermatology' : null } |
  { 'neurology' : null };
export interface EmergencyContact {
  'relationship' : string,
  'name' : string,
  'email' : [] | [string],
  'address' : [] | [string],
  'phoneNumber' : string,
}
export type Gender = { 'other' : null } |
  { 'female' : null } |
  { 'male' : null } |
  { 'prefer_not_to_say' : null };
export interface HealthcareMetrics {
  'averagePatientSatisfaction' : number,
  'averageDoctorResponseTime' : number,
  'specialtyDistribution' : Array<[DoctorSpecialty, bigint]>,
  'queryResolutionRate' : number,
  'patientEngagementRate' : number,
  'criticalQueryResponse' : number,
  'doctorUtilizationRate' : number,
}
export type InsuranceId = string;
export interface InsuranceInfo {
  'id' : InsuranceId,
  'memberId' : string,
  'groupNumber' : [] | [string],
  'provider' : string,
  'isActive' : boolean,
  'deductibleAmount' : [] | [number],
  'expirationDate' : [] | [bigint],
  'copayAmount' : [] | [number],
  'policyNumber' : string,
  'effectiveDate' : bigint,
}
export interface MedicalHistory {
  'surgeries' : Array<string>,
  'lastUpdated' : bigint,
  'medications' : Array<string>,
  'familyHistory' : Array<string>,
  'conditions' : Array<string>,
  'allergies' : Array<string>,
}
export interface MedicalQuery {
  'id' : QueryId,
  'status' : QueryStatus,
  'doctorId' : [] | [DoctorId],
  'title' : string,
  'patientId' : PatientId,
  'createdAt' : bigint,
  'description' : string,
  'updatedAt' : bigint,
  'aiDraftResponse' : [] | [string],
  'response' : [] | [string],
}
export interface Patient {
  'id' : PatientId,
  'name' : string,
  'isActive' : boolean,
  'email' : string,
  'assignedDoctorId' : [] | [DoctorId],
  'condition' : string,
}
export interface PatientData {
  'id' : PatientId,
  'insuranceInfo' : [] | [InsuranceInfo],
  'bloodType' : BloodType,
  'country' : string,
  'dateOfBirth' : string,
  'communicationPreferences' : {
    'sms' : boolean,
    'email' : boolean,
    'phone' : boolean,
    'portal' : boolean,
  },
  'city' : string,
  'createdAt' : bigint,
  'emergencyContact' : EmergencyContact,
  'dataProcessingConsent' : boolean,
  'medicalRecordNumber' : string,
  'isActive' : boolean,
  'email' : string,
  'zipCode' : string,
  'updatedAt' : bigint,
  'lastVisit' : [] | [bigint],
  'state' : string,
  'primaryDoctorId' : [] | [DoctorId],
  'hipaaAcknowledged' : boolean,
  'medicalHistory' : MedicalHistory,
  'consentToTreatment' : boolean,
  'address' : string,
  'gender' : Gender,
  'assignedDoctorIds' : Array<DoctorId>,
  'phoneNumber' : string,
  'currentVitals' : [] | [VitalSigns],
  'lastName' : string,
  'firstName' : string,
}
export type PatientId = string;
export interface PlatformStats {
  'patientSatisfactionAverage' : number,
  'queriesLastMonth' : bigint,
  'totalPatients' : bigint,
  'systemPerformance' : SystemPerformanceMetrics,
  'doctorPerformanceAverage' : number,
  'pendingQueries' : bigint,
  'totalQueries' : bigint,
  'queriesLast24Hours' : bigint,
  'lastUpdated' : bigint,
  'dataBreaches' : bigint,
  'dataAccuracy' : number,
  'auditCompletionRate' : number,
  'hipaaCompliantQueries' : bigint,
  'inReviewQueries' : bigint,
  'patientsByCondition' : Array<[string, bigint]>,
  'doctorsOnline' : bigint,
  'totalDoctors' : bigint,
  'peakUsageHours' : Array<bigint>,
  'activeDoctors' : bigint,
  'doctorsBySpecialty' : Array<[DoctorSpecialty, bigint]>,
  'queriesLastWeek' : bigint,
  'emergencyQueries' : bigint,
  'averageQueryResolutionTime' : number,
  'queriesByDepartment' : Array<[string, bigint]>,
  'healthcareMetrics' : HealthcareMetrics,
  'systemReliability' : number,
  'securityIncidents' : bigint,
  'resolvedQueries' : bigint,
  'newPatientsThisMonth' : bigint,
  'reportingPeriod' : string,
  'activePatients' : bigint,
}
export type QueryCategory = { 'second_opinion' : null } |
  { 'medication_question' : null } |
  { 'other' : string } |
  { 'test_results' : null } |
  { 'appointment_request' : null } |
  { 'general_inquiry' : null } |
  { 'symptom_assessment' : null } |
  { 'follow_up' : null } |
  { 'emergency_consultation' : null } |
  { 'prescription_refill' : null };
export interface QueryData {
  'id' : QueryId,
  'status' : QueryStatus,
  'aiAnalysis' : [] | [AIAnalysis],
  'title' : string,
  'hipaaCompliant' : boolean,
  'assignedAt' : [] | [bigint],
  'responses' : Array<QueryResponse>,
  'dataClassification' : string,
  'patientId' : PatientId,
  'createdAt' : bigint,
  'description' : string,
  'patientSatisfactionRating' : [] | [bigint],
  'escalationLevel' : bigint,
  'assignedDoctorId' : [] | [DoctorId],
  'resolutionComplexity' : [] | [string],
  'updatedAt' : bigint,
  'relatedQueryIds' : Array<QueryId>,
  'followUpRequired' : boolean,
  'aiDraftResponse' : [] | [string],
  'patientMessages' : Array<QueryResponse>,
  'responseTimeMinutes' : [] | [bigint],
  'category' : QueryCategory,
  'auditTrail' : Array<string>,
  'priority' : QueryPriority,
  'internalNotes' : Array<QueryResponse>,
  'attachments' : Array<Attachment>,
  'departmentId' : [] | [string],
  'requiresHumanReview' : boolean,
  'resolvedAt' : [] | [bigint],
  'followUpDate' : [] | [bigint],
}
export type QueryId = string;
export type QueryPriority = { 'low' : null } |
  { 'emergency' : null } |
  { 'normal' : null } |
  { 'high' : null } |
  { 'urgent' : null };
export interface QueryResponse {
  'id' : string,
  'readByPatient' : boolean,
  'readTimestamp' : [] | [bigint],
  'isOfficial' : boolean,
  'timestamp' : bigint,
  'responseText' : string,
  'responderId' : UserId,
  'attachments' : Array<Attachment>,
}
export type QueryStatus = { 'resolved' : null } |
  { 'closed' : null } |
  { 'assigned' : null } |
  { 'submitted' : null } |
  { 'pending' : null } |
  { 'escalated' : null } |
  { 'awaiting_patient_response' : null } |
  { 'in_review' : null };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : QueryId } |
  { 'err' : string };
export interface SearchCriteria {
  'status' : [] | [QueryStatus],
  'doctorId' : [] | [DoctorId],
  'dateTo' : [] | [bigint],
  'patientId' : [] | [PatientId],
  'offset' : [] | [bigint],
  'limit' : [] | [bigint],
  'specialty' : [] | [DoctorSpecialty],
  'category' : [] | [QueryCategory],
  'priority' : [] | [QueryPriority],
  'searchQuery' : [] | [string],
  'department' : [] | [string],
  'dateFrom' : [] | [bigint],
}
export interface SearchResult {
  'hasMore' : boolean,
  'totalCount' : bigint,
  'offset' : bigint,
  'results' : Array<QueryData>,
  'searchQuery' : SearchCriteria,
}
export interface SystemPerformanceMetrics {
  'activeUsers' : bigint,
  'databaseResponseTime' : number,
  'averageQueryProcessingTime' : number,
  'errorRate' : number,
  'systemUptime' : number,
  'peakConcurrentUsers' : bigint,
  'apiResponseTime' : number,
}
export interface SystemStats {
  'totalPatients' : bigint,
  'pendingQueries' : bigint,
  'totalQueries' : bigint,
  'totalDoctors' : bigint,
  'completedQueries' : bigint,
}
export type UserId = string;
export interface VitalSigns {
  'weight' : [] | [number],
  'height' : [] | [number],
  'temperature' : [] | [number],
  'recordedAt' : bigint,
  'recordedBy' : [] | [UserId],
  'oxygenSaturation' : [] | [bigint],
  'heartRate' : [] | [bigint],
  'bloodPressureDiastolic' : [] | [bigint],
  'bloodPressureSystolic' : [] | [bigint],
}
export interface _SERVICE {
  'assignPatientToDoctor' : ActorMethod<[PatientId, DoctorId], Result>,
  'createEnhancedPatient' : ActorMethod<[PatientData], PatientId>,
  'findPatientByEmail' : ActorMethod<[string], [] | [Patient]>,
  'getAllDoctors' : ActorMethod<[], Array<Doctor>>,
  'getDoctor' : ActorMethod<[DoctorId], [] | [Doctor]>,
  'getDoctorPatients' : ActorMethod<[DoctorId], Array<Patient>>,
  'getDoctorQueries' : ActorMethod<[DoctorId], Array<MedicalQuery>>,
  'getEnhancedPatient' : ActorMethod<[PatientId], [] | [PatientData]>,
  'getPatient' : ActorMethod<[PatientId], [] | [Patient]>,
  'getPatientQueries' : ActorMethod<[PatientId], Array<MedicalQuery>>,
  'getPatientQueriesEnhanced' : ActorMethod<
    [PatientId, [] | [SearchCriteria]],
    SearchResult
  >,
  'getPendingQueries' : ActorMethod<[], Array<MedicalQuery>>,
  'getPlatformStats' : ActorMethod<[], PlatformStats>,
  'getQuery' : ActorMethod<[QueryId], [] | [MedicalQuery]>,
  'getStats' : ActorMethod<[], SystemStats>,
  'getUnassignedPatients' : ActorMethod<[], Array<Patient>>,
  'healthCheck' : ActorMethod<[], string>,
  'registerDoctor' : ActorMethod<[string, string], DoctorId>,
  'registerPatient' : ActorMethod<[string, string, string], PatientId>,
  'respondToQuery' : ActorMethod<[QueryId, DoctorId, string], Result>,
  'submitQuery' : ActorMethod<[PatientId, string, string], Result_1>,
  'submitQueryEnhanced' : ActorMethod<[QueryData], ApiResult_1>,
  'takeQuery' : ActorMethod<[QueryId, DoctorId], Result>,
  'unassignPatient' : ActorMethod<[PatientId, DoctorId], Result>,
  'updatePatient' : ActorMethod<[PatientId, PatientData], ApiResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
