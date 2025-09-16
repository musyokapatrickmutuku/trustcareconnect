// Backend connection and management for TrustCareConnect
import { Config } from './config.js';
import { errorHandler, RetryStrategies } from './errorHandler.js';
import { logger } from './logger.js';

export class BackendManager {
    constructor() {
        this.actor = null;
        this.isConnected = false;
        this.connectionListeners = [];
        this.circuitBreaker = errorHandler.createCircuitBreaker('backend', {
            failureThreshold: 3,
            resetTimeout: 60000
        });

        // Setup error handling
        errorHandler.addErrorListener((error, context) => {
            if (context.category === 'backend_connection') {
                this.handleConnectionError(error, context);
            }
        });
    }

    // Add connection status listener
    addConnectionListener(callback) {
        this.connectionListeners.push(callback);
    }

    // Notify all connection listeners
    notifyConnectionChange(status, message) {
        this.connectionListeners.forEach(callback => callback(status, message));
    }

    // Initialize backend connection
    async initialize() {
        logger.info('Starting backend initialization', {
            environment: Config.isDevelopment() ? 'development' : 'production'
        }, 'backend_init');

        return await errorHandler.retryWithBackoff(async () => {
            this.notifyConnectionChange('connecting', 'Connecting to backend...');

            return await this.circuitBreaker.execute(async () => {
                const backendConfig = Config.getBackendConfig();

                logger.debug('Backend configuration', {
                    host: backendConfig.host,
                    canisterId: backendConfig.canisterId,
                    isLocal: backendConfig.isLocal
                }, 'backend_config');

                if (Config.isDevelopment() || backendConfig.isLocal) {
                    await this.connectToLocalBackend();
                } else {
                    await this.connectToRemoteBackend();
                }

                logger.info('Backend connection successful', {
                    isConnected: this.isConnected
                }, 'backend_connection');

                return true;
            });
        }, RetryStrategies.BACKEND_CONNECTION).catch(error => {
            logger.error('Failed to initialize backend after retries', {
                error: error.message,
                retries: RetryStrategies.BACKEND_CONNECTION.maxRetries
            }, 'backend_init_failure');
            console.error('Failed to initialize backend after retries:', error);
            this.notifyConnectionChange('disconnected', 'Backend connection failed');
            return false;
        });
    }

    // Connect to backend based on environment
    async connectToLocalBackend() {
        try {
            // Check if IC Agent is loaded
            if (typeof IC === 'undefined') {
                throw new Error('IC Agent not loaded');
            }

            const { HttpAgent, Actor } = IC;
            const backendConfig = Config.getBackendConfig();

            // Create agent based on environment
            const agent = new HttpAgent({
                host: backendConfig.host
            });

            // Fetch root key only for local development
            if (backendConfig.fetchRootKey) {
                await agent.fetchRootKey();
            }

            // Define the Candid interface
            const idlFactory = ({ IDL }) => {
                const PatientId = IDL.Text;
                const VitalSigns = IDL.Record({
                    bloodGlucose: IDL.Opt(IDL.Float64),
                    bloodPressure: IDL.Opt(IDL.Text),
                    heartRate: IDL.Opt(IDL.Nat),
                    temperature: IDL.Opt(IDL.Float64),
                });

                const MedicalResponse = IDL.Record({
                    content: IDL.Text,
                    safetyScore: IDL.Nat,
                    urgency: IDL.Text,
                    timestamp: IDL.Int,
                    requiresReview: IDL.Bool,
                });

                const SystemStats = IDL.Record({
                    totalPatients: IDL.Nat,
                    totalDoctors: IDL.Nat,
                    totalQueries: IDL.Nat,
                    pendingQueries: IDL.Nat,
                    completedQueries: IDL.Nat,
                });

                const ApiResult = IDL.Variant({
                    ok: MedicalResponse,
                    err: IDL.Text,
                });

                return IDL.Service({
                    healthCheck: IDL.Func([], [IDL.Text], ['query']),
                    getStats: IDL.Func([], [SystemStats], ['query']),
                    initializeTestPatients: IDL.Func([], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
                    processMedicalQuery: IDL.Func([PatientId, IDL.Text, IDL.Opt(VitalSigns)], [ApiResult], []),
                });
            };

            // Create the actor
            this.actor = Actor.createActor(idlFactory, {
                agent,
                canisterId: backendConfig.canisterId,
            });

            // Test connection
            const healthCheck = await this.actor.healthCheck();
            console.log('Backend health check:', healthCheck);

            // Initialize test patients
            try {
                const result = await this.actor.initializeTestPatients();
                console.log('Test patients result:', result);
            } catch (error) {
                console.log('Test patients already exist or error:', error);
            }

            this.isConnected = true;
            this.notifyConnectionChange('connected', 'Connected to local backend');

        } catch (error) {
            console.error('Backend connection failed:', error);
            throw error;
        }
    }

    // Connect to remote backend (staging/production)
    async connectToRemoteBackend() {
        // Use the same connection logic but without fetching root key
        return this.connectToLocalBackend();
    }

    // Get system statistics
    async getStats() {
        if (!this.isConnected || !this.actor) {
            throw new Error('Backend not connected');
        }

        return await errorHandler.retryWithBackoff(async () => {
            return await this.actor.getStats();
        }, RetryStrategies.DASHBOARD_DATA);
    }

    // Get health check
    async healthCheck() {
        if (!this.isConnected || !this.actor) {
            throw new Error('Backend not connected');
        }

        return await errorHandler.retryWithBackoff(async () => {
            return await this.actor.healthCheck();
        }, RetryStrategies.DASHBOARD_DATA);
    }

    // Process medical query
    async processMedicalQuery(patientId, queryText, vitalSigns) {
        if (!this.isConnected || !this.actor) {
            throw new Error('Backend not connected');
        }

        return await errorHandler.retryWithBackoff(async () => {
            // Format vital signs for Candid interface
            const formattedVitals = {};
            if (vitalSigns.bloodGlucose) formattedVitals.bloodGlucose = [parseFloat(vitalSigns.bloodGlucose)];
            else formattedVitals.bloodGlucose = [];

            if (vitalSigns.bloodPressure) formattedVitals.bloodPressure = [vitalSigns.bloodPressure];
            else formattedVitals.bloodPressure = [];

            if (vitalSigns.heartRate) formattedVitals.heartRate = [parseInt(vitalSigns.heartRate)];
            else formattedVitals.heartRate = [];

            if (vitalSigns.temperature) formattedVitals.temperature = [parseFloat(vitalSigns.temperature)];
            else formattedVitals.temperature = [];

            const vitalsToSend = Object.values(formattedVitals).some(arr => arr.length > 0) ? [formattedVitals] : [];

            return await this.actor.processMedicalQuery(patientId, queryText, vitalsToSend);
        }, RetryStrategies.MEDICAL_QUERY);
    }

    // Handle connection errors
    handleConnectionError(error, context) {
        console.warn('Backend connection error:', error, context);

        if (context.retrying) {
            this.notifyConnectionChange('connecting', `Retrying connection (${context.attempt}/${context.maxRetries})...`);
        } else {
            this.notifyConnectionChange('disconnected', 'Connection failed');
        }
    }
}