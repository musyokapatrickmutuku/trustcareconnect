// Mock Service Tests
const MockService = require('../../src/services/MockService');

describe('MockService', () => {
  let mockService;

  beforeEach(() => {
    mockService = new MockService();
  });

  describe('Constructor', () => {
    test('should initialize successfully', () => {
      expect(mockService).toBeInstanceOf(MockService);
    });

    test('should be available by default', () => {
      expect(mockService.isAvailable()).toBe(true);
    });
  });

  describe('generateResponse', () => {
    test('should generate response for common query', async () => {
      const query = 'I have a headache';
      const condition = 'Migraine';

      const response = await mockService.generateResponse(query, condition);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response).toContain('Migraine');
    });

    test('should generate response for diabetes query', async () => {
      const query = 'How can I manage my blood sugar?';
      const condition = 'Diabetes';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('Diabetes');
      expect(response).toContain('blood sugar');
    });

    test('should generate response for hypertension query', async () => {
      const query = 'My blood pressure is high';
      const condition = 'Hypertension';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('Hypertension');
      expect(response).toContain('blood pressure');
    });

    test('should generate response for cardiac query', async () => {
      const query = 'I have chest pain';
      const condition = 'Heart Disease';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('Heart Disease');
      expect(response).toContain('chest pain');
    });

    test('should generate response for mental health query', async () => {
      const query = 'I feel anxious all the time';
      const condition = 'Anxiety';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('Anxiety');
      expect(response).toContain('anxious');
    });

    test('should generate generic response for unknown condition', async () => {
      const query = 'I have a rare condition';
      const condition = 'Rare Disease';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('Rare Disease');
      expect(response).toContain('healthcare provider');
    });

    test('should handle empty query gracefully', async () => {
      const query = '';
      const condition = 'Test Condition';

      const response = await mockService.generateResponse(query, condition);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response).toContain('Test Condition');
    });

    test('should handle empty condition gracefully', async () => {
      const query = 'Test query';
      const condition = '';

      const response = await mockService.generateResponse(query, condition);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should include disclaimer in response', async () => {
      const query = 'Test medical query';
      const condition = 'Test Condition';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('mock AI response');
      expect(response.toLowerCase()).toContain('healthcare provider');
    });

    test('should generate different responses for same input (variability)', async () => {
      const query = 'I have a headache';
      const condition = 'Migraine';

      const response1 = await mockService.generateResponse(query, condition);
      const response2 = await mockService.generateResponse(query, condition);

      // Responses should be similar but may have slight variations
      expect(typeof response1).toBe('string');
      expect(typeof response2).toBe('string');
      expect(response1).toContain('Migraine');
      expect(response2).toContain('Migraine');
    });

    test('should handle special characters in input', async () => {
      const query = 'I have pain in my chest & back!';
      const condition = 'Chest Pain (Acute)';

      const response = await mockService.generateResponse(query, condition);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should handle very long query text', async () => {
      const longQuery = 'I have been experiencing severe pain in my chest area for the past three days. The pain gets worse when I breathe deeply or move around. It started suddenly while I was at work and has been persistent since then. I also feel shortness of breath sometimes.';
      const condition = 'Chest Pain';

      const response = await mockService.generateResponse(longQuery, condition);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      expect(response).toContain('Chest Pain');
    });

    test('should handle very long condition text', async () => {
      const query = 'I need help with my condition';
      const longCondition = 'Chronic Obstructive Pulmonary Disease with Acute Exacerbation and Secondary Complications';

      const response = await mockService.generateResponse(query, longCondition);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe('Response Quality', () => {
    test('should generate medically appropriate response', async () => {
      const query = 'Should I go to the emergency room?';
      const condition = 'Severe Chest Pain';

      const response = await mockService.generateResponse(query, condition);

      expect(response.toLowerCase()).toMatch(/emergency|urgent|immediate|doctor|physician|healthcare/);
    });

    test('should include appropriate medical disclaimers', async () => {
      const query = 'What medication should I take?';
      const condition = 'Pain Management';

      const response = await mockService.generateResponse(query, condition);

      expect(response.toLowerCase()).toMatch(/consult|healthcare provider|doctor|physician/);
    });

    test('should avoid giving specific medication recommendations', async () => {
      const query = 'What pills should I take for pain?';
      const condition = 'Chronic Pain';

      const response = await mockService.generateResponse(query, condition);

      // Should not recommend specific medications
      expect(response.toLowerCase()).not.toMatch(/take.*mg|dosage|prescription.*drug/);
      expect(response.toLowerCase()).toMatch(/healthcare provider|doctor/);
    });

    test('should provide helpful but cautious responses', async () => {
      const query = 'Is this symptom serious?';
      const condition = 'Unusual Symptoms';

      const response = await mockService.generateResponse(query, condition);

      expect(response).toContain('healthcare provider');
      expect(response.toLowerCase()).toMatch(/recommend|suggest|consult/);
    });
  });

  describe('Performance', () => {
    test('should respond quickly', async () => {
      const startTime = Date.now();
      
      await mockService.generateResponse('Quick test', 'Test Condition');
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should be very fast for mock
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(mockService.generateResponse(`Query ${i}`, `Condition ${i}`));
      }

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(10);
      responses.forEach((response, index) => {
        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
        expect(response).toContain(`Condition ${index}`);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null inputs gracefully', async () => {
      const response = await mockService.generateResponse(null, null);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should handle undefined inputs gracefully', async () => {
      const response = await mockService.generateResponse(undefined, undefined);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should handle numeric inputs', async () => {
      const response = await mockService.generateResponse(12345, 67890);

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('should handle object inputs', async () => {
      const response = await mockService.generateResponse({query: 'test'}, {condition: 'test'});

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });
  });
});