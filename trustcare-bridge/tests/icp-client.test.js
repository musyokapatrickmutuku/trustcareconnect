const { HttpAgent } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const ICPClient = require('../src/icp-client');

// Mock @dfinity modules
jest.mock('@dfinity/agent');
jest.mock('@dfinity/principal');

describe('ICPClient', () => {
    let client;
    let mockAgent;
    let mockActor;
    let originalEnv;

    beforeEach(() => {
        // Store original environment
        originalEnv = process.env;

        // Set test environment variables
        process.env = {
            ...originalEnv,
            ICP_CANISTER_ID: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
            ICP_HOST: 'http://localhost:4943',
            ICP_AGENT_HOST: 'http://localhost:4943',
            ICP_FETCH_ROOT_KEY: 'true'
        };

        // Clear all mocks
        jest.clearAllMocks();

        // Setup mock agent
        mockAgent = {
            fetchRootKey: jest.fn().mockResolvedValue(undefined),
            call: jest.fn(),
            query: jest.fn(),
            readState: jest.fn()
        };

        HttpAgent.mockImplementation(() => mockAgent);

        // Setup mock actor
        mockActor = {
            processMedicalQuery: jest.fn(),
            storeAIResponse: jest.fn(),
            getPatientHistory: jest.fn(),
            processDoctorReview: jest.fn(),
            getQueryStatus: jest.fn(),
            updateMedicalRecord: jest.fn(),
            getPatientData: jest.fn(),
            addAuditLog: jest.fn(),
            getAuditLogs: jest.fn(),
            healthCheck: jest.fn()
        };

        // Mock Actor.createActor
        const { Actor } = require('@dfinity/agent');
        Actor.createActor = jest.fn().mockReturnValue(mockActor);

        // Mock Principal
        Principal.fromText = jest.fn().mockReturnValue({ toText: () => 'test-principal' });

        // Create client instance
        client = new ICPClient();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('Initialization', () => {
        test('should initialize with correct configuration', () => {
            expect(client.canisterId).toBe('rdmx6-jaaaa-aaaah-qcaiq-cai');
            expect(client.host).toBe('http://localhost:4943');
            expect(client.agentHost).toBe('http://localhost:4943');
            expect(client.fetchRootKey).toBe(true);
        });

        test('should create HTTP agent with correct host', () => {
            expect(HttpAgent).toHaveBeenCalledWith({
                host: 'http://localhost:4943'
            });
        });

        test('should fetch root key in development', () => {
            expect(mockAgent.fetchRootKey).toHaveBeenCalled();
        });

        test('should throw error when canister ID is missing', () => {
            delete process.env.ICP_CANISTER_ID;

            expect(() => {
                new ICPClient();
            }).toThrow('ICP_CANISTER_ID environment variable is required');
        });

        test('should not fetch root key in production', () => {
            process.env.ICP_FETCH_ROOT_KEY = 'false';
            process.env.NODE_ENV = 'production';

            jest.clearAllMocks();

            new ICPClient();

            expect(mockAgent.fetchRootKey).not.toHaveBeenCalled();
        });
    });

    describe('Medical Record Operations', () => {
        const mockAIResponse = {
            queryId: 'test-query-123',
            content: 'Test medical advice',
            safetyScore: 85,
            urgency: 'LOW',
            requiresReview: false,
            timestamp: Date.now(),
            processingTime: 1500
        };

        test('should store AI response successfully', async () => {
            const expectedResponse = {
                queryId: 'test-query-123',
                success: true,
                timestamp: Date.now()
            };

            mockActor.storeAIResponse.mockResolvedValue(expectedResponse);

            const result = await client.storeAIResponse('test-query-123', mockAIResponse);

            expect(result).toEqual(expectedResponse);
            expect(mockActor.storeAIResponse).toHaveBeenCalledWith(
                'test-query-123',
                expect.objectContaining({
                    content: 'Test medical advice',
                    safetyScore: 85,
                    urgency: 'LOW',
                    requiresReview: false
                })
            );
        });

        test('should update medical record with query data', async () => {
            const queryData = {
                patientId: 'P001',
                query: 'I have been feeling tired',
                vitalSigns: { bloodGlucose: 120 },
                aiResponse: mockAIResponse,
                timestamp: Date.now()
            };

            const expectedResponse = {
                queryId: 'test-query-456',
                success: true
            };

            mockActor.updateMedicalRecord.mockResolvedValue(expectedResponse);

            const result = await client.updateMedicalRecord(queryData);

            expect(result).toEqual(expectedResponse);
            expect(mockActor.updateMedicalRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    patientId: 'P001',
                    query: 'I have been feeling tired',
                    vitalSigns: { bloodGlucose: 120 }
                })
            );
        });

        test('should retrieve patient history', async () => {
            const mockHistory = [
                {
                    queryId: 'Q001',
                    timestamp: 1234567890,
                    query: 'Previous query 1',
                    response: 'Previous response 1',
                    safetyScore: 80
                },
                {
                    queryId: 'Q002',
                    timestamp: 1234567891,
                    query: 'Previous query 2',
                    response: 'Previous response 2',
                    safetyScore: 75
                }
            ];

            mockActor.getPatientHistory.mockResolvedValue(mockHistory);

            const result = await client.getPatientHistory('P001', { limit: 10, offset: 0 });

            expect(result).toEqual(mockHistory);
            expect(mockActor.getPatientHistory).toHaveBeenCalledWith(
                'P001',
                expect.objectContaining({ limit: 10, offset: 0 })
            );
        });

        test('should get query status', async () => {
            const mockStatus = {
                queryId: 'Q123',
                status: 'completed',
                timestamp: Date.now(),
                safetyScore: 85,
                requiresReview: false
            };

            mockActor.getQueryStatus.mockResolvedValue(mockStatus);

            const result = await client.getQueryStatus('Q123');

            expect(result).toEqual(mockStatus);
            expect(mockActor.getQueryStatus).toHaveBeenCalledWith('Q123');
        });

        test('should process doctor review', async () => {
            const reviewData = {
                queryId: 'Q123',
                action: 'approve',
                notes: 'Approved by doctor',
                finalResponse: 'Doctor-approved response',
                doctorId: 'D001'
            };

            const expectedResponse = {
                success: true,
                queryId: 'Q123',
                status: 'approved',
                timestamp: Date.now()
            };

            mockActor.processDoctorReview.mockResolvedValue(expectedResponse);

            const result = await client.processDoctorReview(reviewData);

            expect(result).toEqual(expectedResponse);
            expect(mockActor.processDoctorReview).toHaveBeenCalledWith(
                expect.objectContaining({
                    queryId: 'Q123',
                    action: 'approve',
                    notes: 'Approved by doctor',
                    doctorId: 'D001'
                })
            );
        });
    });

    describe('Data Persistence', () => {
        test('should persist patient data correctly', async () => {
            const patientData = {
                patientId: 'P001',
                name: 'John Doe',
                age: 45,
                condition: 'Type 2 Diabetes',
                medications: ['Metformin', 'Lisinopril'],
                allergies: ['Penicillin']
            };

            const expectedResponse = {
                success: true,
                patientId: 'P001',
                timestamp: Date.now()
            };

            mockActor.updateMedicalRecord.mockResolvedValue(expectedResponse);

            const result = await client.updateMedicalRecord(patientData);

            expect(result.success).toBe(true);
            expect(mockActor.updateMedicalRecord).toHaveBeenCalledWith(
                expect.objectContaining(patientData)
            );
        });

        test('should handle large medical records', async () => {
            const largeRecord = {
                patientId: 'P001',
                medicalHistory: 'A'.repeat(10000), // Large history text
                labResults: Array(100).fill().map((_, i) => ({
                    date: `2024-01-${i + 1}`,
                    result: `Test result ${i + 1}`,
                    value: Math.random() * 100
                })),
                medications: Array(20).fill().map((_, i) => `Medication ${i + 1}`)
            };

            mockActor.updateMedicalRecord.mockResolvedValue({
                success: true,
                patientId: 'P001'
            });

            const result = await client.updateMedicalRecord(largeRecord);

            expect(result.success).toBe(true);
            expect(mockActor.updateMedicalRecord).toHaveBeenCalledWith(
                expect.objectContaining({
                    patientId: 'P001',
                    medicalHistory: largeRecord.medicalHistory
                })
            );
        });

        test('should handle concurrent updates', async () => {
            const updates = Array(5).fill().map((_, i) => ({
                patientId: `P00${i + 1}`,
                query: `Concurrent query ${i + 1}`,
                timestamp: Date.now() + i
            }));

            mockActor.updateMedicalRecord.mockImplementation((data) =>
                Promise.resolve({
                    success: true,
                    patientId: data.patientId,
                    queryId: `Q${data.patientId}`
                })
            );

            const promises = updates.map(update => client.updateMedicalRecord(update));
            const results = await Promise.all(promises);

            expect(results).toHaveLength(5);
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.patientId).toBe(`P00${index + 1}`);
            });
        });
    });

    describe('Audit Logging', () => {
        test('should add audit log entry', async () => {
            const auditData = {
                action: 'query_processed',
                patientId: 'P001',
                userId: 'U001',
                timestamp: Date.now(),
                details: {
                    queryId: 'Q123',
                    safetyScore: 85,
                    urgency: 'LOW'
                }
            };

            const expectedResponse = {
                success: true,
                logId: 'LOG123',
                timestamp: Date.now()
            };

            mockActor.addAuditLog.mockResolvedValue(expectedResponse);

            const result = await client.addAuditLog(auditData);

            expect(result).toEqual(expectedResponse);
            expect(mockActor.addAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'query_processed',
                    patientId: 'P001',
                    userId: 'U001'
                })
            );
        });

        test('should retrieve audit logs with filters', async () => {
            const mockLogs = [
                {
                    logId: 'LOG001',
                    action: 'query_processed',
                    patientId: 'P001',
                    timestamp: 1234567890,
                    details: { queryId: 'Q001' }
                },
                {
                    logId: 'LOG002',
                    action: 'doctor_review',
                    patientId: 'P001',
                    timestamp: 1234567891,
                    details: { queryId: 'Q001', approved: true }
                }
            ];

            mockActor.getAuditLogs.mockResolvedValue(mockLogs);

            const filters = {
                patientId: 'P001',
                startDate: 1234567800,
                endDate: 1234567900,
                action: 'query_processed'
            };

            const result = await client.getAuditLogs(filters);

            expect(result).toEqual(mockLogs);
            expect(mockActor.getAuditLogs).toHaveBeenCalledWith(
                expect.objectContaining(filters)
            );
        });

        test('should handle audit log pagination', async () => {
            const mockLogs = Array(50).fill().map((_, i) => ({
                logId: `LOG${i.toString().padStart(3, '0')}`,
                action: 'query_processed',
                patientId: 'P001',
                timestamp: 1234567890 + i,
                details: { queryId: `Q${i}` }
            }));

            mockActor.getAuditLogs.mockResolvedValue(mockLogs.slice(0, 20));

            const result = await client.getAuditLogs({
                patientId: 'P001',
                limit: 20,
                offset: 0
            });

            expect(result).toHaveLength(20);
            expect(mockActor.getAuditLogs).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 20,
                    offset: 0
                })
            );
        });
    });

    describe('Error Handling', () => {
        test('should handle canister call failures', async () => {
            const canisterError = new Error('Canister call failed');
            mockActor.storeAIResponse.mockRejectedValue(canisterError);

            await expect(client.storeAIResponse('Q123', {}))
                .rejects.toThrow('Failed to store AI response: Canister call failed');
        });

        test('should handle network connectivity issues', async () => {
            const networkError = new Error('Network unreachable');
            networkError.code = 'ECONNREFUSED';
            mockActor.getPatientHistory.mockRejectedValue(networkError);

            await expect(client.getPatientHistory('P001'))
                .rejects.toThrow('Network error connecting to ICP canister');
        });

        test('should handle invalid canister ID', async () => {
            Principal.fromText.mockImplementation(() => {
                throw new Error('Invalid principal');
            });

            expect(() => {
                new ICPClient();
            }).toThrow('Invalid ICP canister ID format');
        });

        test('should handle agent creation failure', async () => {
            HttpAgent.mockImplementation(() => {
                throw new Error('Failed to create agent');
            });

            expect(() => {
                new ICPClient();
            }).toThrow('Failed to initialize ICP agent: Failed to create agent');
        });

        test('should retry transient failures', async () => {
            const transientError = new Error('Temporary failure');
            transientError.code = 'IC0503'; // IC temporary error code

            mockActor.storeAIResponse
                .mockRejectedValueOnce(transientError)
                .mockResolvedValueOnce({ success: true, queryId: 'Q123' });

            const result = await client.storeAIResponse('Q123', {});

            expect(result.success).toBe(true);
            expect(mockActor.storeAIResponse).toHaveBeenCalledTimes(2);
        });

        test('should not retry permanent failures', async () => {
            const permanentError = new Error('Authentication failed');
            permanentError.code = 'IC0401';

            mockActor.storeAIResponse.mockRejectedValue(permanentError);

            await expect(client.storeAIResponse('Q123', {}))
                .rejects.toThrow('Authentication failed');

            expect(mockActor.storeAIResponse).toHaveBeenCalledTimes(1);
        });
    });

    describe('Health Check', () => {
        test('should perform successful health check', async () => {
            mockActor.healthCheck.mockResolvedValue({
                status: 'healthy',
                timestamp: Date.now(),
                version: '1.0.0'
            });

            const isHealthy = await client.healthCheck();

            expect(isHealthy).toBe(true);
            expect(mockActor.healthCheck).toHaveBeenCalled();
        });

        test('should handle health check failure', async () => {
            mockActor.healthCheck.mockRejectedValue(new Error('Health check failed'));

            const isHealthy = await client.healthCheck();

            expect(isHealthy).toBe(false);
        });

        test('should timeout on slow health check', async () => {
            mockActor.healthCheck.mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 10000))
            );

            const healthCheckPromise = client.healthCheck();

            // Should timeout quickly for health checks
            await expect(Promise.race([
                healthCheckPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ])).rejects.toThrow('Timeout');
        });
    });

    describe('Data Validation', () => {
        test('should validate query data before storage', async () => {
            const invalidQueryData = {
                // Missing required fields
                query: 'Test query'
                // No patientId
            };

            await expect(client.updateMedicalRecord(invalidQueryData))
                .rejects.toThrow('Invalid query data: missing required fields');
        });

        test('should validate patient ID format', async () => {
            const invalidPatientData = {
                patientId: '', // Empty patient ID
                query: 'Test query'
            };

            await expect(client.updateMedicalRecord(invalidPatientData))
                .rejects.toThrow('Invalid patient ID format');
        });

        test('should validate AI response data', async () => {
            const invalidAIResponse = {
                content: 'Test content',
                safetyScore: 150, // Invalid score > 100
                urgency: 'INVALID_URGENCY'
            };

            await expect(client.storeAIResponse('Q123', invalidAIResponse))
                .rejects.toThrow('Invalid AI response data');
        });

        test('should sanitize input data', async () => {
            const unsafeData = {
                patientId: 'P001',
                query: '<script>alert("xss")</script>',
                notes: 'Normal notes'
            };

            mockActor.updateMedicalRecord.mockResolvedValue({
                success: true,
                patientId: 'P001'
            });

            await client.updateMedicalRecord(unsafeData);

            const callArgs = mockActor.updateMedicalRecord.mock.calls[0][0];
            expect(callArgs.query).not.toContain('<script>');
            expect(callArgs.query).toBe('alert("xss")'); // Sanitized
        });
    });

    describe('Performance', () => {
        test('should handle batch operations efficiently', async () => {
            const batchData = Array(100).fill().map((_, i) => ({
                patientId: `P${i.toString().padStart(3, '0')}`,
                query: `Batch query ${i}`,
                timestamp: Date.now() + i
            }));

            mockActor.updateMedicalRecord.mockImplementation(() =>
                Promise.resolve({ success: true })
            );

            const startTime = Date.now();
            const promises = batchData.map(data => client.updateMedicalRecord(data));
            await Promise.all(promises);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(mockActor.updateMedicalRecord).toHaveBeenCalledTimes(100);
        });

        test('should optimize repeated queries', async () => {
            mockActor.getPatientHistory.mockResolvedValue([]);

            // Make the same query multiple times
            const promises = Array(10).fill().map(() =>
                client.getPatientHistory('P001', { limit: 10 })
            );

            await Promise.all(promises);

            // Should have made actual calls (no internal caching in this client)
            expect(mockActor.getPatientHistory).toHaveBeenCalledTimes(10);
        });
    });

    describe('Canister Management', () => {
        test('should handle canister upgrade gracefully', async () => {
            // Simulate canister upgrade scenario
            mockActor.storeAIResponse
                .mockRejectedValueOnce(new Error('Canister is upgrading'))
                .mockResolvedValueOnce({ success: true, queryId: 'Q123' });

            const result = await client.storeAIResponse('Q123', {
                content: 'Test content',
                safetyScore: 85,
                urgency: 'LOW'
            });

            expect(result.success).toBe(true);
            expect(mockActor.storeAIResponse).toHaveBeenCalledTimes(2);
        });

        test('should handle multiple canister instances', async () => {
            // Test with different canister ID
            process.env.ICP_CANISTER_ID = 'different-canister-id';

            const client2 = new ICPClient();

            expect(client2.canisterId).toBe('different-canister-id');
            expect(client2.canisterId).not.toBe(client.canisterId);
        });
    });
});