// WebSocket Manager for TrustCareConnect Bridge Integration
import { Config } from './config.js';
import { logger } from './logger.js';

export class WebSocketManager {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // Start with 1 second
        this.heartbeatInterval = null;
        this.heartbeatTimer = 30000; // 30 seconds

        // Message handling
        this.messageHandlers = new Map();
        this.responseQueue = new Map(); // queryId -> response data
        this.pendingQueries = new Map(); // queryId -> query data
        this.offlineQueue = [];

        // Connection listeners
        this.connectionListeners = [];

        // WebSocket URL configuration
        this.wsUrl = Config.get('websocket.url') || 'ws://localhost:8080';

        this.setupMessageHandlers();
    }

    // Add connection status listener
    addConnectionListener(callback) {
        this.connectionListeners.push(callback);
    }

    // Notify all connection listeners
    notifyConnectionListeners(status, message, details = {}) {
        this.connectionListeners.forEach(listener => {
            try {
                listener(status, message, details);
            } catch (error) {
                console.error('Error in connection listener:', error);
            }
        });
    }

    // Setup default message handlers
    setupMessageHandlers() {
        // Query response handler
        this.messageHandlers.set('query_response', (data) => {
            this.handleQueryResponse(data);
        });

        // Query progress handler
        this.messageHandlers.set('query_progress', (data) => {
            this.handleQueryProgress(data);
        });

        // Doctor review update handler
        this.messageHandlers.set('doctor_review_update', (data) => {
            this.handleDoctorReviewUpdate(data);
        });

        // Queue status handler
        this.messageHandlers.set('queue_status', (data) => {
            this.handleQueueStatus(data);
        });

        // System status handler
        this.messageHandlers.set('system_status', (data) => {
            this.handleSystemStatus(data);
        });

        // Error handler
        this.messageHandlers.set('error', (data) => {
            this.handleError(data);
        });

        // Heartbeat response handler
        this.messageHandlers.set('pong', (data) => {
            logger.debug('Heartbeat pong received', data);
        });
    }

    // Connect to WebSocket
    async connect() {
        if (this.isConnected || this.isConnecting) {
            return Promise.resolve(true);
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                logger.info(`Connecting to WebSocket: ${this.wsUrl}`);

                this.ws = new WebSocket(this.wsUrl);

                // Connection opened
                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000;

                    logger.info('WebSocket connected successfully');
                    this.notifyConnectionListeners('connected', 'WebSocket connected', {
                        url: this.wsUrl,
                        reconnectAttempts: this.reconnectAttempts
                    });

                    this.startHeartbeat();
                    this.processOfflineQueue();

                    resolve(true);
                };

                // Message received
                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                // Connection closed
                this.ws.onclose = (event) => {
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.stopHeartbeat();

                    logger.warn(`WebSocket connection closed`, {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean
                    });

                    this.notifyConnectionListeners('disconnected',
                        `Connection closed: ${event.reason || 'Unknown reason'}`, {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean
                    });

                    // Attempt reconnection unless it was a clean close
                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        this.notifyConnectionListeners('failed', 'Max reconnection attempts reached');
                    }
                };

                // Connection error
                this.ws.onerror = (error) => {
                    logger.error('WebSocket connection error', error);
                    this.notifyConnectionListeners('error', 'WebSocket connection error', { error });

                    if (this.isConnecting) {
                        reject(error);
                    }
                };

            } catch (error) {
                this.isConnecting = false;
                logger.error('Failed to create WebSocket connection', error);
                this.notifyConnectionListeners('error', 'Failed to create connection', { error });
                reject(error);
            }
        });
    }

    // Schedule reconnection with exponential backoff
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

        logger.info(`Scheduling WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        this.notifyConnectionListeners('reconnecting',
            `Reconnecting in ${Math.round(delay/1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
            attempt: this.reconnectAttempts,
            delay: delay
        });

        setTimeout(() => {
            this.connect().catch(error => {
                logger.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
            });
        }, delay);
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'User initiated disconnect');
            this.ws = null;
        }
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
    }

    // Start heartbeat to keep connection alive
    startHeartbeat() {
        this.stopHeartbeat(); // Clear any existing heartbeat

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendMessage('ping', {
                    timestamp: Date.now(),
                    clientId: this.getClientId()
                });
            }
        }, this.heartbeatTimer);

        logger.debug('Heartbeat started', { interval: this.heartbeatTimer });
    }

    // Stop heartbeat
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            logger.debug('Heartbeat stopped');
        }
    }

    // Send message through WebSocket
    sendMessage(type, data = {}) {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            logger.warn('Cannot send message: WebSocket not connected', { type, data });
            return false;
        }

        try {
            const message = {
                type: type,
                data: data,
                timestamp: Date.now(),
                clientId: this.getClientId()
            };

            this.ws.send(JSON.stringify(message));
            logger.debug('WebSocket message sent', { type, messageSize: JSON.stringify(message).length });
            return true;
        } catch (error) {
            logger.error('Failed to send WebSocket message', { type, data, error });
            return false;
        }
    }

    // Handle incoming WebSocket messages
    handleMessage(messageData) {
        try {
            const message = JSON.parse(messageData);

            logger.debug('WebSocket message received', {
                type: message.type,
                hasData: !!message.data,
                timestamp: message.timestamp
            });

            // Route message to appropriate handler
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
                handler(message.data);
            } else {
                logger.warn('No handler found for message type', { type: message.type });
            }

        } catch (error) {
            logger.error('Failed to parse WebSocket message', { messageData, error });
        }
    }

    // Submit medical query via WebSocket
    async submitMedicalQuery(patientId, queryText, vitalSigns = {}) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }

        const queryId = this.generateQueryId();
        const queryData = {
            queryId: queryId,
            patientId: patientId,
            queryText: queryText,
            vitalSigns: vitalSigns,
            timestamp: Date.now(),
            channel: 'websocket'
        };

        // Store query in pending queries
        this.pendingQueries.set(queryId, queryData);

        // Send query via WebSocket
        const sent = this.sendMessage('medical_query', queryData);

        if (!sent) {
            this.pendingQueries.delete(queryId);
            throw new Error('Failed to send query via WebSocket');
        }

        logger.info('Medical query submitted via WebSocket', {
            queryId,
            patientId,
            queryLength: queryText.length
        });

        return queryId;
    }

    // Handle query response
    handleQueryResponse(data) {
        const { queryId } = data;

        if (!queryId) {
            logger.error('Query response missing queryId', data);
            return;
        }

        logger.info('Query response received', { queryId, safetyScore: data.safetyScore });

        // Store response and remove from pending
        this.responseQueue.set(queryId, data);
        this.pendingQueries.delete(queryId);

        // Trigger response callback if registered
        if (this.queryResponseCallback) {
            this.queryResponseCallback(queryId, data);
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('wsQueryResponse', {
            detail: { queryId, data }
        }));
    }

    // Handle query progress updates
    handleQueryProgress(data) {
        const { queryId, step, status, message } = data;

        logger.debug('Query progress update', { queryId, step, status });

        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('wsQueryProgress', {
            detail: { queryId, step, status, message }
        }));
    }

    // Handle doctor review updates
    handleDoctorReviewUpdate(data) {
        const { queryId, status, doctorId, message } = data;

        logger.info('Doctor review update', { queryId, status, doctorId });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('wsDoctorReviewUpdate', {
            detail: { queryId, status, doctorId, message }
        }));
    }

    // Handle queue status updates
    handleQueueStatus(data) {
        logger.debug('Queue status update', data);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('wsQueueStatus', {
            detail: data
        }));
    }

    // Handle system status updates
    handleSystemStatus(data) {
        logger.debug('System status update', data);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('wsSystemStatus', {
            detail: data
        }));
    }

    // Handle error messages
    handleError(data) {
        logger.error('WebSocket error message received', data);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('wsError', {
            detail: data
        }));
    }

    // Process offline queue when connection is restored
    processOfflineQueue() {
        if (this.offlineQueue.length === 0) {
            return;
        }

        logger.info(`Processing ${this.offlineQueue.length} queued queries`);

        // Process queued queries
        const queueCopy = [...this.offlineQueue];
        this.offlineQueue = [];

        queueCopy.forEach(async (queuedQuery) => {
            try {
                await this.submitMedicalQuery(
                    queuedQuery.patientId,
                    queuedQuery.queryText,
                    queuedQuery.vitalSigns
                );
                logger.info('Queued query processed successfully', {
                    originalTimestamp: queuedQuery.timestamp
                });
            } catch (error) {
                logger.error('Failed to process queued query', {
                    queuedQuery,
                    error
                });
                // Re-queue if it fails
                this.offlineQueue.push(queuedQuery);
            }
        });
    }

    // Add query to offline queue
    queueOfflineQuery(patientId, queryText, vitalSigns = {}) {
        if (this.offlineQueue.length >= Config.get('websocket.maxOfflineQueue', 10)) {
            logger.warn('Offline queue is full, dropping oldest query');
            this.offlineQueue.shift();
        }

        this.offlineQueue.push({
            patientId,
            queryText,
            vitalSigns,
            timestamp: Date.now()
        });

        logger.info('Query added to offline queue', {
            patientId,
            queueSize: this.offlineQueue.length
        });
    }

    // Register query response callback
    onQueryResponse(callback) {
        this.queryResponseCallback = callback;
    }

    // Get connection statistics
    getConnectionStats() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            reconnectAttempts: this.reconnectAttempts,
            pendingQueries: this.pendingQueries.size,
            responseQueue: this.responseQueue.size,
            offlineQueue: this.offlineQueue.length,
            wsUrl: this.wsUrl
        };
    }

    // Generate unique query ID
    generateQueryId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Generate or get client ID
    getClientId() {
        if (!this.clientId) {
            this.clientId = localStorage.getItem('trustcare_client_id') ||
                          `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('trustcare_client_id', this.clientId);
        }
        return this.clientId;
    }

    // Get pending query by ID
    getPendingQuery(queryId) {
        return this.pendingQueries.get(queryId);
    }

    // Get response by query ID
    getResponse(queryId) {
        return this.responseQueue.get(queryId);
    }

    // Clear response from queue
    clearResponse(queryId) {
        this.responseQueue.delete(queryId);
    }
}