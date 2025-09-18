# TrustCare Bridge - WebSocket Service

A high-performance WebSocket bridge service that connects TrustCareConnect's frontend with Novita AI and ICP blockchain infrastructure for real-time medical query processing.

## 🚀 Features

- **Real-time WebSocket Communication**: Instant bidirectional communication between frontend and backend
- **Novita AI Integration**: Direct integration with Baichuan-M2-32B medical AI model
- **ICP Blockchain Updates**: Automatic updates to Internet Computer Protocol canisters
- **Rate Limiting**: Built-in protection against abuse and overuse
- **Health Monitoring**: Comprehensive health checks and monitoring endpoints
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Production Ready**: Nginx reverse proxy, Redis caching, and robust error handling

## 📋 Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- Access to Novita AI API
- Running ICP canister with TrustCareConnect backend

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

```env
# Novita AI Configuration
NOVITA_API_KEY=your_novita_api_key_here

# ICP Configuration
ICP_CANISTER_ID=uxrrr-q7777-77774-qaaaq-cai
ICP_HOST=http://localhost:4943
```

### Optional Variables

```env
# Server Configuration
PORT=8080                    # HTTP server port
WS_PORT=8081                # WebSocket server port
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGINS=http://localhost:3000,http://localhost:4943

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10   # 10 requests per window

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000  # 30 seconds
MAX_CONCURRENT_CONNECTIONS=1000
```

## 🛠️ Installation & Setup

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Test the service:**
```bash
curl http://localhost:8080/health
```

### Docker Deployment

1. **Build and start services:**
```bash
npm run docker:build
npm run docker:up
```

2. **View logs:**
```bash
docker-compose logs -f trustcare-bridge
```

3. **Stop services:**
```bash
npm run docker:down
```

## 🔌 WebSocket API

### Connection

Connect to WebSocket endpoint:
```javascript
const ws = new WebSocket('ws://localhost:8081');
```

### Message Format

All messages follow this JSON structure:
```json
{
  "type": "message_type",
  "payload": { ... },
  "requestId": "optional-request-id",
  "timestamp": 1234567890
}
```

### Available Message Types

#### 1. Medical Query Processing

**Send:**
```json
{
  "type": "medical_query",
  "payload": {
    "patientId": "P001",
    "query": "I have been feeling tired and my blood sugar is high",
    "vitalSigns": {
      "bloodGlucose": 180,
      "bloodPressure": "140/90",
      "heartRate": 85,
      "temperature": 37.2
    },
    "context": {
      "diabetesType": "Type 2",
      "hba1c": 6.9,
      "medications": ["Metformin", "Empagliflozin"],
      "allergies": []
    }
  },
  "requestId": "query-123"
}
```

**Receive Status Updates:**
```json
{
  "type": "query_status",
  "payload": {
    "status": "processing",
    "message": "Processing your medical query with AI..."
  },
  "requestId": "query-123"
}
```

**Receive Final Response:**
```json
{
  "type": "medical_response",
  "payload": {
    "queryId": "uuid-here",
    "content": "1. Monitor your blood glucose levels more frequently...",
    "safetyScore": 65,
    "urgency": "MEDIUM",
    "requiresReview": true,
    "timestamp": 1234567890
  },
  "requestId": "query-123"
}
```

#### 2. Query Status Check

**Send:**
```json
{
  "type": "query_status",
  "payload": {
    "queryId": "uuid-here"
  },
  "requestId": "status-check-1"
}
```

**Receive:**
```json
{
  "type": "query_status_response",
  "payload": {
    "queryId": "uuid-here",
    "status": "completed",
    "timestamp": 1234567890
  },
  "requestId": "status-check-1"
}
```

#### 3. Ping/Pong (Connection Test)

**Send:**
```json
{
  "type": "ping"
}
```

**Receive:**
```json
{
  "type": "pong",
  "payload": {
    "timestamp": 1234567890
  }
}
```

### Error Handling

Errors are sent with this format:
```json
{
  "type": "error",
  "payload": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": 1234567890
  },
  "requestId": "original-request-id"
}
```

Common error codes:
- `INVALID_PAYLOAD`: Missing or invalid message data
- `QUERY_PROCESSING_ERROR`: Error during AI processing or ICP update
- `RATE_LIMITED`: Too many requests from client
- `MESSAGE_PROCESSING_ERROR`: General message handling error

## 🏥 Integration Example

### Frontend Integration

