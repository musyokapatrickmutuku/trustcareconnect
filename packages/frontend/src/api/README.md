# TrustCareConnect API Layer

This directory contains the comprehensive API layer for connecting to the TrustCareConnect Motoko backend canister on the Internet Computer Protocol (ICP).

## Architecture Overview

```
src/api/
├── index.js                 # Main module exports
├── trustcare.js            # High-level TrustCare API interface
├── integration-example.js  # Usage examples and patterns
└── README.md              # This documentation

src/services/
└── api.js                 # Low-level ICP HttpAgent service
```

## Quick Start

### Basic Usage

```javascript
import trustCareAPI from '../api/trustcare';

// Register a new patient
const result = await trustCareAPI.registerPatient('John Doe', 'Type 2 Diabetes', 'john@example.com');

if (result.success) {
  console.log('Patient registered with ID:', result.data);
} else {
  console.error('Registration failed:', result.error);
}
```

### Environment Configuration

Ensure your `.env.local` file is configured:

```env
# Backend canister configuration
REACT_APP_BACKEND_CANISTER_ID=your-canister-id-here
REACT_APP_IC_HOST=http://localhost:4943

# Feature flags
REACT_APP_ENABLE_CLINICAL_FEATURES=true
REACT_APP_DEBUG_MODE=true
```

## API Reference

### System Operations

```javascript
// Health check
const health = await trustCareAPI.healthCheck();

// Get system statistics
const stats = await trustCareAPI.getSystemStats();

// Test connection
const connectionTest = await trustCareAPI.testConnection();
```

### Patient Management

```javascript
// Register patient
const registration = await trustCareAPI.registerPatient(name, condition, email);

// Find patient by email
const patient = await trustCareAPI.findPatientByEmail(email);

// Get patient by ID
const patient = await trustCareAPI.getPatient(patientId);

// Get unassigned patients (for doctors)
const patients = await trustCareAPI.getUnassignedPatients();
```

### Doctor Management

```javascript
// Register doctor
const registration = await trustCareAPI.registerDoctor(name, specialization);

// Get doctor by ID
const doctor = await trustCareAPI.getDoctor(doctorId);

// Get all doctors
const doctors = await trustCareAPI.getAllDoctors();

// Get doctor's assigned patients
const patients = await trustCareAPI.getDoctorPatients(doctorId);
```

### Query Management

```javascript
// Submit patient query (includes AI processing)
const queryId = await trustCareAPI.submitQuery(patientId, title, description);

// Get patient's queries
const queries = await trustCareAPI.getPatientQueries(patientId);

// Get pending queries (for doctors)
const pendingQueries = await trustCareAPI.getPendingQueries();

// Doctor takes a query
const result = await trustCareAPI.takeQuery(queryId, doctorId);

// Doctor responds to query
const result = await trustCareAPI.respondToQuery(queryId, doctorId, response);
```

### Batch Operations

```javascript
// Load complete dashboard data for a doctor
const dashboardData = await trustCareAPI.getDoctorDashboardData(doctorId);

// Load complete portal data for a patient
const portalData = await trustCareAPI.getPatientPortalData(patientId);
```

## Error Handling

All API methods return a standardized response format:

```javascript
{
  success: boolean,
  data?: any,        // Present on success
  error?: string     // Present on failure
}
```

### Example Error Handling

```javascript
async function handlePatientLogin(email) {
  try {
    const result = await trustCareAPI.findPatientByEmail(email);
    
    if (result.success && result.data) {
      // Patient found - proceed with login
      setCurrentUser(result.data);
    } else if (result.success && !result.data) {
      // Patient not found
      setError('Patient not found. Please register first.');
    } else {
      // API error
      setError(result.error);
    }
  } catch (error) {
    // Network/connection error
    setError('Connection error. Please try again.');
  }
}
```

## React Integration Patterns

### Using with React State

```javascript
import React, { useState, useEffect } from 'react';
import trustCareAPI from '../api/trustcare';

function PatientDashboard({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const portalData = await trustCareAPI.getPatientPortalData(patientId);
        
        if (portalData.success) {
          setPatient(portalData.data.patient?.data);
          setQueries(portalData.data.queries?.data || []);
        } else {
          setError(portalData.error);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      loadData();
    }
  }, [patientId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {patient?.name}</h1>
      <p>Condition: {patient?.condition}</p>
      <h2>Your Queries</h2>
      {queries.map(query => (
        <div key={query.id}>
          <h3>{query.title}</h3>
          <p>{query.description}</p>
          <p>Status: {query.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Custom Hooks

```javascript
import { useState, useEffect } from 'react';
import trustCareAPI from '../api/trustcare';

export function useSystemHealth() {
  const [health, setHealth] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const checkHealth = async () => {
    const result = await trustCareAPI.healthCheck();
    setHealth(result);
    setLastCheck(new Date());
    return result;
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return { health, lastCheck, checkHealth };
}
```

## Connection Management

### Automatic Reconnection

The API layer includes automatic reconnection logic:

```javascript
// The service will automatically retry failed connections
// Manual reconnection can be triggered:
const reconnect = await trustCareAPI.reconnect();

// Get connection status information
const connectionInfo = trustCareAPI.getConnectionInfo();
```

### Development vs Production

The API automatically configures itself based on environment:

- **Development**: Uses local replica at `http://localhost:4943`
- **Production**: Uses ICP mainnet at `https://icp-api.io`

## Debugging

Enable debug mode in your environment:

```env
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug
```

This will provide detailed logging of all API operations in the browser console.

## Clinical Features Integration

The API layer is designed to work seamlessly with the clinical decision support features:

```javascript
// Submit query with clinical processing
const queryResult = await trustCareAPI.submitQuery(
  patientId,
  'High blood sugar levels',
  'I have been experiencing consistently high blood sugar readings...'
);

// The backend will automatically generate AI clinical decision support
// which can be accessed through the query response
```

## Migration from Existing icpService

If you're migrating from the existing `icpService.ts`, the new API provides the same interface with enhanced features:

```javascript
// Old way
import icpService from '../services/icpService';

// New way (drop-in replacement)
import trustCareAPI from '../api/trustcare';

// All method signatures remain the same
const result = await trustCareAPI.registerPatient(name, condition, email);
```

## Advanced Usage

### Batch Operations with Error Handling

```javascript
async function loadDoctorDashboard(doctorId) {
  const result = await trustCareAPI.getDoctorDashboardData(doctorId);
  
  if (result.success) {
    // All data loaded successfully
    const { doctor, patients, queries, pendingQueries, stats } = result.data;
    
    // Check for partial failures
    if (result.errors.length > 0) {
      console.warn('Some data failed to load:', result.errors);
      // Handle partial failures gracefully
    }
  } else {
    // Complete failure
    console.error('Dashboard load failed:', result.error);
  }
}
```

### Custom Timeout and Retry Logic

```javascript
// Query submission with extended timeout for AI processing
const result = await trustCareAPI.service.callCanisterMethod('submitQuery', 
  [patientId, title, description], 
  { timeout: 60000, retries: 3 }
);
```

## Support

For issues with the API layer:

1. Check the browser console for detailed error logs (with debug mode enabled)
2. Verify your environment configuration in `.env.local`
3. Test the connection using `trustCareAPI.testConnection()`
4. Check the ICP replica is running (for development)