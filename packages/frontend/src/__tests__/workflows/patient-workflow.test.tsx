// End-to-End Patient Workflow Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import icpService from '../../services/icpService';

// Mock the icpService
jest.mock('../../services/icpService');
const mockIcpService = icpService as jest.Mocked<typeof icpService>;

// Wrapper component for routing
const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Patient Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockIcpService.healthCheck.mockResolvedValue({
      success: true,
      data: 'TrustCareConnect backend is running! Patients: 5, Doctors: 3, Queries: 10'
    });
  });

  describe('Complete Patient Registration and Query Flow', () => {
    test('should complete full patient journey: registration → login → query submission', async () => {
      const user = userEvent.setup();

      // Mock successful patient registration
      mockIcpService.registerPatient.mockResolvedValue({
        success: true,
        data: 'patient_123'
      });

      // Mock patient login (find by email)
      const mockPatient = {
        id: 'patient_123',
        name: 'John Doe',
        condition: 'Diabetes',
        email: 'john@example.com',
        assignedDoctorId: 'doctor_456',
        isActive: true
      };
      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      // Mock query submission
      mockIcpService.submitQuery.mockResolvedValue({
        success: true,
        data: 'query_789'
      });

      // Mock query retrieval
      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'query_789',
            patientId: 'patient_123',
            title: 'Blood Sugar Concerns',
            description: 'My blood sugar levels have been high recently',
            status: 'pending',
            doctorId: 'doctor_456',
            response: undefined,
            aiDraftResponse: 'Monitor your levels and consult your healthcare provider.',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ]
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // 1. Navigate to Patient Portal
      await user.click(screen.getByText(/patient portal/i));

      // 2. Register as new patient
      await user.click(screen.getByText(/new patient.*register/i));

      // Fill registration form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/condition/i), 'Diabetes');

      // Submit registration
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(mockIcpService.registerPatient).toHaveBeenCalledWith(
          'John Doe',
          'Diabetes',
          'john@example.com'
        );
      });

      // 3. Should automatically log in after registration
      await waitFor(() => {
        expect(screen.getByText(/welcome.*john doe/i)).toBeInTheDocument();
      });

      // 4. Submit a query
      await user.type(
        screen.getByLabelText(/query title/i),
        'Blood Sugar Concerns'
      );
      await user.type(
        screen.getByLabelText(/description/i),
        'My blood sugar levels have been high recently'
      );

      await user.click(screen.getByRole('button', { name: /submit query/i }));

      await waitFor(() => {
        expect(mockIcpService.submitQuery).toHaveBeenCalledWith(
          'patient_123',
          'Blood Sugar Concerns',
          'My blood sugar levels have been high recently'
        );
      });

      // 5. Verify query appears in patient's query list
      await waitFor(() => {
        expect(screen.getByText('Blood Sugar Concerns')).toBeInTheDocument();
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    test('should handle patient login workflow', async () => {
      const user = userEvent.setup();

      const mockPatient = {
        id: 'patient_456',
        name: 'Jane Smith',
        condition: 'Hypertension',
        email: 'jane@example.com',
        assignedDoctorId: 'doctor_789',
        isActive: true
      };

      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Navigate to Patient Portal
      await user.click(screen.getByText(/patient portal/i));

      // Login with existing email
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockIcpService.findPatientByEmail).toHaveBeenCalledWith('jane@example.com');
      });

      await waitFor(() => {
        expect(screen.getByText(/welcome.*jane smith/i)).toBeInTheDocument();
      });
    });

    test('should handle login failure gracefully', async () => {
      const user = userEvent.setup();

      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: null // Patient not found
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      await user.click(screen.getByText(/patient portal/i));
      await user.type(screen.getByLabelText(/email/i), 'notfound@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/patient not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Query Management Workflow', () => {
    const mockPatient = {
      id: 'patient_123',
      name: 'John Doe',
      condition: 'Diabetes',
      email: 'john@example.com',
      assignedDoctorId: 'doctor_456',
      isActive: true
    };

    beforeEach(() => {
      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: mockPatient
      });
    });

    test('should display existing queries for logged-in patient', async () => {
      const user = userEvent.setup();

      const mockQueries = [
        {
          id: 'query_1',
          patientId: 'patient_123',
          title: 'Medication Question',
          description: 'Question about my medication',
          status: 'completed' as const,
          doctorId: 'doctor_456',
          response: 'Continue taking your medication as prescribed.',
          aiDraftResponse: 'AI draft response',
          createdAt: Date.now() - 86400000, // 1 day ago
          updatedAt: Date.now()
        },
        {
          id: 'query_2',
          patientId: 'patient_123',
          title: 'Follow-up Question',
          description: 'Follow-up on previous visit',
          status: 'pending' as const,
          doctorId: 'doctor_456',
          response: undefined,
          aiDraftResponse: 'AI draft for pending query',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: mockQueries
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      await user.click(screen.getByText(/patient portal/i));
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('Medication Question')).toBeInTheDocument();
        expect(screen.getByText('Follow-up Question')).toBeInTheDocument();
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    test('should prevent query submission for unassigned patient', async () => {
      const user = userEvent.setup();

      const unassignedPatient = {
        ...mockPatient,
        assignedDoctorId: undefined,
        isActive: false
      };

      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: unassignedPatient
      });

      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      await user.click(screen.getByText(/patient portal/i));
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/you need to be assigned to a doctor/i)).toBeInTheDocument();
      });

      // Query form should be disabled or show warning
      const submitButton = screen.getByRole('button', { name: /submit query/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling Workflows', () => {
    test('should handle backend connectivity issues', async () => {
      const user = userEvent.setup();

      mockIcpService.healthCheck.mockResolvedValue({
        success: false,
        error: 'Backend connection failed'
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/backend connection failed/i)).toBeInTheDocument();
      });
    });

    test('should handle registration errors', async () => {
      const user = userEvent.setup();

      mockIcpService.registerPatient.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      await user.click(screen.getByText(/patient portal/i));
      await user.click(screen.getByText(/new patient.*register/i));

      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/condition/i), 'Test Condition');

      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    test('should handle query submission failures', async () => {
      const user = userEvent.setup();

      const mockPatient = {
        id: 'patient_123',
        name: 'John Doe',
        condition: 'Diabetes',
        email: 'john@example.com',
        assignedDoctorId: 'doctor_456',
        isActive: true
      };

      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: []
      });

      mockIcpService.submitQuery.mockResolvedValue({
        success: false,
        error: 'Query submission failed'
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      await user.click(screen.getByText(/patient portal/i));
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/welcome.*john doe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/query title/i), 'Test Query');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.click(screen.getByRole('button', { name: /submit query/i }));

      await waitFor(() => {
        expect(screen.getByText(/query submission failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and State Management', () => {
    test('should maintain patient state across page navigation', async () => {
      const user = userEvent.setup();

      const mockPatient = {
        id: 'patient_123',
        name: 'John Doe',
        condition: 'Diabetes',
        email: 'john@example.com',
        assignedDoctorId: 'doctor_456',
        isActive: true
      };

      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Login as patient
      await user.click(screen.getByText(/patient portal/i));
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/welcome.*john doe/i)).toBeInTheDocument();
      });

      // Navigate to home and back
      await user.click(screen.getByText(/^home$/i));
      await user.click(screen.getByText(/patient portal/i));

      // Should still be logged in
      await waitFor(() => {
        expect(screen.getByText(/welcome.*john doe/i)).toBeInTheDocument();
      });
    });

    test('should handle logout functionality', async () => {
      const user = userEvent.setup();

      const mockPatient = {
        id: 'patient_123',
        name: 'John Doe',
        condition: 'Diabetes',
        email: 'john@example.com',
        assignedDoctorId: 'doctor_456',
        isActive: true
      };

      mockIcpService.findPatientByEmail.mockResolvedValue({
        success: true,
        data: mockPatient
      });

      mockIcpService.getPatientQueries.mockResolvedValue({
        success: true,
        data: []
      });

      render(
        <AppWrapper>
          <App />
        </AppWrapper>
      );

      // Login
      await user.click(screen.getByText(/patient portal/i));
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/welcome.*john doe/i)).toBeInTheDocument();
      });

      // Logout
      await user.click(screen.getByRole('button', { name: /logout/i }));

      // Should return to login form
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.queryByText(/welcome.*john doe/i)).not.toBeInTheDocument();
      });
    });
  });
});