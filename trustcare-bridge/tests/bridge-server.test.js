const WebSocket = require('ws');
const request = require('supertest');
const { EventEmitter } = require('events');
const TrustCareBridge = require('../src/bridge-server');

// Mock external dependencies
jest.mock('../src/novita-client');
jest.mock('../src/icp-client');
jest.mock('../src/monitoring');

const MockNovitaClient = require('../src/novita-client');
const MockICPClient = require('../src/icp-client');
const { MetricsCollector } = require('../src/monitoring');

describe('TrustCareBridge', () => {
    let bridge;
    let mockNovita;
    let mockICP;
    let mockMetrics;

    beforeAll(() => {
        // Set test environment variables
        process.env.NODE_ENV = 'test';
        process.env.WS_PORT = '8081';
        process.env.HTTP_PORT = '3002';
        process.env.LOG_LEVEL = 'error';
    });

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup mock implementations
        mockNovita = {
            callMedicalAI: jest.fn(),
            healthCheck: jest.fn().mockResolvedValue(true)
        };
        MockNovitaClient.mockImplementation(() => mockNovita);

        mockICP = {
            storeAIResponse: jest.fn(),
            getPatientHistory: jest.fn(),
            processDoctorReview: jest.fn(),
            getQueryStatus: jest.fn(),
            healthCheck: jest.fn().mockResolvedValue(true),
            updateMedicalRecord: jest.fn()
        };
        MockICPClient.mockImplementation(() => mockICP);

        mockMetrics = {
            setActiveConnections: jest.fn(),
            recordQuery: jest.fn(),
            recordApiRequest: jest.fn(),
            recordExternalApiCall: jest.fn(),
            trackPerformance: jest.fn((name, fn) => fn()),
            getMetrics: jest.fn().mockResolvedValue('# Test metrics'),
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
        // Small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
    });

    describe('Server Initialization', () => {
        test('should initialize with default configuration', () => {
            bridge = new TrustCareBridge();

            expect(bridge.wsPort).toBe(8081);
            expect(bridge.httpPort).toBe(3002);
            expect(bridge.connectionManager).toBeDefined();
            expect(bridge.requestQueue).toBeDefined();
            expect(bridge.metrics).toBeDefined();
            expect(bridge.messageRouter).toBeDefined();
        });

        test('should start HTTP server', (done) => {
            bridge = new TrustCareBridge();

            // Wait for server to start
            setTimeout(() => {
                request(bridge.app)
                    .get('/health')
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .end((err, res) => {
                        if (err) return done(err);
                        expect(res.body.status).toBe('healthy');
                        done();
                    });
            }, 500);
        });

        test('should start WebSocket server', (done) => {
            bridge = new TrustCareBridge();

            setTimeout(() => {
                const ws = new WebSocket(`ws://localhost:8081`);

                ws.on('open', () => {
                    ws.close();
                    done();
                });

                ws.on('error', (error) => {
                    done(error);
                });
            }, 500);
        });
    });

    describe('HTTP Endpoints', () => {
        beforeEach(() => {
            bridge = new TrustCareBridge();
        });

        test('GET /health should return service status', async () => {
            const response = await request(bridge.app)
                .get('/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'healthy',
                connections: expect.any(Object),
                queue: expect.any(Object),
                services: expect.any(Object),
                uptime: expect.any(Number),
                memory: expect.any(Object)
            });
        });

        test('GET /metrics should return Prometheus metrics', async () => {
            const response = await request(bridge.app)
                .get('/metrics')
                .expect(200)
                .expect('Content-Type', /text\/plain/);

            expect(response.text).toBe('# Test metrics');
            expect(mockMetrics.getMetrics).toHaveBeenCalled();
        });

        test('GET /ws-info should return WebSocket information', async () => {
            const response = await request(bridge.app)
                .get('/ws-info')
                .expect(200);

            expect(response.body).toMatchObject({
                wsPort: 8081,
                protocols: ['ws', 'wss'],
                endpoint: '/ws',
                maxConnections: expect.any(String),
                heartbeatInterval: expect.any(String)
            });
        });

        test('POST /api/medical-query should process medical query', async () => {
            const mockAIResponse = {
                content: 'Test medical advice',
                safetyScore: 85,
                urgency: 'LOW',
                requiresReview: false,
                timestamp: Date.now(),
                processingTime: 1500
            };

            mockNovita.callMedicalAI.mockResolvedValue(mockAIResponse);
            mockICP.updateMedicalRecord.mockResolvedValue({ queryId: 'test-123' });

            const response = await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    patientId: 'P001',
                    query: 'I have been feeling tired lately',
                    vitalSigns: { bloodGlucose: 120 }
                })
                .expect(200);

            expect(response.body).toMatchObject({
                queryId: 'test-123',
                content: 'Test medical advice',
                safetyScore: 85,
                urgency: 'LOW',
                requiresReview: false
            });

            expect(mockNovita.callMedicalAI).toHaveBeenCalledWith(
                'I have been feeling tired lately',
                expect.objectContaining({
                    patientId: 'P001',
                    vitalSigns: { bloodGlucose: 120 }
                })
            );
        });

        test('POST /api/medical-query should return 400 for invalid input', async () => {
            const response = await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    query: 'Test query' // Missing patientId
                })
                .expect(400);

            expect(response.body.error).toBe('patientId and query are required');
        });

        test('GET /api/history/:patientId should return patient history', async () => {
            const mockHistory = [
                { queryId: '1', timestamp: Date.now(), content: 'Previous query 1' },
                { queryId: '2', timestamp: Date.now(), content: 'Previous query 2' }
            ];

            mockICP.getPatientHistory.mockResolvedValue(mockHistory);

            const response = await request(bridge.app)
                .get('/api/history/P001')
                .query({ limit: 10, offset: 0 })
                .expect(200);

            expect(response.body).toEqual(mockHistory);
            expect(mockICP.getPatientHistory).toHaveBeenCalledWith('P001', { limit: '10', offset: '0' });
        });
    });

    describe('WebSocket Connection Management', () => {
        beforeEach(() => {
            bridge = new TrustCareBridge();
        });

        test('should accept WebSocket connections', (done) => {
            setTimeout(() => {
                const ws = new WebSocket(`ws://localhost:8081`);

                ws.on('open', () => {
                    expect(mockMetrics.setActiveConnections).toHaveBeenCalled();
                    ws.close();
                    done();
                });

                ws.on('error', done);
            }, 500);
        });

        test('should send welcome message on connection', (done) => {
            setTimeout(() => {
                const ws = new WebSocket(`ws://localhost:8081`);

                ws.on('message', (data) => {
                    const message = JSON.parse(data.toString());
                    expect(message.type).toBe('connection_established');
                    expect(message.payload).toMatchObject({
                        connectionId: expect.any(String),
                        serverTime: expect.any(String),
                        protocols: ['ws', 'wss'],
                        features: expect.any(Array)
                    });
                    ws.close();
                    done();
                });

                ws.on('error', done);
            }, 500);
        });

        test('should handle connection closure', (done) => {
            setTimeout(() => {
                const ws = new WebSocket(`ws://localhost:8081`);

                ws.on('open', () => {
                    ws.close();
                });

                ws.on('close', () => {
                    // Verify metrics were updated
                    setTimeout(() => {
                        expect(mockMetrics.setActiveConnections).toHaveBeenCalledTimes(2); // Open and close
                        done();
                    }, 100);
                });

                ws.on('error', done);
            }, 500);
        });

        test('should track multiple connections', (done) => {
            setTimeout(() => {
                const ws1 = new WebSocket(`ws://localhost:8081`);
                const ws2 = new WebSocket(`ws://localhost:8081`);

                let connectedCount = 0;

                const onOpen = () => {
                    connectedCount++;
                    if (connectedCount === 2) {
                        expect(mockMetrics.setActiveConnections).toHaveBeenCalledWith(2);
                        ws1.close();
                        ws2.close();
                        done();
                    }
                };

                ws1.on('open', onOpen);
                ws2.on('open', onOpen);
                ws1.on('error', done);
                ws2.on('error', done);
            }, 500);
        });
    });

    describe('WebSocket Message Routing', () => {
        let ws;

        beforeEach((done) => {
            bridge = new TrustCareBridge();
            setTimeout(() => {
                ws = new WebSocket(`ws://localhost:8081`);
                ws.on('open', () => {
                    // Skip welcome message
                    ws.once('message', () => done());
                });
                ws.on('error', done);
            }, 500);
        });

        afterEach(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });

        test('should handle ping message', (done) => {
            const pingMessage = {
                type: 'ping',
                payload: {},
                requestId: 'test-ping-123'
            };

            ws.send(JSON.stringify(pingMessage));

            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.type === 'pong') {
                    expect(response.requestId).toBe('test-ping-123');
                    expect(response.payload.timestamp).toBeDefined();
                    done();
                }
            });
        });

        test('should handle medical query message', (done) => {
            const mockAIResponse = {
                queryId: 'test-query-123',
                content: 'Test medical advice',
                safetyScore: 85,
                urgency: 'LOW',
                requiresReview: false,
                timestamp: Date.now(),
                processingTime: 1500
            };

            mockNovita.callMedicalAI.mockResolvedValue(mockAIResponse);
            mockICP.storeAIResponse.mockResolvedValue({ success: true });

            const queryMessage = {
                type: 'medical_query',
                payload: {
                    patientId: 'P001',
                    query: 'I have been feeling tired lately',
                    vitalSigns: { bloodGlucose: 120 }
                },
                requestId: 'test-query-456'
            };

            let statusReceived = false;
            let responseReceived = false;

            ws.on('message', (data) => {
                const message = JSON.parse(data.toString());

                if (message.type === 'query_status' && !statusReceived) {
                    statusReceived = true;
                    expect(message.payload.status).toMatch(/queued|processing|ai_processed/);
                } else if (message.type === 'medical_response' && !responseReceived) {
                    responseReceived = true;
                    expect(message.payload).toMatchObject({
                        queryId: expect.any(String),
                        content: 'Test medical advice',
                        safetyScore: 85,
                        urgency: 'LOW'
                    });
                    done();
                }
            });

            ws.send(JSON.stringify(queryMessage));
        });

        test('should handle subscribe updates message', (done) => {
            const subscribeMessage = {
                type: 'subscribe_updates',
                payload: {
                    patientId: 'P001',
                    queryId: 'Q123'
                },
                requestId: 'test-subscribe-789'
            };

            ws.send(JSON.stringify(subscribeMessage));

            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.type === 'subscription_confirmed') {
                    expect(response.requestId).toBe('test-subscribe-789');
                    expect(response.payload.subscriptions).toContain('patient:P001');
                    expect(response.payload.subscriptions).toContain('query:Q123');
                    done();
                }
            });
        });

        test('should handle invalid JSON message', (done) => {
            ws.send('invalid json message');

            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.type === 'error') {
                    expect(response.payload.code).toBe('MESSAGE_PROCESSING_ERROR');
                    expect(response.payload.message).toContain('Invalid JSON');
                    done();
                }
            });
        });

        test('should handle unknown message type', (done) => {
            const unknownMessage = {
                type: 'unknown_type',
                payload: {},
                requestId: 'test-unknown-123'
            };

            ws.send(JSON.stringify(unknownMessage));

            ws.on('message', (data) => {
                const response = JSON.parse(data.toString());
                if (response.type === 'error') {
                    expect(response.payload.message).toContain('Unknown message type');
                    done();
                }
            });
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            bridge = new TrustCareBridge();
        });

        test('should handle Novita API errors gracefully', async () => {
            mockNovita.callMedicalAI.mockRejectedValue(new Error('Novita API Error'));

            const response = await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    patientId: 'P001',
                    query: 'Test query'
                })
                .expect(500);

            expect(response.body.error).toBe('Internal server error');
            expect(response.body.message).toBe('Novita API Error');
        });

        test('should handle ICP canister errors gracefully', async () => {
            const mockAIResponse = {
                content: 'Test advice',
                safetyScore: 85,
                urgency: 'LOW',
                requiresReview: false,
                timestamp: Date.now()
            };

            mockNovita.callMedicalAI.mockResolvedValue(mockAIResponse);
            mockICP.updateMedicalRecord.mockRejectedValue(new Error('ICP Error'));

            const response = await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    patientId: 'P001',
                    query: 'Test query'
                })
                .expect(500);

            expect(response.body.error).toBe('Internal server error');
            expect(response.body.message).toBe('ICP Error');
        });

        test('should handle metrics endpoint errors', async () => {
            mockMetrics.getMetrics.mockRejectedValue(new Error('Metrics error'));

            const response = await request(bridge.app)
                .get('/metrics')
                .expect(500);

            expect(response.body.error).toBe('Failed to generate metrics');
        });
    });

    describe('Rate Limiting', () => {
        beforeEach(() => {
            bridge = new TrustCareBridge();
            // Override rate limiting for testing
            process.env.RATE_LIMIT_WINDOW_MS = '1000'; // 1 second window
            process.env.RATE_LIMIT_MAX_REQUESTS = '2'; // 2 requests max
        });

        test('should allow requests within rate limit', async () => {
            const mockAIResponse = {
                content: 'Test advice',
                safetyScore: 85,
                urgency: 'LOW',
                requiresReview: false,
                timestamp: Date.now()
            };

            mockNovita.callMedicalAI.mockResolvedValue(mockAIResponse);
            mockICP.updateMedicalRecord.mockResolvedValue({ queryId: 'test-123' });

            // First request should succeed
            await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    patientId: 'P001',
                    query: 'Test query'
                })
                .expect(200);

            // Second request should succeed
            await request(bridge.app)
                .post('/api/medical-query')
                .send({
                    patientId: 'P001',
                    query: 'Test query 2'
                })
                .expect(200);
        });

        test('should block WebSocket connections that exceed rate limit', (done) => {
            // Create connections rapidly to trigger rate limiting
            const connections = [];
            let blockedConnections = 0;

            setTimeout(() => {
                for (let i = 0; i < 15; i++) {
                    const ws = new WebSocket(`ws://localhost:8081`);

                    ws.on('open', () => {
                        connections.push(ws);
                    });

                    ws.on('close', (code) => {
                        if (code === 1008) { // Rate limit exceeded
                            blockedConnections++;
                        }
                    });

                    ws.on('error', () => {
                        // Expected for rate limited connections
                    });
                }

                // Check results after a delay
                setTimeout(() => {
                    connections.forEach(ws => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.close();
                        }
                    });

                    // Should have some blocked connections due to rate limiting
                    expect(blockedConnections).toBeGreaterThan(0);
                    done();
                }, 1000);
            }, 500);
        });
    });

    describe('Reconnection Logic', () => {
        beforeEach(() => {
            bridge = new TrustCareBridge();
        });

        test('should handle client reconnections', (done) => {
            setTimeout(() => {
                const ws1 = new WebSocket(`ws://localhost:8081`);

                ws1.on('open', () => {
                    // Close first connection
                    ws1.close();

                    // Create new connection (simulating reconnect)
                    setTimeout(() => {
                        const ws2 = new WebSocket(`ws://localhost:8081`);

                        ws2.on('open', () => {
                            // Verify second connection is established
                            expect(mockMetrics.setActiveConnections).toHaveBeenCalledWith(1);
                            ws2.close();
                            done();
                        });

                        ws2.on('error', done);
                    }, 100);
                });

                ws1.on('error', done);
            }, 500);
        });

        test('should maintain separate connection states', (done) => {
            setTimeout(() => {
                const ws1 = new WebSocket(`ws://localhost:8081`);
                const ws2 = new WebSocket(`ws://localhost:8081`);

                let ws1Connected = false;
                let ws2Connected = false;

                ws1.on('open', () => {
                    ws1Connected = true;
                    checkBothConnected();
                });

                ws2.on('open', () => {
                    ws2Connected = true;
                    checkBothConnected();
                });

                function checkBothConnected() {
                    if (ws1Connected && ws2Connected) {
                        // Close one connection
                        ws1.close();

                        // Verify the other remains active
                        setTimeout(() => {
                            expect(ws2.readyState).toBe(WebSocket.OPEN);
                            ws2.close();
                            done();
                        }, 100);
                    }
                }

                ws1.on('error', done);
                ws2.on('error', done);
            }, 500);
        });
    });

    describe('Health Checks', () => {
        beforeEach(() => {
            bridge = new TrustCareBridge();
        });

        test('should perform periodic health checks', (done) => {
            // Wait for health check to run
            setTimeout(() => {
                expect(mockNovita.healthCheck).toHaveBeenCalled();
                expect(mockICP.healthCheck).toHaveBeenCalled();
                done();
            }, 1100); // Just over 1 second
        });

        test('should update health status on check failure', (done) => {
            mockNovita.healthCheck.mockRejectedValue(new Error('Health check failed'));

            setTimeout(() => {
                // Health check should have been attempted
                expect(mockNovita.healthCheck).toHaveBeenCalled();
                done();
            }, 1100);
        });
    });

    describe('Graceful Shutdown', () => {
        test('should close all connections on shutdown', (done) => {
            bridge = new TrustCareBridge();

            setTimeout(() => {
                const ws = new WebSocket(`ws://localhost:8081`);

                ws.on('open', () => {
                    // Trigger shutdown
                    bridge.shutdown();
                });

                ws.on('close', (code) => {
                    expect(code).toBe(1001); // Server shutting down
                    done();
                });

                ws.on('error', done);
            }, 500);
        });

        test('should cleanup resources on shutdown', () => {
            bridge = new TrustCareBridge();

            // Mock server cleanup methods
            const mockWssClose = jest.fn();
            const mockHttpServerClose = jest.fn();

            bridge.wss = { close: mockWssClose };
            bridge.httpServer = { close: mockHttpServerClose };

            bridge.shutdown();

            expect(mockWssClose).toHaveBeenCalled();
            expect(mockHttpServerClose).toHaveBeenCalled();
        });
    });
});