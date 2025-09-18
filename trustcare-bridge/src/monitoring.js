const EventEmitter = require('events');
const winston = require('winston');
const promClient = require('prom-client');
require('winston-daily-rotate-file');

/**
 * Comprehensive monitoring system for TrustCareConnect Bridge Service
 * Provides metrics collection, logging, and alerting capabilities
 */
class MetricsCollector extends EventEmitter {
    constructor() {
        super();

        // Initialize Prometheus metrics registry
        this.register = new promClient.Registry();
        promClient.collectDefaultMetrics({ register: this.register });

        // Initialize metrics
        this.initializeMetrics();

        // Initialize logger
        this.logger = this.createLogger();

        // Alert thresholds
        this.alertThresholds = {
            maxResponseTime: 5000, // 5 seconds
            minSuccessRate: 0.95, // 95%
            maxErrorRate: 0.05, // 5%
            maxActiveConnections: 1000,
            minCacheHitRatio: 0.8, // 80%
            maxMemoryUsage: 0.85 // 85%
        };

        // Start monitoring intervals
        this.startMonitoring();

        this.logger.info('MetricsCollector initialized', {
            component: 'monitoring',
            action: 'initialize'
        });
    }

    initializeMetrics() {
        // Total queries processed counter
        this.totalQueries = new promClient.Counter({
            name: 'trustcare_queries_total',
            help: 'Total number of medical queries processed',
            labelNames: ['status', 'urgency', 'channel'],
            registers: [this.register]
        });

        // Response time histogram
        this.responseTime = new promClient.Histogram({
            name: 'trustcare_response_time_seconds',
            help: 'Response time for medical queries in seconds',
            labelNames: ['endpoint', 'method'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
            registers: [this.register]
        });

        // Safety score distribution histogram
        this.safetyScoreDistribution = new promClient.Histogram({
            name: 'trustcare_safety_score_distribution',
            help: 'Distribution of safety scores for medical queries',
            buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            registers: [this.register]
        });

        // API success/failure rates
        this.apiRequests = new promClient.Counter({
            name: 'trustcare_api_requests_total',
            help: 'Total API requests by endpoint and status',
            labelNames: ['endpoint', 'method', 'status_code'],
            registers: [this.register]
        });

        // WebSocket connections gauge
        this.activeConnections = new promClient.Gauge({
            name: 'trustcare_websocket_connections',
            help: 'Number of active WebSocket connections',
            registers: [this.register]
        });

        // Cache metrics
        this.cacheHits = new promClient.Counter({
            name: 'trustcare_cache_hits_total',
            help: 'Total cache hits',
            registers: [this.register]
        });

        this.cacheMisses = new promClient.Counter({
            name: 'trustcare_cache_misses_total',
            help: 'Total cache misses',
            registers: [this.register]
        });

        // Cache hit ratio gauge
        this.cacheHitRatio = new promClient.Gauge({
            name: 'trustcare_cache_hit_ratio',
            help: 'Cache hit ratio percentage',
            registers: [this.register]
        });

        // Processing queue metrics
        this.queueSize = new promClient.Gauge({
            name: 'trustcare_queue_size',
            help: 'Number of queries in processing queue',
            labelNames: ['queue_type'],
            registers: [this.register]
        });

        // Database metrics
        this.dbConnections = new promClient.Gauge({
            name: 'trustcare_db_connections',
            help: 'Number of active database connections',
            registers: [this.register]
        });

        this.dbQueryDuration = new promClient.Histogram({
            name: 'trustcare_db_query_duration_seconds',
            help: 'Database query execution time',
            labelNames: ['operation', 'table'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
            registers: [this.register]
        });

        // External API metrics
        this.externalApiRequests = new promClient.Counter({
            name: 'trustcare_external_api_requests_total',
            help: 'Total external API requests',
            labelNames: ['provider', 'endpoint', 'status'],
            registers: [this.register]
        });

        this.externalApiDuration = new promClient.Histogram({
            name: 'trustcare_external_api_duration_seconds',
            help: 'External API request duration',
            labelNames: ['provider', 'endpoint'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
            registers: [this.register]
        });

        // Memory and CPU metrics
        this.memoryUsage = new promClient.Gauge({
            name: 'trustcare_memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type'],
            registers: [this.register]
        });

        this.cpuUsage = new promClient.Gauge({
            name: 'trustcare_cpu_usage_percent',
            help: 'CPU usage percentage',
            registers: [this.register]
        });

        // Alert metrics
        this.alerts = new promClient.Counter({
            name: 'trustcare_alerts_total',
            help: 'Total number of alerts triggered',
            labelNames: ['type', 'severity'],
            registers: [this.register]
        });

        // Business metrics
        this.uniquePatients = new promClient.Gauge({
            name: 'trustcare_unique_patients_daily',
            help: 'Number of unique patients served daily',
            registers: [this.register]
        });

        this.avgSafetyScore = new promClient.Gauge({
            name: 'trustcare_avg_safety_score',
            help: 'Average safety score for processed queries',
            registers: [this.register]
        });

        this.doctorReviews = new promClient.Counter({
            name: 'trustcare_doctor_reviews_total',
            help: 'Total number of doctor reviews',
            labelNames: ['status'],
            registers: [this.register]
        });
    }

    createLogger() {
        // Create custom log format
        const logFormat = winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return JSON.stringify({
                    timestamp,
                    level,
                    message,
                    service: 'trustcare-bridge',
                    version: process.env.APP_VERSION || '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    ...meta
                });
            })
        );

