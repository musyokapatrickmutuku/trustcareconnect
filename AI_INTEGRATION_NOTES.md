# AI Integration Documentation

## Overview
TrustCareConnect now integrates AI responses into the doctor workflow. When patients submit queries, the backend automatically generates an AI draft response that doctors can review, edit, and approve.

## Backend Changes

### Data Structure Updates
- **MedicalQuery** type now includes `aiDraftResponse: ?Text` field
- Stores AI-generated draft responses alongside patient queries

### New AI Proxy Integration
- Added HTTP outcall capability to call the AI proxy server
- `getAIDraftResponse()` function calls `http://localhost:3001/api/query`
- Automatically triggered when patients submit queries via `submitQuery()`

### Backend Implementation Details
- **File**: `src/backend/main.mo`
- **Key Functions**:
  - `getAIDraftResponse()`: Calls AI proxy with patient query and condition
  - `submitQuery()`: Now includes AI draft generation
  - All query update functions preserve `aiDraftResponse` field

## Frontend Changes

### Doctor Workflow Enhancement  
- **File**: `src/frontend/src/App.jsx`
- **New Features**:
  - Displays AI draft responses in "Under Review" queries
  - "Use AI Draft" button to populate response textarea
  - Visual separation between AI draft and doctor's final response

### UI Components
- AI draft displayed in styled container with 🤖 emoji
- "Use AI Draft" button copies AI response to textarea
- Doctors can edit AI draft or write completely new responses

## AI Proxy Integration Points

### Automatic Backend Calls
1. **Patient Query Submission**:
   - `submitQuery()` → `getAIDraftResponse()` → AI Proxy
   - Request: `POST /api/query` with `{queryText, condition, provider: "mock"}`
   - AI draft stored in `MedicalQuery.aiDraftResponse`

### Frontend AI Workflow
1. **Doctor Reviews Query**: AI draft automatically visible
2. **Doctor Options**:
   - Use AI draft as-is (click "Use AI Draft")  
   - Edit AI draft before submitting
   - Write completely new response
3. **Final Submission**: Doctor's response stored in `MedicalQuery.response`

## Configuration Notes

### AI Proxy Server
- **URL**: `http://localhost:3001/api/query`
- **Provider**: Currently set to "mock" for testing
- **Timeout**: 2048 bytes max response
- **Fallback**: Returns `null` if AI proxy fails

### HTTP Outcalls
- Uses ICP's `http_request` capability  
- Cycles cost: 20,949,972,000 per request
- Simple JSON parsing (production should use proper JSON library)

## Testing the Integration

### Prerequisites
1. AI proxy server running on port 3001
2. ICP backend deployed with HTTP outcalls enabled
3. Frontend connected to backend

### Test Flow
1. Register patient and doctor
2. Doctor assigns patient to their care  
3. Patient submits query
4. Doctor sees query with AI draft in "Under Review" section
5. Doctor can use/edit AI draft before submitting final response

## Production Considerations

### Security
- Validate AI proxy responses
- Sanitize all input/output text
- Consider rate limiting AI calls

### Error Handling  
- Graceful fallback if AI proxy unavailable
- Log AI proxy failures for monitoring
- Don't block query submission if AI fails

### Performance
- Consider caching AI responses
- Monitor cycles usage for HTTP outcalls
- Async AI generation to avoid blocking

## Next Steps

### Potential Enhancements
1. **Real AI APIs**: Switch from mock to OpenAI/Claude  
2. **AI Provider Selection**: Let doctors choose AI provider
3. **Response Quality Scoring**: Rate AI draft usefulness
4. **Conversation History**: Include previous exchanges in AI context
5. **Specialized Prompts**: Condition-specific AI prompting

### Code Locations
- **Backend**: `src/backend/main.mo` (lines 126-185, 366-400)  
- **Frontend**: `src/frontend/src/App.jsx` (lines 653-688)
- **Styles**: `src/frontend/src/main.css` (lines 422-479)
- **AI Proxy**: `ai-proxy/ai-proxy.js` (fully functional)

## Integration Summary

The AI integration maintains the core doctor-patient workflow while enhancing it with AI assistance:

1. **Patient submits query** → AI draft auto-generated
2. **Doctor reviews query + AI draft** → Can edit or approve  
3. **Doctor submits final response** → Human oversight maintained

This approach ensures AI assists doctors rather than replacing them, maintaining the medical supervision required in healthcare applications.