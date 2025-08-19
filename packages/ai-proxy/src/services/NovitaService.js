// Novita AI Service Integration for Baichuan Model
const axios = require('axios');

class NovitaService {
  constructor(apiKey, model = 'baichuan/baichuan-m2-32b') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.novita.ai/openai/v1/chat/completions';
  }

  /**
   * Create clinical decision support prompt for healthcare providers
   * @param {string} queryText - Patient's query/symptoms
   * @param {string} patientCondition - Patient's medical condition and history
   * @returns {string} Clinical decision support prompt
   */
  createClinicalDecisionPrompt(queryText, patientCondition) {
    return `You are a clinical decision support AI assistant providing comprehensive analysis for healthcare providers only.

PATIENT INFORMATION: ${patientCondition}
PATIENT PRESENTATION: "${queryText}"

Generate a structured clinical decision support response in the following format:

## PATIENT HISTORY SUMMARY
- Key medical conditions and current status
- Current medications and recent changes
- Relevant past medical events and complications
- Recent laboratory/vital signs

## SYMPTOM ANALYSIS
- Primary symptoms reported by patient
- Symptom onset, duration, and characteristics  
- Associated symptoms or triggers
- Clinical significance and urgency assessment

## CLINICAL RECOMMENDATIONS FOR PROVIDER

### Immediate Assessment & Management:
- Vital signs and clinical examination priorities
- Diagnostic tests or monitoring required
- Immediate interventions or treatments
- Safety precautions and red flag symptoms

### Differential Diagnosis Considerations:
- Most likely diagnosis based on presentation
- Alternative diagnoses to consider
- Risk stratification and severity assessment

### Treatment Plan Options:
- First-line treatment recommendations
- Alternative therapy options
- Medication adjustments or considerations
- Non-pharmacological interventions

### Follow-up & Monitoring:
- Recommended follow-up timeline
- Parameters to monitor
- Patient education priorities
- When to escalate care

### Patient Communication Points:
- Key explanations to provide patient
- Warning signs to discuss
- Lifestyle recommendations
- Medication adherence counseling

This is for healthcare provider use only - not for direct patient communication.`;
  }

  /**
   * Create clinical draft prompt for healthcare provider review
   * @param {string} queryText - Patient's query
   * @param {string} patientProfile - Detailed patient medical profile
   * @returns {string} Clinical prompt for comprehensive draft
   */
  createClinicalDraftPrompt(queryText, patientProfile) {
    return `You are a clinical AI assistant creating a draft response for a healthcare provider to review and approve before sending to their patient.

PATIENT PROFILE:
${patientProfile}

PATIENT QUERY: "${queryText}"

Create a comprehensive clinical draft response structured as follows:

**CLINICAL ASSESSMENT:**
- Differential diagnoses considerations
- Medication-related factors
- Diabetes-specific concerns

**IMMEDIATE RECOMMENDATIONS:**
- Blood glucose monitoring steps
- Symptom management protocols
- Emergency care indicators

**FOLLOW-UP PLAN:**
- Dietary guidance specifics
- Medication review points
- Monitoring schedule

**PATIENT EDUCATION:**
- Condition-specific explanations
- Prevention strategies
- Self-management tips

Provide direct clinical guidance without showing reasoning process. Format for easy doctor review and modification.`;
  }

  /**
   * Generate clinical draft response for healthcare provider review
   * @param {string} queryText - Patient's query
   * @param {string} patientProfile - Detailed patient profile
   * @returns {Promise<string>} Clinical draft response
   */
  async generateClinicalDraft(queryText, patientProfile) {
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a clinical AI assistant helping healthcare providers create comprehensive patient response drafts. Provide direct clinical guidance without internal reasoning."
          },
          {
            role: "user",
            content: this.createClinicalDraftPrompt(queryText, patientProfile)
          }
        ],
        max_tokens: 1200,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Novita AI Clinical Draft Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Failed to generate clinical draft response');
    }
  }

  /**
   * Generate clinical decision support response for healthcare providers
   * @param {string} queryText - Patient's query/symptoms
   * @param {string} condition - Patient's medical condition and history
   * @returns {Promise<string>} Clinical decision support response
   */
  async generateResponse(queryText, condition) {
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a clinical decision support AI assistant providing comprehensive analysis exclusively for healthcare providers. Your responses are structured clinical guidance tools for medical professionals, not for direct patient communication."
          },
          {
            role: "user",
            content: this.createClinicalDecisionPrompt(queryText, condition)
          }
        ],
        max_tokens: 1500, // Increased for comprehensive clinical responses
        temperature: 0.3   // Lower temperature for more consistent clinical guidance
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for comprehensive clinical responses
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Novita AI Clinical Decision Support Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw new Error('Failed to generate clinical decision support response');
    }
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  isAvailable() {
    return this.apiKey && this.apiKey !== 'mock-novita-key';
  }
}

module.exports = NovitaService;