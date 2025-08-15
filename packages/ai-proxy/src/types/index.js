// AI Proxy Type Definitions

/**
 * @typedef {Object} QueryRequest
 * @property {string} queryText - The patient's query
 * @property {string} condition - The patient's medical condition
 * @property {'openai'|'claude'|'mock'} provider - AI provider to use
 */

/**
 * @typedef {Object} QueryResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} response - The AI-generated response
 * @property {Object} metadata - Additional response metadata
 */

/**
 * @typedef {Object} ProviderConfig
 * @property {string} url - API endpoint URL
 * @property {string} key - API key
 * @property {string} model - Model identifier
 */

/**
 * @typedef {Object} APIError
 * @property {string} error - Error message
 * @property {string} code - Error code
 * @property {string} timestamp - Error timestamp
 */

module.exports = {
  // Export types for JSDoc usage
};