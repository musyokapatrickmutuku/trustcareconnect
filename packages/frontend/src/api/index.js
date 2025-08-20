// TrustCareConnect API Module - Main Export Index
// Provides clean imports for the entire API layer

// Main API interface
export { default as trustCareAPI, TrustCareAPI } from './trustcare.js';

// Low-level service layer
export { default as icpApiService } from '../services/api.js';

// Integration examples and patterns
export { default as integrationExamples } from './integration-example.js';

// Default export for convenience
import trustCareAPI from './trustcare.js';
export default trustCareAPI;