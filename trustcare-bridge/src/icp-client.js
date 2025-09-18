const { HttpAgent, Actor } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const { v4: uuidv4 } = require('uuid');

/**
 * ICPClient - Comprehensive Internet Computer Protocol integration client
 * Features: Auto-reconnection, batch updates, audit logging, health monitoring
 */
class ICPClient {
    constructor() {
        this.canisterId = process.env.ICP_CANISTER_ID;
        this.host = process.env.ICP_AGENT_HOST || 'http://127.0.0.1:4943';

        if (!this.canisterId) {
            throw new Error('ICP_CANISTER_ID environment variable is required');
        }

        // Connection state
        this.agent = null;
        this.actor = null;
        this.isInitialized = false;
        this.lastHealthCheck = null;

        // Reconnection management
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second

        // Batch update management
        this.batchQueue = [];
        this.batchConfig = {
            maxSize: 10,
            flushInterval: 5000, // 5 seconds
            enabled: true
        };

        // Audit logging
        this.auditLog = [];
        this.auditConfig = {
            maxEntries: 1000,
            retentionDays: 90
        };

        // Initialize connection
        this.initialize();

        // Start batch processing
        this.startBatchProcessor();

        console.log('🔗 ICPClient initialized for TrustCareConnect');
    }

    /**
     * Establish connection to the canister with comprehensive error handling
     */
    async connectToCanister(canisterId = null, host = null) {
        const targetCanisterId = canisterId || this.canisterId;
        const targetHost = host || this.host;

        try {
            console.log(`🔗 Connecting to canister ${targetCanisterId} at ${targetHost}`);

            // Create HTTP Agent with retry configuration
            this.agent = new HttpAgent({
                host: targetHost,
                verifyQuerySignatures: process.env.NODE_ENV === 'production',
                retryTimes: 3,
                backoffStrategy: 'exponential'
            });

            // Fetch root key for local development
            if (process.env.NODE_ENV !== 'production') {
                await this.agent.fetchRootKey();
            }

            // Create actor with comprehensive IDL interface
            this.actor = Actor.createActor(this.getIDLFactory(), {
                agent: this.agent,
                canisterId: targetCanisterId
            });

            // Verify connection with health check
            await this.verifyCanisterHealth();

            this.isInitialized = true;
            this.reconnectAttempts = 0;
            this.canisterId = targetCanisterId;
            this.host = targetHost;

            console.log('✅ Successfully connected to ICP canister');
            this.updateAuditLog('canister_connected', {
                canisterId: targetCanisterId,
                host: targetHost
            });

            return true;

        } catch (error) {
            console.error('❌ Failed to connect to canister:', error);
            this.updateAuditLog('canister_connection_failed', {
                error: error.message,
                canisterId: targetCanisterId,
                host: targetHost
            });
            throw error;
        }
    }

