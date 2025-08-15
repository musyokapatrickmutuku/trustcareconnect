// Claude Service Integration
const axios = require('axios');

class ClaudeService {
  constructor(apiKey, model = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  /**
   * Create medical prompt for Claude
   * @param {string} queryText - Patient's query
   * @param {string} condition - Patient's condition
   * @returns {string} Formatted prompt
   */
  createMedicalPrompt(queryText, condition) {
    return `You are a helpful medical AI assistant providing general health information. A patient with ${condition} has asked: "${queryText}"

Please provide a helpful, informative response that:
1. Offers general medical guidance related to their condition
2. Emphasizes the importance of consulting their healthcare provider
3. Avoids specific diagnoses or treatment recommendations
4. Is empathetic and supportive
5. Keeps the response concise and easy to understand

Remember: This is for general information only and should not replace professional medical advice.`;
  }

  /**
   * Call Claude API
   * @param {string} queryText - Patient's query
   * @param {string} condition - Patient's condition
   * @returns {Promise<string>} AI response
   */
  async generateResponse(queryText, condition) {
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: this.createMedicalPrompt(queryText, condition)
          }
        ]
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API Error:', error.message);
      throw new Error('Failed to get Claude response');
    }
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  isAvailable() {
    return this.apiKey && this.apiKey !== 'mock-claude-key';
  }
}

module.exports = ClaudeService;