        // Create logger with multiple transports
        const logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            defaultMeta: {
                service: 'trustcare-bridge',
                hostname: require('os').hostname()
            },
            transports: [
                // Console transport for development
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                    level: 'debug'
                }),

                // Error log file with daily rotation
                new winston.transports.DailyRotateFile({
                    filename: 'logs/error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    handleExceptions: true,
                    handleRejections: true,
                    maxSize: '20m',
                    maxFiles: '14d',
                    createSymlink: true,
                    symlinkName: 'error.log'
                }),

                // Info log file with daily rotation
                new winston.transports.DailyRotateFile({
                    filename: 'logs/info-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'info',
                    maxSize: '20m',
                    maxFiles: '14d',
                    createSymlink: true,
                    symlinkName: 'info.log'
                }),

                // Debug log file with daily rotation
                new winston.transports.DailyRotateFile({
                    filename: 'logs/debug-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'debug',
                    maxSize: '20m',
                    maxFiles: '7d', // Keep debug logs for shorter period
                    createSymlink: true,
                    symlinkName: 'debug.log'
                }),

                // Medical events log (separate for compliance)
                new winston.transports.DailyRotateFile({
                    filename: 'logs/medical-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'info',
                    maxSize: '50m',
                    maxFiles: '90d', // Keep medical logs longer for compliance
                    createSymlink: true,
                    symlinkName: 'medical.log',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        });

        return logger;
    }

    // Query tracking methods
    recordQuery(queryData) {
        const { status, urgency = 'LOW', channel = 'web', safetyScore, duration } = queryData;

        // Increment total queries
        this.totalQueries.inc({ status, urgency, channel });

        // Record safety score distribution
        if (safetyScore !== undefined) {
            this.safetyScoreDistribution.observe(safetyScore);
        }

        // Record response time if provided
        if (duration !== undefined) {
            this.responseTime.observe({ endpoint: 'query', method: 'POST' }, duration / 1000);
        }

        this.logger.info('Query recorded', {
            component: 'metrics',
            action: 'record_query',
            status,
            urgency,
            channel,
            safetyScore,
            duration
        });

        // Check for alerts
        this.checkAlerts(queryData);
    }

    // API request tracking
    recordApiRequest(endpoint, method, statusCode, duration) {
        this.apiRequests.inc({ endpoint, method, status_code: statusCode.toString() });
        this.responseTime.observe({ endpoint, method }, duration / 1000);

        this.logger.debug('API request recorded', {
            component: 'metrics',
            action: 'record_api_request',
            endpoint,
            method,
            statusCode,
            duration
        });
    }

    // WebSocket connection tracking
    setActiveConnections(count) {
        this.activeConnections.set(count);

        this.logger.debug('Active connections updated', {
            component: 'metrics',
            action: 'update_connections',
            count
        });

        // Check connection threshold
        if (count > this.alertThresholds.maxActiveConnections) {
            this.triggerAlert('high_connection_count', 'warning', {
                current: count,
                threshold: this.alertThresholds.maxActiveConnections
            });
        }
    }

    // Cache tracking
    recordCacheHit() {
        this.cacheHits.inc();
        this.updateCacheHitRatio();
    }

    recordCacheMiss() {
        this.cacheMisses.inc();
        this.updateCacheHitRatio();
    }

    updateCacheHitRatio() {
        const hits = this.cacheHits._getValue();
        const misses = this.cacheMisses._getValue();
        const total = hits + misses;
        const ratio = total > 0 ? hits / total : 0;

        this.cacheHitRatio.set(ratio);

        // Check cache hit ratio threshold
        if (ratio < this.alertThresholds.minCacheHitRatio && total > 100) {
            this.triggerAlert('low_cache_hit_ratio', 'warning', {
                current: ratio,
                threshold: this.alertThresholds.minCacheHitRatio
            });
        }
    }

    // External API tracking
    recordExternalApiCall(provider, endpoint, status, duration) {
        this.externalApiRequests.inc({ provider, endpoint, status });
        this.externalApiDuration.observe({ provider, endpoint }, duration / 1000);

        this.logger.info('External API call recorded', {
            component: 'metrics',
            action: 'record_external_api',
            provider,
            endpoint,
            status,
            duration
        });
    }

    // Database tracking
    recordDbQuery(operation, table, duration) {
        this.dbQueryDuration.observe({ operation, table }, duration / 1000);

        this.logger.debug('Database query recorded', {
            component: 'metrics',
            action: 'record_db_query',
            operation,
            table,
            duration
        });
    }

    // Queue tracking
    setQueueSize(queueType, size) {
        this.queueSize.set({ queue_type: queueType }, size);
    }

    // System metrics tracking
    updateSystemMetrics() {
        const memUsage = process.memoryUsage();

        this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
        this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
        this.memoryUsage.set({ type: 'external' }, memUsage.external);
        this.memoryUsage.set({ type: 'rss' }, memUsage.rss);

        // Calculate memory usage percentage
        const memoryPercent = memUsage.heapUsed / memUsage.heapTotal;

        // Check memory threshold
        if (memoryPercent > this.alertThresholds.maxMemoryUsage) {
            this.triggerAlert('high_memory_usage', 'critical', {
                current: memoryPercent,
                threshold: this.alertThresholds.maxMemoryUsage
            });
        }
    }

    // Alert system
    triggerAlert(type, severity, data = {}) {
        this.alerts.inc({ type, severity });

        const alertData = {
            type,
            severity,
            timestamp: new Date().toISOString(),
            service: 'trustcare-bridge',
            ...data
        };

        this.logger.warn('Alert triggered', {
            component: 'monitoring',
            action: 'trigger_alert',
            ...alertData
        });

        // Emit alert event for external handlers
        this.emit('alert', alertData);

        // Send to external alert systems if configured
        this.sendAlert(alertData);
    }

    async sendAlert(alertData) {
        try {
            // Send to webhook if configured
            if (process.env.ALERT_WEBHOOK_URL) {
                await fetch(process.env.ALERT_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN || ''}`
                    },
                    body: JSON.stringify(alertData)
                });
            }

            // Send to Slack if configured
            if (process.env.SLACK_WEBHOOK_URL) {
                await this.sendSlackAlert(alertData);
            }
        } catch (error) {
            this.logger.error('Failed to send alert', {
                component: 'monitoring',
                action: 'send_alert',
                error: error.message,
                alertData
            });
        }
    }

    async sendSlackAlert(alertData) {
        const slackMessage = {
            text: `🚨 TrustCare Alert: ${alertData.type}`,
            attachments: [{
                color: alertData.severity === 'critical' ? 'danger' : 'warning',
                fields: [
                    { title: 'Severity', value: alertData.severity, short: true },
                    { title: 'Service', value: alertData.service, short: true },
                    { title: 'Timestamp', value: alertData.timestamp, short: false }
                ]
            }]
        };

        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMessage)
        });
    }

    // Alert threshold checking
    checkAlerts(queryData) {
        const { duration, safetyScore } = queryData;

        // Check response time
        if (duration && duration > this.alertThresholds.maxResponseTime) {
            this.triggerAlert('slow_response', 'warning', {
                current: duration,
                threshold: this.alertThresholds.maxResponseTime
            });
        }

        // Check safety score
        if (safetyScore !== undefined && safetyScore < 40) {
            this.triggerAlert('low_safety_score', 'critical', {
                safetyScore,
                patientId: queryData.patientId
            });
        }
    }

    // Performance tracking wrapper
    trackPerformance(operation, fn) {
        const startTime = Date.now();
        const timer = this.responseTime.startTimer({ endpoint: operation, method: 'internal' });

        try {
            const result = fn();

            if (result && typeof result.then === 'function') {
                return result
                    .then(res => {
                        const duration = Date.now() - startTime;
                        timer({ status: 'success' });
                        this.logger.debug('Performance tracked', {
                            component: 'metrics',
                            action: 'track_performance',
                            operation,
                            duration,
                            status: 'success'
                        });
                        return res;
                    })
                    .catch(error => {
                        const duration = Date.now() - startTime;
                        timer({ status: 'error' });
                        this.logger.error('Performance tracked with error', {
                            component: 'metrics',
                            action: 'track_performance',
                            operation,
                            duration,
                            status: 'error',
                            error: error.message
                        });
                        throw error;
                    });
            } else {
                const duration = Date.now() - startTime;
                timer({ status: 'success' });
                this.logger.debug('Performance tracked', {
                    component: 'metrics',
                    action: 'track_performance',
                    operation,
                    duration,
                    status: 'success'
                });
                return result;
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            timer({ status: 'error' });
            this.logger.error('Performance tracked with error', {
                component: 'metrics',
                action: 'track_performance',
                operation,
                duration,
                status: 'error',
                error: error.message
            });
            throw error;
        }
    }

    // Start monitoring intervals
    startMonitoring() {
        // Update system metrics every 30 seconds
        setInterval(() => {
            this.updateSystemMetrics();
        }, 30000);

        // Update cache hit ratio every minute
        setInterval(() => {
            this.updateCacheHitRatio();
        }, 60000);

        // Log health status every 5 minutes
        setInterval(() => {
            this.logHealthStatus();
        }, 300000);
    }

    logHealthStatus() {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();

        this.logger.info('Health status', {
            component: 'monitoring',
            action: 'health_status',
            uptime,
            memoryUsage: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            activeConnections: this.activeConnections._getValue(),
            cacheHitRatio: this.cacheHitRatio._getValue()
        });
    }

    // Get metrics for Prometheus
    async getMetrics() {
        return this.register.metrics();
    }

    // Reset all metrics (for testing)
    resetMetrics() {
        this.register.clear();
        this.initializeMetrics();
        this.logger.info('Metrics reset', {
            component: 'monitoring',
            action: 'reset_metrics'
        });
    }

    // Graceful shutdown
    shutdown() {
        this.logger.info('Metrics collector shutting down', {
            component: 'monitoring',
            action: 'shutdown'
        });

        // Final metrics collection
        this.updateSystemMetrics();
        this.logHealthStatus();
    }
}

module.exports = { MetricsCollector };