    /**
     * IDL Interface Definition matching Motoko types
     */
    getIDLFactory() {
        return ({ IDL }) => {
            // Patient Profile Type
            const PatientProfile = IDL.Record({
                id: IDL.Text,
                diabetesType: IDL.Text,
                hba1c: IDL.Opt(IDL.Float64),
                medications: IDL.Vec(IDL.Text),
                allergies: IDL.Vec(IDL.Text),
                medicalHistory: IDL.Opt(IDL.Text),
                lastUpdate: IDL.Int
            });

            // Vital Signs Type
            const VitalSigns = IDL.Record({
                bloodGlucose: IDL.Opt(IDL.Float64),
                bloodPressure: IDL.Opt(IDL.Text),
                heartRate: IDL.Opt(IDL.Nat),
                temperature: IDL.Opt(IDL.Float64),
                weight: IDL.Opt(IDL.Float64),
                timestamp: IDL.Int
            });

            // Medical Query Type
            const MedicalQuery = IDL.Record({
                id: IDL.Text,
                patientId: IDL.Text,
                query: IDL.Text,
                vitalSigns: IDL.Opt(VitalSigns),
                timestamp: IDL.Int,
                status: IDL.Variant({
                    'submitted': IDL.Null,
                    'processing': IDL.Null,
                    'ai_processed': IDL.Null,
                    'doctor_approved': IDL.Null,
                    'completed': IDL.Null,
                    'rejected': IDL.Null
                }),
                priority: IDL.Nat
            });

            // AI Response Type
            const AIResponse = IDL.Record({
                queryId: IDL.Text,
                content: IDL.Text,
                fullResponse: IDL.Text,
                safetyScore: IDL.Nat,
                urgency: IDL.Variant({
                    'low': IDL.Null,
                    'medium': IDL.Null,
                    'high': IDL.Null
                }),
                requiresReview: IDL.Bool,
                modelVersion: IDL.Text,
                processingTime: IDL.Nat,
                timestamp: IDL.Int
            });

            // Audit Log Entry Type
            const AuditLogEntry = IDL.Record({
                id: IDL.Text,
                action: IDL.Text,
                userId: IDL.Opt(IDL.Text),
                patientId: IDL.Opt(IDL.Text),
                data: IDL.Text, // JSON serialized data
                timestamp: IDL.Int,
                ipAddress: IDL.Opt(IDL.Text),
                userAgent: IDL.Opt(IDL.Text)
            });

            // Result Types
            const QueryResult = IDL.Variant({
                'ok': MedicalQuery,
                'err': IDL.Text
            });

            const ResponseResult = IDL.Variant({
                'ok': AIResponse,
                'err': IDL.Text
            });

            const AuditResult = IDL.Variant({
                'ok': IDL.Vec(AuditLogEntry),
                'err': IDL.Text
            });

            // Batch Operation Type
            const BatchOperation = IDL.Record({
                operationType: IDL.Variant({
                    'storeResponse': IDL.Null,
                    'updateProfile': IDL.Null,
                    'logAudit': IDL.Null
                }),
                data: IDL.Text // JSON serialized operation data
            });

            // Service Interface
            return IDL.Service({
                // Medical guidance functions
                'getMedicalGuidance': IDL.Func(
                    [IDL.Text, IDL.Text, IDL.Opt(VitalSigns)],
                    [ResponseResult],
                    []
                ),

                // Storage functions
                'storeResponse': IDL.Func(
                    [IDL.Text, AIResponse],
                    [IDL.Text],
                    []
                ),

                'storePatientProfile': IDL.Func(
                    [PatientProfile],
                    [IDL.Text],
                    []
                ),

                'storeMedicalQuery': IDL.Func(
                    [MedicalQuery],
                    [IDL.Text],
                    []
                ),

                // Batch operations
                'processBatchOperations': IDL.Func(
                    [IDL.Vec(BatchOperation)],
                    [IDL.Vec(IDL.Text)],
                    []
                ),

                // Audit functions
                'getAuditLog': IDL.Func(
                    [IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)], // patientId, limit, offset
                    [AuditResult],
                    ['query']
                ),

                'addAuditLogEntry': IDL.Func(
                    [AuditLogEntry],
                    [IDL.Text],
                    []
                ),

                // Query functions
                'getQueryStatus': IDL.Func(
                    [IDL.Text],
                    [IDL.Opt(MedicalQuery)],
                    ['query']
                ),

                'getPatientHistory': IDL.Func(
                    [IDL.Text, IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)], // patientId, limit, offset
                    [IDL.Vec(MedicalQuery)],
                    ['query']
                ),

                'getPatientProfile': IDL.Func(
                    [IDL.Text],
                    [IDL.Opt(PatientProfile)],
                    ['query']
                ),

                // Health and admin functions
                'getCanisterStatus': IDL.Func(
                    [],
                    [IDL.Record({
                        status: IDL.Text,
                        cyclesBalance: IDL.Nat,
                        memoryUsage: IDL.Nat,
                        totalQueries: IDL.Nat,
                        lastUpdate: IDL.Int
                    })],
                    ['query']
                ),

                'getCanisterMetrics': IDL.Func(
                    [],
                    [IDL.Record({
                        totalPatients: IDL.Nat,
                        totalQueries: IDL.Nat,
                        totalResponses: IDL.Nat,
                        averageResponseTime: IDL.Float64,
                        errorRate: IDL.Float64
                    })],
                    ['query']
                )
            });
        };
    }

    /**
     * Initialize connection with automatic retry
     */
    async initialize() {
        try {
            await this.connectToCanister();
        } catch (error) {
            console.error('❌ Initial connection failed, will retry:', error.message);
            // Start reconnection process
            this.scheduleReconnection();
        }
    }

    /**
     * Store AI response on blockchain with comprehensive data
     */
    async storeAIResponse(queryId, response) {
        try {
            await this.ensureConnection();

            console.log(`💾 Storing AI response for query ${queryId}`);

            // Format response for ICP storage
            const icpResponse = {
                queryId,
                content: response.content || '',
                fullResponse: response.fullResponse || response.content || '',
                safetyScore: BigInt(response.safetyScore || 0),
                urgency: this.formatUrgencyForICP(response.urgency || 'low'),
                requiresReview: response.requiresReview || false,
                modelVersion: response.modelVersion || 'unknown',
                processingTime: BigInt(response.processingTime || 0),
                timestamp: BigInt(response.timestamp || Date.now())
            };

            // Use batch processing if enabled
            if (this.batchConfig.enabled) {
                return await this.addToBatch('storeResponse', { queryId, response: icpResponse });
            }

            // Direct storage
            const result = await this.actor.storeResponse(queryId, icpResponse);

            this.updateAuditLog('ai_response_stored', {
                queryId,
                safetyScore: response.safetyScore,
                urgency: response.urgency,
                processingTime: response.processingTime
            });

            console.log('✅ AI response stored successfully:', result);
            return result;

        } catch (error) {
            console.error('❌ Error storing AI response:', error);
            this.updateAuditLog('ai_response_storage_failed', {
                queryId,
                error: error.message
            });

            // Attempt reconnection if connection issue
            if (this.isConnectionError(error)) {
                this.scheduleReconnection();
            }

            throw new Error(`Failed to store AI response: ${error.message}`);
        }
    }

    /**
     * Update audit log for compliance tracking
     */
    updateAuditLog(action, data) {
        const auditEntry = {
            id: uuidv4(),
            action,
            userId: data.userId || null,
            patientId: data.patientId || null,
            data: JSON.stringify(data),
            timestamp: Date.now(),
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null
        };

        // Add to local audit log
        this.auditLog.push(auditEntry);

        // Trim local log if too large
        if (this.auditLog.length > this.auditConfig.maxEntries) {
            this.auditLog.shift();
        }

        // Store on blockchain (use batch if enabled)
        if (this.isInitialized) {
            if (this.batchConfig.enabled) {
                this.addToBatch('logAudit', auditEntry);
            } else {
                this.storeAuditEntryOnChain(auditEntry).catch(error => {
                    console.error('❌ Failed to store audit entry on chain:', error);
                });
            }
        }

        console.log(`🔍 Audit log updated: ${action}`, data);
    }

    /**
     * Store audit entry on blockchain
     */
    async storeAuditEntryOnChain(auditEntry) {
        try {
            await this.ensureConnection();

            const icpAuditEntry = {
                id: auditEntry.id,
                action: auditEntry.action,
                userId: auditEntry.userId ? [auditEntry.userId] : [],
                patientId: auditEntry.patientId ? [auditEntry.patientId] : [],
                data: auditEntry.data,
                timestamp: BigInt(auditEntry.timestamp),
                ipAddress: auditEntry.ipAddress ? [auditEntry.ipAddress] : [],
                userAgent: auditEntry.userAgent ? [auditEntry.userAgent] : []
            };

            const result = await this.actor.addAuditLogEntry(icpAuditEntry);
            return result;

        } catch (error) {
            console.error('❌ Error storing audit entry on chain:', error);
            throw error;
        }
    }

    /**
     * Automatic reconnection on connection loss
     */
    scheduleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached. Manual intervention required.');
            this.updateAuditLog('reconnection_failed', {
                attempts: this.reconnectAttempts,
                reason: 'max_attempts_exceeded'
            });
            return;
        }

        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
        this.reconnectAttempts++;

        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

        setTimeout(async () => {
            try {
                await this.connectToCanister();
                console.log('✅ Reconnection successful');
                this.updateAuditLog('reconnection_successful', {
                    attempts: this.reconnectAttempts
                });
            } catch (error) {
                console.error('❌ Reconnection failed:', error.message);
                this.scheduleReconnection(); // Retry
            }
        }, delay);
    }

    /**
     * Verify canister health with comprehensive checks
     */
    async verifyCanisterHealth() {
        try {
            const startTime = Date.now();

            // Get canister status
            const status = await this.actor.getCanisterStatus();
            const responseTime = Date.now() - startTime;

            // Verify status is healthy
            if (!status || status.status !== 'running') {
                throw new Error(`Canister not healthy. Status: ${status?.status || 'unknown'}`);
            }

            // Check cycles balance (warn if low)
            const cyclesBalance = Number(status.cyclesBalance);
            if (cyclesBalance < 1000000000000) { // Less than 1T cycles
                console.warn('⚠️ Low cycles balance:', cyclesBalance);
            }

            // Check memory usage
            const memoryUsage = Number(status.memoryUsage);
            const memoryPercentage = (memoryUsage / (4 * 1024 * 1024 * 1024)) * 100; // Assuming 4GB limit
            if (memoryPercentage > 80) {
                console.warn('⚠️ High memory usage:', memoryPercentage.toFixed(2), '%');
            }

            this.lastHealthCheck = {
                timestamp: Date.now(),
                status: 'healthy',
                responseTime,
                cyclesBalance,
                memoryUsage,
                memoryPercentage: memoryPercentage.toFixed(2)
            };

            console.log('✅ Canister health check passed:', {
                responseTime: `${responseTime}ms`,
                cycles: `${(cyclesBalance / 1000000000000).toFixed(2)}T`,
                memory: `${memoryPercentage.toFixed(2)}%`
            });

            return this.lastHealthCheck;

        } catch (error) {
            const healthCheck = {
                timestamp: Date.now(),
                status: 'unhealthy',
                error: error.message
            };

            this.lastHealthCheck = healthCheck;
            console.error('❌ Canister health check failed:', error);
            throw error;
        }
    }

    /**
     * Batch updates to reduce cycles usage
     */
    startBatchProcessor() {
        if (!this.batchConfig.enabled) return;

        setInterval(() => {
            this.processBatch();
        }, this.batchConfig.flushInterval);

        console.log(`📦 Batch processor started (flush every ${this.batchConfig.flushInterval}ms)`);
    }

    /**
     * Add operation to batch queue
     */
    async addToBatch(operationType, data) {
        const batchOperation = {
            operationType: { [operationType]: null },
            data: JSON.stringify(data),
            timestamp: Date.now()
        };

        this.batchQueue.push(batchOperation);

        // Force flush if batch is full
        if (this.batchQueue.length >= this.batchConfig.maxSize) {
            return await this.processBatch();
        }

        return Promise.resolve('queued');
    }

    /**
     * Process batch operations
     */
    async processBatch() {
        if (this.batchQueue.length === 0) return;

        try {
            await this.ensureConnection();

            const operations = this.batchQueue.splice(0, this.batchConfig.maxSize);
            console.log(`📦 Processing batch of ${operations.length} operations`);

            const startTime = Date.now();
            const results = await this.actor.processBatchOperations(operations);
            const processingTime = Date.now() - startTime;

            console.log(`✅ Batch processed successfully in ${processingTime}ms`);
            this.updateAuditLog('batch_processed', {
                operationCount: operations.length,
                processingTime,
                results: results.length
            });

            return results;

        } catch (error) {
            console.error('❌ Batch processing failed:', error);
            this.updateAuditLog('batch_processing_failed', {
                error: error.message,
                queueSize: this.batchQueue.length
            });

            // Requeue operations on failure
            const failedOperations = this.batchQueue.splice(0, this.batchConfig.maxSize);
            this.batchQueue.unshift(...failedOperations);

            throw error;
        }
    }

    /**
     * Additional methods for comprehensive functionality
     */

    async getPatientHistory(patientId, options = {}) {
        try {
            await this.ensureConnection();

            const { limit = 20, offset = 0 } = options;
            const result = await this.actor.getPatientHistory(
                patientId,
                limit ? [BigInt(limit)] : [],
                offset ? [BigInt(offset)] : []
            );

            return result.map(query => this.formatMedicalQueryFromICP(query));

        } catch (error) {
            console.error('❌ Error getting patient history:', error);
            throw new Error(`Failed to get patient history: ${error.message}`);
        }
    }

    async getQueryStatus(queryId) {
        try {
            await this.ensureConnection();

            const result = await this.actor.getQueryStatus(queryId);

            if (result.length > 0) {
                const query = result[0];
                return {
                    status: this.formatQueryStatusFromICP(query.status),
                    queryId,
                    timestamp: Number(query.timestamp),
                    priority: Number(query.priority)
                };
            } else {
                throw new Error('Query not found');
            }

        } catch (error) {
            console.error('❌ Error getting query status:', error);
            throw new Error(`Failed to get query status: ${error.message}`);
        }
    }

    async processDoctorReview(reviewData) {
        try {
            await this.ensureConnection();

            this.updateAuditLog('doctor_review_processed', {
                queryId: reviewData.queryId,
                doctorId: reviewData.doctorId,
                action: reviewData.action
            });

            // Implementation depends on specific canister methods
            // This is a placeholder for the actual review processing
            return { success: true, reviewId: uuidv4() };

        } catch (error) {
            console.error('❌ Error processing doctor review:', error);
            throw new Error(`Failed to process doctor review: ${error.message}`);
        }
    }

    /**
     * Utility and helper methods
     */

    async ensureConnection() {
        if (!this.isInitialized) {
            await this.connectToCanister();
        }
    }

    isConnectionError(error) {
        const connectionErrorPatterns = [
            'network error',
            'connection refused',
            'timeout',
            'agent error',
            'canister error',
            'http error'
        ];

        const errorMessage = error.message.toLowerCase();
        return connectionErrorPatterns.some(pattern => errorMessage.includes(pattern));
    }

    formatUrgencyForICP(urgency) {
        const urgencyMap = {
            'low': { 'low': null },
            'medium': { 'medium': null },
            'high': { 'high': null }
        };
        return urgencyMap[urgency.toLowerCase()] || { 'low': null };
    }

    formatMedicalQueryFromICP(icpQuery) {
        return {
            id: icpQuery.id,
            patientId: icpQuery.patientId,
            query: icpQuery.query,
            vitalSigns: icpQuery.vitalSigns.length > 0 ? icpQuery.vitalSigns[0] : null,
            timestamp: Number(icpQuery.timestamp),
            status: this.formatQueryStatusFromICP(icpQuery.status),
            priority: Number(icpQuery.priority)
        };
    }

    formatQueryStatusFromICP(statusVariant) {
        const statusKeys = Object.keys(statusVariant);
        return statusKeys.length > 0 ? statusKeys[0] : 'unknown';
    }

    /**
     * Public API methods
     */

    async healthCheck() {
        try {
            return await this.verifyCanisterHealth();
        } catch (error) {
            throw new Error(`ICP canister health check failed: ${error.message}`);
        }
    }

    getConnectionInfo() {
        return {
            canisterId: this.canisterId,
            host: this.host,
            isInitialized: this.isInitialized,
            lastHealthCheck: this.lastHealthCheck,
            reconnectAttempts: this.reconnectAttempts,
            batchQueueSize: this.batchQueue.length,
            auditLogSize: this.auditLog.length
        };
    }

    getBatchStats() {
        return {
            queueSize: this.batchQueue.length,
            maxSize: this.batchConfig.maxSize,
            flushInterval: this.batchConfig.flushInterval,
            enabled: this.batchConfig.enabled
        };
    }

    getAuditLogLocal() {
        return this.auditLog.slice(); // Return copy
    }

    async getAuditLogFromChain(patientId = null, limit = 100, offset = 0) {
        try {
            await this.ensureConnection();

            const result = await this.actor.getAuditLog(
                patientId ? [patientId] : [],
                [BigInt(limit)],
                [BigInt(offset)]
            );

            if ('ok' in result) {
                return result.ok.map(entry => ({
                    id: entry.id,
                    action: entry.action,
                    userId: entry.userId.length > 0 ? entry.userId[0] : null,
                    patientId: entry.patientId.length > 0 ? entry.patientId[0] : null,
                    data: JSON.parse(entry.data),
                    timestamp: Number(entry.timestamp),
                    ipAddress: entry.ipAddress.length > 0 ? entry.ipAddress[0] : null,
                    userAgent: entry.userAgent.length > 0 ? entry.userAgent[0] : null
                }));
            } else {
                throw new Error(result.err);
            }

        } catch (error) {
            console.error('❌ Error getting audit log from chain:', error);
            throw new Error(`Failed to get audit log: ${error.message}`);
        }
    }

    /**
     * Configuration methods
     */

    configureBatch(config) {
        this.batchConfig = { ...this.batchConfig, ...config };
        console.log('📦 Batch configuration updated:', this.batchConfig);
    }

    configureReconnection(maxAttempts, initialDelay) {
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = initialDelay;
        console.log('🔄 Reconnection configuration updated:', {
            maxAttempts,
            initialDelay
        });
    }
}

module.exports = ICPClient;