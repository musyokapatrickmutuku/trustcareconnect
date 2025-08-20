// TrustCareConnect API - Comprehensive Motoko Backend Connection Functions
// High-level interface for all TrustCareConnect backend operations

import icpApiService from '../services/api.js';

/**
 * TrustCareConnect API Class
 * Provides structured access to all Motoko backend canister functions
 * with enhanced error handling, logging, and type safety
 */
class TrustCareAPI {
  constructor() {
    this.service = icpApiService;
    this.log = this.service.log.bind(this.service);
  }

  // =======================
  // SYSTEM OPERATIONS
  // =======================

  /**
   * Perform health check on the backend canister
   */
  async healthCheck() {
    try {
      const result = await this.service.callCanisterMethod('healthCheck');
      return this.service.handleMotokoResult(result, 'health check');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const result = await this.service.callCanisterMethod('getStats');
      return this.service.handleMotokoResult(result, 'get system stats');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    return this.service.getConnectionInfo();
  }

  // =======================
  // PATIENT MANAGEMENT
  // =======================

  /**
   * Register a new patient in the system
   * @param {string} name - Patient's full name
   * @param {string} condition - Primary medical condition
   * @param {string} email - Patient's email address
   */
  async registerPatient(name, condition, email) {
    try {
      this.log(`Registering patient: ${name}, condition: ${condition}`);
      const result = await this.service.callCanisterMethod('registerPatient', [name, condition, email]);
      return this.service.handleMotokoResult(result, 'register patient');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve patient information by ID
   * @param {string} patientId - Patient's unique identifier
   */
  async getPatient(patientId) {
    try {
      this.log(`Getting patient: ${patientId}`);
      const result = await this.service.callCanisterMethod('getPatient', [patientId]);
      return this.service.handleMotokoOption(result, 'get patient');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Find patient by email address
   * @param {string} email - Patient's email address
   */
  async findPatientByEmail(email) {
    try {
      this.log(`Finding patient by email: ${email}`);
      const result = await this.service.callCanisterMethod('findPatientByEmail', [email]);
      return this.service.handleMotokoOption(result, 'find patient by email');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all patients not yet assigned to a doctor
   */
  async getUnassignedPatients() {
    try {
      this.log('Getting unassigned patients');
      const result = await this.service.callCanisterMethod('getUnassignedPatients');
      return this.service.handleMotokoResult(result, 'get unassigned patients');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a patient to a doctor
   * @param {string} patientId - Patient's unique identifier
   * @param {string} doctorId - Doctor's unique identifier
   */
  async assignPatientToDoctor(patientId, doctorId) {
    try {
      this.log(`Assigning patient ${patientId} to doctor ${doctorId}`);
      const result = await this.service.callCanisterMethod('assignPatientToDoctor', [patientId, doctorId]);
      return this.service.handleMotokoResult(result, 'assign patient to doctor');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all patients assigned to a specific doctor
   * @param {string} doctorId - Doctor's unique identifier
   */
  async getDoctorPatients(doctorId) {
    try {
      this.log(`Getting patients for doctor: ${doctorId}`);
      const result = await this.service.callCanisterMethod('getDoctorPatients', [doctorId]);
      return this.service.handleMotokoResult(result, 'get doctor patients');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Unassign a patient from a doctor
   * @param {string} patientId - Patient's unique identifier
   * @param {string} doctorId - Doctor's unique identifier
   */
  async unassignPatient(patientId, doctorId) {
    try {
      this.log(`Unassigning patient ${patientId} from doctor ${doctorId}`);
      const result = await this.service.callCanisterMethod('unassignPatient', [patientId, doctorId]);
      return this.service.handleMotokoResult(result, 'unassign patient');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =======================
  // DOCTOR MANAGEMENT
  // =======================

  /**
   * Register a new doctor in the system
   * @param {string} name - Doctor's full name
   * @param {string} specialization - Medical specialization
   */
  async registerDoctor(name, specialization) {
    try {
      this.log(`Registering doctor: ${name}, specialization: ${specialization}`);
      const result = await this.service.callCanisterMethod('registerDoctor', [name, specialization]);
      return this.service.handleMotokoResult(result, 'register doctor');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve doctor information by ID
   * @param {string} doctorId - Doctor's unique identifier
   */
  async getDoctor(doctorId) {
    try {
      this.log(`Getting doctor: ${doctorId}`);
      const result = await this.service.callCanisterMethod('getDoctor', [doctorId]);
      return this.service.handleMotokoOption(result, 'get doctor');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all registered doctors in the system
   */
  async getAllDoctors() {
    try {
      this.log('Getting all doctors');
      const result = await this.service.callCanisterMethod('getAllDoctors');
      return this.service.handleMotokoResult(result, 'get all doctors');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =======================
  // QUERY MANAGEMENT
  // =======================

  /**
   * Submit a new medical query from a patient
   * @param {string} patientId - Patient's unique identifier
   * @param {string} title - Query title/summary
   * @param {string} description - Detailed query description
   */
  async submitQuery(patientId, title, description) {
    try {
      this.log(`Submitting query for patient ${patientId}: ${title}`);
      const result = await this.service.callCanisterMethod('submitQuery', [patientId, title, description], {
        timeout: 60000 // Extended timeout for AI processing
      });
      return this.service.handleMotokoResult(result, 'submit query');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve a specific query by ID
   * @param {string} queryId - Query's unique identifier
   */
  async getQuery(queryId) {
    try {
      this.log(`Getting query: ${queryId}`);
      const result = await this.service.callCanisterMethod('getQuery', [queryId]);
      return this.service.handleMotokoOption(result, 'get query');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all queries submitted by a specific patient
   * @param {string} patientId - Patient's unique identifier
   */
  async getPatientQueries(patientId) {
    try {
      this.log(`Getting queries for patient: ${patientId}`);
      const result = await this.service.callCanisterMethod('getPatientQueries', [patientId]);
      return this.service.handleMotokoResult(result, 'get patient queries');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all queries that are pending doctor review
   */
  async getPendingQueries() {
    try {
      this.log('Getting pending queries');
      const result = await this.service.callCanisterMethod('getPendingQueries');
      return this.service.handleMotokoResult(result, 'get pending queries');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Doctor takes ownership of a pending query
   * @param {string} queryId - Query's unique identifier
   * @param {string} doctorId - Doctor's unique identifier
   */
  async takeQuery(queryId, doctorId) {
    try {
      this.log(`Doctor ${doctorId} taking query ${queryId}`);
      const result = await this.service.callCanisterMethod('takeQuery', [queryId, doctorId]);
      return this.service.handleMotokoResult(result, 'take query');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Doctor responds to a query under their review
   * @param {string} queryId - Query's unique identifier
   * @param {string} doctorId - Doctor's unique identifier
   * @param {string} response - Doctor's response to the query
   */
  async respondToQuery(queryId, doctorId, response) {
    try {
      this.log(`Doctor ${doctorId} responding to query ${queryId}`);
      const result = await this.service.callCanisterMethod('respondToQuery', [queryId, doctorId, response]);
      return this.service.handleMotokoResult(result, 'respond to query');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all queries assigned to a specific doctor
   * @param {string} doctorId - Doctor's unique identifier
   */
  async getDoctorQueries(doctorId) {
    try {
      this.log(`Getting queries for doctor: ${doctorId}`);
      const result = await this.service.callCanisterMethod('getDoctorQueries', [doctorId]);
      return this.service.handleMotokoResult(result, 'get doctor queries');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =======================
  // BATCH OPERATIONS
  // =======================

  /**
   * Batch operation to get complete dashboard data for a doctor
   * @param {string} doctorId - Doctor's unique identifier
   */
  async getDoctorDashboardData(doctorId) {
    try {
      this.log(`Getting dashboard data for doctor: ${doctorId}`);
      
      // Parallel execution of multiple operations
      const [doctorInfo, assignedPatients, doctorQueries, pendingQueries, systemStats] = await Promise.allSettled([
        this.getDoctor(doctorId),
        this.getDoctorPatients(doctorId),
        this.getDoctorQueries(doctorId),
        this.getPendingQueries(),
        this.getSystemStats()
      ]);

      return {
        success: true,
        data: {
          doctor: doctorInfo.status === 'fulfilled' ? doctorInfo.value : null,
          patients: assignedPatients.status === 'fulfilled' ? assignedPatients.value : null,
          queries: doctorQueries.status === 'fulfilled' ? doctorQueries.value : null,
          pendingQueries: pendingQueries.status === 'fulfilled' ? pendingQueries.value : null,
          stats: systemStats.status === 'fulfilled' ? systemStats.value : null
        },
        errors: [doctorInfo, assignedPatients, doctorQueries, pendingQueries, systemStats]
          .filter(result => result.status === 'rejected')
          .map(result => result.reason)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch operation to get complete patient portal data
   * @param {string} patientId - Patient's unique identifier
   */
  async getPatientPortalData(patientId) {
    try {
      this.log(`Getting portal data for patient: ${patientId}`);
      
      // Parallel execution of multiple operations
      const [patientInfo, patientQueries, systemStats] = await Promise.allSettled([
        this.getPatient(patientId),
        this.getPatientQueries(patientId),
        this.getSystemStats()
      ]);

      return {
        success: true,
        data: {
          patient: patientInfo.status === 'fulfilled' ? patientInfo.value : null,
          queries: patientQueries.status === 'fulfilled' ? patientQueries.value : null,
          stats: systemStats.status === 'fulfilled' ? systemStats.value : null
        },
        errors: [patientInfo, patientQueries, systemStats]
          .filter(result => result.status === 'rejected')
          .map(result => result.reason)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // =======================
  // UTILITY METHODS
  // =======================

  /**
   * Test connection with comprehensive diagnostics
   */
  async testConnection() {
    try {
      const connectionInfo = this.getConnectionInfo();
      const healthResult = await this.healthCheck();
      
      return {
        success: true,
        data: {
          connection: connectionInfo,
          health: healthResult,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        connection: this.getConnectionInfo()
      };
    }
  }

  /**
   * Reinitialize connection (useful for reconnection scenarios)
   */
  async reconnect() {
    try {
      await this.service.initialize();
      return { success: true, message: 'Reconnection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const trustCareAPI = new TrustCareAPI();
export default trustCareAPI;

// Named exports for specific use cases
export {
  trustCareAPI,
  TrustCareAPI
};