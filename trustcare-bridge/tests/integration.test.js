const WebSocket = require('ws');
const request = require('supertest');
const TrustCareBridge = require('../src/bridge-server');
const { MetricsCollector } = require('../src/monitoring');

// Mock external dependencies for integration testing
jest.mock('../src/monitoring');

describe('TrustCareBridge Integration Tests', () => {
    let bridge;
    let mockMetrics;

    beforeAll(() => {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.WS_PORT = '8082';
        process.env.HTTP_PORT = '3003';
        process.env.LOG_LEVEL = 'error';
        process.env.RATE_LIMIT_MAX_REQUESTS = '100'; // Higher limit for integration tests
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup comprehensive mock metrics
        mockMetrics = {
            setActiveConnections: jest.fn(),
            recordQuery: jest.fn(),
            recordApiRequest: jest.fn(),
            recordExternalApiCall: jest.fn(),
            trackPerformance: jest.fn((name, fn) => fn()),
            getMetrics: jest.fn().mockResolvedValue('# Integration test metrics'),
            logger: {
                info: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
                warn: jest.fn()
            },
            on: jest.fn(),
            emit: jest.fn()
        };

        MetricsCollector.mockImplementation(() => mockMetrics);
    });

    afterEach(async () => {
        if (bridge) {
            bridge.shutdown();
            bridge = null;
        }
        // Allow cleanup time
        await new Promise(resolve => setTimeout(resolve, 200));
    });

    describe('End-to-End Medical Query Flow', () => {
        test('should handle complete medical query workflow', async () => {
            bridge = new TrustCareBridge();

            // Wait for server initialization
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 1: Check service health
            const healthResponse = await request(bridge.app)
                .get('/health')
                .expect(200);

            expect(healthResponse.body.status).toBe('healthy');

            // Step 2: Establish WebSocket connection
            const ws = new WebSocket(`ws://localhost:8082`);

            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);

                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });

            // Step 3: Receive welcome message
            const welcomeMessage = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'connection_established') {
                        resolve(message);
                    }
                });

                setTimeout(() => reject(new Error('Welcome message timeout')), 2000);
            });

            expect(welcomeMessage.payload.connectionId).toBeDefined();
            expect(welcomeMessage.payload.features).toContain('medical_query');

            // Step 4: Subscribe to updates
            const subscribeMessage = {
                type: 'subscribe_updates',
                payload: {
                    patientId: 'P001',
                    queryId: 'Q123'
                },
                requestId: 'test-subscribe-001'
            };

            ws.send(JSON.stringify(subscribeMessage));

            const subscriptionConfirmed = await new Promise((resolve, reject) => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'subscription_confirmed') {
                        resolve(message);
                    }
                });

                setTimeout(() => reject(new Error('Subscription timeout')), 2000);
            });

            expect(subscriptionConfirmed.payload.subscriptions).toContain('patient:P001');

            // Step 5: Send medical query
            const medicalQuery = {
                type: 'medical_query',
                payload: {
                    patientId: 'P001',
                    query: 'I have been feeling tired and my blood sugar readings are higher than usual',
                    vitalSigns: {
                        bloodGlucose: 180,
                        bloodPressure: '140/90',
                        heartRate: 85
                    },
                    context: {
                        medicalHistory: 'Type 2 diabetes, diagnosed 2020',
                        medications: ['Metformin 1000mg', 'Lisinopril 10mg'],
                        allergies: ['Penicillin']
                    }
                },
                requestId: 'test-query-001'
            };

            ws.send(JSON.stringify(medicalQuery));

            // Step 6: Track query processing through status updates
            const statusUpdates = [];
            const queryResponse = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Query processing timeout'));
                }, 10000);

                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());

                    if (message.type === 'query_status') {
                        statusUpdates.push(message.payload.status);
                    } else if (message.type === 'medical_response') {
                        clearTimeout(timeout);
                        resolve(message);
                    } else if (message.type === 'error') {
                        clearTimeout(timeout);
                        reject(new Error(message.payload.message));
                    }
                });
            });

            // Verify status progression
            expect(statusUpdates).toContain('queued');

            // Verify response structure
            expect(queryResponse.payload).toMatchObject({
                queryId: expect.any(String),
                content: expect.any(String),
                safetyScore: expect.any(Number),
                urgency: expect.stringMatching(/LOW|MEDIUM|HIGH/),
                requiresReview: expect.any(Boolean),
                timestamp: expect.any(Number),
                processingTime: expect.any(Number)
            });

            // Step 7: Verify metrics were recorded
            expect(mockMetrics.recordQuery).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: expect.any(String),
                    urgency: expect.any(String),
                    channel: 'websocket',
                    safetyScore: expect.any(Number),
                    duration: expect.any(Number)
                })
            );

            ws.close();
        }, 15000);

        test('should handle REST API medical query', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const queryData = {
                patientId: 'P002',
                query: 'My insulin levels seem off and I feel dizzy',
                vitalSigns: {
                    bloodGlucose: 65,
                    heartRate: 100,
                    temperature: 37.2
                },
                context: {
                    medicalHistory: 'Type 1 diabetes',
                    medications: ['Insulin pump therapy'],
                    lastMeal: '3 hours ago'
                }
            };

            const response = await request(bridge.app)
                .post('/api/medical-query')
                .send(queryData)
                .expect(200);

            expect(response.body).toMatchObject({
                queryId: expect.any(String),
                content: expect.any(String),
                safetyScore: expect.any(Number),
                urgency: expect.stringMatching(/LOW|MEDIUM|HIGH/),
                requiresReview: expect.any(Boolean),
                timestamp: expect.any(Number)
            });

            // Low blood glucose should trigger safety concerns
            expect(response.body.safetyScore).toBeLessThan(70);
            expect(response.body.urgency).toMatch(/MEDIUM|HIGH/);
        });
    });

    describe('Multi-Client Scenarios', () => {
        test('should handle multiple concurrent WebSocket connections', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const clients = [];
            const connectionPromises = [];

            // Create 5 concurrent connections
            for (let i = 0; i < 5; i++) {
                const ws = new WebSocket(`ws://localhost:8082`);
                clients.push(ws);

                const connectionPromise = new Promise((resolve, reject) => {
                    ws.on('open', () => resolve(i));
                    ws.on('error', reject);
                });

                connectionPromises.push(connectionPromise);
            }

            const connectedClients = await Promise.all(connectionPromises);
            expect(connectedClients).toHaveLength(5);

            // Send messages from each client
            const messagePromises = clients.map((ws, index) => {
                return new Promise((resolve, reject) => {
                    const pingMessage = {
                        type: 'ping',
                        payload: {},
                        requestId: `ping-${index}`
                    };

                    ws.send(JSON.stringify(pingMessage));

                    ws.on('message', (data) => {
                        const message = JSON.parse(data.toString());
                        if (message.type === 'pong' && message.requestId === `ping-${index}`) {
                            resolve(message);
                        }
                    });

                    setTimeout(() => reject(new Error(`Ping timeout for client ${index}`)), 5000);
                });
            });

            const responses = await Promise.all(messagePromises);
            expect(responses).toHaveLength(5);

            // Clean up connections
            clients.forEach(ws => ws.close());

            // Verify metrics tracked multiple connections
            expect(mockMetrics.setActiveConnections).toHaveBeenCalledWith(5);
        }, 10000);

        test('should broadcast updates to subscribed clients', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create two WebSocket clients
            const client1 = new WebSocket(`ws://localhost:8082`);
            const client2 = new WebSocket(`ws://localhost:8082`);

            // Wait for both to connect
            await Promise.all([
                new Promise(resolve => client1.on('open', resolve)),
                new Promise(resolve => client2.on('open', resolve))
            ]);

            // Skip welcome messages
            await Promise.all([
                new Promise(resolve => client1.once('message', resolve)),
                new Promise(resolve => client2.once('message', resolve))
            ]);

            // Subscribe both clients to the same patient
            const subscribeMessage = {
                type: 'subscribe_updates',
                payload: { patientId: 'P001' },
                requestId: 'sub-001'
            };

            client1.send(JSON.stringify(subscribeMessage));
            client2.send(JSON.stringify(subscribeMessage));

            // Wait for subscription confirmations
            await Promise.all([
                new Promise(resolve => {
                    client1.on('message', (data) => {
                        const msg = JSON.parse(data.toString());
                        if (msg.type === 'subscription_confirmed') resolve();
                    });
                }),
                new Promise(resolve => {
                    client2.on('message', (data) => {
                        const msg = JSON.parse(data.toString());
                        if (msg.type === 'subscription_confirmed') resolve();
                    });
                })
            ]);

            // Send medical query from client1
            const queryMessage = {
                type: 'medical_query',
                payload: {
                    patientId: 'P001',
                    query: 'Feeling unwell today'
                },
                requestId: 'query-broadcast-test'
            };

            client1.send(JSON.stringify(queryMessage));

            // Both clients should receive the real-time update
            const updatePromises = [client1, client2].map(client => {
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Update timeout')), 8000);

                    client.on('message', (data) => {
                        const message = JSON.parse(data.toString());
                        if (message.type === 'real_time_update') {
                            clearTimeout(timeout);
                            resolve(message);
                        }
                    });
                });
            });

            const updates = await Promise.all(updatePromises);

            updates.forEach(update => {
                expect(update.payload.subscription).toBe('patient:P001');
                expect(update.payload.type).toBe('query_completed');
            });

            client1.close();
            client2.close();
        }, 12000);
    });

    describe('Error Recovery and Resilience', () => {
        test('should handle WebSocket reconnection scenarios', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Initial connection
            let ws = new WebSocket(`ws://localhost:8082`);

            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
            });

            // Skip welcome message
            await new Promise(resolve => ws.once('message', resolve));

            // Close connection
            ws.close();

            // Reconnect after a delay
            await new Promise(resolve => setTimeout(resolve, 500));

            ws = new WebSocket(`ws://localhost:8082`);

            await new Promise((resolve, reject) => {
                ws.on('open', resolve);
                ws.on('error', reject);
            });

            // Should receive new welcome message
            const welcomeMessage = await new Promise(resolve => {
                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'connection_established') {
                        resolve(message);
                    }
                });
            });

            expect(welcomeMessage.payload.connectionId).toBeDefined();

            ws.close();
        });

        test('should handle malformed WebSocket messages gracefully', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const ws = new WebSocket(`ws://localhost:8082`);

            await new Promise(resolve => ws.on('open', resolve));

            // Skip welcome message
            await new Promise(resolve => ws.once('message', resolve));

            // Send malformed JSON
            ws.send('{ invalid json');

            const errorResponse = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Error response timeout')), 3000);

                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'error') {
                        clearTimeout(timeout);
                        resolve(message);
                    }
                });
            });

            expect(errorResponse.payload.code).toBe('MESSAGE_PROCESSING_ERROR');
            expect(errorResponse.payload.message).toContain('Invalid JSON');

            ws.close();
        });

        test('should handle high load gracefully', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Send multiple REST requests rapidly
            const requests = Array(20).fill().map((_, i) =>
                request(bridge.app)
                    .post('/api/medical-query')
                    .send({
                        patientId: `P${i.toString().padStart(3, '0')}`,
                        query: `Load test query ${i}`
                    })
            );

            const responses = await Promise.all(requests);

            // All requests should complete successfully
            responses.forEach((response, index) => {
                expect(response.status).toBe(200);
                expect(response.body.queryId).toBeDefined();
            });

            // Service should remain healthy
            const healthResponse = await request(bridge.app)
                .get('/health')
                .expect(200);

            expect(healthResponse.body.status).toBe('healthy');
        }, 15000);
    });

    describe('Data Flow Validation', () => {
        test('should maintain data consistency through complete flow', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            const patientId = 'P001';
            const testQuery = 'Integration test query for data consistency';

            // Step 1: Submit query via REST API
            const restResponse = await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    patientId,
                    query: testQuery,
                    vitalSigns: { bloodGlucose: 150 }
                })
                .expect(200);

            const queryId = restResponse.body.queryId;

            // Step 2: Retrieve patient history
            const historyResponse = await request(bridge.app)
                .get(`/api/history/${patientId}`)
                .expect(200);

            // History should include the new query
            expect(Array.isArray(historyResponse.body)).toBe(true);

            // Step 3: Check metrics were recorded
            expect(mockMetrics.recordQuery).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: expect.any(String),
                    patientId
                })
            );

            expect(mockMetrics.recordApiRequest).toHaveBeenCalledWith(
                '/api/medical-query',
                'POST',
                200,
                expect.any(Number)
            );
        });

        test('should handle edge cases in data processing', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test with edge case data
            const edgeCaseQuery = {
                patientId: 'P001',
                query: 'A'.repeat(1000), // Very long query
                vitalSigns: {
                    bloodGlucose: 0, // Edge case value
                    heartRate: 200, // High value
                    temperature: 42.0 // High fever
                }
            };

            const response = await request(bridge.app)
                .post('/api/medical-query')
                .send(edgeCaseQuery)
                .expect(200);

            expect(response.body.queryId).toBeDefined();
            expect(response.body.safetyScore).toBeLessThan(50); // Should flag as concerning
        });
    });

    describe('Service Integration', () => {
        test('should integrate monitoring with actual operations', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Perform various operations
            await request(bridge.app).get('/health').expect(200);
            await request(bridge.app).get('/metrics').expect(200);
            await request(bridge.app).get('/ws-info').expect(200);

            // Verify metrics endpoint provides data
            const metricsResponse = await request(bridge.app)
                .get('/metrics')
                .expect(200)
                .expect('Content-Type', /text\/plain/);

            expect(metricsResponse.text).toBe('# Integration test metrics');
            expect(mockMetrics.getMetrics).toHaveBeenCalled();
        });

        test('should maintain service health under various conditions', async () => {
            bridge = new TrustCareBridge();

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Perform mixed load
            const operations = [
                // HTTP requests
                request(bridge.app).get('/health'),
                request(bridge.app).get('/metrics'),
                request(bridge.app).post('/api/medical-query').send({
                    patientId: 'P001',
                    query: 'Health check query'
                }),

                // WebSocket operations
                (async () => {
                    const ws = new WebSocket(`ws://localhost:8082`);
                    await new Promise(resolve => ws.on('open', resolve));
                    ws.close();
                })()
            ];

            await Promise.all(operations);

            // Service should remain healthy
            const finalHealthCheck = await request(bridge.app)
                .get('/health')
                .expect(200);

            expect(finalHealthCheck.body.status).toBe('healthy');
            expect(finalHealthCheck.body.uptime).toBeGreaterThan(0);
            expect(finalHealthCheck.body.memory).toBeDefined();
        });
    });
});