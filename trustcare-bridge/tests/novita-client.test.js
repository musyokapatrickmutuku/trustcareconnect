const axios = require('axios');
const NovitaAIClient = require('../src/novita-client');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('NovitaAIClient', () => {
    let client;
    let originalEnv;

    beforeEach(() => {
        // Store original environment
        originalEnv = process.env;

        // Set test environment variables
        process.env = {
            ...originalEnv,
            NOVITA_API_KEY: 'test-api-key',
            NOVITA_BASE_URL: 'https://api.novita.ai/openai/v1',
            NOVITA_API_RATE_LIMIT: '10',
            NOVITA_API_CACHE_TTL: '300'
        };

        // Clear all mocks
        jest.clearAllMocks();

        // Create new client instance
        client = new NovitaAIClient();
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('Initialization', () => {
        test('should initialize with correct configuration', () => {
            expect(client.apiKey).toBe('test-api-key');
            expect(client.baseUrl).toBe('https://api.novita.ai/openai/v1');
            expect(client.rateLimit).toBe(10);
            expect(client.cacheTTL).toBe(300000); // 300 seconds in milliseconds
        });

        test('should use default values when environment variables are missing', () => {
            delete process.env.NOVITA_BASE_URL;
            delete process.env.NOVITA_API_RATE_LIMIT;
            delete process.env.NOVITA_API_CACHE_TTL;

            const defaultClient = new NovitaAIClient();

            expect(defaultClient.baseUrl).toBe('https://api.novita.ai/openai/v1');
            expect(defaultClient.rateLimit).toBe(10);
            expect(defaultClient.cacheTTL).toBe(300000);
        });

        test('should throw error when API key is missing', () => {
            delete process.env.NOVITA_API_KEY;

            expect(() => {
                new NovitaAIClient();
            }).toThrow('NOVITA_API_KEY environment variable is required');
        });
    });

    describe('API Calls', () => {
        const mockSuccessResponse = {
            data: {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            analysis: 'Patient presents with fatigue symptoms',
                            safetyScore: 75,
                            urgency: 'LOW',
                            recommendations: [
                                'Monitor blood glucose levels',
                                'Ensure adequate rest',
                                'Consider vitamin D supplementation'
                            ],
                            requiresReview: false,
                            reasoning: 'Symptoms are common and manageable'
                        })
                    }
                }],
                usage: {
                    total_tokens: 150,
                    prompt_tokens: 80,
                    completion_tokens: 70
                }
            }
        };

        test('should successfully call medical AI with valid input', async () => {
            mockedAxios.post.mockResolvedValue(mockSuccessResponse);

            const result = await client.callMedicalAI('I have been feeling tired lately', {
                patientId: 'P001',
                vitalSigns: { bloodGlucose: 120 },
                medicalHistory: 'Type 2 diabetes'
            });

            expect(result).toMatchObject({
                content: expect.stringContaining('fatigue symptoms'),
                safetyScore: 75,
                urgency: 'LOW',
                requiresReview: false,
                processingTime: expect.any(Number),
                timestamp: expect.any(Number)
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.novita.ai/openai/v1/chat/completions',
                expect.objectContaining({
                    model: 'baichuan/baichuan-m2-32b',
                    messages: expect.arrayContaining([
                        expect.objectContaining({ role: 'system' }),
                        expect.objectContaining({ role: 'user' })
                    ]),
                    temperature: 0.7,
                    max_tokens: 2048
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key',
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        test('should build correct clinical prompt with patient context', async () => {
            mockedAxios.post.mockResolvedValue(mockSuccessResponse);

            await client.callMedicalAI('Blood sugar is high', {
                patientId: 'P001',
                vitalSigns: { bloodGlucose: 250 },
                medicalHistory: 'Type 2 diabetes, diagnosed 2020',
                medications: ['Metformin', 'Lisinopril'],
                allergies: ['Penicillin']
            });

            const callArgs = mockedAxios.post.mock.calls[0][1];
            const systemMessage = callArgs.messages[0].content;

            expect(systemMessage).toContain('medical AI assistant');
            expect(systemMessage).toContain('Type 2 diabetes');
            expect(systemMessage).toContain('Metformin');
            expect(systemMessage).toContain('Penicillin');
            expect(systemMessage).toContain('Blood glucose: 250');
        });

        test('should handle emergency symptoms with high urgency', async () => {
            const emergencyResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'EMERGENCY: Chest pain requires immediate attention',
                                safetyScore: 15,
                                urgency: 'HIGH',
                                recommendations: [
                                    'Call emergency services immediately',
                                    'Do not drive yourself to hospital',
                                    'Take aspirin if not allergic'
                                ],
                                requiresReview: true,
                                reasoning: 'Chest pain could indicate cardiac emergency'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(emergencyResponse);

            const result = await client.callMedicalAI('I have severe chest pain and difficulty breathing', {
                patientId: 'P001',
                vitalSigns: { heartRate: 120, bloodPressure: '160/95' }
            });

            expect(result.safetyScore).toBeLessThan(40);
            expect(result.urgency).toBe('HIGH');
            expect(result.requiresReview).toBe(true);
            expect(result.content).toContain('emergency');
        });

        test('should calculate accurate safety scores', async () => {
            const testCases = [
                {
                    query: 'Mild headache',
                    expectedScore: 85,
                    expectedUrgency: 'LOW'
                },
                {
                    query: 'Blood sugar is 280',
                    expectedScore: 55,
                    expectedUrgency: 'MEDIUM'
                },
                {
                    query: 'Chest pain and unconscious',
                    expectedScore: 20,
                    expectedUrgency: 'HIGH'
                }
            ];

            for (const testCase of testCases) {
                const mockResponse = {
                    data: {
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    analysis: `Analysis for ${testCase.query}`,
                                    safetyScore: testCase.expectedScore,
                                    urgency: testCase.expectedUrgency,
                                    recommendations: ['Test recommendation'],
                                    requiresReview: testCase.expectedScore < 70,
                                    reasoning: 'Test reasoning'
                                })
                            }
                        }]
                    }
                };

                mockedAxios.post.mockResolvedValue(mockResponse);

                const result = await client.callMedicalAI(testCase.query, { patientId: 'P001' });

                expect(result.safetyScore).toBe(testCase.expectedScore);
                expect(result.urgency).toBe(testCase.expectedUrgency);
                expect(result.requiresReview).toBe(testCase.expectedScore < 70);
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle API timeout errors', async () => {
            const timeoutError = new Error('Request timeout');
            timeoutError.code = 'ECONNABORTED';
            mockedAxios.post.mockRejectedValue(timeoutError);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('Request timeout to Novita AI service');
        });

        test('should handle network errors', async () => {
            const networkError = new Error('Network Error');
            networkError.code = 'ECONNREFUSED';
            mockedAxios.post.mockRejectedValue(networkError);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('Network error connecting to Novita AI');
        });

        test('should handle 401 authentication errors', async () => {
            const authError = new Error('Request failed with status code 401');
            authError.response = { status: 401, data: { error: 'Invalid API key' } };
            mockedAxios.post.mockRejectedValue(authError);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('Authentication failed: Invalid API key');
        });

        test('should handle 429 rate limit errors', async () => {
            const rateLimitError = new Error('Request failed with status code 429');
            rateLimitError.response = {
                status: 429,
                data: { error: 'Rate limit exceeded' },
                headers: { 'retry-after': '60' }
            };
            mockedAxios.post.mockRejectedValue(rateLimitError);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('Rate limit exceeded. Retry after 60 seconds');
        });

        test('should handle invalid JSON response', async () => {
            const invalidResponse = {
                data: {
                    choices: [{
                        message: {
                            content: 'Invalid JSON content'
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(invalidResponse);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('Invalid response format from AI service');
        });

        test('should handle missing response content', async () => {
            const emptyResponse = {
                data: {
                    choices: []
                }
            };

            mockedAxios.post.mockResolvedValue(emptyResponse);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('No response content received from AI service');
        });
    });

    describe('Retry Logic', () => {
        test('should retry on temporary failures', async () => {
            const tempError = new Error('Request failed with status code 503');
            tempError.response = { status: 503, data: { error: 'Service temporarily unavailable' } };

            const successResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Successful response after retry',
                                safetyScore: 80,
                                urgency: 'LOW',
                                recommendations: ['Test recommendation'],
                                requiresReview: false,
                                reasoning: 'Test reasoning'
                            })
                        }
                    }]
                }
            };

            // First call fails, second succeeds
            mockedAxios.post
                .mockRejectedValueOnce(tempError)
                .mockResolvedValueOnce(successResponse);

            const result = await client.callMedicalAI('Test query', { patientId: 'P001' });

            expect(result.content).toContain('Successful response after retry');
            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        });

        test('should not retry on authentication errors', async () => {
            const authError = new Error('Request failed with status code 401');
            authError.response = { status: 401, data: { error: 'Invalid API key' } };

            mockedAxios.post.mockRejectedValue(authError);

            await expect(client.callMedicalAI('Test query', { patientId: 'P001' }))
                .rejects.toThrow('Authentication failed');

            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        test('should exponential backoff on retries', async () => {
            const tempError = new Error('Request failed with status code 503');
            tempError.response = { status: 503 };

            mockedAxios.post.mockRejectedValue(tempError);

            const startTime = Date.now();

            try {
                await client.callMedicalAI('Test query', { patientId: 'P001' });
            } catch (error) {
                // Expected to fail after retries
            }

            const endTime = Date.now();
            const elapsed = endTime - startTime;

            // Should have taken some time for retries with backoff
            expect(elapsed).toBeGreaterThan(100); // At least 100ms for backoff
            expect(mockedAxios.post).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });
    });

    describe('Rate Limiting', () => {
        test('should respect rate limit configuration', async () => {
            const mockResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Test analysis',
                                safetyScore: 80,
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            // Make multiple rapid requests
            const promises = [];
            for (let i = 0; i < 15; i++) {
                promises.push(client.callMedicalAI(`Test query ${i}`, { patientId: 'P001' }));
            }

            const startTime = Date.now();
            await Promise.all(promises);
            const endTime = Date.now();

            // Should have taken time due to rate limiting
            expect(endTime - startTime).toBeGreaterThan(1000); // At least 1 second
        });

        test('should queue requests when rate limit reached', async () => {
            const mockResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Test analysis',
                                safetyScore: 80,
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            // Create client with very low rate limit for testing
            process.env.NOVITA_API_RATE_LIMIT = '1';
            const limitedClient = new NovitaAIClient();

            const request1 = limitedClient.callMedicalAI('Query 1', { patientId: 'P001' });
            const request2 = limitedClient.callMedicalAI('Query 2', { patientId: 'P001' });

            const results = await Promise.all([request1, request2]);

            expect(results).toHaveLength(2);
            expect(results[0].content).toBeDefined();
            expect(results[1].content).toBeDefined();
        });
    });

    describe('Caching', () => {
        test('should cache identical requests', async () => {
            const mockResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Cached response',
                                safetyScore: 80,
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            const query = 'I have a headache';
            const context = { patientId: 'P001' };

            // First call
            const result1 = await client.callMedicalAI(query, context);

            // Second identical call (should be cached)
            const result2 = await client.callMedicalAI(query, context);

            expect(result1.content).toBe(result2.content);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1); // Only one actual API call
        });

        test('should not cache different requests', async () => {
            const mockResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Different response',
                                safetyScore: 80,
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            // Two different queries
            await client.callMedicalAI('I have a headache', { patientId: 'P001' });
            await client.callMedicalAI('I have stomach pain', { patientId: 'P001' });

            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        });

        test('should expire cache after TTL', async () => {
            // Set very short cache TTL for testing
            process.env.NOVITA_API_CACHE_TTL = '0.1'; // 0.1 seconds
            const shortCacheClient = new NovitaAIClient();

            const mockResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Expired cache response',
                                safetyScore: 80,
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            const query = 'I have a headache';
            const context = { patientId: 'P001' };

            // First call
            await shortCacheClient.callMedicalAI(query, context);

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Second call (cache should be expired)
            await shortCacheClient.callMedicalAI(query, context);

            expect(mockedAxios.post).toHaveBeenCalledTimes(2);
        });
    });

    describe('Health Check', () => {
        test('should perform successful health check', async () => {
            const healthResponse = {
                data: { status: 'healthy' }
            };

            mockedAxios.get.mockResolvedValue(healthResponse);

            const isHealthy = await client.healthCheck();

            expect(isHealthy).toBe(true);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                'https://api.novita.ai/openai/v1/models',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key'
                    })
                })
            );
        });

        test('should handle health check failure', async () => {
            const healthError = new Error('Service unavailable');
            mockedAxios.get.mockRejectedValue(healthError);

            const isHealthy = await client.healthCheck();

            expect(isHealthy).toBe(false);
        });
    });

    describe('Safety Score Validation', () => {
        test('should validate safety score range', async () => {
            const invalidResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Test analysis',
                                safetyScore: 150, // Invalid score > 100
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(invalidResponse);

            const result = await client.callMedicalAI('Test query', { patientId: 'P001' });

            // Should clamp safety score to valid range
            expect(result.safetyScore).toBeLessThanOrEqual(100);
            expect(result.safetyScore).toBeGreaterThanOrEqual(0);
        });

        test('should handle missing safety score', async () => {
            const missingScoreResponse = {
                data: {
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                analysis: 'Test analysis',
                                // Missing safetyScore
                                urgency: 'LOW',
                                recommendations: ['Test'],
                                requiresReview: false,
                                reasoning: 'Test'
                            })
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(missingScoreResponse);

            const result = await client.callMedicalAI('Test query', { patientId: 'P001' });

            // Should provide default safety score
            expect(result.safetyScore).toBeDefined();
            expect(typeof result.safetyScore).toBe('number');
        });
    });
});