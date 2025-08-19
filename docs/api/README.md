# TrustCareConnect API Documentation

Welcome to the TrustCareConnect API documentation. This guide covers all API endpoints and integration details for the healthcare platform.

## Overview

TrustCareConnect provides a comprehensive healthcare platform with three main API layers:

- **ICP Backend API** - Core healthcare data management on Internet Computer
- **AI Proxy API** - AI-powered medical query processing  
- **Frontend Integration** - React application with TypeScript support

## Quick Start

### Base URLs

- **Production**: `https://api.trustcareconnect.com`
- **Staging**: `https://staging-api.trustcareconnect.com`
- **Development**: `http://localhost:3001`

### Authentication

TrustCareConnect uses role-based authentication with ICP Principal IDs:

```typescript
// Patient authentication
const patientPrincipal = "2vxsx-fae";

// Doctor authentication  
const doctorPrincipal = "rdmx6-jaaaa-aaaah-qcaiq-cai";
```

## API Reference

### AI Proxy Endpoints

#### Health Check
```http
GET /api/health
```

Returns the health status of the AI Proxy service.

**Response**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-19T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### Process Medical Query
```http
POST /api/query
```

Processes a medical query using AI providers (OpenAI or Claude).

**Request Body**
```json
{
  "queryText": "What are the symptoms of type 2 diabetes?",
  "condition": "diabetes",
  "provider": "openai"
}
```

**Parameters**
- `queryText` (string, required) - The medical question to process
- `condition` (string, optional) - Related medical condition 
- `provider` (string, optional) - AI provider ("openai" or "claude", defaults to "openai")

**Response**
```json
{
  "success": true,
  "data": {
    "response": "Type 2 diabetes symptoms include increased thirst, frequent urination...",
    "provider": "openai",
    "processingTime": 1250,
    "timestamp": "2025-01-19T10:30:00.000Z"
  }
}
```

**Error Response**
```json
{
  "success": false,
  "error": "AI_PROVIDER_ERROR",
  "message": "Failed to process query with AI provider",
  "details": {
    "provider": "openai",
    "errorCode": "insufficient_quota"
  }
}
```

#### Query with Fallback
```http
POST /api/query/fallback
```

Processes a query with automatic fallback between AI providers.

**Request Body**
```json
{
  "queryText": "Explain hypertension treatment options",
  "condition": "hypertension",
  "preferredProvider": "claude"
}
```

#### Log Collection
```http
POST /api/logs
```

Collects logs from frontend applications (internal endpoint).

**Request Body**
```json
{
  "logs": [
    {
      "level": "error",
      "message": "API request failed",
      "timestamp": "2025-01-19T10:30:00.000Z",
      "metadata": {
        "endpoint": "/api/query",
        "status": 500
      }
    }
  ],
  "source": "frontend",
  "application": "trustcareconnect"
}
```

### ICP Backend Endpoints

The ICP backend provides core healthcare data management functions.

#### Patient Management

##### Register Patient
```motoko
registerPatient(patientData: PatientData) : async Result<PatientId, Text>
```

**Parameters**
```motoko
type PatientData = {
  name: Text;
  email: Text;
  dateOfBirth: Text;
  gender: Text;
  contactInfo: ContactInfo;
};
```

##### Get Patient
```motoko
getPatient(patientId: PatientId) : async ?Patient
```

##### Update Patient
```motoko  
updatePatient(patientId: PatientId, updates: PatientData) : async Result<(), Text>
```

#### Doctor Management

##### Register Doctor
```motoko
registerDoctor(doctorData: DoctorData) : async Result<DoctorId, Text>
```

##### Get Doctor
```motoko
getDoctor(doctorId: DoctorId) : async ?Doctor
```

##### Assign Patient to Doctor
```motoko
assignPatientToDoctor(patientId: PatientId, doctorId: DoctorId) : async Result<(), Text>
```

#### Query Management

##### Submit Query
```motoko
submitQuery(queryData: QueryData) : async Result<QueryId, Text>
```

**Parameters**
```motoko
type QueryData = {
  patientId: PatientId;
  queryText: Text;
  category: Text;
  urgency: UrgencyLevel;
};
```

