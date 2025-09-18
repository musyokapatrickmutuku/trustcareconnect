// Main application logic for TrustCareConnect Frontend
import { Config } from './config.js';
import { BackendManager } from './backend.js';
import { UIManager } from './ui.js';
import { WebSocketManager } from './websocketManager.js';
import { WebSocketUIManager } from './websocketUI.js';
import { errorHandler } from './errorHandler.js';
import { mockResponseManager } from './mockResponses.js';
import { logger, performanceMonitor } from './logger.js';
import { offlineManager } from './offlineManager.js';

export class TrustCareApp {
    constructor() {
        this.backend = new BackendManager();
        this.ui = new UIManager();
        this.websocket = new WebSocketManager();
        this.websocketUI = new WebSocketUIManager();

        // Connection preferences
        this.preferWebSocket = true;
        this.fallbackToICP = true;

        // Bind UI to backend connection events
        this.backend.addConnectionListener((status, message) => {
            this.ui.updateConnectionStatus(status, message);
            this.websocketUI.updateConnectionStatus('icp', status, message);
        });

        // Bind WebSocket connection events
        this.websocket.addConnectionListener((status, message, details) => {
            this.websocketUI.updateConnectionStatus('websocket', status, message, details);
            this.handleWebSocketConnectionChange(status, message, details);
        });

        // Bind WebSocket query response handler
        this.websocket.onQueryResponse((queryId, data) => {
            this.handleWebSocketQueryResponse(queryId, data);
        });
    }

