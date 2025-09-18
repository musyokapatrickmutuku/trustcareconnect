const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const NovitaAIClient = require('./novita-client');
const ICPClient = require('./icp-client');
const { MetricsCollector } = require('./monitoring');

// Connection Manager Class
class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.connectionsByUser = new Map();
        this.reconnectionAttempts = new Map();
    }

    addConnection(connectionId, connectionData) {
        this.connections.set(connectionId, {
            ...connectionData,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            messageCount: 0,
            status: 'active'
        });

        // Track by user if available
        if (connectionData.userId) {
            if (!this.connectionsByUser.has(connectionData.userId)) {
                this.connectionsByUser.set(connectionData.userId, new Set());
            }
            this.connectionsByUser.get(connectionData.userId).add(connectionId);
        }

        console.log(`📱 Connection ${connectionId} added. Total: ${this.connections.size}`);
    }

    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            if (connection.userId) {
                const userConnections = this.connectionsByUser.get(connection.userId);
                if (userConnections) {
                    userConnections.delete(connectionId);
                    if (userConnections.size === 0) {
                        this.connectionsByUser.delete(connection.userId);
                    }
                }
            }
            this.connections.delete(connectionId);
            console.log(`📴 Connection ${connectionId} removed. Total: ${this.connections.size}`);
        }
    }

    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }

    updateActivity(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.lastActivity = Date.now();
            connection.messageCount++;
        }
    }

    getConnectionsByUser(userId) {
        return this.connectionsByUser.get(userId) || new Set();
    }

    getActiveConnections() {
        return Array.from(this.connections.values()).filter(conn => conn.status === 'active');
    }

    getConnectionStats() {
        const connections = Array.from(this.connections.values());
        const now = Date.now();

        return {
            total: connections.length,
            active: connections.filter(c => c.status === 'active').length,
            idle: connections.filter(c => now - c.lastActivity > 300000).length, // 5 min idle
            averageMessageCount: connections.reduce((sum, c) => sum + c.messageCount, 0) / connections.length || 0,
            oldestConnection: Math.min(...connections.map(c => c.connectedAt))
        };
    }
}

// Request Queue Class
class RequestQueue {
    constructor() {
        this.queues = new Map(); // Per-user queues
        this.processing = new Set();
        this.maxQueueSize = parseInt(process.env.MAX_QUEUE_SIZE) || 10;
        this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 5;
    }

    async enqueue(userId, requestData) {
        if (!this.queues.has(userId)) {
            this.queues.set(userId, []);
        }

        const userQueue = this.queues.get(userId);

        if (userQueue.length >= this.maxQueueSize) {
            throw new Error('Request queue full. Please try again later.');
        }

        const request = {
            id: uuidv4(),
            userId,
            data: requestData,
            enqueuedAt: Date.now(),
            status: 'queued'
        };

        userQueue.push(request);
        this.processQueue();

        return request.id;
    }

    async processQueue() {
        if (this.processing.size >= this.maxConcurrent) {
            return;
        }

        // Find next request to process (FIFO across all users)
        let nextRequest = null;
        let earliestTime = Infinity;

        for (const [userId, queue] of this.queues.entries()) {
            if (queue.length > 0 && queue[0].enqueuedAt < earliestTime) {
                nextRequest = queue[0];
                earliestTime = queue[0].enqueuedAt;
            }
        }

        if (nextRequest) {
            // Remove from queue and start processing
            const userQueue = this.queues.get(nextRequest.userId);
            userQueue.shift();

            this.processing.add(nextRequest.id);
            nextRequest.status = 'processing';

            try {
                await this.processRequest(nextRequest);
            } finally {
                this.processing.delete(nextRequest.id);
                // Process next request
                setImmediate(() => this.processQueue());
            }
        }
    }

    async processRequest(request) {
        // This will be called by the main bridge logic
        console.log(`🔄 Processing queued request ${request.id} for user ${request.userId}`);
    }

