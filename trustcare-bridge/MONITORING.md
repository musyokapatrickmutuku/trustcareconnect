# TrustCareConnect Bridge Service - Monitoring Guide

## Overview

This document describes the comprehensive monitoring system implemented for the TrustCareConnect Bridge Service, including metrics collection, alerting, and dashboard configuration.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Bridge Service │───▶│   Prometheus    │───▶│     Grafana     │
│   (Metrics)     │    │   (Storage)     │    │  (Dashboards)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Winston Logs   │    │  Alert Manager  │    │   Slack/Email   │
│   (Files/JSON)  │    │    (Rules)      │    │  (Notifications)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Metrics Collection

### MetricsCollector Class

The `MetricsCollector` class provides comprehensive monitoring capabilities:

#### Core Metrics
- **Total Queries**: Counter tracking all medical queries by status, urgency, and channel
- **Response Time**: Histogram of response times for different endpoints
- **Safety Score Distribution**: Histogram showing distribution of AI safety scores
- **Active Connections**: Gauge of current WebSocket connections
- **Cache Performance**: Hit/miss ratios and cache efficiency

#### API Metrics
- **Request Counts**: Total API requests by endpoint, method, and status code
- **External API Calls**: Tracking calls to Novita AI and ICP services
- **Database Operations**: Query performance and connection pooling

#### System Metrics
- **Memory Usage**: Heap usage, RSS, and external memory
- **CPU Usage**: Process CPU utilization
- **Queue Sizes**: Processing queue depth by type

#### Business Metrics
- **Daily Active Patients**: Unique patients served per day
- **Doctor Reviews**: Review completion rates and status
- **Alert Frequency**: Count of triggered alerts by type and severity

### Prometheus Integration

All metrics are exposed in Prometheus format at `/metrics` endpoint:

```bash
curl http://localhost:3001/metrics
```

Example metrics output:
```
# HELP trustcare_queries_total Total number of medical queries processed
# TYPE trustcare_queries_total counter
trustcare_queries_total{status="completed",urgency="LOW",channel="websocket"} 142

# HELP trustcare_response_time_seconds Response time for medical queries in seconds
# TYPE trustcare_response_time_seconds histogram
trustcare_response_time_seconds_bucket{endpoint="query",method="POST",le="0.1"} 45
trustcare_response_time_seconds_bucket{endpoint="query",method="POST",le="0.5"} 128
```

## Logging System

### Winston Configuration

Structured logging with multiple transports:

#### Log Levels and Files
- **Error**: `logs/error-YYYY-MM-DD.log` (14 days retention)
- **Info**: `logs/info-YYYY-MM-DD.log` (14 days retention)
- **Debug**: `logs/debug-YYYY-MM-DD.log` (7 days retention)
- **Medical**: `logs/medical-YYYY-MM-DD.log` (90 days retention, compliance)

#### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Medical query processed",
  "service": "trustcare-bridge",
  "version": "1.0.0",
  "environment": "production",
  "component": "metrics",
  "action": "record_query",
  "patientId": "hashed_patient_id",
  "safetyScore": 85,
  "urgency": "LOW",
  "duration": 1250
}
```

### Medical Event Logging

Special logging for medical events with patient privacy protection:
- Patient IDs are hashed for privacy
- HIPAA-compliant log retention
- Separate audit trail for compliance

## Alerting System

### Alert Thresholds

The system monitors these critical thresholds:

#### Performance Alerts
- **Response Time**: > 5 seconds (warning)
- **Memory Usage**: > 85% heap (warning)
- **Connection Count**: > 900 connections (warning)
- **Queue Size**: > 50 items (warning)

#### Medical Alerts
- **Low Safety Score**: < 40% (critical)
- **High Failure Rate**: > 5% API failures (warning)
- **Low Cache Hit Ratio**: < 60% (warning)

#### Business Alerts
- **No Queries**: No queries for 30 minutes (warning)
- **Low Daily Patients**: < 10 unique patients (warning)
- **High Query Failures**: > 10% query failures (critical)

### Alert Delivery

Alerts are delivered through multiple channels:

#### Slack Integration
```javascript
// Environment variables
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

#### Email Notifications
```javascript
// Environment variables
ALERT_WEBHOOK_URL=https://your-alerting-service.com/webhook
ALERT_WEBHOOK_TOKEN=your_webhook_token
```

#### Alert Format
```json
{
  "type": "high_response_time",
  "severity": "warning",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "service": "trustcare-bridge",
  "current": 7.5,
  "threshold": 5.0,
  "patientId": "patient_123"
}
```

