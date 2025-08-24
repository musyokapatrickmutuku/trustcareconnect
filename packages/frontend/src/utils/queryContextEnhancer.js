// Query Context Enhancer - Integration layer for AI query processing
// Enhances patient queries with medical history context for better AI responses

import medicalHistoryProvider from './medicalHistoryProvider.js';
import trustCareAPI from '../api/trustcare.js';

/**
 * Query Context Enhancer Class
 * Integrates patient medical history with query submission for enhanced AI responses
 * This class modifies the query submission process to include medical context
 */
class QueryContextEnhancer {
  constructor() {
    this.contextCache = new Map();
    this.enhancedQueries = new Map();
  }

  /**
   * Enhanced query submission with medical history context
   * This method replaces the standard submitQuery to include patient context
   * 
   * @param {string} patientId - Patient's platform ID
   * @param {string} title - Query title
   * @param {string} description - Patient's question/description
   * @returns {object} Enhanced query submission result
   */
  async submitEnhancedQuery(patientId, title, description) {
    try {
      console.log(`Enhancing query for patient ${patientId}: ${title}`);

      // Get medical history context for the patient
      const contextData = medicalHistoryProvider.getEnhancedContextForQuery(patientId, description);
      
      // Create enhanced query description that includes medical context
      const enhancedDescription = this.buildEnhancedDescription(description, contextData);
      
      // Submit the enhanced query to the backend
      const result = await trustCareAPI.submitQuery(patientId, title, enhancedDescription);
      
      if (result.success) {
        // Store the original query and context for reference
        this.enhancedQueries.set(result.data, {
          queryId: result.data,
          patientId: patientId,
          originalTitle: title,
          originalDescription: description,
          enhancedDescription: enhancedDescription,
          contextType: contextData.contextType,
          hasPatientHistory: contextData.hasPatientHistory,
          timestamp: contextData.timestamp
        });

        console.log(`✅ Enhanced query submitted successfully: ${result.data}`);
        
        return {
          success: true,
          queryId: result.data,
          enhanced: true,
          contextType: contextData.contextType,
          hasPatientHistory: contextData.hasPatientHistory,
          message: 'Query submitted with medical history context for personalized AI response'
        };
      } else {
        console.error(`❌ Enhanced query submission failed: ${result.error}`);
        return {
          success: false,
          error: result.error,
          enhanced: false
        };
      }

    } catch (error) {
      console.error('Error in enhanced query submission:', error);
      return {
        success: false,
        error: error.message,
        enhanced: false
      };
    }
  }

  /**
   * Build enhanced description with medical context
   * This formats the patient's question with their medical history context
   */
  buildEnhancedDescription(originalDescription, contextData) {
    if (!contextData.hasPatientHistory) {
      // No medical history available - return original with note
      return `${originalDescription}

[Note: This query will be processed with general diabetes guidance as detailed medical history is not available]`;
    }

    // Build enhanced description with medical context
    let enhanced = `PATIENT QUERY: ${originalDescription}

MEDICAL CONTEXT FOR AI PROCESSING:
${contextData.fullContext}

PROCESSING INSTRUCTIONS:
- Use the patient's specific medical history above when formulating your response
- Reference their current medications, HbA1c levels, and treatment status
- Consider their diabetes type, age, ethnicity, and comorbidities
- Provide personalized recommendations based on their medical profile
- Always recommend consulting with their assigned diabetes specialist for medical decisions

Please provide a response that considers this patient's specific medical situation and history.`;

    return enhanced;
  }

  /**
   * Get query enhancement details by query ID
   * Useful for understanding how a query was enhanced
   */
  getQueryEnhancementDetails(queryId) {
    return this.enhancedQueries.get(queryId) || null;
  }

