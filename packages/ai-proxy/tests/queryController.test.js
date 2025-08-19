// AI Proxy Query Controller Tests
const request = require('supertest');
const express = require('express');
const QueryController = require('../src/controllers/QueryController');

// Create test app
const app = express();
app.use(express.json());

// Initialize controller and routes
const queryController = new QueryController();
app.post('/api/query', (req, res) => queryController.processQuery(req, res));
app.get('/api/providers', (req, res) => queryController.getProviders(req, res));

describe('QueryController', () => {
  describe('POST /api/query', () => {
    test('should process valid query with mock provider', async () => {
      const validQuery = {
        queryText: 'I have been experiencing headaches for 3 days',
        condition: 'Migraine',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(validQuery)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.response).toContain('Migraine');
      expect(response.body.response).toContain('headaches');
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.provider).toBe('mock');
      expect(response.body.metadata.condition).toBe('Migraine');
      expect(response.body.metadata.responseId).toMatch(/^query_/);
    });

    test('should handle OpenAI provider fallback to mock', async () => {
      const queryWithOpenAI = {
        queryText: 'What should I do about chest pain?',
        condition: 'Cardiac',
        provider: 'openai'
      };

      const response = await request(app)
        .post('/api/query')
        .send(queryWithOpenAI)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      // Should fallback to mock since no real API key
      expect(response.body.metadata.provider).toMatch(/mock/);
    });

    test('should handle Claude provider fallback to mock', async () => {
      const queryWithClaude = {
        queryText: 'How can I manage my diabetes better?',
        condition: 'Diabetes',
        provider: 'claude'
      };

      const response = await request(app)
        .post('/api/query')
        .send(queryWithClaude)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      // Should fallback to mock since no real API key
      expect(response.body.metadata.provider).toMatch(/mock/);
    });

    test('should default to mock provider when none specified', async () => {
      const queryWithoutProvider = {
        queryText: 'I feel dizzy when I stand up',
        condition: 'Hypotension'
      };

      const response = await request(app)
        .post('/api/query')
        .send(queryWithoutProvider)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.provider).toBe('mock');
    });

    test('should sanitize long query text', async () => {
      const longQuery = 'x'.repeat(1500); // Over 1000 char limit
      const queryWithLongText = {
        queryText: longQuery,
        condition: 'Test',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(queryWithLongText)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.queryLength).toBeLessThanOrEqual(1000);
    });

    test('should sanitize long condition text', async () => {
      const longCondition = 'x'.repeat(150); // Over 100 char limit
      const queryWithLongCondition = {
        queryText: 'Test query',
        condition: longCondition,
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(queryWithLongCondition)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata.condition).toHaveLength(100);
    });

    // Validation Error Tests
    test('should return 400 for missing queryText', async () => {
      const invalidQuery = {
        condition: 'Test',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(invalidQuery)
        .expect(400);

      expect(response.body.error).toBe('Invalid or missing queryText');
      expect(response.body.code).toBe('INVALID_QUERY_TEXT');
    });

    test('should return 400 for missing condition', async () => {
      const invalidQuery = {
        queryText: 'Test query',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(invalidQuery)
        .expect(400);

      expect(response.body.error).toBe('Invalid or missing condition');
      expect(response.body.code).toBe('INVALID_CONDITION');
    });

    test('should return 400 for empty queryText', async () => {
      const invalidQuery = {
        queryText: '   ', // Only whitespace
        condition: 'Test',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(invalidQuery)
        .expect(400);

      expect(response.body.error).toBe('Query text cannot be empty');
      expect(response.body.code).toBe('EMPTY_QUERY');
    });

    test('should return 400 for non-string queryText', async () => {
      const invalidQuery = {
        queryText: 123, // Number instead of string
        condition: 'Test',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(invalidQuery)
        .expect(400);

      expect(response.body.error).toBe('Invalid or missing queryText');
      expect(response.body.code).toBe('INVALID_QUERY_TEXT');
    });

    test('should return 400 for non-string condition', async () => {
      const invalidQuery = {
        queryText: 'Test query',
        condition: {}, // Object instead of string
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(invalidQuery)
        .expect(400);

      expect(response.body.error).toBe('Invalid or missing condition');
      expect(response.body.code).toBe('INVALID_CONDITION');
    });
  });

  describe('GET /api/providers', () => {
    test('should return available providers', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      expect(response.body.providers).toBeDefined();
      expect(Array.isArray(response.body.providers)).toBe(true);
      expect(response.body.providers.length).toBeGreaterThan(0);
      expect(response.body.timestamp).toBeDefined();

      // Check that mock provider is available
      const mockProvider = response.body.providers.find(p => p.name === 'mock');
      expect(mockProvider).toBeDefined();
      expect(mockProvider.available).toBe(true);
      expect(mockProvider.default).toBe(true);
    });

    test('should include OpenAI provider info', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      const openaiProvider = response.body.providers.find(p => p.name === 'openai');
      expect(openaiProvider).toBeDefined();
      expect(openaiProvider.description).toContain('OpenAI');
      expect(openaiProvider.model).toBe('gpt-3.5-turbo');
      expect(typeof openaiProvider.available).toBe('boolean');
    });

    test('should include Claude provider info', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      const claudeProvider = response.body.providers.find(p => p.name === 'claude');
      expect(claudeProvider).toBeDefined();
      expect(claudeProvider.description).toContain('Claude');
      expect(claudeProvider.model).toBe('claude-3-haiku-20240307');
      expect(typeof claudeProvider.available).toBe('boolean');
    });
  });

  describe('Validation Helper Functions', () => {
    test('should validate valid request', () => {
      const validation = queryController.validateQueryRequest('Valid query', 'Valid condition');
      expect(validation.isValid).toBe(true);
    });

    test('should invalidate missing queryText', () => {
      const validation = queryController.validateQueryRequest(null, 'Valid condition');
      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('INVALID_QUERY_TEXT');
    });

    test('should invalidate missing condition', () => {
      const validation = queryController.validateQueryRequest('Valid query', null);
      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('INVALID_CONDITION');
    });

    test('should invalidate empty queryText', () => {
      const validation = queryController.validateQueryRequest('', 'Valid condition');
      expect(validation.isValid).toBe(false);
      expect(validation.code).toBe('EMPTY_QUERY');
    });
  });

  describe('Error Handling', () => {
    test('should handle controller initialization errors gracefully', () => {
      // Test that controller can be created without errors
      expect(() => new QueryController()).not.toThrow();
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/query')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express should handle this before reaching our controller
      expect(response.body.error || response.text).toBeDefined();
    });
  });

  describe('Response Format Validation', () => {
    test('should return consistent response format', async () => {
      const query = {
        queryText: 'Test query for format validation',
        condition: 'Test condition',
        provider: 'mock'
      };

      const response = await request(app)
        .post('/api/query')
        .send(query)
        .expect(200);

      // Check required response fields
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('metadata');
      
      // Check metadata structure
      expect(response.body.metadata).toHaveProperty('provider');
      expect(response.body.metadata).toHaveProperty('condition');
      expect(response.body.metadata).toHaveProperty('queryLength');
      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('responseId');

      // Validate timestamp format
      const timestamp = new Date(response.body.metadata.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();

      // Validate response ID format
      expect(response.body.metadata.responseId).toMatch(/^query_\d+_[a-z0-9]+$/);
    });

    test('should maintain response format for errors', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({}) // Empty request to trigger validation error
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(typeof response.body.error).toBe('string');
      expect(typeof response.body.code).toBe('string');
    });
  });
});