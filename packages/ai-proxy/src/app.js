// TrustCareConnect AI Proxy - Main Application
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const QueryController = require('./controllers/QueryController');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize controllers
const queryController = new QueryController();

// Security middleware
app.use(helmet());

// CORS configuration - adjust origins for production
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:4943', 
    'https://localhost:4943',
    // Add production origins
    ...(process.env.CORS_ORIGINS?.split(',') || [])
  ],
  methods: ['GET', 'POST'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TrustCareConnect AI Proxy',
    version: '1.0.0'
  });
});

// AI query endpoint
app.post('/api/query', (req, res) => queryController.processQuery(req, res));

// Get available AI providers
app.get('/api/providers', (req, res) => queryController.getProviders(req, res));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'UNHANDLED_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    availableEndpoints: [
      'GET /api/health',
      'POST /api/query',
      'GET /api/providers'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TrustCareConnect AI Proxy Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;