// Request logging middleware for AI Proxy
// Logs all HTTP requests with detailed information

const { logRequest, logError, logSecurityEvent } = require('../utils/logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log the completed request
    logRequest(req, res, responseTime);
    
    // Check for slow requests
    if (responseTime > 5000) {
      logSecurityEvent('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        ip: req.ip
      });
    }
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (error, req, res, next) => {
  // Log the error with request context
  logError(error, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  next(error);
};

// Security event logger
const securityLogger = (req, res, next) => {
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // XSS
    /on\w+\s*=/i  // Event handlers
  ];
  
  const checkSuspicious = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkSuspicious);
    }
    return false;
  };
  
  // Check URL, query params, and body for suspicious content
  if (checkSuspicious(req.url) || 
      checkSuspicious(req.query) || 
      checkSuspicious(req.body)) {
    
    logSecurityEvent('Suspicious Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      query: req.query,
      body: typeof req.body === 'object' ? JSON.stringify(req.body) : req.body
    });
  }
  
  next();
};

// Rate limit logging
const rateLimitLogger = (req, res, next) => {
  // Check if rate limit headers are present
  const remaining = res.get('X-RateLimit-Remaining');
  const limit = res.get('X-RateLimit-Limit');
  
  if (remaining !== undefined && parseInt(remaining) < parseInt(limit) * 0.1) {
    logSecurityEvent('Rate Limit Warning', {
      ip: req.ip,
      remaining,
      limit,
      url: req.originalUrl
    });
  }
  
  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  securityLogger,
  rateLimitLogger
};