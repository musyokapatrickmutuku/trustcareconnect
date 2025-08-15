// ICP Service - Refactored with TypeScript and better structure
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/backend';
import { Patient, Doctor, MedicalQuery, SystemStats, ApiResponse } from '../types';

// Backend canister ID (will be set after deployment)
const BACKEND_CANISTER_ID = process.env.REACT_APP_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

class ICPService {
  private actor: any = null;
  private agent: HttpAgent | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
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
  private async ensureActor(): Promise<any> {
    if (!this.actor) {
      await this.init();
    }
    return this.actor;
  }

  // Generic error handler
  private handleError(error: any, operation: string): ApiResponse<never> {
    console.error(`Error ${operation}:`, error);
    return { 
      success: false, 
      error: error.message || `Failed to ${operation}` 
    };
  }

  // =======================
  // PATIENT METHODS
  // =======================

  async registerPatient(name: string, condition: string, email: string): Promise<ApiResponse<string>> {
    try {
      const actor = await this.ensureActor();
      const patientId = await actor.registerPatient(name, condition, email);
      return { success: true, data: patientId };
    } catch (error) {
      return this.handleError(error, 'register patient');
    }
  }

  async getPatient(patientId: string): Promise<ApiResponse<Patient | null>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.getPatient(patientId);
      return { success: true, data: result[0] || null };
    } catch (error) {
      return this.handleError(error, 'get patient');
    }
  }

  async getUnassignedPatients(): Promise<ApiResponse<Patient[]>> {
    try {
      const actor = await this.ensureActor();
      const patients = await actor.getUnassignedPatients();
      return { success: true, data: patients };
    } catch (error) {
      return this.handleError(error, 'get unassigned patients');
    }
  }

  async assignPatientToDoctor(patientId: string, doctorId: string): Promise<ApiResponse<void>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.assignPatientToDoctor(patientId, doctorId);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      return this.handleError(error, 'assign patient to doctor');
    }
  }

  async getDoctorPatients(doctorId: string): Promise<ApiResponse<Patient[]>> {
    try {
      const actor = await this.ensureActor();
      const patients = await actor.getDoctorPatients(doctorId);
      return { success: true, data: patients };
    } catch (error) {
      return this.handleError(error, 'get doctor patients');
    }
  }

  async unassignPatient(patientId: string, doctorId: string): Promise<ApiResponse<void>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.unassignPatient(patientId, doctorId);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      return this.handleError(error, 'unassign patient');
    }
  }

  // =======================
  // DOCTOR METHODS
  // =======================

  async registerDoctor(name: string, specialization: string): Promise<ApiResponse<string>> {
    try {
      const actor = await this.ensureActor();
      const doctorId = await actor.registerDoctor(name, specialization);
      return { success: true, data: doctorId };
    } catch (error) {
      return this.handleError(error, 'register doctor');
    }
  }

  async getDoctor(doctorId: string): Promise<ApiResponse<Doctor | null>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.getDoctor(doctorId);
      return { success: true, data: result[0] || null };
    } catch (error) {
      return this.handleError(error, 'get doctor');
    }
  }

  async getAllDoctors(): Promise<ApiResponse<Doctor[]>> {
    try {
      const actor = await this.ensureActor();
      const doctors = await actor.getAllDoctors();
      return { success: true, data: doctors };
    } catch (error) {
      return this.handleError(error, 'get all doctors');
    }
  }

  // =======================
  // QUERY METHODS
  // =======================

  async submitQuery(patientId: string, title: string, description: string): Promise<ApiResponse<string>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.submitQuery(patientId, title, description);
      
      if ('ok' in result) {
        return { success: true, data: result.ok };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      return this.handleError(error, 'submit query');
    }
  }

  async getPatientQueries(patientId: string): Promise<ApiResponse<MedicalQuery[]>> {
    try {
      const actor = await this.ensureActor();
      const queries = await actor.getPatientQueries(patientId);
      return { success: true, data: queries };
    } catch (error) {
      return this.handleError(error, 'get patient queries');
    }
  }

  async getPendingQueries(): Promise<ApiResponse<MedicalQuery[]>> {
    try {
      const actor = await this.ensureActor();
      const queries = await actor.getPendingQueries();
      return { success: true, data: queries };
    } catch (error) {
      return this.handleError(error, 'get pending queries');
    }
  }

  async takeQuery(queryId: string, doctorId: string): Promise<ApiResponse<void>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.takeQuery(queryId, doctorId);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      return this.handleError(error, 'take query');
    }
  }

  async respondToQuery(queryId: string, doctorId: string, response: string): Promise<ApiResponse<void>> {
    try {
      const actor = await this.ensureActor();
      const result = await actor.respondToQuery(queryId, doctorId, response);
      
      if ('ok' in result) {
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (error) {
      return this.handleError(error, 'respond to query');
    }
  }

  async getDoctorQueries(doctorId: string): Promise<ApiResponse<MedicalQuery[]>> {
    try {
      const actor = await this.ensureActor();
      const queries = await actor.getDoctorQueries(doctorId);
      return { success: true, data: queries };
    } catch (error) {
      return this.handleError(error, 'get doctor queries');
    }
  }

  // =======================
  // SYSTEM METHODS
  // =======================

  async getStats(): Promise<ApiResponse<SystemStats>> {
    try {
      const actor = await this.ensureActor();
      const stats = await actor.getStats();
      return { success: true, data: stats };
    } catch (error) {
      return this.handleError(error, 'get stats');
    }
  }

  async healthCheck(): Promise<ApiResponse<string>> {
    try {
      const actor = await this.ensureActor();
      const status = await actor.healthCheck();
      return { success: true, data: status };
    } catch (error) {
      return this.handleError(error, 'health check');
    }
  }
}

// Export singleton instance
const icpService = new ICPService();
export default icpService;