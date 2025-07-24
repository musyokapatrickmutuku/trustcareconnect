# Deepseek LLM Integration Setup Guide

## Overview
This implementation integrates the Deepseek R1 model via Novita AI API with your ICP medical assistant.

## Configuration Required

### 1. API Key Setup
Replace the placeholder API key in `src/assist_backend/main.mo`:

```motoko
private let API_KEY = "YOUR_API_KEY_HERE"; // Line 97
```

**Replace with your actual Novita AI API key**

### 2. Deployment Commands

```bash
# Start local ICP network
dfx start --background

# Deploy with cycles for HTTP outcalls
dfx deploy --with-cycles 1000000000000

# Or deploy individual canister with cycles
dfx canister create assist_backend --with-cycles 1000000000000
dfx build
dfx canister install assist_backend --mode upgrade
```

### 3. Testing the Integration

1. **Open demo.html** in your browser
2. **Select Patient Portal** 
3. **Choose a patient** (e.g., Sarah Johnson)
4. **Submit a test query** like:
   - "My blood sugar reading is 250 mg/dL this morning, what should I do?"
   - "I'm feeling dizzy and think my blood sugar might be low"

### 4. Expected Behavior

**Before Integration (Mock):**
- Predefined responses based on keyword matching
- Instant responses

**After Integration (LLM):**
- Real AI responses from Deepseek R1 model
- Processing delay (2-5 seconds)
- Personalized responses based on patient profile
- Fallback to safe default if API fails

## API Request Format

The system sends this to Deepseek:

```json
{
  "model": "deepseek/deepseek-r1-0528",
  "messages": [
    {
      "role": "system",
      "content": "You are a medical AI assistant specializing in diabetes care..."
    },
    {
      "role": "user", 
      "content": "Patient Profile: Sarah Johnson, Age: 47, Diabetes Type: Type 2, HbA1c: 6.9%, Current Medications: Metformin 1000mg BID, Lisinopril 15mg daily, Empagliflozin 10mg daily\n\nPatient Query: My blood sugar is high at 250\n\nPlease provide safe, evidence-based medical guidance..."
    }
  ],
  "max_tokens": 500,
  "temperature": 0.3
}
```

## Error Handling

The system includes robust error handling:

1. **API Failures** → Fallback to safe default response
2. **Network Issues** → Error logged, fallback response
3. **JSON Parsing Errors** → Safe default response
4. **Cycles Exhaustion** → Error logged

## Cost Management

- Each HTTP outcall costs ~2M cycles
- Deployed with 1T cycles = ~500,000 API calls
- Monitor cycles: `dfx canister status assist_backend`

## Verification Steps

1. **Check API Key** is properly set (line 97 in main.mo)
2. **Deploy with Cycles** using the commands above
3. **Test Query** via demo.html
4. **Check Logs** in dfx terminal for any errors
5. **Verify Response** comes from LLM (should be different from mock responses)

## Troubleshooting

**Common Issues:**
- "Insufficient cycles" → Redeploy with more cycles
- "API key invalid" → Check your Novita AI API key
- "Network error" → Check internet connection
- "JSON parsing failed" → Response format changed (check parseDeepseekResponse function)

**Debug Commands:**
```bash
# Check canister status and cycles
dfx canister status assist_backend

# View logs
dfx logs assist_backend

# Check if HTTP outcalls are enabled
dfx info
```

## Next Steps for Production

1. **Proper JSON Parsing** - Replace basic string parsing with robust JSON library
2. **Rate Limiting** - Add request throttling
3. **Caching** - Cache responses for identical queries
4. **Monitoring** - Add usage analytics
5. **Security** - Move API key to environment variables