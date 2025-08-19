// Log collection endpoint for AI Proxy
// Receives logs from frontend and other services

const express = require('express');
const rateLimit = require('express-rate-limit');
const { logger, logSecurityEvent } = require('../utils/logger');

const router = express.Router();

// Rate limiting for log endpoints
const logRateLimit = rateLimit({
  windowMs: 1000 * 60, // 1 minute
  max: 100, // Maximum 100 log entries per minute per IP
  message: {
    error: 'Too many log requests',
    message: 'Rate limit exceeded for log submissions'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation for log entries
const validateLogEntry = (entry) => {
  const requiredFields = ['level', 'message', 'timestamp'];
  const validLevels = ['debug', 'info', 'warn', 'error'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!entry[field]) {
      return `Missing required field: ${field}`;
    }
  }
  
  // Validate log level
  if (!validLevels.includes(entry.level)) {
    return `Invalid log level: ${entry.level}`;
  }
  
  // Validate timestamp
  if (isNaN(Date.parse(entry.timestamp))) {
    return `Invalid timestamp: ${entry.timestamp}`;
  }
  
  // Check message length
  if (typeof entry.message !== 'string' || entry.message.length > 1000) {
    return 'Message must be a string with maximum 1000 characters';
  }
  
  return null;
};

// Sanitize log entry to prevent injection attacks
const sanitizeLogEntry = (entry) => {
  const sanitized = { ...entry };
  
  // Sanitize string fields
  const stringFields = ['message', 'url', 'userAgent'];
  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      // Remove potential HTML/JavaScript
      sanitized[field] = sanitized[field]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
        .replace(/javascript:/gi, '[JAVASCRIPT_REMOVED]')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '[EVENT_HANDLER_REMOVED]');
    }
  });
  
  // Limit metadata size
  if (sanitized.metadata && typeof sanitized.metadata === 'object') {
    const metadataStr = JSON.stringify(sanitized.metadata);
    if (metadataStr.length > 5000) {
      sanitized.metadata = { _truncated: true, _original_size: metadataStr.length };
    }
  }
  
  return sanitized;
};

// POST /api/logs - Receive logs from frontend
router.post('/', logRateLimit, (req, res) => {
  try {
    const { logs, source, application } = req.body;
    
    // Validate request structure
    if (!Array.isArray(logs)) {
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'Logs must be an array'
      });
    }
    
    if (logs.length > 50) {
      logSecurityEvent('Large Log Batch', {
        source,
        application,
        logCount: logs.length,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Batch too large',
        message: 'Maximum 50 log entries per request'
      });
    }
    
    const processedLogs = [];
    const errors = [];
    
    // Process each log entry
    logs.forEach((logEntry, index) => {
      const validationError = validateLogEntry(logEntry);
      if (validationError) {
        errors.push(`Entry ${index}: ${validationError}`);
        return;
      }
      
      const sanitizedEntry = sanitizeLogEntry(logEntry);
      
      // Add context from request
      const contextualEntry = {
        ...sanitizedEntry,
        source: source || 'unknown',
        application: application || 'trustcareconnect',
        receivedAt: new Date().toISOString(),
        clientIp: req.ip,
        forwardedFor: req.get('X-Forwarded-For'),
        userAgent: req.get('User-Agent')
      };
      
      // Log the entry using our logger
      switch (contextualEntry.level) {
        case 'debug':
          logger.debug(`[${source}] ${contextualEntry.message}`, contextualEntry.metadata);
          break;
        case 'info':
          logger.info(`[${source}] ${contextualEntry.message}`, contextualEntry.metadata);
          break;
        case 'warn':
          logger.warn(`[${source}] ${contextualEntry.message}`, contextualEntry.metadata);
          break;
        case 'error':
          logger.error(`[${source}] ${contextualEntry.message}`, contextualEntry.metadata);
          break;
      }
      
      processedLogs.push(contextualEntry);
    });
    
    // Check for security-relevant logs
    const securityLogs = processedLogs.filter(log => 
      log.level === 'warn' || log.level === 'error' ||
      log.message.toLowerCase().includes('security') ||
      log.message.toLowerCase().includes('unauthorized') ||
      log.message.toLowerCase().includes('suspicious')
    );
    
    if (securityLogs.length > 0) {
      logSecurityEvent('Security Logs Received', {
        source,
        application,
        securityLogCount: securityLogs.length,
        totalLogs: processedLogs.length,
        ip: req.ip
      });
    }
    
    // Response
    const response = {
      success: true,
      processed: processedLogs.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };
    
    if (errors.length > 0) {
      return res.status(207).json(response); // Multi-status
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    logger.error('Log processing error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      body: req.body
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process logs'
    });
  }
});

// GET /api/logs/health - Health check for log endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'log-collector',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/logs/stats - Log statistics (admin only)
router.get('/stats', (req, res) => {
  // In production, add authentication middleware here
  
  const stats = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    // Add more operational statistics as needed
    logLevels: {
      debug: 'Available in development',
      info: 'General information',
      warn: 'Warning conditions',
      error: 'Error conditions'
    }
  };
  
  res.status(200).json(stats);
});

module.exports = router;