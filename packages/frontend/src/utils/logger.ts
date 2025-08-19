// Frontend Logger for TrustCareConnect
// Client-side logging with error tracking and analytics

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
  stack?: string;
}

interface ErrorInfo {
  error: Error;
  errorInfo?: {
    componentStack: string;
  };
  context?: Record<string, any>;
}

class FrontendLogger {
  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private userId?: string;
  private isEnabled: boolean;
  private logLevel: number;
  private maxBufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  
  private logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                     process.env.REACT_APP_ENABLE_LOGGING === 'true';
    this.logLevel = this.logLevels[process.env.REACT_APP_LOG_LEVEL as keyof typeof this.logLevels] || 1;
    
    if (this.isEnabled) {
      this.startPeriodicFlush();
      this.setupErrorHandlers();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: keyof typeof this.logLevels): boolean {
    return this.isEnabled && this.logLevels[level] >= this.logLevel;
  }

  private createLogEntry(
    level: keyof typeof this.logLevels,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata,
      stack: error?.stack
    };
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }

    // Immediately flush critical errors
    if (entry.level === 'error') {
      this.flushLogs();
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const apiHost = process.env.REACT_APP_API_HOST || 'http://localhost:3001';
      
      await fetch(`${apiHost}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          source: 'frontend',
          application: 'trustcareconnect'
        })
      });
    } catch (error) {
      // If sending fails, add logs back to buffer (but not indefinitely)
      if (this.logBuffer.length < this.maxBufferSize / 2) {
        this.logBuffer.unshift(...logsToSend);
      }
      
      // Fallback to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send logs to server:', error);
      }
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason?.toString() || 'Unknown reason',
        stack: event.reason?.stack
      });
    });
  }

  // Public logging methods
  debug(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, metadata);
    this.addToBuffer(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, metadata);
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, metadata);
    this.addToBuffer(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, metadata);
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, metadata);
    this.addToBuffer(entry);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, metadata);
    }
  }

  error(message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, metadata, error);
    this.addToBuffer(entry);
    
    // Always show errors in console
    console.error(`[ERROR] ${message}`, metadata, error);
  }

  // Specialized logging methods
  logUserAction(action: string, details?: Record<string, any>): void {
    this.info('User Action', {
      action,
      ...details
    });
  }

  logAPICall(endpoint: string, method: string, duration: number, status?: number): void {
    const level = status && status >= 400 ? 'warn' : 'info';
    this[level]('API Call', {
      endpoint,
      method,
      duration: `${duration}ms`,
      status
    });
  }

  logPageView(path: string, referrer?: string): void {
    this.info('Page View', {
      path,
      referrer: referrer || document.referrer,
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
    });
  }

  logPerformance(metric: string, value: number, context?: Record<string, any>): void {
    const level = value > 3000 ? 'warn' : 'info';
    this[level]('Performance Metric', {
      metric,
      value: `${value}ms`,
      ...context
    });
  }

  logReactError(errorInfo: ErrorInfo): void {
    this.error('React Component Error', {
      errorMessage: errorInfo.error.message,
      componentStack: errorInfo.errorInfo?.componentStack,
      ...errorInfo.context
    }, errorInfo.error);
  }

  // Set user context
  setUserId(userId: string): void {
    this.userId = userId;
  }

  setUserContext(context: Record<string, any>): void {
    // Add user context to all future logs
    this.info('User Context Set', context);
  }

  // Manual flush trigger
  flush(): Promise<void> {
    return this.flushLogs();
  }
}

// Create singleton instance
export const logger = new FrontendLogger();

// React Error Boundary integration
export const logErrorBoundary = (error: Error, errorInfo: { componentStack: string }) => {
  logger.logReactError({
    error,
    errorInfo,
    context: {
      url: window.location.href,
      userAgent: navigator.userAgent
    }
  });
};

export default logger;