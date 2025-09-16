// Main application logic for TrustCareConnect Frontend
import { Config } from './config.js';
import { BackendManager } from './backend.js';
import { UIManager } from './ui.js';
import { errorHandler } from './errorHandler.js';
import { mockResponseManager } from './mockResponses.js';
import { logger, performanceMonitor } from './logger.js';
import { offlineManager } from './offlineManager.js';

export class TrustCareApp {
    constructor() {
        this.backend = new BackendManager();
        this.ui = new UIManager();

        // Bind UI to backend connection events
        this.backend.addConnectionListener((status, message) => {
            this.ui.updateConnectionStatus(status, message);
        });
    }

    // Initialize the application
    async initialize() {
        try {
            console.log('Initializing TrustCareConnect application...');

            // Setup global error handling
            errorHandler.setupGlobalErrorHandling();

            // Try to connect to backend
            const connected = await this.backend.initialize();

            if (!connected) {
                this.ui.showMockMode();
            } else {
                // Load initial dashboard data
                await this.loadDashboardData();
            }

            // Setup event listeners
            this.setupEventListeners();

            console.log('TrustCareConnect application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize application:', error);
            errorHandler.notifyError(error, {
                category: 'application_initialization',
                source: 'app_initialize'
            });
            this.ui.showMockMode();
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

        try {
            let response;

            if (!this.backend.isConnected) {
                logger.info('Backend not connected, handling offline', {
                    patientId: formData.patientId,
                    isOnline: offlineManager.isOnline
                }, 'offline_handling');

                // Handle offline query processing
                if (offlineManager.isOnline) {
                    // Online but backend disconnected - show mock response
                    await this.simulateMockResponse(formData.patientId, formData.queryText, formData.vitalSigns);
                } else {
                    // Completely offline - queue for sync
                    const queued = offlineManager.queueMedicalQuery(
                        formData.patientId,
                        formData.queryText,
                        formData.vitalSigns
                    );

                    if (!queued) {
                        // Queue is full, show error
                        return;
                    }
                }
                return;
            }

            // Process real query through backend
            const result = await this.backend.processMedicalQuery(
                formData.patientId,
                formData.queryText,
                formData.vitalSigns
            );

            if (result.ok) {
                response = result.ok;
                this.ui.showResponse(result.ok);

                // Log successful medical query
                logger.logMedicalQuery(
                    formData.patientId,
                    formData.queryText,
                    formData.vitalSigns,
                    result.ok
                );
            } else {
                throw new Error(result.err);
            }

        } catch (error) {
            logger.error('Error submitting medical query', {
                error: error.message,
                patientId: formData.patientId,
                queryLength: formData.queryText?.length
            }, 'medical_query_error');

            console.error('Error submitting query:', error);

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
            performanceMonitor.end(queryTimer, {
                hasVitalSigns: Object.keys(formData.vitalSigns).some(key => formData.vitalSigns[key]),
                backendConnected: this.backend.isConnected
            });

            this.ui.setSubmitButtonLoading(false);
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new TrustCareApp();

    // Expose debugging tools in development
    if (Config.isDevelopment()) {
        window.logger = logger;
        window.performanceMonitor = performanceMonitor;
        window.offlineManager = offlineManager;
        window.debugLogs = () => window.app.ui.showDebugLogs();
        window.offlineStats = () => offlineManager.getOfflineStatistics();

        logger.info('Debug tools available', {
            tools: [
                'window.logger',
                'window.performanceMonitor',
                'window.offlineManager',
                'window.debugLogs()',
                'window.offlineStats()'
            ]
        }, 'debug_tools');
    }

    await window.app.initialize();
});