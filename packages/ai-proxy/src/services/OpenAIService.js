// OpenAI Service Integration
const axios = require('axios');

class OpenAIService {
  constructor(apiKey, model = 'gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Create medical prompt for OpenAI
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
   * Call OpenAI API
   * @param {string} queryText - Patient's query
   * @param {string} condition - Patient's condition
   * @returns {Promise<string>} AI response
   */
  async generateResponse(queryText, condition) {
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a helpful medical AI assistant that provides general health information while emphasizing the importance of professional medical consultation."
          },
          {
            role: "user",
            content: this.createMedicalPrompt(queryText, condition)
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.message);
      throw new Error('Failed to get OpenAI response');
    }
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  isAvailable() {
    return this.apiKey && this.apiKey !== 'mock-openai-key';
  }
}

module.exports = OpenAIService;