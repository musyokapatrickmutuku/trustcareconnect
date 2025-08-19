// Test setup for AI Proxy
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.CLAUDE_API_KEY = 'test-claude-key';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console.log for cleaner test output
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  createMockRequest: (body = {}, headers = {}) => ({
    body,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  }),
  
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }
};