##### Get Query
```motoko
getQuery(queryId: QueryId) : async ?Query
```

##### Respond to Query
```motoko
respondToQuery(queryId: QueryId, doctorId: DoctorId, response: Text) : async Result<(), Text>
```

#### Health Check
```motoko
healthCheck() : async Result<Text, Text>
```

### Rate Limiting

All API endpoints are rate-limited to ensure fair usage:

- **Default**: 100 requests per 15 minutes per IP
- **AI Query endpoints**: 20 requests per minute per IP
- **Log endpoints**: 100 entries per minute per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1642678800
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request validation failed |
| `AUTHENTICATION_REQUIRED` | Valid authentication required |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `AI_PROVIDER_ERROR` | AI service unavailable |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

### Response Format

All API responses follow a consistent format:

**Success Response**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

**Error Response**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": { ... },
  "timestamp": "2025-01-19T10:30:00.000Z"
}
```

## SDKs and Integration

### JavaScript/TypeScript SDK

```bash
npm install @trustcareconnect/api-client
```

```typescript
import { TrustCareConnectClient } from '@trustcareconnect/api-client';

const client = new TrustCareConnectClient({
  baseUrl: 'https://api.trustcareconnect.com',
  canisterId: 'your-canister-id'
});

// Submit medical query
const result = await client.query.submit({
  queryText: "What causes headaches?",
  condition: "headache"
});
```

### Python SDK

```bash
pip install trustcareconnect-api
```

```python
from trustcareconnect import TrustCareConnectClient

client = TrustCareConnectClient(
    base_url="https://api.trustcareconnect.com",
    canister_id="your-canister-id"
)

# Submit query
result = client.query.submit(
    query_text="What are diabetes symptoms?",
    condition="diabetes"
)
```

## Webhooks

TrustCareConnect supports webhooks for real-time notifications:

### Query Response Webhook
```http
POST https://your-app.com/webhooks/query-response
```

**Payload**
```json
{
  "event": "query.responded",
  "timestamp": "2025-01-19T10:30:00.000Z",
  "data": {
    "queryId": "query-123",
    "patientId": "patient-456", 
    "doctorId": "doctor-789",
    "response": "Based on your symptoms..."
  }
}
```

## Testing

### Testing Environment

Use our staging environment for testing:

- **Base URL**: `https://staging-api.trustcareconnect.com`
- **Test Canister ID**: `rdmx6-jaaaa-aaaah-qcaiq-cai`

### Example Requests

#### Test AI Query
```bash
curl -X POST https://staging-api.trustcareconnect.com/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "queryText": "What is hypertension?",
    "condition": "blood pressure",
    "provider": "openai"
  }'
```

#### Test Health Check
```bash
curl https://staging-api.trustcareconnect.com/api/health
```

## Monitoring and Observability

### Health Endpoints

- `GET /api/health` - Service health check
- `GET /api/logs/health` - Log collection health
- `GET /api/metrics` - Prometheus metrics (production)

### Logging

All API requests are logged with structured data:

```json
{
  "timestamp": "2025-01-19T10:30:00.000Z",
  "level": "info",
  "message": "API Request",
  "method": "POST",
  "url": "/api/query",
  "status": 200,
  "responseTime": "1250ms",
  "userAgent": "TrustCareConnect/1.0",
  "ip": "192.168.1.100"
}
```

## Security

### HTTPS Only
All production endpoints require HTTPS connections.

### CORS Policy
```javascript
// Allowed origins
const allowedOrigins = [
  'https://trustcareconnect.com',
  'https://app.trustcareconnect.com'
];
```

### Content Security Policy
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

## Support

- **Documentation**: [https://docs.trustcareconnect.com](https://docs.trustcareconnect.com)
- **Status Page**: [https://status.trustcareconnect.com](https://status.trustcareconnect.com)  
- **Support Email**: [support@trustcareconnect.com](mailto:support@trustcareconnect.com)
- **GitHub Issues**: [https://github.com/musyokapatrickmutuku/trustcareconnect/issues](https://github.com/musyokapatrickmutuku/trustcareconnect/issues)