    // Initialize the application
    async initialize() {
        try {
            console.log('Initializing TrustCareConnect application...');

            // Setup global error handling
            errorHandler.setupGlobalErrorHandling();

            // Initialize connection status
            this.websocketUI.updateConnectionStatus('websocket', 'connecting', 'Connecting...');
            this.websocketUI.updateConnectionStatus('icp', 'connecting', 'Connecting...');
            this.websocketUI.updateConnectionStatus('bridge', 'connecting', 'Checking...');

            // Try to connect to WebSocket first (preferred)
            let wsConnected = false;
            if (this.preferWebSocket) {
                try {
                    wsConnected = await this.websocket.connect();
                    if (wsConnected) {
                        this.websocketUI.updateConnectionStatus('bridge', 'connected', 'Connected');
                        logger.info('WebSocket connection established');
                    }
                } catch (error) {
                    logger.warn('WebSocket connection failed, will try fallback', error);
                    this.websocketUI.updateConnectionStatus('bridge', 'disconnected', 'Failed');
                }
            }

            // Try to connect to ICP backend
            const icpConnected = await this.backend.initialize();

            if (!icpConnected && !wsConnected) {
                this.ui.showMockMode();
                this.websocketUI.updateConnectionStatus('icp', 'disconnected', 'Failed');
            } else if (icpConnected) {
                // Load initial dashboard data
                await this.loadDashboardData();
                this.websocketUI.updateConnectionStatus('icp', 'connected', 'Connected');
            }

            // Setup event listeners
            this.setupEventListeners();

            // Log connection summary
            const connSummary = this.websocketUI.getConnectionSummary();
            logger.info('Application initialized', {
                websocket: wsConnected,
                icp: icpConnected,
                connectionSummary: connSummary
            });

            console.log('TrustCareConnect application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            errorHandler.notifyError(error, {
                category: 'application_initialization',
                source: 'app_initialize'
            });
            this.ui.showMockMode();
            this.websocketUI.updateConnectionStatus('websocket', 'error', 'Error');
            this.websocketUI.updateConnectionStatus('icp', 'error', 'Error');
            this.websocketUI.updateConnectionStatus('bridge', 'error', 'Error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Medical query form submission
        const form = document.getElementById('medicalQueryForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleQuerySubmission(e));
        }

        // Navigation buttons
        const navButtons = document.querySelectorAll('[onclick*="showSection"]');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const section = button.getAttribute('onclick').match(/showSection\('([^']+)'\)/)?.[1];
                if (section) {
                    this.ui.showSection(section);
                }
            });
        });

        // Initialize backend button
        const initButton = document.querySelector('[onclick*="initializeBackend"]');
        if (initButton) {
            initButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.reinitializeBackend();
            });
        }
    }

    // Handle medical query submission
    async handleQuerySubmission(event) {
        event.preventDefault();

        const formData = this.ui.getFormData();

        logger.logUserInteraction('query_submission_started', 'medical_query_form', {
            patientId: formData.patientId,
            queryLength: formData.queryText?.length || 0,
            hasVitalSigns: Object.keys(formData.vitalSigns).some(key => formData.vitalSigns[key])
        });

        if (!this.ui.validateForm(formData)) {
            logger.warn('Form validation failed', formData, 'form_validation');
            return;
        }

        // Show loading state
        this.ui.setSubmitButtonLoading(true);
        this.ui.hideResponseContainer();

        const queryTimer = performanceMonitor.start('medical_query_processing');
        let queryId = null;
        let usedWebSocket = false;

        try {
            // Step 1: Try WebSocket first (preferred method)
            if (this.websocket.isConnected && this.preferWebSocket) {
                logger.info('Attempting WebSocket submission', {
                    patientId: formData.patientId,
                    wsConnected: this.websocket.isConnected
                });

                try {
                    // Show progress indicator
                    queryId = await this.websocket.submitMedicalQuery(
                        formData.patientId,
                        formData.queryText,
                        formData.vitalSigns
                    );

                    this.websocketUI.showQueryProgress(queryId);
                    this.websocketUI.updateLoadingText('Processing via WebSocket Bridge...');

                    usedWebSocket = true;
                    logger.info('Query submitted via WebSocket', { queryId });

                    // WebSocket handles the response asynchronously through events
                    return;

                } catch (wsError) {
                    logger.warn('WebSocket submission failed, trying ICP fallback', wsError);
                    this.websocketUI.hideQueryProgress();

                    if (!this.fallbackToICP) {
                        throw wsError;
                    }
                    // Continue to ICP fallback below
                }
            }

            // Step 2: ICP Backend fallback
            if (this.backend.isConnected && this.fallbackToICP) {
                logger.info('Using ICP backend', {
                    patientId: formData.patientId,
                    icpConnected: this.backend.isConnected
                });

                this.websocketUI.updateLoadingText('Processing via ICP Backend...');

                const result = await this.backend.processMedicalQuery(
                    formData.patientId,
                    formData.queryText,
                    formData.vitalSigns
                );

                if (result.ok) {
                    // Update response channel indicator
                    const responseChannel = document.getElementById('responseChannel');
                    if (responseChannel) {
                        responseChannel.textContent = 'ICP Backend';
                    }

                    this.ui.showResponse(result.ok);

                    // Log successful medical query
                    logger.logMedicalQuery(
                        formData.patientId,
                        formData.queryText,
                        formData.vitalSigns,
                        result.ok
                    );

                    return;
                } else {
                    throw new Error(result.err);
                }
            }

            // Step 3: Offline handling
            if (!this.websocket.isConnected && !this.backend.isConnected) {
                logger.info('All connections failed, handling offline', {
                    patientId: formData.patientId,
                    isOnline: offlineManager.isOnline
                });

                if (offlineManager.isOnline) {
                    // Online but services disconnected - show mock response
                    await this.simulateMockResponse(formData.patientId, formData.queryText, formData.vitalSigns);

                    // Also queue for when services come back online
                    this.websocket.queueOfflineQuery(formData.patientId, formData.queryText, formData.vitalSigns);
                } else {
                    // Completely offline - queue for sync
                    const queued = offlineManager.queueMedicalQuery(
                        formData.patientId,
                        formData.queryText,
                        formData.vitalSigns
                    );

                    if (!queued) {
                        throw new Error('Offline queue is full. Please try again later.');
                    }

                    this.ui.showOfflineMessage('Query queued for when connection is restored');
                }
                return;
            }

            throw new Error('No available connection method');

        } catch (error) {
            logger.error('Error submitting medical query', {
                error: error.message,
                patientId: formData.patientId,
                queryLength: formData.queryText?.length,
                usedWebSocket,
                queryId
            }, 'medical_query_error');

            console.error('Error submitting query:', error);

            // Hide progress if it was shown
            if (queryId) {
                this.websocketUI.hideQueryProgress();
            }

            // Handle error with error handler
            const errorResponse = await errorHandler.handleMedicalQueryError(error, formData);

            if (errorResponse.fallbackAction === 'mock_response') {
                // Handle fallback based on network status
                if (offlineManager.isOnline) {
                    // Show fallback mock response with vital signs
                    await this.simulateMockResponse(formData.patientId, formData.queryText, formData.vitalSigns);
                } else {
                    // Queue for offline processing
                    offlineManager.queueMedicalQuery(
                        formData.patientId,
                        formData.queryText,
                        formData.vitalSigns
                    );
                }
            } else {
                alert('Failed to submit query: ' + (errorResponse.message || error.message));
            }
        } finally {
            // Only hide loading if we're not waiting for WebSocket response
            if (!usedWebSocket || queryId === null) {
                performanceMonitor.end(queryTimer, {
                    hasVitalSigns: Object.keys(formData.vitalSigns).some(key => formData.vitalSigns[key]),
                    backendConnected: this.backend.isConnected,
                    websocketConnected: this.websocket.isConnected,
                    usedWebSocket
                });

                this.ui.setSubmitButtonLoading(false);
            }
        }
    }

    // Simulate mock response when backend is offline
    async simulateMockResponse(patientId, queryText, vitalSigns = {}) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Generate intelligent mock response based on patient and query
                const mockResponse = mockResponseManager.generateMockResponse(
                    patientId,
                    queryText,
                    vitalSigns
                );

                this.ui.showResponse(mockResponse);
                resolve();
            }, Config.get('ui.loadingSimulationDelay'));
        });
    }

    // Load dashboard data
    async loadDashboardData() {
        if (!this.backend.isConnected) {
            console.warn('Backend not connected, cannot load dashboard data');
            return;
        }

        try {
            const [stats, healthCheck] = await Promise.all([
                this.backend.getStats(),
                this.backend.healthCheck()
            ]);

            this.ui.updateDashboardStats(stats);
            this.ui.updateHealthCheck(healthCheck);

        } catch (error) {
            console.error('Error loading dashboard data:', error);

            // Handle dashboard error with error handler
            errorHandler.notifyError(error, {
                category: 'dashboard_data',
                source: 'load_dashboard_data'
            });

            const backendStatus = document.getElementById('backendStatus');
            if (backendStatus) backendStatus.textContent = '❌ Error';
            this.ui.updateHealthCheck('Error loading: ' + error.message);
        }
    }

    // Reinitialize backend connection
    async reinitializeBackend() {
        await this.backend.initialize();
    }

    // Handle WebSocket connection state changes
    handleWebSocketConnectionChange(status, message, details) {
        logger.info('WebSocket connection state changed', { status, message, details });

        switch (status) {
            case 'connected':
                // Update UI to show WebSocket is available
                this.websocketUI.showNotification('WebSocket connected - Real-time updates enabled', 'success');
                break;
            case 'reconnecting':
                this.websocketUI.showNotification(`Reconnecting... (${message})`, 'info');
                break;
            case 'disconnected':
                if (this.backend.isConnected) {
                    this.websocketUI.showNotification('WebSocket disconnected - Using ICP fallback', 'warning');
                } else {
                    this.websocketUI.showNotification('All services disconnected - Working offline', 'error');
                }
                break;
            case 'failed':
                this.websocketUI.showNotification('WebSocket connection failed - Using fallback methods', 'error');
                break;
        }
    }

    // Handle WebSocket query response
    handleWebSocketQueryResponse(queryId, data) {
        logger.info('WebSocket query response received', { queryId, data });

        // Hide loading state
        this.ui.setSubmitButtonLoading(false);

        // Show the response
        this.ui.showResponse(data);

        // Update safety score and urgency in UI
        const safetyScore = document.getElementById('safetyScore');
        if (safetyScore && data.safetyScore !== undefined) {
            safetyScore.textContent = data.safetyScore;
        }

        const urgencyLevel = document.getElementById('urgencyLevel');
        if (urgencyLevel && data.urgency) {
            urgencyLevel.textContent = data.urgency;
            urgencyLevel.className = `urgency-${data.urgency.toLowerCase()}`;
        }

        // Log successful WebSocket query
        logger.logMedicalQuery(
            data.patientId || 'unknown',
            'WebSocket query response',
            {},
            data
        );

        // Performance monitoring
        const queryTimer = performanceMonitor.getActiveTimer('medical_query_processing');
        if (queryTimer) {
            performanceMonitor.end(queryTimer, {
                websocketConnected: true,
                usedWebSocket: true,
                safetyScore: data.safetyScore
            });
        }
    }

    // Get connection status summary
    getConnectionStatus() {
        return {
            websocket: {
                connected: this.websocket.isConnected,
                connecting: this.websocket.isConnecting,
                stats: this.websocket.getConnectionStats()
            },
            icp: {
                connected: this.backend.isConnected,
                stats: this.backend.getConnectionStats ? this.backend.getConnectionStats() : {}
            },
            ui: this.websocketUI.getConnectionSummary()
        };
    }

    // Force reconnect to all services
    async reconnectAll() {
        logger.info('Forcing reconnection to all services');

        // Reset UI
        this.websocketUI.reset();

        // Try to reconnect WebSocket
        if (!this.websocket.isConnected) {
            try {
                await this.websocket.connect();
            } catch (error) {
                logger.warn('WebSocket reconnection failed', error);
            }
        }

        // Try to reconnect ICP backend
        if (!this.backend.isConnected) {
            try {
                await this.backend.initialize();
            } catch (error) {
                logger.warn('ICP backend reconnection failed', error);
            }
        }
    }
}

