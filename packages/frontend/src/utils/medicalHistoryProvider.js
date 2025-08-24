// Medical History Provider - Context Integration for AI Queries
// Provides patient medical history context for AI query processing

import icpService from '../services/icpService.ts';

/**
 * Medical History Provider Class
 * Manages patient medical history data for AI context generation
 * Integrates with backend enhanced patient data
 */
class MedicalHistoryProvider {
  constructor() {
    this.historyCache = new Map();
    this.contextTemplates = this.initializeContextTemplates();
  }

  /**
   * Initialize context templates for different types of diabetes queries
   */
  initializeContextTemplates() {
    return {
      general: {
        title: "General Diabetes Management Context",
        sections: ["basicInfo", "currentStatus", "medications", "complications"]
      },
      medication: {
        title: "Medication and Treatment Context",
        sections: ["basicInfo", "medications", "treatmentHistory", "currentStatus"]
      },
      symptoms: {
        title: "Symptoms and Health Status Context",
        sections: ["basicInfo", "currentStatus", "complications", "recentVisits"]
      },
      lifestyle: {
        title: "Lifestyle and Management Context",
        sections: ["basicInfo", "currentStatus", "treatmentHistory", "familyHistory"]
      },
      emergency: {
        title: "Emergency and Urgent Care Context",
        sections: ["basicInfo", "medications", "complications", "currentStatus", "emergencyContacts"]
      }
    };
  }

  /**
   * Get comprehensive medical history for a patient from backend
   * @param {string} platformId - Patient's platform ID  
   * @returns {Promise<object>} Medical history data or null if not found
   */
  async getPatientMedicalHistory(platformId) {
    // First check cache
    if (this.historyCache.has(platformId)) {
      return this.historyCache.get(platformId);
    }

    try {
      // Get enhanced patient data from backend
      const result = await icpService.getEnhancedPatient(platformId);
      
      if (result.success && result.data) {
        const enhancedPatient = result.data;
        
        // Transform backend data to medical history format
        const history = {
          patientId: enhancedPatient.id,
          name: `${enhancedPatient.firstName} ${enhancedPatient.lastName}`,
          email: enhancedPatient.email,
          dateOfBirth: enhancedPatient.dateOfBirth,
          medicalHistory: enhancedPatient.medicalHistory,
          currentVitals: enhancedPatient.currentVitals,
          assignedDoctorId: enhancedPatient.primaryDoctorId,
          isActive: enhancedPatient.isActive,
          lastVisit: enhancedPatient.lastVisit
        };
        
        // Cache the result
        this.historyCache.set(platformId, history);
        return history;
      }
    } catch (error) {
      console.error('Failed to get patient medical history:', error);
    }

    return null;
  }

  /**
   * Generate AI context string based on patient medical history
   * @param {string} platformId - Patient's platform ID
   * @param {string} queryType - Type of query (general, medication, symptoms, lifestyle, emergency)
   * @param {string} queryText - The actual patient query text
   * @returns {Promise<string>} Formatted context for AI processing
   */
  async generateAIContext(platformId, queryType = 'general', queryText = '') {
    const history = await this.getPatientMedicalHistory(platformId);
    
    if (!history) {
      return this.generateGenericContext(queryText);
    }

    const template = this.contextTemplates[queryType] || this.contextTemplates.general;
    const context = this.buildContextFromTemplate(history, template, queryText);
    
    return context;
  }

  /**
   * Build context string from template and patient history
   */
  buildContextFromTemplate(history, template, queryText) {
    let context = `PATIENT MEDICAL CONTEXT - ${template.title}\n`;
    context += '='.repeat(60) + '\n\n';
    
    // Add query context
    if (queryText) {
      context += `CURRENT QUERY: "${queryText}"\n\n`;
    }

    // Build sections based on template
    template.sections.forEach(section => {
      const sectionContent = this.buildContextSection(history, section);
      if (sectionContent) {
        context += sectionContent + '\n';
      }
    });

    // Add AI instructions
    context += this.getAIInstructions(history.diabetesType, queryText);
    
    return context;
  }

