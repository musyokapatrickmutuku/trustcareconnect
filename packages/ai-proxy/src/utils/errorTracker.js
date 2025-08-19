// Error tracking and reporting utility for AI Proxy
// Tracks errors, generates reports, and sends alerts

const { logger, logError } = require('./logger');
const nodemailer = require('nodemailer');

class ErrorTracker {
  constructor() {
    this.errorCounts = new Map();
    this.recentErrors = [];
    this.maxRecentErrors = 100;
    this.alertThresholds = {
      errorRate: 10, // errors per minute
      criticalError: 1, // immediate alert
      uptime: 0.99 // 99% uptime threshold
    };
    
    // Setup email transporter if configured
    this.emailTransporter = this.setupEmailTransporter();
    
    // Start periodic reporting
    this.startPeriodicReporting();
  }

  setupEmailTransporter() {
    if (!process.env.SMTP_HOST) return null;
    
    try {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } catch (error) {
      logger.error('Failed to setup email transporter', { error: error.message });
      return null;
    }
  }

  // Track an error occurrence
  trackError(error, context = {}) {
    const errorKey = this.generateErrorKey(error, context);
    const timestamp = new Date();
    
    // Update error counts
    if (!this.errorCounts.has(errorKey)) {
      this.errorCounts.set(errorKey, {
        count: 0,
        firstSeen: timestamp,
        lastSeen: timestamp,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context
      });
    }
    
    const errorInfo = this.errorCounts.get(errorKey);
    errorInfo.count++;
    errorInfo.lastSeen = timestamp;
    
    // Add to recent errors
    this.recentErrors.unshift({
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      errorKey
    });
    
    // Limit recent errors size
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(0, this.maxRecentErrors);
    }
    
    // Log the error
    logError(error, context);
    
    // Check for alert conditions
    this.checkAlertConditions(errorKey, errorInfo);
    