## Grafana Dashboard

### Dashboard Sections

#### 1. Service Overview
- Service status and uptime
- Active WebSocket connections
- Query processing rate

#### 2. Medical Query Analytics
- Safety score distribution
- Average safety scores over time
- Query volume by urgency level

#### 3. Performance Metrics
- Response time percentiles (P50, P95, P99)
- Cache hit ratios
- Processing queue sizes

#### 4. External API Monitoring
- Novita AI success rates
- ICP service response times
- API error rates

#### 5. System Resources
- Memory usage breakdown
- CPU utilization
- Disk space usage

#### 6. Business Metrics
- Daily active patients
- Doctor review completion rates
- Alert frequency

### Dashboard Import

To import the dashboard into Grafana:

1. Copy the contents of `grafana-dashboard.json`
2. Go to Grafana → Dashboards → Import
3. Paste the JSON configuration
4. Configure the Prometheus data source

## Setup Instructions

### 1. Environment Configuration

```bash
# Monitoring configuration
LOG_LEVEL=info
ALERT_WEBHOOK_URL=https://your-alerting-service.com/webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Alert thresholds (optional, defaults provided)
MAX_RESPONSE_TIME=5000
MIN_SUCCESS_RATE=0.95
MAX_ERROR_RATE=0.05
MAX_ACTIVE_CONNECTIONS=1000
MIN_CACHE_HIT_RATIO=0.8
MAX_MEMORY_USAGE=0.85
```

### 2. Prometheus Configuration

Update `prometheus.yml` with your service endpoints:

```yaml
scrape_configs:
  - job_name: 'trustcare-bridge'
    static_configs:
      - targets: ['trustcare-bridge:3001']
    scrape_interval: 10s
```

### 3. Docker Compose Integration

Add monitoring services to your `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./trustcare_rules.yml:/etc/prometheus/trustcare_rules.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
```

### 4. Log Directory Setup

Create log directories with proper permissions:

```bash
mkdir -p logs
chmod 755 logs
```

## Monitoring Best Practices

### 1. Metric Naming
- Use consistent naming: `trustcare_component_metric_unit`
- Include relevant labels for filtering
- Avoid high-cardinality labels

### 2. Alert Tuning
- Start with conservative thresholds
- Adjust based on baseline performance
- Implement alert fatigue prevention

### 3. Dashboard Design
- Group related metrics together
- Use appropriate visualization types
- Include threshold indicators

### 4. Log Management
- Monitor log file sizes
- Implement log rotation
- Consider centralized logging for production

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check heap usage
curl http://localhost:3001/metrics | grep trustcare_memory_usage_bytes

# Review garbage collection
NODE_ENV=production NODE_OPTIONS="--expose-gc" npm start
```

#### Missing Metrics
```bash
# Verify metrics endpoint
curl http://localhost:3001/metrics

# Check Prometheus targets
curl http://localhost:9090/targets
```

#### Alert Not Firing
```bash
# Check Prometheus rules
curl http://localhost:9090/rules

# Verify alert manager configuration
curl http://localhost:9093/api/v1/alerts
```

### Log Analysis

```bash
# View recent errors
tail -f logs/error.log

# Search for specific patterns
grep "safety_score" logs/medical.log | jq .

# Monitor real-time logs
tail -f logs/info.log | jq 'select(.component == "metrics")'
```

## Performance Impact

The monitoring system is designed with minimal performance impact:

- **CPU Overhead**: < 1% under normal load
- **Memory Overhead**: ~50MB additional memory usage
- **Disk I/O**: Log rotation prevents excessive disk usage
- **Network**: Prometheus scraping every 10-15 seconds

## Security Considerations

### Data Privacy
- Patient IDs are hashed in logs
- Sensitive data excluded from metrics
- HIPAA-compliant log retention

### Access Control
- Metrics endpoint can be secured with authentication
- Grafana access controls for different user roles
- Alert webhook authentication tokens

### Audit Trail
- All medical events logged for compliance
- Monitoring system changes tracked
- Alert acknowledgment logging

## Maintenance

### Regular Tasks
- Review alert thresholds monthly
- Update dashboard as new features are added
- Monitor log disk usage
- Review and rotate API keys

### Upgrades
- Test monitoring during deployments
- Backup Grafana dashboards before updates
- Monitor for metric compatibility after updates

This comprehensive monitoring system provides full visibility into the TrustCareConnect Bridge Service, ensuring high availability, performance, and compliance with medical data requirements.