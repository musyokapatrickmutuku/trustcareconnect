# TrustCareConnect AI Proxy Server

A lightweight Express.js server that acts as a proxy between the TrustCareConnect frontend and AI services (OpenAI, Claude) for generating medical query responses.

## 🚀 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager

### Installation

1. **Navigate to the AI proxy directory:**
   ```bash
   cd ai-proxy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file with your API keys (optional for testing)
   nano .env  # or use any text editor
   ```

4. **Start the server:**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

The server will start on `http://localhost:3001`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `ai-proxy` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# API Keys (optional - server works with mock responses)
OPENAI_API_KEY=your-openai-key-here
CLAUDE_API_KEY=your-claude-key-here
```

### API Key Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create account and generate API key
3. Add to `.env` file: `OPENAI_API_KEY=sk-...`

#### Claude API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create account and generate API key
3. Add to `.env` file: `CLAUDE_API_KEY=sk-ant-...`

**Note:** The server works perfectly with mock responses if no API keys are provided!

## 📡 API Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "TrustCareConnect AI Proxy",
  "version": "1.0.0"
}
```

### Query AI
```http
POST /api/query
Content-Type: application/json

{
  "queryText": "How often should I check my blood sugar?",
  "condition": "diabetes",
  "provider": "mock"
}
```

**Parameters:**
- `queryText` (required): The medical query from the patient
- `condition` (required): Patient's medical condition 
- `provider` (optional): AI provider - `"mock"`, `"openai"`, or `"claude"` (default: "mock")

**Response:**
```json
{
  "success": true,
  "response": "Based on your diabetes-related query, I recommend maintaining regular blood sugar monitoring...",
  "metadata": {
    "provider": "mock",
    "condition": "diabetes",
    "queryLength": 36,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "responseId": "query_1704110400000_abc123def"
  }
}
```

### Get Available Providers
```http
GET /api/providers
```

**Response:**
```json
{
  "providers": [
    {
      "name": "mock",
      "description": "Mock AI responses for testing",
      "available": true,
      "default": true
    },
    {
      "name": "openai",
      "description": "OpenAI GPT-3.5 Turbo",
      "available": false,
      "model": "gpt-3.5-turbo"
    }
  ]
}
```

## 🧪 Testing the Server

### Using curl

```bash
# Health check
curl http://localhost:3001/api/health

# Test AI query with mock response
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "queryText": "What diet should I follow for diabetes?",
    "condition": "diabetes",
    "provider": "mock"
  }'

# Check available providers
curl http://localhost:3001/api/providers
```

### Using JavaScript/Frontend

```javascript
// Example integration code for frontend
async function queryAI(queryText, condition, provider = 'mock') {
  try {
    const response = await fetch('http://localhost:3001/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryText,
        condition,
        provider
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('AI Response:', data.response);
      return data.response;
    } else {
      console.error('AI Error:', data.error);
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
}

// Usage
queryAI("How often should I exercise?", "diabetes");
```

## 🔒 Security Features

- **CORS Protection**: Configured for localhost origins
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Query and condition parameter validation
- **Input Sanitization**: Limits on input length
- **Helmet.js**: Security headers
- **Error Handling**: Comprehensive error responses

## 📝 Mock Responses

The server provides intelligent mock responses based on medical conditions:

- **Diabetes**: Responses about blood sugar monitoring, diet, medication
- **Hypertension**: Responses about blood pressure management, lifestyle
- **General**: Generic health guidance for other conditions

Mock responses always include disclaimers about consulting healthcare providers.

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your-real-openai-key
CLAUDE_API_KEY=your-real-claude-key
```

### PM2 Deployment
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ai-proxy.js --name "trustcare-ai-proxy"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "ai-proxy.js"]
```

## 🔄 Switching to Real API Keys

1. **Get API keys** from OpenAI and/or Anthropic
2. **Update `.env` file** with real keys
3. **Restart the server** - it will automatically use real APIs
4. **Update frontend** to use `provider: "openai"` or `provider: "claude"`

The server gracefully falls back to mock responses if API calls fail.

## 📊 Monitoring

Server logs include:
- Request processing with provider and condition
- API fallbacks to mock responses
- Error tracking and handling
- Performance metrics

## 🤝 Integration with TrustCareConnect

This proxy is designed to integrate seamlessly with the TrustCareConnect ICP frontend. Doctors can get AI-generated suggestions for patient queries while maintaining the human oversight workflow.

## 🛠️ Troubleshooting

### Common Issues

1. **Port 3001 already in use**
   ```bash
   # Change port in .env file
   PORT=3002
   ```

2. **CORS errors**
   - Check frontend is running on allowed origins
   - Add your frontend URL to CORS configuration

3. **API key errors**
   - Verify API keys in `.env` file
   - Check API key permissions and credits
   - Server will use mock responses as fallback

4. **Module not found errors**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📞 Support

For issues or questions:
1. Check server logs for error messages
2. Test with mock responses first
3. Verify API key configuration
4. Check network connectivity

The AI proxy is designed to be lightweight, reliable, and easy to swap between different AI providers as needed.