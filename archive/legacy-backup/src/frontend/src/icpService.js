import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './declarations/backend';

// Backend canister ID (will be set after deployment)
const BACKEND_CANISTER_ID = process.env.REACT_APP_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

class ICPService {
  constructor() {
    this.actor = null;
    this.agent = null;
    this.init();
  }

  async init() {
    try {
      // Create HTTP agent
      this.agent = new HttpAgent({
        host: process.env.NODE_ENV === 'development' ? 'http://localhost:4943' : 'https://icp-api.io'
      });

      // Fetch root key for local development
      if (process.env.NODE_ENV === 'development') {
        await this.agent.fetchRootKey();
      }

      // Create actor for backend canister
      this.actor = Actor.createActor(idlFactory, {
        agent: this.agent,
        canisterId: BACKEND_CANISTER_ID,
      });

    } catch (error) {
      console.error('Failed to initialize ICP service:', error);
    }
  }

  // Ensure actor is initialized
  async ensureActor() {
    if (!this.actor) {
      await this.init();
    }
    return this.actor;
  }

  // =======================
  // PATIENT FUNCTIONS
  // =======================

  async registerPatient(name, condition, email) {
    try {
      const actor = await this.ensureActor();
      const patientId = await actor.registerPatient(name, condition, email);
      return { success: true, data: patientId };
    } catch (error) {
      console.error('Error registering patient:', error);
      return { success: false, error: error.message };
    }
  }

  async getPatient(patientId) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.getPatient(patientId);
      return { success: true, data: result[0] || null };
    } catch (error) {
      console.error('Error getting patient:', error);
      return { success: false, error: error.message };
    }
  }

  async submitQuery(patientId, title, description) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.submitQuery(patientId, title, description);
      
      if ('ok' in result) {
        return { success: true, data: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      return { success: false, error: error.message };
    }
  }

  async getPatientQueries(patientId) {
    try {
      const actor = await this.ensureActor();
      const queries = await actor.getPatientQueries(patientId);
      return { success: true, data: queries };
    } catch (error) {
      console.error('Error getting patient queries:', error);
      return { success: false, error: error.message };
    }
  }

  // =======================
  // PATIENT ASSIGNMENT FUNCTIONS
  // =======================

  async getUnassignedPatients() {
    try {
      const actor = await this.ensureActor();
      const patients = await actor.getUnassignedPatients();
      return { success: true, data: patients };
    } catch (error) {
      console.error('Error getting unassigned patients:', error);
      return { success: false, error: error.message };
    }
  }

  async assignPatientToDoctor(patientId, doctorId) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.assignPatientToDoctor(patientId, doctorId);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error assigning patient to doctor:', error);
      return { success: false, error: error.message };
    }
  }

  async getDoctorPatients(doctorId) {
    try {
      const actor = await this.ensureActor();
      const patients = await actor.getDoctorPatients(doctorId);
      return { success: true, data: patients };
    } catch (error) {
      console.error('Error getting doctor patients:', error);
      return { success: false, error: error.message };
    }
  }

  async unassignPatient(patientId, doctorId) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.unassignPatient(patientId, doctorId);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error unassigning patient:', error);
      return { success: false, error: error.message };
    }
  }

  // =======================
  // DOCTOR FUNCTIONS
  // =======================

  async registerDoctor(name, specialization) {
    try {
      const actor = await this.ensureActor();
      const doctorId = await actor.registerDoctor(name, specialization);
      return { success: true, data: doctorId };
    } catch (error) {
      console.error('Error registering doctor:', error);
      return { success: false, error: error.message };
    }
  }

  async getDoctor(doctorId) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.getDoctor(doctorId);
      return { success: true, data: result[0] || null };
    } catch (error) {
      console.error('Error getting doctor:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingQueries() {
    try {
      const actor = await this.ensureActor();
      const queries = await actor.getPendingQueries();
      return { success: true, data: queries };
    } catch (error) {
      console.error('Error getting pending queries:', error);
      return { success: false, error: error.message };
    }
  }

  async takeQuery(queryId, doctorId) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.takeQuery(queryId, doctorId);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error taking query:', error);
      return { success: false, error: error.message };
    }
  }

  async respondToQuery(queryId, doctorId, response) {
    try {
      const actor = await this.ensureActor();
      const result = await actor.respondToQuery(queryId, doctorId, response);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      console.error('Error responding to query:', error);
      return { success: false, error: error.message };
    }
  }

  async getDoctorQueries(doctorId) {
    try {
      const actor = await this.ensureActor();
      const queries = await actor.getDoctorQueries(doctorId);
      return { success: true, data: queries };
    } catch (error) {
      console.error('Error getting doctor queries:', error);
      return { success: false, error: error.message };
    }
  }

  // =======================
  // GENERAL FUNCTIONS
  // =======================

  async getAllDoctors() {
    try {
      const actor = await this.ensureActor();
      const doctors = await actor.getAllDoctors();
      return { success: true, data: doctors };
    } catch (error) {
      console.error('Error getting all doctors:', error);
      return { success: false, error: error.message };
    }
  }

  async getStats() {
    try {
      const actor = await this.ensureActor();
      const stats = await actor.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false, error: error.message };
    }
  }

  async healthCheck() {
    try {
      const actor = await this.ensureActor();
      const status = await actor.healthCheck();
      return { success: true, data: status };
    } catch (error) {
      console.error('Error with health check:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const icpService = new ICPService();
export default icpService;