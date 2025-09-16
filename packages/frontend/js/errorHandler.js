// Error handling and retry logic for TrustCareConnect Frontend
import { Config } from './config.js';
import { logger } from './logger.js';

export class ErrorHandler {
    constructor() {
        this.retryConfig = Config.get('ui');
        this.errorListeners = [];
    }

    // Add error listener
    addErrorListener(callback) {
        this.errorListeners.push(callback);
    }

    // Notify error listeners
    notifyError(error, context = {}) {
        // Log the error
        logger.error(error.message || 'Unknown error', {
            error: error.stack || error.toString(),
            context
        }, context.category || 'general');

        this.errorListeners.forEach(callback => {
            try {
                callback(error, context);
            } catch (e) {
                logger.error('Error in error listener', {
                    listenerError: e.message,
                    originalError: error.message
                }, 'error_listener');
                console.error('Error in error listener:', e);
            }
        });
    }

    // Retry function with exponential backoff
    async retryWithBackoff(fn, options = {}) {
        const {
            maxRetries = this.retryConfig.maxRetries,
            baseDelay = this.retryConfig.retryDelay,
            maxDelay = 30000,
            operation = 'operation'
        } = options;

        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    throw this.createDetailedError(error, operation, attempt);
                }

                if (attempt === maxRetries) {
                    throw this.createDetailedError(error, operation, attempt);
                }

                // Calculate exponential backoff delay
                const delay = Math.min(
                    baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
                    maxDelay
                );

                logger.warn(`${operation} failed, retrying`, {
                    attempt,
                    maxRetries,
                    delay,
                    error: error.message
                }, 'retry_attempt');
                console.warn(`${operation} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, error);

                this.notifyError(error, {
                    operation,
                    attempt,
                    maxRetries,
                    retrying: true
                });

                await this.delay(delay);
            }
        }

        throw this.createDetailedError(lastError, operation, maxRetries);
    }

    // Check if error should not be retried
    isNonRetryableError(error) {
        if (!error) return false;

        const errorMessage = error.message?.toLowerCase() || '';

        // Don't retry on these types of errors
        const nonRetryablePatterns = [
            'unauthorized',
            'forbidden',
            'not found',
            'bad request',
            'validation',
            'invalid credentials',
            'authentication failed',
            'permission denied'
        ];

        return nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
    }

    // Create detailed error with context
    createDetailedError(originalError, operation, attempts) {
        const error = new Error(`${operation} failed after ${attempts} attempts: ${originalError.message}`);
        error.originalError = originalError;
        error.operation = operation;
        error.attempts = attempts;
        error.timestamp = new Date().toISOString();
        return error;
    }

    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Handle specific backend connection errors
    async handleBackendError(error, context = {}) {
        const errorType = this.categorizeBackendError(error);

        logger.error('Backend connection error', {
            errorType,
            message: error.message,
            context
        }, 'backend_error');

        this.notifyError(error, {
            ...context,
            errorType,
            category: 'backend_connection'
        });

        switch (errorType) {
            case 'network':
                return {
                    message: 'Network connection failed. Please check your internet connection.',
                    suggestion: 'Try refreshing the page or checking your network settings.',
                    recoverable: true
                };

            case 'timeout':
                return {
                    message: 'Request timed out. The server may be busy.',
                    suggestion: 'Please try again in a few moments.',
                    recoverable: true
                };

            case 'canister_error':
                return {
                    message: 'Backend service is currently unavailable.',
                    suggestion: 'The system will automatically retry. You can also try refreshing the page.',
                    recoverable: true
                };

            case 'authentication':
                return {
                    message: 'Authentication failed.',
                    suggestion: 'Please refresh the page and try again.',
                    recoverable: false
                };

            default:
                return {
                    message: 'An unexpected error occurred.',
                    suggestion: 'Please try again. If the problem persists, contact support.',
                    recoverable: true
                };
        }
    }

    // Categorize backend errors
    categorizeBackendError(error) {
        if (!error) return 'unknown';

        const errorMessage = error.message?.toLowerCase() || '';

        if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
            return 'network';
        }

        if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
            return 'timeout';
        }

        if (errorMessage.includes('canister') || errorMessage.includes('replica')) {
            return 'canister_error';
        }

        if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
            return 'authentication';
        }

        return 'unknown';
    }

    // Handle medical query errors specifically
    handleMedicalQueryError(error, queryData = {}) {
        const errorInfo = this.categorizeBackendError(error);

        this.notifyError(error, {
            category: 'medical_query',
            patientId: queryData.patientId,
            queryLength: queryData.query?.length,
            hasVitals: !!queryData.vitalSigns
        });

        return {
            ...errorInfo,
            fallbackAction: 'mock_response',
            preserveQuery: true
        };
    }

    // Global error handler for unhandled errors
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);

            this.notifyError(event.reason, {
                category: 'unhandled_rejection',
                source: 'global_handler'
            });

            // Prevent the error from showing in console (optional)
            // event.preventDefault();
        });

        // Handle general JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);

            this.notifyError(event.error, {
                category: 'javascript_error',
                source: 'global_handler',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }

    // Circuit breaker pattern for failing services
    createCircuitBreaker(serviceName, options = {}) {
        const {
            failureThreshold = 5,
            resetTimeout = 60000,
            monitorWindow = 300000 // 5 minutes
        } = options;

        return {
            state: 'closed', // closed, open, half-open
            failures: 0,
            lastFailure: null,
            successCount: 0,

            async execute(fn) {
                if (this.state === 'open') {
                    if (Date.now() - this.lastFailure > resetTimeout) {
                        this.state = 'half-open';
                        this.successCount = 0;
                    } else {
                        throw new Error(`Circuit breaker is open for ${serviceName}`);
                    }
                }

                try {
                    const result = await fn();

                    if (this.state === 'half-open') {
                        this.successCount++;
                        if (this.successCount >= 3) {
                            this.state = 'closed';
                            this.failures = 0;
                        }
                    } else {
                        this.failures = Math.max(0, this.failures - 1);
                    }

                    return result;
                } catch (error) {
                    this.failures++;
                    this.lastFailure = Date.now();

                    if (this.failures >= failureThreshold) {
                        this.state = 'open';
                        console.warn(`Circuit breaker opened for ${serviceName} due to ${this.failures} failures`);
                    }

                    throw error;
                }
            }
        };
    }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Error types for consistent handling
export const ErrorTypes = {
    NETWORK_ERROR: 'network_error',
    TIMEOUT_ERROR: 'timeout_error',
    CANISTER_ERROR: 'canister_error',
    AUTHENTICATION_ERROR: 'authentication_error',
    VALIDATION_ERROR: 'validation_error',
    UNKNOWN_ERROR: 'unknown_error'
};

// Pre-configured retry strategies
export const RetryStrategies = {
    BACKEND_CONNECTION: {
        maxRetries: 3,
        baseDelay: 1000,
        operation: 'backend connection'
    },
    MEDICAL_QUERY: {
        maxRetries: 2,
        baseDelay: 2000,
        operation: 'medical query'
    },
    DASHBOARD_DATA: {
        maxRetries: 2,
        baseDelay: 500,
        operation: 'dashboard data fetch'
    }
};