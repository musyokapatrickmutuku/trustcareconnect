// ICP Service Tests
import icpService from '../services/icpService';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Patient, Doctor, MedicalQuery } from '../types';

// Mock the ICP agent for testing
jest.mock('@dfinity/agent');

const mockActor = {
  registerPatient: jest.fn(),
  getPatient: jest.fn(),
  findPatientByEmail: jest.fn(),
  registerDoctor: jest.fn(),
  getDoctor: jest.fn(),
  getAllDoctors: jest.fn(),
  submitQuery: jest.fn(),
  getPatientQueries: jest.fn(),
  assignPatientToDoctor: jest.fn(),
  healthCheck: jest.fn(),
  getStats: jest.fn()
};

(Actor.createActor as jest.Mock).mockReturnValue(mockActor);
(HttpAgent as jest.MockedClass<typeof HttpAgent>).mockImplementation(() => ({
  fetchRootKey: jest.fn().mockResolvedValue(undefined)
}) as any);

describe('ICPService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Patient Management', () => {
    test('should register patient successfully', async () => {
      const mockPatientId = 'patient_123';
      mockActor.registerPatient.mockResolvedValue(mockPatientId);

      const result = await icpService.registerPatient('John Doe', 'Diabetes', 'john@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockPatientId);
      expect(mockActor.registerPatient).toHaveBeenCalledWith('John Doe', 'Diabetes', 'john@example.com');
    });

    test('should handle patient registration errors', async () => {
      const errorMessage = 'Registration failed';
      mockActor.registerPatient.mockRejectedValue(new Error(errorMessage));

      const result = await icpService.registerPatient('John Doe', 'Diabetes', 'john@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('register patient');
    });

    test('should find patient by email successfully', async () => {
      const mockPatient: Patient = {
        id: 'patient_123',
        name: 'John Doe',
        condition: 'Diabetes',
        email: 'john@example.com',
        assignedDoctorId: 'doctor_456',
        isActive: true
      };
      mockActor.findPatientByEmail.mockResolvedValue([mockPatient]);

      const result = await icpService.findPatientByEmail('john@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPatient);
      expect(mockActor.findPatientByEmail).toHaveBeenCalledWith('john@example.com');
    });

    test('should return null when patient email not found', async () => {
      mockActor.findPatientByEmail.mockResolvedValue([]);

      const result = await icpService.findPatientByEmail('notfound@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    test('should get patient by ID successfully', async () => {
      const mockPatient: Patient = {
        id: 'patient_123',
        name: 'John Doe',
        condition: 'Diabetes',
        email: 'john@example.com',
        assignedDoctorId: 'doctor_456',
        isActive: true
      };
      mockActor.getPatient.mockResolvedValue([mockPatient]);

      const result = await icpService.getPatient('patient_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPatient);
    });

    test('should assign patient to doctor successfully', async () => {
      mockActor.assignPatientToDoctor.mockResolvedValue({ ok: undefined });

      const result = await icpService.assignPatientToDoctor('patient_123', 'doctor_456');

      expect(result.success).toBe(true);
      expect(mockActor.assignPatientToDoctor).toHaveBeenCalledWith('patient_123', 'doctor_456');
    });

    test('should handle assignment errors', async () => {
      const errorMessage = 'Patient not found';
      mockActor.assignPatientToDoctor.mockResolvedValue({ err: errorMessage });

      const result = await icpService.assignPatientToDoctor('invalid_patient', 'doctor_456');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('Doctor Management', () => {
    test('should register doctor successfully', async () => {
      const mockDoctorId = 'doctor_456';
      mockActor.registerDoctor.mockResolvedValue(mockDoctorId);

      const result = await icpService.registerDoctor('Dr. Smith', 'Cardiology');

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockDoctorId);
      expect(mockActor.registerDoctor).toHaveBeenCalledWith('Dr. Smith', 'Cardiology');
    });

    test('should handle doctor registration errors', async () => {
      const errorMessage = 'Registration failed';
      mockActor.registerDoctor.mockRejectedValue(new Error(errorMessage));

      const result = await icpService.registerDoctor('Dr. Smith', 'Cardiology');

      expect(result.success).toBe(false);
      expect(result.error).toContain('register doctor');
    });

    test('should get doctor by ID successfully', async () => {
      const mockDoctor: Doctor = {
        id: 'doctor_456',
        name: 'Dr. Smith',
        specialization: 'Cardiology'
      };
      mockActor.getDoctor.mockResolvedValue([mockDoctor]);

      const result = await icpService.getDoctor('doctor_456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDoctor);
    });

    test('should get all doctors successfully', async () => {
      const mockDoctors: Doctor[] = [
        { id: 'doctor_456', name: 'Dr. Smith', specialization: 'Cardiology' },
        { id: 'doctor_789', name: 'Dr. Johnson', specialization: 'Neurology' }
      ];
      mockActor.getAllDoctors.mockResolvedValue(mockDoctors);

      const result = await icpService.getAllDoctors();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDoctors);
      expect(result.data).toHaveLength(2);
    });

    test('should return null when doctor not found', async () => {
      mockActor.getDoctor.mockResolvedValue([]);

      const result = await icpService.getDoctor('invalid_doctor');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('Query Management', () => {
    test('should submit query successfully', async () => {
      const mockQueryId = 'query_789';
      mockActor.submitQuery.mockResolvedValue({ ok: mockQueryId });

      const result = await icpService.submitQuery('patient_123', 'Chest Pain', 'I have been experiencing chest pain for 2 days');

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockQueryId);
      expect(mockActor.submitQuery).toHaveBeenCalledWith('patient_123', 'Chest Pain', 'I have been experiencing chest pain for 2 days');
    });

    test('should handle query submission errors', async () => {
      const errorMessage = 'Patient must be assigned to a doctor first';
      mockActor.submitQuery.mockResolvedValue({ err: errorMessage });

      const result = await icpService.submitQuery('patient_123', 'Chest Pain', 'I have chest pain');

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    test('should get patient queries successfully', async () => {
      const mockQueries: MedicalQuery[] = [
        {
          id: 'query_789',
          patientId: 'patient_123',
          title: 'Chest Pain',
          description: 'I have chest pain',
          status: 'pending',
          doctorId: 'doctor_456',
          response: undefined,
          aiDraftResponse: 'This is a mock AI response',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];
      mockActor.getPatientQueries.mockResolvedValue(mockQueries);

      const result = await icpService.getPatientQueries('patient_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQueries);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].status).toBe('pending');
    });

    test('should handle empty query list', async () => {
      mockActor.getPatientQueries.mockResolvedValue([]);

      const result = await icpService.getPatientQueries('patient_with_no_queries');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    });

    test('should handle query fetch errors', async () => {
      const errorMessage = 'Network error';
      mockActor.getPatientQueries.mockRejectedValue(new Error(errorMessage));

      const result = await icpService.getPatientQueries('patient_123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('get patient queries');
    });
  });

  describe('System Functions', () => {
    test('should perform health check successfully', async () => {
      const mockHealthStatus = 'TrustCareConnect backend is running! Patients: 5, Doctors: 3, Queries: 10';
      mockActor.healthCheck.mockResolvedValue(mockHealthStatus);

      const result = await icpService.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockHealthStatus);
      expect(result.data).toContain('TrustCareConnect backend is running');
    });

    test('should get system stats successfully', async () => {
      const mockStats = {
        totalPatients: 10,
        totalDoctors: 5,
        totalQueries: 25,
        pendingQueries: 8,
        completedQueries: 17
      };
      mockActor.getStats.mockResolvedValue(mockStats);

      const result = await icpService.getStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(result.data!.totalPatients).toBe(10);
      expect(result.data!.pendingQueries).toBeLessThan(result.data!.totalQueries);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const networkError = new Error('Network connection failed');
      mockActor.healthCheck.mockRejectedValue(networkError);

      const result = await icpService.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error).toContain('health check');
    });

    test('should handle canister errors gracefully', async () => {
      const canisterError = new Error('Canister call failed');
      mockActor.registerPatient.mockRejectedValue(canisterError);

      const result = await icpService.registerPatient('Test Patient', 'Test Condition', 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle actor initialization failure', async () => {
      // Test when actor is null/undefined
      const originalActor = (icpService as any).actor;
      (icpService as any).actor = null;

      const result = await icpService.healthCheck();

      expect(result.success).toBe(true); // Should recover by re-initializing
      
      // Restore actor
      (icpService as any).actor = originalActor;
    });

    test('should handle invalid response formats', async () => {
      // Test malformed responses
      mockActor.getPatient.mockResolvedValue('invalid_response_format');

      const result = await icpService.getPatient('patient_123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull(); // Should handle gracefully
    });
  });
});