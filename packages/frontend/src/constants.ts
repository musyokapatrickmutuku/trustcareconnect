// Application Constants

export const UI_MESSAGES = {
  ERROR: {
    BACKEND_CONNECTION_FAILED: 'Failed to connect to backend. Please check your connection.',
    INVALID_INPUT: 'Please check your input and try again.',
    AUTHENTICATION_FAILED: 'Authentication failed. Please try again.',
    PERMISSION_DENIED: 'You do not have permission to access this resource.',
    UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  },
  SUCCESS: {
    LOGIN_SUCCESS: 'Login successful!',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    REGISTRATION_SUCCESS: 'Registration completed successfully!',
    QUERY_SUBMITTED: 'Your query has been submitted successfully.',
    RESPONSE_SENT: 'Your response has been sent to the patient.',
  },
  LOADING: {
    SIGNING_IN: 'Signing in...',
    REGISTERING: 'Creating account...',
    LOADING_DATA: 'Loading data...',
    SUBMITTING: 'Submitting...',
    SAVING: 'Saving...',
  },
  INFO: {
    WELCOME: 'Welcome to TrustCareConnect',
    NO_DATA: 'No data available.',
    PROCESSING: 'Processing your request...',
  }
};

export const MEDICAL_SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology', 
  'Hematology',
  'Infectious Disease',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Surgery',
  'Urology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Obstetrics & Gynecology',
  'Anesthesiology',
  'Pathology',
  'Physical Medicine & Rehabilitation'
];

export const QUERY_STATUSES = {
  PENDING: 'pending',
  DOCTOR_REVIEW: 'doctor_review',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
} as const;

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
} as const;

export const API_ENDPOINTS = {
  HEALTH_CHECK: '/health',
  PATIENTS: '/patients',
  DOCTORS: '/doctors', 
  QUERIES: '/queries',
  STATS: '/stats'
} as const;