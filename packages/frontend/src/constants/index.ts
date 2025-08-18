// Application constants

export const API_ENDPOINTS = {
  HEALTH_CHECK: '/health',
  STATS: '/stats',
  REGISTER_PATIENT: '/registerPatient',
  REGISTER_DOCTOR: '/registerDoctor',
  SUBMIT_QUERY: '/submitQuery',
  GET_PATIENT: '/getPatient',
  GET_DOCTOR: '/getDoctor',
  GET_PATIENT_QUERIES: '/getPatientQueries',
  GET_DOCTOR_QUERIES: '/getDoctorQueries',
  GET_PENDING_QUERIES: '/getPendingQueries',
  TAKE_QUERY: '/takeQuery',
  RESPOND_TO_QUERY: '/respondToQuery',
  ASSIGN_PATIENT: '/assignPatientToDoctor',
  UNASSIGN_PATIENT: '/unassignPatient',
  GET_UNASSIGNED_PATIENTS: '/getUnassignedPatients',
  GET_DOCTOR_PATIENTS: '/getDoctorPatients',
  GET_ALL_DOCTORS: '/getAllDoctors'
} as const;

export const QUERY_STATUS = {
  PENDING: 'Pending',
  DOCTOR_REVIEW: 'Under Review',
  COMPLETED: 'Completed'
} as const;

export const USER_TYPES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor'
} as const;

export const FORM_VALIDATION = {
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 100,
  MAX_CONDITION_LENGTH: 100,
  MAX_SPECIALIZATION_LENGTH: 100,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_RESPONSE_LENGTH: 2000
} as const;

export const UI_MESSAGES = {
  LOADING: {
    REGISTERING: 'Registering...',
    SUBMITTING: 'Submitting...',
    LOADING: 'Loading...'
  },
  SUCCESS: {
    PATIENT_REGISTERED: 'Patient registered successfully!',
    DOCTOR_REGISTERED: 'Doctor registered successfully!',
    QUERY_SUBMITTED: 'Query submitted successfully!',
    QUERY_TAKEN: 'Query taken successfully!',
    RESPONSE_SUBMITTED: 'Response submitted successfully!',
    PATIENT_ASSIGNED: 'Patient assigned successfully!',
    PATIENT_UNASSIGNED: 'Patient unassigned successfully!'
  },
  ERROR: {
    BACKEND_CONNECTION_FAILED: 'Backend connection failed',
    REGISTRATION_FAILED: 'Registration failed',
    SUBMISSION_FAILED: 'Submission failed',
    LOADING_FAILED: 'Failed to load data'
  }
} as const;

export const MEDICAL_CONDITIONS = [
  'diabetes',
  'hypertension',
  'heart disease',
  'obesity',
  'asthma',
  'arthritis',
  'depression',
  'anxiety',
  'other'
] as const;

export const MEDICAL_SPECIALIZATIONS = [
  'endocrinologist',
  'cardiologist',
  'general practitioner',
  'psychiatrist',
  'pulmonologist',
  'rheumatologist',
  'other'
] as const;