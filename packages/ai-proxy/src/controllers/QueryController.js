// Query Controller for AI Proxy
const OpenAIService = require('../services/OpenAIService');
const ClaudeService = require('../services/ClaudeService');
const NovitaService = require('../services/NovitaService');
const MockService = require('../services/MockService');

class QueryController {
  constructor() {
    // Initialize AI services
    this.openaiService = new OpenAIService(
      process.env.OPENAI_API_KEY || 'mock-openai-key'
    );
    this.claudeService = new ClaudeService(
      process.env.CLAUDE_API_KEY || 'mock-claude-key'
    );
    this.novitaService = new NovitaService(
      process.env.NOVITA_API_KEY || 'sk_F_8dAOPzGPmh98MZPYGOQyYFrPdy2l6d29HQjmj6PA8'
    );
    this.mockService = new MockService();
  }

  /**
   * Process AI query request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processQuery(req, res) {
    try {
      const { queryText, condition, provider = 'novita' } = req.body;

      // Validation
      const validation = this.validateQueryRequest(queryText, condition);
      if (!validation.isValid) {
        return res.status(400).json({
          error: validation.error,
          code: validation.code
        });
      }

      // Sanitize inputs
      const sanitizedQuery = queryText.trim().substring(0, 1000);
      const sanitizedCondition = condition.trim().substring(0, 100);

      let aiResponse;
      let responseProvider = provider;

      try {
        // Route to appropriate AI service
        switch (provider.toLowerCase()) {
          case 'openai':
            if (this.openaiService.isAvailable()) {
              aiResponse = await this.openaiService.generateResponse(sanitizedQuery, sanitizedCondition);
              responseProvider = 'openai';
            } else {
              console.log('Using mock OpenAI response (no real API key provided)');
              aiResponse = await this.mockService.generateResponse(sanitizedQuery, sanitizedCondition);
              responseProvider = 'mock-openai';
            }
            break;

          case 'claude':
            if (this.claudeService.isAvailable()) {
              aiResponse = await this.claudeService.generateResponse(sanitizedQuery, sanitizedCondition);
              responseProvider = 'claude';
            } else {
              console.log('Using mock Claude response (no real API key provided)');
              aiResponse = await this.mockService.generateResponse(sanitizedQuery, sanitizedCondition);
              responseProvider = 'mock-claude';
            }
            break;

          case 'novita':
            if (this.novitaService.isAvailable()) {
              // Always use clinical decision support format for Novita
              aiResponse = await this.novitaService.generateResponse(sanitizedQuery, sanitizedCondition);
              responseProvider = 'novita-clinical';
            } else {
              console.log('Using mock Novita response (no real API key provided)');
              aiResponse = await this.mockService.generateResponse(sanitizedQuery, sanitizedCondition);
              responseProvider = 'mock-novita';
            }
            break;

          case 'mock':
          default:
            aiResponse = await this.mockService.generateResponse(sanitizedQuery, sanitizedCondition);
            responseProvider = 'mock';
            break;
        }
      } catch (apiError) {
        console.error(`${provider} API failed, falling back to mock response:`, apiError.message);
        aiResponse = await this.mockService.generateResponse(sanitizedQuery, sanitizedCondition);
        responseProvider = `mock-${provider}-fallback`;
      }

      // Response
      res.json({
        success: true,
        response: aiResponse,
        metadata: {
          provider: responseProvider,
          condition: sanitizedCondition,
          queryLength: sanitizedQuery.length,
          timestamp: new Date().toISOString(),
          responseId: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      });

      // Log the interaction (without sensitive data)
      console.log(`AI Query processed: ${responseProvider} | Condition: ${sanitizedCondition} | Query length: ${sanitizedQuery.length}`);

    } catch (error) {
      console.error('Query Controller Error:', error);
      res.status(500).json({
        error: 'Internal server error while processing AI query',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get available AI providers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProviders(req, res) {
    try {
      res.json({
        providers: [
          {
            name: 'novita',
            description: 'Novita AI Clinical Decision Support (Baichuan M2-32B)',
            available: this.novitaService.isAvailable(),
            model: 'baichuan/baichuan-m2-32b',
            purpose: 'Clinical decision support for healthcare providers',
            default: true
          },
          {
            name: 'openai',
            description: 'OpenAI GPT-3.5 Turbo (General Medical Guidance)',
            available: this.openaiService.isAvailable(),
            model: 'gpt-3.5-turbo'
          },
          {
            name: 'claude',
            description: 'Anthropic Claude 3 Haiku (General Medical Guidance)',
            available: this.claudeService.isAvailable(),
            model: 'claude-3-haiku-20240307'
          },
          {
            name: 'mock',
            description: 'Mock AI responses for testing only',
            available: true,
            default: false
          }
        ],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get Providers Error:', error);
      res.status(500).json({
        error: 'Failed to get provider information',
        code: 'PROVIDERS_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate query request
   * @param {string} queryText - Patient's query
   * @param {string} condition - Patient's condition
   * @returns {Object} Validation result
   */
  validateQueryRequest(queryText, condition) {
    if (!queryText || typeof queryText !== 'string') {
      return {
        isValid: false,
        error: 'Invalid or missing queryText',
        code: 'INVALID_QUERY_TEXT'
      };
    }

    if (!condition || typeof condition !== 'string') {
      return {
        isValid: false,
        error: 'Invalid or missing condition',
        code: 'INVALID_CONDITION'
      };
    }

    if (queryText.trim().length === 0) {
      return {
        isValid: false,
        error: 'Query text cannot be empty',
        code: 'EMPTY_QUERY'
      };
    }

    return { isValid: true };
  }
}

module.exports = QueryController;