```javascript
class TrustCareBridge {
  constructor(wsUrl = 'ws://localhost:8081') {
    this.ws = new WebSocket(wsUrl);
    this.requestCallbacks = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('🔌 Connected to TrustCare Bridge');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('📴 Disconnected from TrustCare Bridge');
      // Implement reconnection logic
    };
  }

  async submitMedicalQuery(queryData) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId();

      this.requestCallbacks.set(requestId, { resolve, reject });

      this.send({
        type: 'medical_query',
        payload: queryData,
        requestId
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.requestCallbacks.has(requestId)) {
          this.requestCallbacks.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  handleMessage(message) {
    const { type, payload, requestId } = message;

    if (requestId && this.requestCallbacks.has(requestId)) {
      const { resolve, reject } = this.requestCallbacks.get(requestId);
      this.requestCallbacks.delete(requestId);

      if (type === 'error') {
        reject(new Error(payload.message));
      } else if (type === 'medical_response') {
        resolve(payload);
      }
    } else if (type === 'query_status') {
      // Handle status updates
      this.onStatusUpdate?.(payload);
    }
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  generateRequestId() {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Usage
const bridge = new TrustCareBridge();

bridge.onStatusUpdate = (status) => {
  console.log('Query status:', status.message);
};

const response = await bridge.submitMedicalQuery({
  patientId: 'P001',
  query: 'I feel dizzy and my blood sugar is low',
  vitalSigns: { bloodGlucose: 65 }
});

console.log('AI Response:', response);
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "connections": 5,
  "uptime": 3600
}
```

### WebSocket Info Endpoint

```bash
curl http://localhost:8080/ws-info
```

Response:
```json
{
  "wsPort": 8081,
  "protocol": "ws",
  "endpoint": "/ws"
}
```

## 🔒 Security Features

- **Rate Limiting**: 10 requests per 15 minutes per IP
- **Input Validation**: Comprehensive validation of all message payloads
- **CORS Protection**: Configurable CORS origins
- **Connection Limits**: Maximum concurrent connections limit
- **Error Sanitization**: No sensitive data leaked in error messages

## 🐛 Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: connect ECONNREFUSED
```
- Check if the bridge service is running
- Verify the correct port configuration
- Ensure Docker containers are up

**2. ICP Canister Connection Failed**
```
Error: ICP canister unavailable
```
- Verify `ICP_CANISTER_ID` is correct
- Check if local DFX replica is running
- Ensure canister is deployed and accessible

**3. Novita AI API Errors**
```
Error: Invalid API key or authentication failed
```
- Verify `NOVITA_API_KEY` is valid
- Check API key permissions
- Monitor API usage limits

**4. Rate Limiting**
```
Error: Rate limit exceeded
```
- Reduce request frequency
- Check rate limit configuration
- Implement proper request queuing

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

### Container Logs

View detailed logs:
```bash
docker-compose logs -f trustcare-bridge
docker-compose logs -f redis
docker-compose logs -f nginx
```

## 📈 Performance Tuning

### WebSocket Optimization

- **Heartbeat Interval**: Adjust `WS_HEARTBEAT_INTERVAL` based on network conditions
- **Connection Pool**: Monitor `MAX_CONCURRENT_CONNECTIONS` usage
- **Buffer Sizes**: Tune message buffer sizes for your payload sizes

### Rate Limiting Adjustment

```env
# For high-volume production
RATE_LIMIT_WINDOW_MS=300000    # 5 minutes
RATE_LIMIT_MAX_REQUESTS=50     # 50 requests per window
```

### Redis Configuration

For production, use persistent Redis:
```yaml
# In docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## 🚀 Deployment

### Production Deployment

1. **Set production environment:**
```env
NODE_ENV=production
LOG_LEVEL=warn
```

2. **Use secure configurations:**
- Enable HTTPS with proper SSL certificates
- Use strong JWT secrets
- Configure Redis password
- Set up proper CORS origins

3. **Deploy with Docker Compose:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Scaling

For high-load scenarios:
1. Use multiple bridge service instances behind load balancer
2. Implement Redis for session storage across instances
3. Use horizontal pod autoscaling in Kubernetes

## 📝 API Documentation

Full API documentation is available in the OpenAPI specification format. See the main TrustCareConnect documentation for complete details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review logs for detailed error messages

---

**🏥 TrustCareConnect** - Empowering diabetes care through AI and blockchain technology.