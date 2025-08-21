# TrustCareConnect API Documentation

## Overview

TrustCareConnect provides a comprehensive healthcare platform built on the Internet Computer Protocol using Motoko for the backend and React for the frontend. This documentation covers all API endpoints, data structures, and integration patterns for secure healthcare data management.

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Data Types & Structures](#data-types--structures)
3. [Patient Management API](#patient-management-api)
4. [Doctor Management API](#doctor-management-api)
5. [Query Management API](#query-management-api)
6. [AI Integration API](#ai-integration-api)
7. [Platform Statistics API](#platform-statistics-api)
8. [Frontend Integration](#frontend-integration)
9. [Error Handling](#error-handling)
10. [HIPAA Compliance](#hipaa-compliance)

---

## Authentication & Security

### Identity Management

TrustCareConnect uses Internet Identity for secure authentication and authorization.

```typescript
// Frontend Authentication
import { AuthClient } from '@dfinity/auth-client';

const authClient = await AuthClient.create();
const isAuthenticated = await authClient.isAuthenticated();

if (!isAuthenticated) {
  await authClient.login({
    identityProvider: 'https://identity.ic0.app',
    maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
  });
}
```

### Role-Based Access Control

```typescript
// User Roles
type UserRole = 'patient' | 'doctor' | 'admin' | 'staff';

// Permission Validation
interface UserPermissions {
  canViewPatientData: boolean;
  canModifyMedicalRecords: boolean;
  canSubmitQueries: boolean;
  canAssignDoctors: boolean;
  canAccessAnalytics: boolean;
}
```

---

## Data Types & Structures

### Core Types

```motoko
// Patient Data Structure
type PatientData = {
  id: PatientId;
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
  medicalRecordNumber: Text;
  bloodType: BloodType;
  medicalHistory: MedicalHistory;
  currentVitals: ?VitalSigns;
  emergencyContact: EmergencyContact;
  insuranceInfo: ?InsuranceInfo;
  primaryDoctorId: ?DoctorId;
  assignedDoctorIds: [DoctorId];
  isActive: Bool;
  createdAt: Int;
  updatedAt: Int;
  lastVisit: ?Int;
  consentToTreatment: Bool;
  hipaaAcknowledged: Bool;
  dataProcessingConsent: Bool;
  communicationPreferences: {
    email: Bool;
    sms: Bool;
    phone: Bool;
    portal: Bool;
  };
};
```

```motoko
// Query Data Structure
type QueryData = {
  id: QueryId;
  patientId: PatientId;
  title: Text;
  description: Text;
  category: QueryCategory;
  priority: QueryPriority;
  status: QueryStatus;
  assignedDoctorId: ?DoctorId;
  departmentId: ?Text;
  escalationLevel: Nat;
  aiAnalysis: ?AIAnalysis;
  aiDraftResponse: ?Text;
  requiresHumanReview: Bool;
  responses: [QueryResponse];
  patientMessages: [QueryResponse];
  internalNotes: [QueryResponse];
  attachments: [Attachment];
  relatedQueryIds: [QueryId];
  followUpRequired: Bool;
  followUpDate: ?Int;
  hipaaCompliant: Bool;
  auditTrail: [Text];
  dataClassification: Text;
  createdAt: Int;
  updatedAt: Int;
  assignedAt: ?Int;
  resolvedAt: ?Int;
  responseTimeMinutes: ?Nat;
  patientSatisfactionRating: ?Nat;
  resolutionComplexity: ?Text;
};
```

---

## Patient Management API

### Register Patient

Register a new patient in the healthcare system.

```motoko
public func registerPatient(name: Text, condition: Text, email: Text): async PatientId
```

**Frontend Integration:**
```typescript
import { backend } from '../declarations/backend';

const registerNewPatient = async (patientData: {
  name: string;
  condition: string;
  email: string;
}) => {
  try {
    const patientId = await backend.registerPatient(
      patientData.name,
      patientData.condition,
      patientData.email
    );
    return { success: true, patientId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Enhanced Patient Registration

Register patient with comprehensive medical data.

```motoko
public func registerPatientEnhanced(patientData: PatientData): async ApiResult<PatientId>
```

**Frontend Integration:**
```typescript
const registerPatientEnhanced = async (patientData: PatientData) => {
  try {
    const result = await backend.registerPatientEnhanced(patientData);
    if ('ok' in result) {
      return { success: true, patientId: result.ok };
    } else {
      return { success: false, error: result.err };
    }
  } catch (error) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: error.message } };
  }
};
```

### Get Patient Information

Retrieve patient data by ID.

```motoko
public query func getPatient(patientId: PatientId): async ?Patient
```

**Frontend Integration:**
```typescript
const getPatientData = async (patientId: string): Promise<Patient | null> => {
  try {
    const patient = await backend.getPatient(patientId);
    return patient ? patient[0] : null;
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return null;
  }
};
```

### Update Patient Information

Update existing patient data with validation.

```motoko
public func updatePatient(patientId: PatientId, updatedData: PatientData): async ApiResult<()>
```

**Frontend Integration:**
```typescript
const updatePatientData = async (patientId: string, updatedData: PatientData) => {
  try {
    const result = await backend.updatePatient(patientId, updatedData);
    if ('ok' in result) {
      return { success: true };
    } else {
      return { success: false, error: result.err };
    }
  } catch (error) {
    return { success: false, error: { code: 'UPDATE_FAILED', message: error.message } };
  }
};
```

### Find Patient by Email

Search for patient using email address.

```motoko
public query func findPatientByEmail(email: Text): async ?Patient
```

**Frontend Integration:**
```typescript
const findPatientByEmail = async (email: string) => {
  try {
    const patient = await backend.findPatientByEmail(email);
    return patient ? patient[0] : null;
  } catch (error) {
    console.error('Patient search failed:', error);
    return null;
  }
};
```

---

## Doctor Management API

### Register Doctor

Register a new healthcare provider.

```motoko
public func registerDoctor(name: Text, specialization: Text): async DoctorId
```

**Frontend Integration:**
```typescript
const registerNewDoctor = async (doctorData: {
  name: string;
  specialization: string;
}) => {
  try {
    const doctorId = await backend.registerDoctor(
      doctorData.name,
      doctorData.specialization
    );
    return { success: true, doctorId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Get Doctor Information

Retrieve doctor profile and credentials.

```motoko
public query func getDoctor(doctorId: DoctorId): async ?Doctor
```

**Frontend Integration:**
```typescript
const getDoctorProfile = async (doctorId: string) => {
  try {
    const doctor = await backend.getDoctor(doctorId);
    return doctor ? doctor[0] : null;
  } catch (error) {
    console.error('Failed to fetch doctor:', error);
    return null;
  }
};
```

### Get All Doctors

Retrieve list of all registered doctors.

```motoko
public query func getAllDoctors(): async [Doctor]
```

**Frontend Integration:**
```typescript
const getAllDoctors = async (): Promise<Doctor[]> => {
  try {
    return await backend.getAllDoctors();
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
};
```

### Assign Patient to Doctor

Create doctor-patient relationship.

```motoko
public func assignPatientToDoctor(patientId: PatientId, doctorId: DoctorId): async Result.Result<(), Text>
```

**Frontend Integration:**
```typescript
const assignPatientToDoctor = async (patientId: string, doctorId: string) => {
  try {
    const result = await backend.assignPatientToDoctor(patientId, doctorId);
    if ('ok' in result) {
      return { success: true };
    } else {
      return { success: false, error: result.err };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

---

## Query Management API

### Submit Medical Query

Submit a medical query with AI analysis.

```motoko
public func submitQuery(patientId: PatientId, title: Text, description: Text): async Result.Result<QueryId, Text>
```

**Frontend Integration:**
```typescript
const submitMedicalQuery = async (queryData: {
  patientId: string;
  title: string;
  description: string;
}) => {
  try {
    const result = await backend.submitQuery(
      queryData.patientId,
      queryData.title,
      queryData.description
    );
    
    if ('ok' in result) {
      return { success: true, queryId: result.ok };
    } else {
      return { success: false, error: result.err };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### Enhanced Query Submission

Submit query with comprehensive data and AI processing.

```motoko
public func submitQueryEnhanced(queryData: QueryData): async ApiResult<QueryId>
```

**Frontend Integration:**
```typescript
const submitEnhancedQuery = async (queryData: QueryData) => {
  try {
    const result = await backend.submitQueryEnhanced(queryData);
    if ('ok' in result) {
      return { success: true, queryId: result.ok };
    } else {
      return { success: false, error: result.err };
    }
  } catch (error) {
    return { success: false, error: { code: 'SUBMISSION_FAILED', message: error.message } };
  }
};
```

### Get Query Details

Retrieve comprehensive query information.

```motoko
public query func getQuery(queryId: QueryId): async ?MedicalQuery
```

**Frontend Integration:**
```typescript
const getQueryDetails = async (queryId: string) => {
  try {
    const query = await backend.getQuery(queryId);
    return query ? query[0] : null;
  } catch (error) {
    console.error('Failed to fetch query:', error);
    return null;
  }
};
```

### Get Patient Queries

Retrieve all queries for a specific patient with filtering.

```motoko
public query func getPatientQueriesEnhanced(patientId: PatientId, searchCriteria: ?SearchCriteria): async SearchResult<QueryData>
```

**Frontend Integration:**
```typescript
const getPatientQueries = async (
  patientId: string, 
  filters?: SearchCriteria
) => {
  try {
    const result = await backend.getPatientQueriesEnhanced(
      patientId,
      filters ? [filters] : []
    );
    return result;
  } catch (error) {
    console.error('Failed to fetch patient queries:', error);
    return {
      results: [],
      totalCount: 0,
      hasMore: false,
      offset: 0,
      searchQuery: filters || null
    };
  }
};
```

### Doctor Query Management

```motoko
public func takeQuery(queryId: QueryId, doctorId: DoctorId): async Result.Result<(), Text>
public func respondToQuery(queryId: QueryId, doctorId: DoctorId, response: Text): async Result.Result<(), Text>
public query func getDoctorQueries(doctorId: DoctorId): async [MedicalQuery]
```

**Frontend Integration:**
```typescript
// Take Query
const takeQuery = async (queryId: string, doctorId: string) => {
  try {
    const result = await backend.takeQuery(queryId, doctorId);
    return 'ok' in result ? { success: true } : { success: false, error: result.err };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Respond to Query
const respondToQuery = async (queryId: string, doctorId: string, response: string) => {
  try {
    const result = await backend.respondToQuery(queryId, doctorId, response);
    return 'ok' in result ? { success: true } : { success: false, error: result.err };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get Doctor's Queries
const getDoctorQueries = async (doctorId: string) => {
  try {
    return await backend.getDoctorQueries(doctorId);
  } catch (error) {
    console.error('Failed to fetch doctor queries:', error);
    return [];
  }
};
```

---

## AI Integration API

### AI Analysis Functions

The backend integrates with AI services for clinical decision support.

```motoko
// AI Analysis Result
type AIAnalysis = {
  confidence: Float;
  recommendedActions: [Text];
  riskAssessment: Text;
  suggestedSpecialty: ?DoctorSpecialty;
  flaggedSymptoms: [Text];
  analysisTimestamp: Int;
  modelVersion: Text;
};
```

**Frontend Integration:**
```typescript
// AI analysis is automatically performed during query submission
const submitQueryWithAI = async (queryData: QueryData) => {
  const result = await backend.submitQueryEnhanced(queryData);
  
  if ('ok' in result) {
    // Query includes AI analysis
    const query = await backend.getQuery(result.ok);
    if (query && query[0]?.aiAnalysis) {
      const aiAnalysis = query[0].aiAnalysis[0];
      console.log('AI Confidence:', aiAnalysis.confidence);
      console.log('Risk Assessment:', aiAnalysis.riskAssessment);
      console.log('Recommended Actions:', aiAnalysis.recommendedActions);
    }
  }
  
  return result;
};
```

---

## Platform Statistics API

### Get Comprehensive Platform Statistics

Retrieve detailed analytics and performance metrics.

```motoko
public query func getPlatformStats(): async PlatformStats
```

**Frontend Integration:**
```typescript
const getPlatformAnalytics = async (): Promise<PlatformStats | null> => {
  try {
    const stats = await backend.getPlatformStats();
    return stats;
  } catch (error) {
    console.error('Failed to fetch platform stats:', error);
    return null;
  }
};

// Usage in React Component
const DashboardAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      const platformStats = await getPlatformAnalytics();
      setStats(platformStats);
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  if (!stats) return <div>Loading analytics...</div>;
  
  return (
    <div className="analytics-dashboard">
      <div className="stat-card">
        <h3>Total Patients</h3>
        <p>{stats.totalPatients}</p>
      </div>
      <div className="stat-card">
        <h3>Active Queries</h3>
        <p>{stats.pendingQueries + stats.inReviewQueries}</p>
      </div>
      <div className="stat-card">
        <h3>Resolution Time</h3>
        <p>{Math.round(stats.averageQueryResolutionTime)} min</p>
      </div>
    </div>
  );
};
```

### Legacy Statistics (Backward Compatibility)

```motoko
public query func getStats(): async SystemStats
```

**Frontend Integration:**
```typescript
const getLegacyStats = async () => {
  try {
    return await backend.getStats();
  } catch (error) {
    console.error('Failed to fetch legacy stats:', error);
    return null;
  }
};
```

---

## Frontend Integration

### Backend Actor Setup

```typescript
// src/declarations/backend/index.ts
import { createActor, canisterId } from './backend';
import { AuthClient } from '@dfinity/auth-client';

export const initializeBackend = async () => {
  const authClient = await AuthClient.create();
  const identity = authClient.getIdentity();
  
  return createActor(canisterId, {
    agentOptions: {
      identity,
      host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://localhost:4943',
    },
  });
};
```

### React Hooks for Backend Integration

```typescript
// src/hooks/useBackend.ts
import { useState, useEffect } from 'react';
import { backend } from '../declarations/backend';

export const usePatientData = (patientId: string) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const result = await backend.getPatient(patientId);
        setPatient(result ? result[0] : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);
  
  return { patient, loading, error, refetch: () => fetchPatient() };
};

export const useQuerySubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  
  const submitQuery = async (queryData: {
    patientId: string;
    title: string;
    description: string;
  }) => {
    setSubmitting(true);
    try {
      const result = await backend.submitQuery(
        queryData.patientId,
        queryData.title,
        queryData.description
      );
      
      if ('ok' in result) {
        return { success: true, queryId: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setSubmitting(false);
    }
  };
  
  return { submitQuery, submitting };
};
```

### Real-time Updates with WebSocket Integration

```typescript
// src/services/realtime.ts
export const useRealTimeUpdates = (queryId: string) => {
  const [updates, setUpdates] = useState([]);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'QUERY_UPDATE' && data.queryId === queryId) {
        setUpdates(prev => [...prev, data]);
      }
    };
    
    return () => ws.close();
  }, [queryId]);
  
  return updates;
};
```

---

## Error Handling

### Backend Error Types

```motoko
type ApiError = {
  code: Text;
  message: Text;
  details: ?Text;
  timestamp: Int;
};

type ApiResult<T> = Result.Result<T, ApiError>;
```

### Frontend Error Handling

```typescript
// src/utils/errorHandling.ts
export interface TrustCareError {
  code: string;
  message: string;
  details?: string;
  timestamp?: number;
}

export const handleBackendError = (error: any): TrustCareError => {
  if (error && typeof error === 'object' && 'code' in error) {
    return error as TrustCareError;
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'An unexpected error occurred',
    timestamp: Date.now()
  };
};

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<TrustCareError[]>([]);
  
  const addError = (error: TrustCareError) => {
    setErrors(prev => [...prev, { ...error, timestamp: Date.now() }]);
  };
  
  const clearErrors = () => setErrors([]);
  
  return { errors, addError, clearErrors };
};
```

---

## HIPAA Compliance

### Data Security Measures

1. **Encryption at Rest**: All patient data is encrypted using AES-256
2. **Encryption in Transit**: All communications use TLS 1.3
3. **Access Controls**: Role-based permissions for all data access
4. **Audit Logging**: Complete audit trail for all PHI access
5. **Data Minimization**: Only necessary data is collected and stored

### Frontend Security Implementation

```typescript
// src/utils/security.ts
export const encryptSensitiveData = (data: string): string => {
  // Implement client-side encryption for sensitive form data
  // This is a placeholder - use proper encryption library
  return btoa(data); // Replace with actual encryption
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// HIPAA Compliance Hooks
export const useHIPAACompliance = () => {
  const logAccess = (resource: string, action: string) => {
    const auditEvent = {
      timestamp: new Date().toISOString(),
      resource,
      action,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
    };
    
    // Send to audit logging service
    backend.logAuditEvent(auditEvent);
  };
  
  return { logAccess };
};
```

### Data Classification

```typescript
// src/types/dataClassification.ts
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  PHI = 'phi', // Protected Health Information
}

export interface ClassifiedData<T> {
  data: T;
  classification: DataClassification;
  accessControls: string[];
  auditRequired: boolean;
}
```

---

## Health Check and System Monitoring

### Backend Health Check

```motoko
public query func healthCheck(): async Text
```

**Frontend Integration:**
```typescript
const performHealthCheck = async (): Promise<boolean> => {
  try {
    const health = await backend.healthCheck();
    return health.includes('TrustCareConnect backend is running');
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// System Status Component
export const SystemStatus: React.FC = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await performHealthCheck();
      setIsHealthy(healthy);
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`system-status ${isHealthy ? 'healthy' : 'unhealthy'}`}>
      <span>System Status: {isHealthy === null ? 'Checking...' : isHealthy ? 'Healthy' : 'Unhealthy'}</span>
    </div>
  );
};
```

---

## Rate Limiting and Performance

### Frontend Rate Limiting

```typescript
// src/utils/rateLimiting.ts
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(endpoint: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Usage in API calls
export const rateLimitedApiCall = async (endpoint: string, apiCall: () => Promise<any>) => {
  if (!rateLimiter.canMakeRequest(endpoint, 10, 60000)) { // 10 requests per minute
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  return await apiCall();
};
```

---

## Testing API Integration

### Unit Testing Backend Calls

```typescript
// src/__tests__/api/backend.test.ts
import { backend } from '../../declarations/backend';

describe('Backend API Integration', () => {
  test('should register patient successfully', async () => {
    const result = await backend.registerPatient(
      'Test Patient',
      'Hypertension',
      'test@example.com'
    );
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  
  test('should handle patient not found', async () => {
    const result = await backend.getPatient('nonexistent-id');
    expect(result).toEqual([]);
  });
});
```

### Integration Testing

```typescript
// src/__tests__/integration/healthcare-workflow.test.ts
describe('Healthcare Workflow Integration', () => {
  test('complete patient registration and query submission', async () => {
    // Register patient
    const patientId = await backend.registerPatient(
      'Integration Test Patient',
      'Test Condition',
      'integration@test.com'
    );
    
    // Submit query
    const queryResult = await backend.submitQuery(
      patientId,
      'Test Query',
      'This is a test medical query'
    );
    
    expect('ok' in queryResult).toBe(true);
    
    // Verify query was created
    if ('ok' in queryResult) {
      const query = await backend.getQuery(queryResult.ok);
      expect(query).toBeDefined();
      expect(query[0]?.title).toBe('Test Query');
    }
  });
});
```

This comprehensive API documentation provides developers with all the information needed to integrate with the TrustCareConnect healthcare platform, ensuring secure and compliant healthcare data management.