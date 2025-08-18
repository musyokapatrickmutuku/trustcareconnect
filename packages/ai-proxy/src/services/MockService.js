// Mock AI Service for Development and Testing
class MockService {
  constructor() {
    this.responses = {
      diabetes: [
        "Based on your diabetes-related query, I recommend maintaining regular blood sugar monitoring and following your prescribed medication schedule. However, please consult with your healthcare provider for personalized advice.",
        "For diabetes management, focus on a balanced diet with controlled carbohydrate intake, regular exercise, and consistent medication timing. Always discuss any changes with your doctor.",
        "Diabetes care involves multiple factors including diet, exercise, medication adherence, and regular check-ups. Your healthcare team can provide specific guidance based on your individual needs."
      ],
      hypertension: [
        "For blood pressure management, consider lifestyle modifications such as reducing sodium intake, regular exercise, stress management, and medication compliance as prescribed by your doctor.",
        "Hypertension management typically involves dietary changes, regular monitoring, appropriate medication, and lifestyle adjustments. Please work closely with your healthcare provider.",
        "Blood pressure control requires a comprehensive approach including medication adherence, dietary modifications, regular exercise, and routine monitoring. Consult your doctor for personalized care."
      ],
      general: [
        "Thank you for your health inquiry. While I can provide general information, it's important to consult with your healthcare provider for personalized medical advice and proper diagnosis.",
        "I understand your health concern. For accurate diagnosis and treatment recommendations, please discuss your symptoms with your assigned healthcare professional.",
        "Your health question is important. While I can offer general guidance, your healthcare provider is best positioned to give you specific medical advice based on your individual situation."
      ]
    };
  }

  /**
   * Generate mock response based on condition and query
   * @param {string} queryText - Patient's query
   * @param {string} condition - Patient's condition
   * @returns {Promise<string>} Mock AI response
   */
  async generateResponse(queryText, condition) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const conditionLower = condition.toLowerCase();
    let responses = this.responses.general;
    
    if (conditionLower.includes('diabetes')) {
      responses = this.responses.diabetes;
    } else if (conditionLower.includes('hypertension') || conditionLower.includes('blood pressure')) {
      responses = this.responses.hypertension;
    }
    
    // Add query-specific context to the response
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return `${randomResponse}\n\n**Note: This is an AI-generated response for your "${queryText}" query. Always consult your healthcare provider for medical decisions.**`;
  }

  /**
   * Mock service is always available
   * @returns {boolean}
   */
  isAvailable() {
    return true;
  }

  /**
   * Add custom response for testing
   * @param {string} condition - Medical condition
   * @param {string} response - Custom response
   */
  addCustomResponse(condition, response) {
    if (!this.responses[condition]) {
      this.responses[condition] = [];
    }
    this.responses[condition].push(response);
  }

  /**
   * Get available conditions
   * @returns {string[]} List of conditions
   */
  getAvailableConditions() {
    return Object.keys(this.responses);
  }
}

module.exports = MockService;