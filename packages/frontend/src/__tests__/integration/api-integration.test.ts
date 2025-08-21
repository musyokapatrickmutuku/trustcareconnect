/**
 * Integration Tests for API Layer
 * Tests API calls, error handling, and data transformation
 */

import trustCareAPI from '../../api/trustcare';
import { Patient, Doctor, MedicalQuery, QueryStatus } from '../../types';

// Mock fetch for integration tests
global.fetch = jest.fn();

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  const mockFetchResponse = (data: any, ok = true, status = 200) => {
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    } as Response);
  };

  describe('Health Check API', () => {
    it('successfully checks backend health', async () => {
      const mockResponse = { status: 'healthy', timestamp: Date.now() };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('handles health check failures', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Network error')
      );

      const result = await trustCareAPI.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Patient API Operations', () => {
    const mockPatient: Patient = {
      id: 'patient-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      condition: 'Diabetes',
      isActive: true,
      assignedDoctorId: 'doctor-456'
    };

    it('creates a new patient successfully', async () => {
      const mockResponse = { success: true, data: mockPatient };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const patientData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        condition: 'Diabetes'
      };

      const result = await trustCareAPI.createPatient(patientData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPatient);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/patients'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(patientData)
        })
      );
    });

    it('retrieves patient by ID', async () => {
      const mockResponse = { success: true, data: mockPatient };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.getPatient('patient-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPatient);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/patients/patient-123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('updates patient information', async () => {
      const updatedPatient = { ...mockPatient, condition: 'Type 2 Diabetes' };
      const mockResponse = { success: true, data: updatedPatient };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const updateData = { condition: 'Type 2 Diabetes' };
      const result = await trustCareAPI.updatePatient('patient-123', updateData);

      expect(result.success).toBe(true);
      expect(result.data?.condition).toBe('Type 2 Diabetes');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/patients/patient-123'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });

    it('handles patient API errors gracefully', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ error: 'Patient not found' }, false, 404)
      );

      const result = await trustCareAPI.getPatient('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Patient not found');
    });
  });

  describe('Doctor API Operations', () => {
    const mockDoctor: Doctor = {
      id: 'doctor-456',
      name: 'Dr. Jane Smith',
      specialization: 'Endocrinology',
      email: 'dr.smith@hospital.com',
      isActive: true
    };

    it('retrieves doctor information', async () => {
      const mockResponse = { success: true, data: mockDoctor };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.getDoctor('doctor-456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDoctor);
    });

    it('gets doctor dashboard data with batch operations', async () => {
      const mockDashboardData = {
        patients: { success: true, data: [mockPatient] },
        queries: { success: true, data: [] },
        pendingQueries: { success: true, data: [] }
      };
      
      const mockResponse = { success: true, data: mockDashboardData };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.getDoctorDashboardData('doctor-456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDashboardData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/doctors/doctor-456/dashboard'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('handles doctor assignment operations', async () => {
      const mockResponse = { success: true, data: { assigned: true } };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.assignPatientToDoctor('patient-123', 'doctor-456');

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assignments'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            patientId: 'patient-123',
            doctorId: 'doctor-456'
          })
        })
      );
    });
  });

  describe('Query API Operations', () => {
    const mockQuery: MedicalQuery = {
      id: 'query-789',
      title: 'Blood sugar concerns',
      description: 'Having trouble managing blood sugar levels',
      status: 'pending',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      createdAt: BigInt(Date.now() * 1000000),
      updatedAt: BigInt(Date.now() * 1000000),
      category: 'diabetes'
    };

    it('creates a new medical query', async () => {
      const mockResponse = { success: true, data: mockQuery };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const queryData = {
        title: 'Blood sugar concerns',
        description: 'Having trouble managing blood sugar levels',
        patientId: 'patient-123',
        category: 'diabetes'
      };

      const result = await trustCareAPI.createQuery(queryData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuery);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queries'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(queryData)
        })
      );
    });

    it('updates query status', async () => {
      const updatedQuery = { ...mockQuery, status: 'doctor_review' as QueryStatus };
      const mockResponse = { success: true, data: updatedQuery };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.updateQueryStatus('query-789', 'doctor_review');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('doctor_review');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queries/query-789/status'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'doctor_review' })
        })
      );
    });

    it('submits doctor response to query', async () => {
      const responseData = {
        queryId: 'query-789',
        doctorId: 'doctor-456',
        content: 'Please monitor blood sugar levels more frequently',
        recommendations: ['Check levels 3x daily', 'Adjust diet'],
        followUpInstructions: 'Schedule appointment in 2 weeks'
      };

      const mockResponse = { success: true, data: { submitted: true } };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.submitDoctorResponse(responseData);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/responses'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(responseData)
        })
      );
    });

    it('retrieves patient portal data efficiently', async () => {
      const mockPortalData = {
        patient: { success: true, data: mockPatient },
        queries: { success: true, data: [mockQuery] },
        notifications: { success: true, data: [] }
      };

      const mockResponse = { success: true, data: mockPortalData };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.getPatientPortalData('patient-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPortalData);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/patients/patient-123/portal'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Bulk Operations', () => {
    it('performs bulk query updates', async () => {
      const queryIds = ['query-1', 'query-2', 'query-3'];
      const updateData = { status: 'doctor_review' };
      const mockResponse = { success: true, data: { updated: 3 } };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse(mockResponse)
      );

      const result = await trustCareAPI.bulkUpdateQueries(queryIds, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.updated).toBe(3);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/queries/bulk-update'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ queryIds, updateData })
        })
      );
    });

    it('handles bulk operation failures gracefully', async () => {
      const queryIds = ['invalid-1', 'invalid-2'];
      const updateData = { status: 'completed' };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ error: 'Some queries not found' }, false, 400)
      );

      const result = await trustCareAPI.bulkUpdateQueries(queryIds, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Some queries not found');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('retries failed requests with exponential backoff', async () => {
      let callCount = 0;
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return mockFetchResponse({ success: true, data: 'success' });
      });

      const result = await trustCareAPI.healthCheck();

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('respects maximum retry attempts', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(
        new Error('Persistent network error')
      );

      const result = await trustCareAPI.healthCheck();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent network error');
      expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('handles different HTTP error status codes', async () => {
      const testCases = [
        { status: 400, expectedError: 'Bad Request' },
        { status: 401, expectedError: 'Unauthorized' },
        { status: 403, expectedError: 'Forbidden' },
        { status: 404, expectedError: 'Not Found' },
        { status: 500, expectedError: 'Internal Server Error' }
      ];

      for (const testCase of testCases) {
        (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
          mockFetchResponse(
            { error: testCase.expectedError },
            false,
            testCase.status
          )
        );

        const result = await trustCareAPI.getPatient('test-id');

        expect(result.success).toBe(false);
        expect(result.error).toContain(testCase.expectedError);
      }
    });
  });

  describe('Request Authentication and Headers', () => {
    it('includes authentication headers when available', async () => {
      // Mock authentication token
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'mock-auth-token'),
          setItem: jest.fn(),
          removeItem: jest.fn()
        },
        writable: true
      });

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ success: true })
      );

      await trustCareAPI.getPatient('patient-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-auth-token'
          })
        })
      );
    });

    it('includes proper content-type headers for different request types', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ success: true })
      );

      // Test JSON request
      await trustCareAPI.createPatient({ name: 'Test', email: 'test@example.com' });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('handles multipart form data for file uploads', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('patientId', 'patient-123');

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ success: true, fileId: 'file-123' })
      );

      const result = await trustCareAPI.uploadFile(formData);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/files/upload'),
        expect.objectContaining({
          method: 'POST',
          body: formData
          // Note: Content-Type should NOT be set for FormData
        })
      );
    });
  });

  describe('Response Data Transformation', () => {
    it('transforms timestamp strings to BigInt for query dates', async () => {
      const mockQueryWithTimestamp = {
        id: 'query-123',
        title: 'Test Query',
        createdAt: '1640995200000000000', // Nanosecond timestamp as string
        updatedAt: '1640995200000000000'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ success: true, data: mockQueryWithTimestamp })
      );

      const result = await trustCareAPI.getQuery('query-123');

      expect(result.success).toBe(true);
      expect(typeof result.data?.createdAt).toBe('bigint');
      expect(result.data?.createdAt).toBe(BigInt('1640995200000000000'));
    });

    it('handles null and undefined values in responses', async () => {
      const mockPatientWithNulls = {
        id: 'patient-123',
        name: 'John Doe',
        email: null,
        phone: undefined,
        assignedDoctorId: null
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        mockFetchResponse({ success: true, data: mockPatientWithNulls })
      );

      const result = await trustCareAPI.getPatient('patient-123');

      expect(result.success).toBe(true);
      expect(result.data?.email).toBeNull();
      expect(result.data?.assignedDoctorId).toBeNull();
    });
  });

  describe('Request Timeout and Cancellation', () => {
    it('times out long-running requests', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Mock AbortController
      const mockAbortController = {
        abort: jest.fn(),
        signal: {} as AbortSignal
      };
      global.AbortController = jest.fn(() => mockAbortController) as any;

      const startTime = Date.now();
      const result = await trustCareAPI.getPatient('patient-123');
      const endTime = Date.now();

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(endTime - startTime).toBeGreaterThan(9000); // Should timeout after ~10s
    });

    it('allows request cancellation', async () => {
      const mockAbortController = {
        abort: jest.fn(),
        signal: { aborted: false } as AbortSignal
      };
      global.AbortController = jest.fn(() => mockAbortController) as any;

      (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () => Promise.reject(new Error('AbortError'))
      );

      const result = await trustCareAPI.getPatient('patient-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('AbortError');
    });
  });
});