    getQueueStats() {
        const totalQueued = Array.from(this.queues.values())
            .reduce((sum, queue) => sum + queue.length, 0);

        return {
            totalQueued,
            processing: this.processing.size,
            userQueues: this.queues.size,
            maxQueueSize: this.maxQueueSize,
            maxConcurrent: this.maxConcurrent
        };
    }
}

// MetricsCollector imported from monitoring.js

// Message Router Class
class MessageRouter {
    constructor() {
        this.routes = new Map();
        this.middleware = [];
        this.setupDefaultRoutes();
    }

    setupDefaultRoutes() {
        this.addRoute('ping', this.handlePing.bind(this));
        this.addRoute('medical_query', this.handleMedicalQuery.bind(this));
        this.addRoute('get_history', this.handleGetHistory.bind(this));
        this.addRoute('doctor_review', this.handleDoctorReview.bind(this));
        this.addRoute('query_status', this.handleQueryStatus.bind(this));
        this.addRoute('subscribe_updates', this.handleSubscribeUpdates.bind(this));
    }

    addRoute(type, handler) {
        this.routes.set(type, handler);
    }

    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    async route(connection, message) {
        const { type, payload, requestId } = message;

        // Run middleware
        for (const middleware of this.middleware) {
            const result = await middleware(connection, message);
            if (result === false) {
                return; // Middleware blocked the request
            }
        }

        const handler = this.routes.get(type);
        if (!handler) {
            throw new Error(`Unknown message type: ${type}`);
        }

        return await handler(connection, payload, requestId);
    }

    async handlePing(connection, payload, requestId) {
        return {
            type: 'pong',
            payload: { timestamp: Date.now() },
            requestId
        };
    }

    async handleMedicalQuery(connection, payload, requestId) {
        // This will be implemented by the main bridge class
        throw new Error('Medical query handler not implemented');
    }

    async handleGetHistory(connection, payload, requestId) {
        // This will be implemented by the main bridge class
        throw new Error('Get history handler not implemented');
    }

    async handleDoctorReview(connection, payload, requestId) {
        // This will be implemented by the main bridge class
        throw new Error('Doctor review handler not implemented');
    }

    async handleQueryStatus(connection, payload, requestId) {
        // This will be implemented by the main bridge class
        throw new Error('Query status handler not implemented');
    }

    async handleSubscribeUpdates(connection, payload, requestId) {
        // Subscribe to real-time updates
        const { patientId, queryId } = payload;

        if (!connection.subscriptions) {
            connection.subscriptions = new Set();
        }

        if (patientId) {
            connection.subscriptions.add(`patient:${patientId}`);
        }
        if (queryId) {
            connection.subscriptions.add(`query:${queryId}`);
        }

        return {
            type: 'subscription_confirmed',
            payload: {
                subscriptions: Array.from(connection.subscriptions),
                timestamp: Date.now()
            },
            requestId
        };
    }
}

// Main TrustCare Bridge Class
class TrustCareBridge {
    constructor() {
        this.app = express();
        this.wsPort = parseInt(process.env.WS_PORT) || 8080;  // WebSocket on 8080
        this.httpPort = parseInt(process.env.HTTP_PORT) || 3001; // HTTP REST on 3001

        // Core components
        this.connectionManager = new ConnectionManager();
        this.requestQueue = new RequestQueue();
        this.metrics = new MetricsCollector(); // Comprehensive monitoring system
        this.messageRouter = new MessageRouter();

        // Rate limiting
        this.rateLimiter = new Map();

        // Initialize clients
        this.novitaClient = new NovitaAIClient();
        this.icpClient = new ICPClient();

        this.setupExpress();
        this.setupWebSocket();
        this.setupHealthCheck();
        this.setupMessageRoutes();
        this.setupMetrics();
        this.setupReconnectionLogic();
    }