  /**
   * Build individual context sections
   */
  buildContextSection(history, sectionType) {
    switch (sectionType) {
      case 'basicInfo':
        return `PATIENT PROFILE:
- Patient ID: ${history.patientId}
- Age at Diagnosis: ${history.ageAtDiagnosis} years (${history.gender}, ${history.ethnicity})
- Diabetes Type: ${history.diabetesType}
- Diagnosis: ${history.initialSymptoms}
- Family History: ${history.familyHistory}
`;

      case 'currentStatus':
        return `CURRENT HEALTH STATUS:
- Latest HbA1c: ${history.currentHbA1c} (baseline: ${history.baselineHbA1c})
- Last Visit: ${history.lastVisit}
- Treatment Duration: ${history.treatmentDuration}
- Control Status: ${history.controlStatus}
- Comorbidities: ${Array.isArray(history.comorbidities) ? history.comorbidities.join(', ') : history.comorbidities}
`;

      case 'medications':
        return `CURRENT MEDICATIONS:
${Array.isArray(history.currentMedications) 
  ? history.currentMedications.map(med => `- ${med}`).join('\n')
  : `- ${history.currentMedications}`}
`;

      case 'complications':
        return `COMPLICATIONS & SCREENING:
- Current Complications: ${history.complications}
- Diabetic Complications Monitored: Retinopathy, Neuropathy, Nephropathy
`;

      case 'treatmentHistory':
        return `TREATMENT HISTORY:
- Baseline HbA1c: ${history.baselineHbA1c}
- Current HbA1c: ${history.currentHbA1c}
- Treatment Duration: ${history.treatmentDuration}
- Control Achievement: ${history.controlStatus}
`;

      case 'familyHistory':
        return `FAMILY & GENETIC FACTORS:
- Family History: ${history.familyHistory}
- Ethnicity: ${history.ethnicity} (relevant for diabetes risk factors)
`;

      case 'emergencyContacts':
        return `EMERGENCY CONSIDERATIONS:
- Diabetes Type: ${history.diabetesType}
- Current Control: ${history.controlStatus}
- Key Medications: ${Array.isArray(history.currentMedications) 
  ? history.currentMedications[0] 
  : history.currentMedications}
`;

      default:
        return '';
    }
  }

  /**
   * Get AI-specific instructions based on diabetes type and query
   */
  getAIInstructions(diabetesType, queryText) {
    let instructions = `\nAI RESPONSE INSTRUCTIONS:
─────────────────────────────
`;

    if (diabetesType === 'Type 1') {
      instructions += `This patient has Type 1 Diabetes (autoimmune):
- Focus on insulin management, carb counting, and blood glucose monitoring
- Consider exercise adjustments and sick day management
- Address hypoglycemia prevention and ketoacidosis awareness
`;
    } else if (diabetesType === 'Type 2') {
      instructions += `This patient has Type 2 Diabetes:
- Consider lifestyle modifications, medication adherence, and comorbidities
- Address cardiovascular risk, weight management, and blood pressure
- Include screening for complications (eyes, feet, kidneys)
`;
    } else if (diabetesType.includes('Gestational')) {
      instructions += `This patient has history of Gestational Diabetes:
- Consider pregnancy-related factors and current reproductive status
- Address PCOS and insulin resistance factors
- Focus on postpartum diabetes prevention
`;
    }

    instructions += `
- Use the patient's specific medical history and current status in your response
- Reference their current medications and HbA1c levels when relevant
- Consider their age, ethnicity, and comorbidities in recommendations
- Provide personalized advice based on their control status
- Always recommend consulting with their diabetes specialist for medical decisions

IMPORTANT: Base your response on this specific patient's medical history and current status.
`;

    return instructions;
  }

