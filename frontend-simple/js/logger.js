// Comprehensive Logging System for TrustCareConnect Frontend
import { Config } from './config.js';

export class Logger {
    constructor() {
        this.logLevel = Config.get('logging.level', 'info');
        this.enableConsole = Config.get('logging.console', true);
        this.enableLocalStorage = Config.get('logging.localStorage', true);
        this.maxLocalStorageLogs = Config.get('logging.maxLocalStorageLogs', 1000);
        this.sessionId = this.generateSessionId();

        // Initialize logging
        this.initializeLogging();
    }

    // Initialize logging system
    initializeLogging() {
        // Setup global error handlers
        this.setupGlobalErrorHandlers();

        // Clean up old logs periodically
        this.cleanupOldLogs();

        this.info('Logger initialized', {
            sessionId: this.sessionId,
            logLevel: this.logLevel,
            enableConsole: this.enableConsole,
            enableLocalStorage: this.enableLocalStorage
        });
    }

    // Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Log levels
    static LEVELS = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        trace: 4
    };

    // Check if log level should be processed
    shouldLog(level) {
        return Logger.LEVELS[level] <= Logger.LEVELS[this.logLevel];
    }

    // Core logging method
    log(level, message, data = {}, category = 'general') {
        if (!this.shouldLog(level)) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            category,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            data: this.sanitizeData(data),
            stackTrace: level === 'error' ? this.getStackTrace() : null
        };

        // Console logging
        if (this.enableConsole) {
            this.logToConsole(logEntry);
        }

        // Local storage logging
        if (this.enableLocalStorage) {
            this.logToLocalStorage(logEntry);
        }

        // Production logging (send to backend)
        if (Config.isProduction() && level === 'error') {
            this.logToProduction(logEntry);
        }
    }

    // Convenience methods
    error(message, data = {}, category = 'error') {
        this.log('error', message, data, category);
    }

    warn(message, data = {}, category = 'warning') {
        this.log('warn', message, data, category);
    }

    info(message, data = {}, category = 'info') {
        this.log('info', message, data, category);
    }

    debug(message, data = {}, category = 'debug') {
        this.log('debug', message, data, category);
    }

    trace(message, data = {}, category = 'trace') {
        this.log('trace', message, data, category);
    }

    // Medical-specific logging methods
    logMedicalQuery(patientId, queryText, vitalSigns, responseData) {
        this.info('Medical query processed', {
            patientId: this.hashPatientId(patientId), // Hash for privacy
            queryLength: queryText?.length || 0,
            hasVitalSigns: !!vitalSigns && Object.keys(vitalSigns).length > 0,
            safetyScore: responseData?.safetyScore,
            urgency: responseData?.urgency,
            requiresReview: responseData?.requiresReview,
            processingTime: responseData?.processingTime
        }, 'medical_query');
    }

    logBackendConnection(status, message, details = {}) {
        this.info('Backend connection status change', {
            status,
            message,
            ...details
        }, 'backend_connection');
    }

    logUserInteraction(action, element, data = {}) {
        this.debug('User interaction', {
            action,
            element,
            ...data
        }, 'user_interaction');
    }

    logPerformance(metric, value, context = {}) {
        this.info('Performance metric', {
            metric,
            value,
            context
        }, 'performance');
    }

    logAPICall(endpoint, method, statusCode, duration, error = null) {
        const level = error ? 'error' : 'info';
        this.log(level, 'API call completed', {
            endpoint,
            method,
            statusCode,
            duration,
            error: error?.message
        }, 'api_call');
    }

    // Sanitize sensitive data
    sanitizeData(data) {
        if (!data || typeof data !== 'object') return data;

        const sanitized = { ...data };
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'patientId', 'email'];

        for (const key of sensitiveKeys) {
            if (sanitized[key]) {
                sanitized[key] = this.maskSensitiveData(sanitized[key]);
            }
        }

        return sanitized;
    }

    // Mask sensitive data
    maskSensitiveData(value) {
        if (typeof value !== 'string') return '[MASKED]';
        if (value.length <= 4) return '***';
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }

    // Hash patient ID for privacy
    hashPatientId(patientId) {
        if (!patientId) return null;
        // Simple hash for privacy (in production, use crypto.subtle)
        return btoa(patientId).substring(0, 8);
    }

    // Get stack trace
    getStackTrace() {
        try {
            throw new Error();
        } catch (e) {
            return e.stack;
        }
    }

    // Console logging with colors
    logToConsole(logEntry) {
        const { level, message, data, category } = logEntry;
        const colors = {
            error: 'color: #dc2626; font-weight: bold;',
            warn: 'color: #d97706; font-weight: bold;',
            info: 'color: #2563eb;',
            debug: 'color: #059669;',
            trace: 'color: #7c3aed;'
        };

        const style = colors[level] || '';
        const prefix = `[${logEntry.timestamp}] [${level.toUpperCase()}] [${category}]`;

        console.log(`%c${prefix} ${message}`, style);

        if (Object.keys(data).length > 0) {
            console.log('Data:', data);
        }

        if (logEntry.stackTrace && level === 'error') {
            console.log('Stack trace:', logEntry.stackTrace);
        }
    }

    // Local storage logging
    logToLocalStorage(logEntry) {
        try {
            const logs = this.getLogsFromLocalStorage();
            logs.push(logEntry);

            // Keep only the most recent logs
            if (logs.length > this.maxLocalStorageLogs) {
                logs.splice(0, logs.length - this.maxLocalStorageLogs);
            }

            localStorage.setItem('trustcare_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to save log to localStorage:', error);
        }
    }

    // Production logging (send to backend)
    async logToProduction(logEntry) {
        try {
            // Only send critical errors to production logging endpoint
            if (logEntry.level === 'error') {
                const response = await fetch('/api/logs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(logEntry)
                });

                if (!response.ok) {
                    console.warn('Failed to send log to production endpoint');
                }
            }
        } catch (error) {
            console.warn('Production logging failed:', error.message);
        }
    }

    // Get logs from localStorage
    getLogsFromLocalStorage() {
        try {
            const logs = localStorage.getItem('trustcare_logs');
            return logs ? JSON.parse(logs) : [];
        } catch (error) {
            console.error('Failed to read logs from localStorage:', error);
            return [];
        }
    }

    // Clean up old logs
    cleanupOldLogs() {
        try {
            const logs = this.getLogsFromLocalStorage();
            const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

            const filteredLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return logTime > cutoffTime;
            });

            localStorage.setItem('trustcare_logs', JSON.stringify(filteredLogs));
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    // Setup global error handlers
    setupGlobalErrorHandlers() {
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled promise rejection', {
                reason: event.reason?.message || event.reason,
                stack: event.reason?.stack
            }, 'unhandled_rejection');
        });

        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.error('JavaScript error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            }, 'javascript_error');
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.error('Resource loading error', {
                    tagName: event.target.tagName,
                    src: event.target.src || event.target.href,
                    type: event.target.type
                }, 'resource_error');
            }
        }, true);
    }

    // Export logs for debugging
    exportLogs(format = 'json') {
        const logs = this.getLogsFromLocalStorage();

        if (format === 'json') {
            return JSON.stringify(logs, null, 2);
        } else if (format === 'csv') {
            return this.convertLogsToCSV(logs);
        }

        return logs;
    }

    // Convert logs to CSV format
    convertLogsToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'level', 'category', 'message', 'sessionId'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const row = [
                log.timestamp,
                log.level,
                log.category,
                `"${log.message.replace(/"/g, '""')}"`,
                log.sessionId
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    // Download logs file
    downloadLogs(format = 'json') {
        const logs = this.exportLogs(format);
        const blob = new Blob([logs], {
            type: format === 'json' ? 'application/json' : 'text/csv'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trustcare_logs_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Get logs statistics
    getLogStatistics() {
        const logs = this.getLogsFromLocalStorage();
        const stats = {
            total: logs.length,
            byLevel: {},
            byCategory: {},
            sessionsCount: new Set(logs.map(log => log.sessionId)).size,
            timeRange: {
                oldest: null,
                newest: null
            }
        };

        logs.forEach(log => {
            // Count by level
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

            // Count by category
            stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;

            // Track time range
            const logTime = new Date(log.timestamp);
            if (!stats.timeRange.oldest || logTime < stats.timeRange.oldest) {
                stats.timeRange.oldest = logTime;
            }
            if (!stats.timeRange.newest || logTime > stats.timeRange.newest) {
                stats.timeRange.newest = logTime;
            }
        });

        return stats;
    }

    // Clear all logs
    clearLogs() {
        localStorage.removeItem('trustcare_logs');
        this.info('Logs cleared');
    }
}

// Create singleton instance
export const logger = new Logger();

// Performance monitoring utilities
export class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.marks = new Map();
    }

    // Start timing an operation
    start(name) {
        const mark = `${name}_start`;
        performance.mark(mark);
        this.marks.set(name, mark);
        return name;
    }

    // End timing and log result
    end(name, context = {}) {
        const startMark = this.marks.get(name);
        if (!startMark) {
            this.logger.warn('Performance timing ended without start', { name });
            return null;
        }

        const endMark = `${name}_end`;
        performance.mark(endMark);
        performance.measure(name, startMark, endMark);

        const measure = performance.getEntriesByName(name, 'measure')[0];
        const duration = measure ? measure.duration : null;

        this.logger.logPerformance(name, duration, context);

        // Cleanup
        this.marks.delete(name);
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(name);

        return duration;
    }

    // Monitor function execution time
    monitor(name, fn, context = {}) {
        return async (...args) => {
            this.start(name);
            try {
                const result = await fn(...args);
                this.end(name, context);
                return result;
            } catch (error) {
                this.end(name, { ...context, error: error.message });
                throw error;
            }
        };
    }
}

// Create performance monitor instance
export const performanceMonitor = new PerformanceMonitor(logger);