    setupExpress() {
        // CORS configuration for ICP frontend
        const corsOptions = {
            origin: function (origin, callback) {
                const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

                // Allow ICP canister origins
                const icpPatterns = [
                    /^https?:\/\/.*\.localhost:4943$/,
                    /^https?:\/\/.*\.ic0\.app$/,
                    /^https?:\/\/.*\.raw\.ic0\.app$/,
                    /^https?:\/\/localhost:\d+$/,
                    /^https?:\/\/127\.0\.0\.1:\d+$/
                ];

                const isAllowed = !origin ||
                    allowedOrigins.includes(origin) ||
                    icpPatterns.some(pattern => pattern.test(origin));

                callback(null, isAllowed);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        };

        this.app.use(cors(corsOptions));
        this.app.use(express.json({ limit: '10mb' }));

        // Request logging and metrics middleware
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            console.log(`🌐 ${req.method} ${req.path} from ${req.ip}`);

            // Track API request completion
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.metrics.recordApiRequest(req.path, req.method, res.statusCode, duration);
            });

            next();
        });

        // REST API endpoints
        this.setupRestEndpoints();

        // Start HTTP server
        this.httpServer = this.app.listen(this.httpPort, () => {
            console.log(`🚀 TrustCare Bridge HTTP server running on port ${this.httpPort}`);
        });
    }

    setupRestEndpoints() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                connections: this.connectionManager.getConnectionStats(),
                queue: this.requestQueue.getQueueStats(),
                metrics: this.metrics.getMetrics(),
                services: {
                    websocket: this.wss ? 'running' : 'stopped',
                    novitaApi: this.metrics.metrics.health.novitaApi,
                    icpCanister: this.metrics.metrics.health.icpCanister
                },
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            };
            res.json(health);
        });

        // Prometheus metrics endpoint
        this.app.get('/metrics', async (req, res) => {
            try {
                const prometheusMetrics = await this.metrics.getMetrics();
                res.set('Content-Type', 'text/plain');
                res.send(prometheusMetrics);
            } catch (error) {
                console.error('❌ Error generating metrics:', error);
                res.status(500).json({ error: 'Failed to generate metrics' });
            }
        });

        // JSON metrics endpoint for internal use
        this.app.get('/metrics/json', (req, res) => {
            res.json({
                connections: this.connectionManager.getConnectionStats(),
                queue: this.requestQueue.getQueueStats(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: Date.now()
            });
        });

        // WebSocket connection info
        this.app.get('/ws-info', (req, res) => {
            res.json({
                wsPort: this.wsPort,
                protocols: ['ws', 'wss'],
                endpoint: '/ws',
                maxConnections: process.env.MAX_CONCURRENT_CONNECTIONS || 1000,
                heartbeatInterval: process.env.WS_HEARTBEAT_INTERVAL || 30000
            });
        });

        // REST fallback for medical queries
        this.app.post('/api/medical-query', async (req, res) => {
            try {
                const startTime = Date.now();
                const { patientId, query, vitalSigns, context } = req.body;

                if (!patientId || !query) {
                    return res.status(400).json({
                        error: 'patientId and query are required'
                    });
                }

                const result = await this.processMedicalQueryRest({
                    patientId, query, vitalSigns, context
                });

                const responseTime = Date.now() - startTime;
                this.metrics.recordRequest(true, responseTime);

                res.json(result);
            } catch (error) {
                console.error('❌ REST medical query error:', error);
                this.metrics.recordRequest(false);
                res.status(500).json({
                    error: 'Internal server error',
                    message: error.message
                });
            }
        });

        // REST endpoint for query history
        this.app.get('/api/history/:patientId', async (req, res) => {
            try {
                const { patientId } = req.params;
                const { limit = 20, offset = 0 } = req.query;

                const history = await this.getPatientHistoryRest(patientId, { limit, offset });
                res.json(history);
            } catch (error) {
                console.error('❌ REST history error:', error);
                res.status(500).json({
                    error: 'Failed to retrieve history',
                    message: error.message
                });
            }
        });

        // Connection status endpoint
        this.app.get('/connections', (req, res) => {
            const stats = this.connectionManager.getConnectionStats();
            res.json(stats);
        });
    }

    setupWebSocket() {
        // Setup WebSocket server with SSL support
        let serverOptions = {
            port: this.wsPort,
            clientTracking: true,
            maxPayload: 1024 * 1024, // 1MB max payload
            perMessageDeflate: {
                zlibDeflateOptions: {
                    level: 3
                }
            }
        };

        // SSL configuration for wss://
        if (process.env.SSL_CERT && process.env.SSL_KEY) {
            try {
                const server = https.createServer({
                    cert: fs.readFileSync(process.env.SSL_CERT),
                    key: fs.readFileSync(process.env.SSL_KEY)
                });

                this.wss = new WebSocket.Server({ server, ...serverOptions });
                server.listen(this.wsPort);
                console.log(`🔒 Secure WebSocket server (wss) running on port ${this.wsPort}`);
            } catch (error) {
                console.warn('⚠️ SSL configuration failed, falling back to ws://', error.message);
                this.wss = new WebSocket.Server(serverOptions);
                console.log(`🔌 WebSocket server (ws) running on port ${this.wsPort}`);
            }
        } else {
            this.wss = new WebSocket.Server(serverOptions);
            console.log(`🔌 WebSocket server (ws) running on port ${this.wsPort}`);
        }

        this.wss.on('connection', (ws, req) => {
            this.handleNewConnection(ws, req);
        });

        this.setupHeartbeat();
        this.metrics.recordConnection();
    }

    handleNewConnection(ws, req) {
        const connectionId = uuidv4();
        const clientIP = req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        console.log(`📱 New WebSocket connection: ${connectionId} from ${clientIP}`);

        // Rate limiting check
        if (this.isRateLimited(clientIP)) {
            ws.close(1008, 'Rate limit exceeded');
            this.metrics.recordRateLimit('blocked');
            return;
        }

        // Connection data
        const connectionData = {
            ws,
            id: connectionId,
            ip: clientIP,
            userAgent,
            subscriptions: new Set()
        };

        this.connectionManager.addConnection(connectionId, connectionData);
        this.metrics.setActiveConnections(this.connectionManager.connections.size);

        // Setup WebSocket event handlers
        ws.on('message', async (data) => {
            const startTime = Date.now();
            try {
                await this.handleWebSocketMessage(connectionId, data);
                const processingTime = Date.now() - startTime;
                this.metrics.recordMessage('processed', processingTime);
            } catch (error) {
                console.error(`❌ Error handling message from ${connectionId}:`, error);
                this.metrics.recordError();
                this.sendError(ws, 'MESSAGE_PROCESSING_ERROR', error.message);
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`📴 Connection ${connectionId} closed: ${code} - ${reason}`);
            this.connectionManager.removeConnection(connectionId);
            this.metrics.setActiveConnections(this.connectionManager.connections.size);
        });

        ws.on('error', (error) => {
            console.error(`🚨 WebSocket error for ${connectionId}:`, error);
            this.connectionManager.removeConnection(connectionId);
            this.metrics.recordError();
        });

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // Send welcome message
        this.sendMessage(ws, 'connection_established', {
            connectionId,
            serverTime: new Date().toISOString(),
            protocols: ['ws', 'wss'],
            features: ['medical_query', 'get_history', 'doctor_review', 'real_time_updates']
        });
    }

    async handleWebSocketMessage(connectionId, data) {
        const connection = this.connectionManager.getConnection(connectionId);
        if (!connection) {
            throw new Error('Connection not found');
        }

        this.connectionManager.updateActivity(connectionId);

        let message;
        try {
            message = JSON.parse(data.toString());
        } catch (error) {
            throw new Error('Invalid JSON message');
        }

        const { type } = message;
        console.log(`📨 Received message type: ${type} from ${connectionId}`);

        // Route message through message router
        try {
            const response = await this.messageRouter.route(connection, message);
            if (response) {
                this.sendMessage(connection.ws, response.type, response.payload, response.requestId);
            }
        } catch (error) {
            if (error.message.includes('not implemented')) {
                // Handle the message directly
                await this.handleDirectMessage(connection, message);
            } else {
                throw error;
            }
        }
    }

    async handleDirectMessage(connection, message) {
        const { type, payload, requestId } = message;

        switch (type) {
            case 'medical_query':
                await this.handleMedicalQuery(connection, payload, requestId);
                break;
            case 'get_history':
                await this.handleGetHistory(connection, payload, requestId);
                break;
            case 'doctor_review':
                await this.handleDoctorReview(connection, payload, requestId);
                break;
            case 'query_status':
                await this.handleQueryStatus(connection, payload, requestId);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    }

    async handleMedicalQuery(connection, payload, requestId) {
        const { patientId, query, vitalSigns, context } = payload;

        if (!patientId || !query) {
            this.sendError(connection.ws, 'INVALID_PAYLOAD', 'patientId and query are required', requestId);
            return;
        }

        try {
            // Queue the request
            const queueId = await this.requestQueue.enqueue(patientId, {
                type: 'medical_query',
                connection,
                payload,
                requestId
            });

            this.metrics.recordQueuedRequest();

            // Send queued status
            this.sendMessage(connection.ws, 'query_status', {
                status: 'queued',
                queueId,
                message: 'Request queued for processing...'
            }, requestId);

            // Process the queued request
            await this.processMedicalQuery(connection, payload, requestId);

        } catch (error) {
            console.error(`❌ Error processing medical query for ${connection.id}:`, error);
            this.sendError(connection.ws, 'QUERY_PROCESSING_ERROR', error.message, requestId);
        }
    }

    async processMedicalQuery(connection, payload, requestId) {
        const startTime = Date.now();
        const { patientId, query, vitalSigns, context } = payload;

        try {
            // Send processing status
            this.sendMessage(connection.ws, 'query_status', {
                status: 'processing',
                message: 'Processing your medical query with AI...'
            }, requestId);

            // Call Novita AI API with performance tracking
            const aiResponse = await this.metrics.trackPerformance('novita_api_call', async () => {
                return await this.novitaClient.callMedicalAI(query, {
                    patientId,
                    vitalSigns,
                    ...context
                });
            });

            // Record external API call
            this.metrics.recordExternalApiCall('novita', 'medical_ai', 'success', aiResponse.processingTime || 0);

            // Send AI processing complete status
            this.sendMessage(connection.ws, 'query_status', {
                status: 'ai_processed',
                message: 'AI analysis complete, updating records...'
            }, requestId);

            // Store AI response on ICP blockchain with performance tracking
            const queryId = aiResponse.queryId || require('uuid').v4();
            const icpResponse = await this.metrics.trackPerformance('icp_storage', async () => {
                return await this.icpClient.storeAIResponse(queryId, aiResponse);
            });

            const totalDuration = Date.now() - startTime;

            // Record query metrics
            this.metrics.recordQuery({
                status: 'completed',
                urgency: aiResponse.urgency || 'LOW',
                channel: 'websocket',
                safetyScore: aiResponse.safetyScore,
                duration: totalDuration,
                patientId
            });

            // Send final response
            this.sendMessage(connection.ws, 'medical_response', {
                queryId,
                content: aiResponse.content,
                safetyScore: aiResponse.safetyScore,
                urgency: aiResponse.urgency,
                requiresReview: aiResponse.requiresReview,
                timestamp: aiResponse.timestamp,
                processingTime: totalDuration
            }, requestId);

            // Broadcast to subscribed connections
            this.broadcastUpdate(`patient:${patientId}`, {
                type: 'query_completed',
                queryId,
                urgency: aiResponse.urgency
            });

            console.log(`✅ Medical query processed successfully for ${connection.id}`);

        } catch (error) {
            const totalDuration = Date.now() - startTime;

            // Record failed query
            this.metrics.recordQuery({
                status: 'failed',
                urgency: 'LOW',
                channel: 'websocket',
                duration: totalDuration,
                patientId
            });

            // Record API failure if applicable
            if (error.message.includes('Novita')) {
                this.metrics.recordExternalApiCall('novita', 'medical_ai', 'error', totalDuration);
            }

            throw error;
        }
    }

    async handleGetHistory(connection, payload, requestId) {
        const { patientId, limit = 20, offset = 0 } = payload;

        if (!patientId) {
            this.sendError(connection.ws, 'INVALID_PAYLOAD', 'patientId is required', requestId);
            return;
        }

        try {
            const history = await this.getPatientHistory(patientId, { limit, offset });

            this.sendMessage(connection.ws, 'history_response', {
                patientId,
                history,
                pagination: {
                    limit,
                    offset,
                    total: history.length
                }
            }, requestId);

        } catch (error) {
            console.error(`❌ Error getting patient history:`, error);
            this.sendError(connection.ws, 'HISTORY_ERROR', error.message, requestId);
        }
    }

    async handleDoctorReview(connection, payload, requestId) {
        const { queryId, action, notes, finalResponse } = payload;

        if (!queryId || !action) {
            this.sendError(connection.ws, 'INVALID_PAYLOAD', 'queryId and action are required', requestId);
            return;
        }

        try {
            const result = await this.processDoctorReview({
                queryId,
                action,
                notes,
                finalResponse,
                doctorId: connection.userId
            });

            this.sendMessage(connection.ws, 'review_response', {
                queryId,
                action,
                result,
                timestamp: Date.now()
            }, requestId);

            // Broadcast to patient connections
            this.broadcastUpdate(`query:${queryId}`, {
                type: 'review_completed',
                queryId,
                action
            });

        } catch (error) {
            console.error(`❌ Error processing doctor review:`, error);
            this.sendError(connection.ws, 'REVIEW_ERROR', error.message, requestId);
        }
    }

    async handleQueryStatus(connection, payload, requestId) {
        const { queryId } = payload;

        if (!queryId) {
            this.sendError(connection.ws, 'INVALID_PAYLOAD', 'queryId is required', requestId);
            return;
        }

        try {
            const status = await this.icpClient.getQueryStatus(queryId);

            this.sendMessage(connection.ws, 'query_status_response', {
                queryId,
                ...status
            }, requestId);

        } catch (error) {
            console.error(`❌ Error getting query status:`, error);
            this.sendError(connection.ws, 'STATUS_ERROR', error.message, requestId);
        }
    }

    // REST API implementations
    async processMedicalQueryRest(queryData) {
        const { patientId, query, vitalSigns, context } = queryData;
        const aiResponse = await this.novitaClient.callMedicalAI(query, {
            patientId,
            vitalSigns,
            ...context
        });
        const icpResponse = await this.icpClient.updateMedicalRecord({
            ...queryData,
            aiResponse,
            timestamp: Date.now()
        });

        return {
            queryId: icpResponse.queryId,
            content: aiResponse.content,
            safetyScore: aiResponse.safetyScore,
            urgency: aiResponse.urgency,
            requiresReview: aiResponse.requiresReview,
            timestamp: aiResponse.timestamp
        };
    }

    async getPatientHistoryRest(patientId, options) {
        return await this.getPatientHistory(patientId, options);
    }

    async getPatientHistory(patientId, options) {
        // Implement patient history retrieval
        // This would typically call the ICP canister
        return await this.icpClient.getPatientHistory(patientId, options);
    }

    async processDoctorReview(reviewData) {
        // Implement doctor review processing
        return await this.icpClient.processDoctorReview(reviewData);
    }

    // Utility methods
    isRateLimited(clientIP) {
        const now = Date.now();
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10;

        if (!this.rateLimiter.has(clientIP)) {
            this.rateLimiter.set(clientIP, { count: 1, firstRequest: now });
            return false;
        }

        const rateData = this.rateLimiter.get(clientIP);

        if (now - rateData.firstRequest > windowMs) {
            // Reset window
            this.rateLimiter.set(clientIP, { count: 1, firstRequest: now });
            return false;
        }

        rateData.count++;

        if (rateData.count > maxRequests * 0.8) {
            this.metrics.recordRateLimit('warning');
        }

        return rateData.count > maxRequests;
    }

    sendMessage(ws, type, payload, requestId = null) {
        if (ws.readyState === WebSocket.OPEN) {
            const message = {
                type,
                payload,
                timestamp: Date.now(),
                requestId
            };

            ws.send(JSON.stringify(message));
        }
    }

    sendError(ws, code, message, requestId = null) {
        this.sendMessage(ws, 'error', {
            code,
            message,
            timestamp: Date.now()
        }, requestId);
    }

    broadcastUpdate(subscription, data) {
        const connections = this.connectionManager.getActiveConnections();

        connections.forEach(connection => {
            if (connection.subscriptions && connection.subscriptions.has(subscription)) {
                this.sendMessage(connection.ws, 'real_time_update', {
                    subscription,
                    ...data
                });
            }
        });
    }

    setupHeartbeat() {
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    ws.terminate();
                    return;
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000);

        this.wss.on('close', () => {
            clearInterval(interval);
        });
    }

    setupMessageRoutes() {
        // Override message router methods with bridge implementations
        this.messageRouter.handleMedicalQuery = this.handleMedicalQuery.bind(this);
        this.messageRouter.handleGetHistory = this.handleGetHistory.bind(this);
        this.messageRouter.handleDoctorReview = this.handleDoctorReview.bind(this);
        this.messageRouter.handleQueryStatus = this.handleQueryStatus.bind(this);
    }

    setupMetrics() {
        // Periodic metrics collection
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60000); // Every minute
    }

    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        const connectionStats = this.connectionManager.getConnectionStats();
        const queueStats = this.requestQueue.getQueueStats();

        // Log metrics for monitoring systems
        console.log('📊 System Metrics:', {
            memory: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            connections: connectionStats.active,
            queue: queueStats.totalQueued,
            uptime: Math.round(process.uptime())
        });
    }

    setupReconnectionLogic() {
        // Client-side reconnection is handled by the frontend
        // Server-side we track reconnection attempts for metrics
        this.wss.on('connection', (ws, req) => {
            const clientIP = req.socket.remoteAddress;

            // Check if this is a reconnection
            if (this.connectionManager.reconnectionAttempts.has(clientIP)) {
                this.metrics.recordReconnection();
                this.connectionManager.reconnectionAttempts.delete(clientIP);
            }
        });
    }

    setupHealthCheck() {
        // Periodic health check
        setInterval(async () => {
            try {
                // Check Novita AI connectivity
                await this.novitaClient.healthCheck();
                this.metrics.updateHealthStatus('novitaApi', 'healthy');

                // Check ICP canister connectivity
                await this.icpClient.healthCheck();
                this.metrics.updateHealthStatus('icpCanister', 'healthy');

                console.log(`💚 Health check passed - Connections: ${this.connectionManager.connections.size}`);
            } catch (error) {
                console.error(`💔 Health check failed:`, error);
                this.metrics.updateHealthStatus('novitaApi', 'unhealthy');
                this.metrics.updateHealthStatus('icpCanister', 'unhealthy');
            }
        }, 60000); // Every minute
    }

    // Graceful shutdown
    shutdown() {
        console.log('🛑 Shutting down TrustCare Bridge...');

        // Close all WebSocket connections
        this.connectionManager.getActiveConnections().forEach((connection) => {
            connection.ws.close(1001, 'Server shutting down');
        });

        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }

        // Close HTTP server
        if (this.httpServer) {
            this.httpServer.close();
        }

        console.log('✅ TrustCare Bridge shutdown complete');
    }
}

// Initialize and start the bridge
const bridge = new TrustCareBridge();

// Handle graceful shutdown
process.on('SIGTERM', () => bridge.shutdown());
process.on('SIGINT', () => bridge.shutdown());

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    bridge.shutdown();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = TrustCareBridge;