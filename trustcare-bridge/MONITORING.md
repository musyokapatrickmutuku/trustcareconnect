# TrustCareConnect Bridge Service - Monitoring Guide

> **Note:** This document describes the monitoring system for the `trustcare-bridge` service.

## Overview

The `trustcare-bridge` service includes a monitoring system that collects and exposes metrics about the service's performance and usage.

## Architecture

The bridge service uses the `prom-client` library to collect metrics and exposes them on the `/metrics` endpoint.

```
┌─────────────────┐
│  Bridge Service │───▶│   /metrics      │
│   (Metrics)     │    │   (Prometheus)  │
└─────────────────┘    └─────────────────┘
```

## Metrics Collection

The `MetricsCollector` class in `src/monitoring.js` is responsible for collecting the following metrics:

- **Total Queries**: A counter that tracks the total number of medical queries processed.
- **Response Time**: A histogram that measures the response time for medical queries.
- **Safety Score Distribution**: A histogram that shows the distribution of AI safety scores.
- **Active Connections**: A gauge that indicates the number of current WebSocket connections.

### Prometheus Integration

All metrics are exposed in Prometheus format at the `/metrics` endpoint:

```bash
curl http://localhost:3001/metrics
```

## Logging System

The bridge service uses the `winston` library for logging. It provides structured logging with multiple transports.

### Log Levels and Files

- **Error**: `logs/error-YYYY-MM-DD.log`
- **Info**: `logs/info-YYYY-MM-DD.log`
- **Debug**: `logs/debug-YYYY-MM-DD.log`

## Setup Instructions

To access the metrics, simply start the `trustcare-bridge` service and send a GET request to the `/metrics` endpoint:

```bash
curl http://localhost:3001/metrics
```

## Troubleshooting

### Missing Metrics

If you are not seeing any metrics, make sure that the `trustcare-bridge` service is running and that you are sending requests to the correct port (3001 by default).