  /**
   * Generate generic context when patient history is not available
   */
  generateGenericContext(queryText) {
    return `PATIENT MEDICAL CONTEXT - General Diabetes Support
=======================================================

CURRENT QUERY: "${queryText}"

NOTE: Detailed medical history is not available for this patient.

AI RESPONSE INSTRUCTIONS:
─────────────────────────────
- Provide general diabetes management advice
- Emphasize the importance of consulting with healthcare providers
- Include standard diabetes monitoring and care recommendations
- Ask for more specific information if needed to provide personalized advice
- Recommend keeping detailed medical records for better care coordination

IMPORTANT: Without specific medical history, provide general guidance and encourage professional medical consultation.
`;
  }

  /**
   * Analyze query text to determine appropriate context type
   */
  analyzeQueryType(queryText) {
    const queryLower = queryText.toLowerCase();
    
    if (queryLower.includes('medication') || queryLower.includes('insulin') || queryLower.includes('pill')) {
      return 'medication';
    } else if (queryLower.includes('symptom') || queryLower.includes('feel') || queryLower.includes('pain')) {
      return 'symptoms';
    } else if (queryLower.includes('diet') || queryLower.includes('exercise') || queryLower.includes('lifestyle')) {
      return 'lifestyle';
    } else if (queryLower.includes('emergency') || queryLower.includes('urgent') || queryLower.includes('hospital')) {
      return 'emergency';
    } else {
      return 'general';
    }
  }

  /**
   * Get enhanced context for AI query processing
   * This method automatically determines the best context type based on the query
   */
  getEnhancedContextForQuery(platformId, queryText) {
    const queryType = this.analyzeQueryType(queryText);
    const context = this.generateAIContext(platformId, queryType, queryText);
    
    return {
      contextType: queryType,
      fullContext: context,
      hasPatientHistory: this.getPatientMedicalHistory(platformId) !== null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache management methods
   */
  clearHistoryCache() {
    this.historyCache.clear();
  }

  getCacheSize() {
    return this.historyCache.size;
  }

  /**
   * Get summary of available patient histories
   */
  getAvailableHistorySummary() {
    const importedPatients = patientDataImporter.getImportedPatientsStatus();
    
    return {
      totalPatients: importedPatients.total,
      availableHistories: importedPatients.patients.map(patient => ({
        platformId: patient.platformId,
        name: patient.fullName,
        condition: patient.medicalCondition,
        hasHistory: this.getPatientMedicalHistory(patient.platformId) !== null,
        specialist: patient.assignedSpecialist?.name || 'Unassigned'
      }))
    };
  }

  /**
   * Test method to verify medical history integration
   */
  async testHistoryIntegration() {
    const summary = this.getAvailableHistorySummary();
    
    console.log('Medical History Integration Test');
    console.log('================================');
    
    summary.availableHistories.forEach(patient => {
      console.log(`\nPatient: ${patient.name}`);
      console.log(`  Platform ID: ${patient.platformId}`);
      console.log(`  Has History: ${patient.hasHistory ? '✅' : '❌'}`);
      console.log(`  Specialist: ${patient.specialist}`);
      
      if (patient.hasHistory) {
        const testContext = this.generateAIContext(
          patient.platformId, 
          'general', 
          'How should I manage my diabetes medication?'
        );
        console.log(`  Context Generated: ${testContext.length} characters`);
      }
    });
    
    return summary;
  }
}

// Export singleton instance
const medicalHistoryProvider = new MedicalHistoryProvider();

export default medicalHistoryProvider;

// Named exports
export { MedicalHistoryProvider };

// Convenience functions
export const getPatientContext = (platformId, queryText) => 
  medicalHistoryProvider.getEnhancedContextForQuery(platformId, queryText);

export const getPatientHistory = (platformId) => 
  medicalHistoryProvider.getPatientMedicalHistory(platformId);

export const testHistorySystem = () => 
  medicalHistoryProvider.testHistoryIntegration();