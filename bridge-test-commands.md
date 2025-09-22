# 🧪 TrustCare Bridge Test Commands

Once the bridge service is running, use these commands to test functionality:

## 🔌 WebSocket Connection Test
```bash
# Connect to WebSocket
wscat -c ws://localhost:8080

# You should see connection confirmation:
# Connected (press CTRL+C to quit)
# {"type":"connection_established","payload":{"connectionId":"...","serverTime":"...","features":["medical_query","get_history","doctor_review","real_time_updates"]}}
```

## 🩺 Medical Query Test
```json
{
  "type": "medical_query",
  "payload": {
    "patientId": "P001",
    "query": "I feel dizzy and my blood sugar is low",
    "vitalSigns": {
      "bloodGlucose": 65
    }
  },
  "requestId": "test-123"
}
```

**Expected Response:**
```json
{
  "type": "medical_response",
  "payload": {
    "queryId": "...",
    "content": "AI medical guidance response...",
    "safetyScore": 30,
    "urgency": "HIGH",
    "requiresReview": true,
    "timestamp": 1726599123456,
    "processingTime": 2500
  },
  "requestId": "test-123"
}
```

## 🏥 Health Check Test
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-17T19:10:00.000Z",
  "connections": {
    "total": 1,
    "active": 1
  },
  "services": {
    "websocket": "running",
    "novitaApi": "healthy",
    "icpCanister": "healthy"
  },
  "uptime": 120.5
}
```

## 📊 Metrics Test
```bash
curl http://localhost:3001/metrics/json
```

**Expected Response:**
```json
{
  "connections": {
    "total": 1,
    "active": 1
  },
  "queue": {
    "totalQueued": 0,
    "processing": 0
  },
  "uptime": 120500,
  "memory": {
    "rss": 45678976,
    "heapTotal": 23456789,
    "heapUsed": 12345678
  }
}
```

## 🔗 WebSocket Info
```bash
curl http://localhost:3001/ws-info
```

**Expected Response:**
```json
{
  "wsPort": 8080,
  "protocols": ["ws", "wss"],
  "endpoint": "/ws",
  "maxConnections": 1000,
  "heartbeatInterval": 30000
}
```

## 🏗️ ICP Canister Test
```bash
dfx canister call backend getBridgeStatus '("test-query-id")'
```

**Expected Response:**
```
(variant { ok = record { status = "active"; timestamp = 1726599123456; } })
```

## 🌐 Alternative HTTP Test
```bash
# REST API fallback test
curl -X POST http://localhost:3001/api/medical-query \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "query": "I feel dizzy",
    "vitalSigns": {
      "bloodGlucose": 65
    }
  }'
```

## 🚀 Quick Start Commands
```bash
# Start bridge service
cd trustcare-bridge && npm run dev

# In another terminal, test WebSocket
wscat -c ws://localhost:8080

# In another terminal, test health
curl http://localhost:3001/health
```

---

## ⚡ Status Indicators

### ✅ Healthy Bridge:
- WebSocket accepts connections on port 8080
- HTTP responds on port 3001
- Health check returns "healthy" status
- Metrics show active connections

### ❌ Issues to Check:
- Dependencies not installed: `npm install`
- Missing API key: Check `.env` file
- Port conflicts: `lsof -i :8080` and `lsof -i :3001`
- ICP canister not running: `dfx start --background && dfx deploy`