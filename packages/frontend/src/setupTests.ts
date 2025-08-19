// Test setup for Frontend
import '@testing-library/jest-dom';

// Mock ICP Agent for all tests
jest.mock('@dfinity/agent', () => ({
  Actor: {
    createActor: jest.fn(() => ({
      registerPatient: jest.fn(),
      getPatient: jest.fn(),
      findPatientByEmail: jest.fn(),
      registerDoctor: jest.fn(),
      getDoctor: jest.fn(),
      getAllDoctors: jest.fn(),
      submitQuery: jest.fn(),
      getPatientQueries: jest.fn(),
      assignPatientToDoctor: jest.fn(),
      healthCheck: jest.fn(),
      getStats: jest.fn()
    }))
  },
  HttpAgent: jest.fn(() => ({
    fetchRootKey: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});