    return errorKey;
  }

  generateErrorKey(error, context) {
    // Create a unique key for grouping similar errors
    const errorSignature = `${error.name}:${error.message}`;
    const contextSignature = context.endpoint || context.operation || 'unknown';
    return `${errorSignature}@${contextSignature}`;
  }

  checkAlertConditions(errorKey, errorInfo) {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    // Check error rate (errors per minute)
    const recentErrorsForKey = this.recentErrors.filter(err => 
      err.errorKey === errorKey && err.timestamp > oneMinuteAgo
    );
    
    if (recentErrorsForKey.length >= this.alertThresholds.errorRate) {
      this.sendAlert('HIGH_ERROR_RATE', {
        errorKey,
        count: recentErrorsForKey.length,
        timeWindow: '1 minute',
        error: errorInfo.error,
        context: errorInfo.context
      });
    }
    
    // Check for critical errors
    const criticalKeywords = ['database', 'payment', 'security', 'authentication', 'authorization'];
    const isCritical = criticalKeywords.some(keyword => 
      errorKey.toLowerCase().includes(keyword) ||
      errorInfo.error.message.toLowerCase().includes(keyword)
    );
    
    if (isCritical) {
      this.sendAlert('CRITICAL_ERROR', {
        errorKey,
        error: errorInfo.error,
        context: errorInfo.context,
        firstSeen: errorInfo.firstSeen,
        totalCount: errorInfo.count
      });
    }
  }

  async sendAlert(alertType, alertData) {
    const alert = {
      type: alertType,
      timestamp: new Date().toISOString(),
      service: 'trustcareconnect-ai-proxy',
      data: alertData
    };
    
    // Log the alert
    logger.warn('Error Alert Generated', alert);
    
    // Send email alert if configured
    if (this.emailTransporter && process.env.ALERT_EMAIL) {
      await this.sendEmailAlert(alert);
    }
    
    // Send Slack alert if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(alert);
    }
    
    // Could add integration with services like Sentry, DataDog, etc.
  }

  async sendEmailAlert(alert) {
    try {
      const subject = `TrustCareConnect Alert: ${alert.type}`;
      const html = this.generateEmailTemplate(alert);
      
      await this.emailTransporter.sendMail({
        from: process.env.ALERT_FROM_EMAIL || 'alerts@trustcareconnect.com',
        to: process.env.ALERT_EMAIL,
        subject,
        html
      });
      
      logger.info('Email alert sent', { alertType: alert.type });
    } catch (error) {
      logger.error('Failed to send email alert', { error: error.message });
    }
  }

  async sendSlackAlert(alert) {
    try {
      const payload = this.generateSlackPayload(alert);
      
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        logger.info('Slack alert sent', { alertType: alert.type });
      } else {
        logger.error('Failed to send Slack alert', { 
          status: response.status,
          statusText: response.statusText 
        });
      }
    } catch (error) {
      logger.error('Failed to send Slack alert', { error: error.message });
    }
  }

  generateEmailTemplate(alert) {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .alert-header { background-color: #dc3545; color: white; padding: 15px; }
            .alert-body { padding: 20px; }
            .alert-data { background-color: #f8f9fa; padding: 15px; border-radius: 5px; }
            .timestamp { color: #6c757d; font-size: 0.9em; }
            pre { background-color: #f1f3f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="alert-header">
            <h2>🚨 TrustCareConnect Alert: ${alert.type}</h2>
          </div>
          <div class="alert-body">
            <p class="timestamp">Generated: ${alert.timestamp}</p>
            <p><strong>Service:</strong> ${alert.service}</p>
            
            <div class="alert-data">
              <h3>Alert Details</h3>
              ${alert.type === 'HIGH_ERROR_RATE' ? `
                <p><strong>Error Rate:</strong> ${alert.data.count} errors in ${alert.data.timeWindow}</p>
                <p><strong>Error Key:</strong> ${alert.data.errorKey}</p>
              ` : ''}
              
              ${alert.data.error ? `
                <h4>Error Information</h4>
                <p><strong>Name:</strong> ${alert.data.error.name}</p>
                <p><strong>Message:</strong> ${alert.data.error.message}</p>
                ${alert.data.error.stack ? `<pre>${alert.data.error.stack}</pre>` : ''}
              ` : ''}
              
              ${alert.data.context && Object.keys(alert.data.context).length > 0 ? `
                <h4>Context</h4>
                <pre>${JSON.stringify(alert.data.context, null, 2)}</pre>
              ` : ''}
            </div>
            
            <p><em>This alert was generated automatically by the TrustCareConnect monitoring system.</em></p>
          </div>
        </body>
      </html>
    `;
  }

  generateSlackPayload(alert) {
    const color = alert.type === 'CRITICAL_ERROR' ? 'danger' : 'warning';
    
    return {
      attachments: [{
        color,
        title: `🚨 TrustCareConnect Alert: ${alert.type}`,
        fields: [
          {
            title: 'Service',
            value: alert.service,
            short: true
          },
          {
            title: 'Timestamp',
            value: alert.timestamp,
            short: true
          },
          ...(alert.data.errorKey ? [{
            title: 'Error Key',
            value: alert.data.errorKey,
            short: false
          }] : []),
          ...(alert.data.error ? [{
            title: 'Error Message',
            value: `${alert.data.error.name}: ${alert.data.error.message}`,
            short: false
          }] : [])
        ]
      }]
    };
  }

  // Generate error report
  generateReport() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);
    
    const recentErrors = this.recentErrors.filter(err => err.timestamp > oneHourAgo);
    const dailyErrors = this.recentErrors.filter(err => err.timestamp > oneDayAgo);
    
    // Get top errors by frequency
    const errorFrequency = new Map();
    dailyErrors.forEach(err => {
      const count = errorFrequency.get(err.errorKey) || 0;
      errorFrequency.set(err.errorKey, count + 1);
    });
    
    const topErrors = Array.from(errorFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      timestamp: now.toISOString(),
      summary: {
        totalUniqueErrors: this.errorCounts.size,
        errorsLastHour: recentErrors.length,
        errorsLast24Hours: dailyErrors.length
      },
      topErrors: topErrors.map(([errorKey, count]) => ({
        errorKey,
        count,
        details: this.errorCounts.get(errorKey)
      })),
      recentErrors: recentErrors.slice(0, 10)
    };
  }

  // Periodic reporting
  startPeriodicReporting() {
    // Generate report every hour
    setInterval(() => {
      const report = this.generateReport();
      logger.info('Error Report Generated', report);
      
      // Clean up old errors (older than 24 hours)
      this.cleanupOldErrors();
    }, 3600000); // 1 hour
  }

  cleanupOldErrors() {
    const oneDayAgo = new Date(Date.now() - 86400000);
    
    // Clean recent errors
    this.recentErrors = this.recentErrors.filter(err => err.timestamp > oneDayAgo);
    
    // Clean error counts for old errors
    for (const [key, errorInfo] of this.errorCounts.entries()) {
      if (errorInfo.lastSeen < oneDayAgo) {
        this.errorCounts.delete(key);
      }
    }
  }

  // Get current statistics
  getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const recentErrors = this.recentErrors.filter(err => err.timestamp > oneHourAgo);
    
    return {
      totalUniqueErrors: this.errorCounts.size,
      errorsLastHour: recentErrors.length,
      totalRecentErrors: this.recentErrors.length,
      uptime: process.uptime()
    };
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

module.exports = {
  errorTracker,
  trackError: (error, context) => errorTracker.trackError(error, context),
  getErrorStats: () => errorTracker.getStats(),
  generateErrorReport: () => errorTracker.generateReport()
};