// Global functions for backward compatibility
window.showSection = function(sectionName) {
    if (window.app) {
        window.app.ui.showSection(sectionName);
    }
};

window.initializeBackend = function() {
    if (window.app) {
        window.app.reinitializeBackend();
    }
};

window.reconnectAll = function() {
    if (window.app) {
        window.app.reconnectAll();
    }
};

window.getConnectionStatus = function() {
    if (window.app) {
        return window.app.getConnectionStatus();
    }
    return null;
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new TrustCareApp();

    // Expose debugging tools in development
    if (Config.isDevelopment()) {
        window.logger = logger;
        window.performanceMonitor = performanceMonitor;
        window.offlineManager = offlineManager;
        window.websocket = window.app.websocket;
        window.websocketUI = window.app.websocketUI;
        window.debugLogs = () => window.app.ui.showDebugLogs();
        window.offlineStats = () => offlineManager.getOfflineStatistics();
        window.wsStats = () => window.app.websocket.getConnectionStats();
        window.connectionStatus = () => window.app.getConnectionStatus();

        logger.info('Debug tools available', {
            tools: [
                'window.logger',
                'window.performanceMonitor',
                'window.offlineManager',
                'window.websocket',
                'window.websocketUI',
                'window.debugLogs()',
                'window.offlineStats()',
                'window.wsStats()',
                'window.connectionStatus()',
                'window.reconnectAll()'
            ]
        }, 'debug_tools');
    }

    await window.app.initialize();
});