  /**
   * Enhanced query retrieval with context information
   * This provides additional context about how the query was processed
   */
  async getEnhancedQuery(queryId) {
    try {
      // Get the original query from the API
      const queryResult = await trustCareAPI.getQuery(queryId);
      
      if (!queryResult.success) {
        return queryResult;
      }

      // Get enhancement details
      const enhancementDetails = this.getQueryEnhancementDetails(queryId);
      
      if (enhancementDetails) {
        // Return query with enhancement information
        return {
          success: true,
          data: {
            ...queryResult.data,
            enhanced: true,
            enhancementDetails: enhancementDetails,
            originalDescription: enhancementDetails.originalDescription,
            contextType: enhancementDetails.contextType,
            hasPatientHistory: enhancementDetails.hasPatientHistory
          }
        };
      } else {
        // Return original query with enhancement flag
        return {
          success: true,
          data: {
            ...queryResult.data,
            enhanced: false
          }
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all enhanced queries for a patient
   * Provides insight into the patient's query history with enhancements
   */
  async getPatientEnhancedQueries(patientId) {
    try {
      // Get patient queries from API
      const queriesResult = await trustCareAPI.getPatientQueries(patientId);
      
      if (!queriesResult.success) {
        return queriesResult;
      }

      // Enhance each query with context information
      const enhancedQueries = queriesResult.data.map(query => {
        const enhancementDetails = this.getQueryEnhancementDetails(query.id);
        
        return {
          ...query,
          enhanced: enhancementDetails ? true : false,
          contextType: enhancementDetails?.contextType || null,
          hasPatientHistory: enhancementDetails?.hasPatientHistory || false,
          originalDescription: enhancementDetails?.originalDescription || query.description
        };
      });

      return {
        success: true,
        data: enhancedQueries,
        totalQueries: enhancedQueries.length,
        enhancedQueries: enhancedQueries.filter(q => q.enhanced).length,
        enhancementRate: enhancedQueries.length > 0 
          ? (enhancedQueries.filter(q => q.enhanced).length / enhancedQueries.length * 100).toFixed(1) + '%'
          : '0%'
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test the enhancement system with sample queries
   * Useful for deployment testing and verification
   */
  async testEnhancementSystem() {
    console.log('🧪 Testing Query Enhancement System');
    console.log('===================================');

    const testPatients = [
      { id: 'P001', name: 'Sarah Michelle Johnson' },
      { id: 'P002', name: 'Michael David Rodriguez' },
      { id: 'P003', name: 'Carlos Eduardo Mendoza' }
    ];

    const testQueries = [
      {
        title: 'Blood Sugar Management',
        description: 'My blood sugars have been higher than usual lately. What should I do?'
      },
      {
        title: 'Medication Question',
        description: 'Can I take my diabetes medication with food or should it be on an empty stomach?'
      },
      {
        title: 'Exercise and Diabetes',
        description: 'I want to start exercising more. How do I manage my blood sugar during workouts?'
      }
    ];

    const testResults = [];

    for (const patient of testPatients) {
      console.log(`\n👤 Testing with ${patient.name} (${patient.id})`);
      
      for (const query of testQueries) {
        try {
          // Test context generation without submission
          const contextData = medicalHistoryProvider.getEnhancedContextForQuery(
            patient.id, 
            query.description
          );

          const enhancedDesc = this.buildEnhancedDescription(query.description, contextData);

          testResults.push({
            patient: patient.name,
            patientId: patient.id,
            queryTitle: query.title,
            originalLength: query.description.length,
            enhancedLength: enhancedDesc.length,
            contextType: contextData.contextType,
            hasHistory: contextData.hasPatientHistory,
            enhancementRatio: (enhancedDesc.length / query.description.length).toFixed(1)
          });

          console.log(`  ✅ ${query.title}: Enhanced (${enhancedDesc.length} chars, ${contextData.contextType})`);

        } catch (error) {
          console.log(`  ❌ ${query.title}: Failed - ${error.message}`);
          testResults.push({
            patient: patient.name,
            patientId: patient.id,
            queryTitle: query.title,
            error: error.message
          });
        }
      }
    }

    // Generate test summary
    const summary = {
      totalTests: testResults.length,
      successful: testResults.filter(r => !r.error).length,
      failed: testResults.filter(r => r.error).length,
      averageEnhancementRatio: testResults
        .filter(r => r.enhancementRatio)
        .reduce((sum, r) => sum + parseFloat(r.enhancementRatio), 0) / 
        testResults.filter(r => r.enhancementRatio).length,
      contextTypes: [...new Set(testResults.map(r => r.contextType).filter(Boolean))],
      results: testResults
    };

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${summary.totalTests}`);
    console.log(`  Successful: ${summary.successful}`);
    console.log(`  Failed: ${summary.failed}`);
    console.log(`  Average Enhancement: ${summary.averageEnhancementRatio.toFixed(1)}x`);
    console.log(`  Context Types: ${summary.contextTypes.join(', ')}`);

    return summary;
  }

  /**
   * Get enhancement statistics
   * Provides metrics on how the enhancement system is performing
   */
  getEnhancementStatistics() {
    const queries = Array.from(this.enhancedQueries.values());
    
    if (queries.length === 0) {
      return {
        totalEnhancedQueries: 0,
        contextTypes: {},
        patientsWithHistory: 0,
        patientsWithoutHistory: 0,
        averageContextSize: 0
      };
    }

    const stats = {
      totalEnhancedQueries: queries.length,
      contextTypes: {},
      patientsWithHistory: queries.filter(q => q.hasPatientHistory).length,
      patientsWithoutHistory: queries.filter(q => !q.hasPatientHistory).length,
      uniquePatients: new Set(queries.map(q => q.patientId)).size,
      averageContextSize: queries.reduce((sum, q) => sum + q.enhancedDescription.length, 0) / queries.length
    };

    // Count context types
    queries.forEach(query => {
      stats.contextTypes[query.contextType] = (stats.contextTypes[query.contextType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear enhancement cache
   * Useful for testing and memory management
   */
  clearCache() {
    this.contextCache.clear();
    this.enhancedQueries.clear();
    console.log('✅ Enhancement cache cleared');
  }
}

// Export singleton instance
const queryContextEnhancer = new QueryContextEnhancer();

export default queryContextEnhancer;

// Named exports
export { QueryContextEnhancer };

// Convenience functions for easy integration
export const submitEnhancedQuery = (patientId, title, description) => 
  queryContextEnhancer.submitEnhancedQuery(patientId, title, description);

export const getEnhancedQuery = (queryId) => 
  queryContextEnhancer.getEnhancedQuery(queryId);

export const getPatientEnhancedQueries = (patientId) => 
  queryContextEnhancer.getPatientEnhancedQueries(patientId);

export const testEnhancementSystem = () => 
  queryContextEnhancer.testEnhancementSystem();