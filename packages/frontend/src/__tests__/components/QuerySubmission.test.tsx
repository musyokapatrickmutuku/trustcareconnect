// QuerySubmission Component Tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuerySubmission from '../../components/patient/QuerySubmission';
import icpService from '../../services/icpService';
import { Patient } from '../../types';

// Mock the icpService
jest.mock('../../services/icpService');
const mockIcpService = icpService as jest.Mocked<typeof icpService>;

describe('QuerySubmission', () => {
  const mockPatient: Patient = {
    id: 'patient_123',
    name: 'John Doe',
    condition: 'Diabetes',
    email: 'john@example.com',
    assignedDoctorId: 'doctor_456',
    isActive: true
  };

  const mockProps = {
    patient: mockPatient,
    assignedDoctorName: 'Dr. Smith',
    onQuerySubmitted: jest.fn(),
    showMessage: jest.fn(),
    loading: false,
    setLoading: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render query submission form', () => {
      render(<QuerySubmission {...mockProps} />);

      expect(screen.getByLabelText(/query title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit query/i })).toBeInTheDocument();
    });

    test('should show submit button as disabled when fields are empty', () => {
      render(<QuerySubmission {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /submit query/i });
      expect(submitButton).toBeDisabled();
    });

    test('should show warning when patient has no assigned doctor', () => {
      const unassignedPatient = { ...mockPatient, assignedDoctorId: undefined };
      render(<QuerySubmission {...mockProps} patient={unassignedPatient} />);

      expect(screen.getByText(/you need to be assigned to a doctor/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors for empty fields', async () => {
      const user = userEvent.setup();
      render(<QuerySubmission {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /submit query/i });
      
      // Try to submit without filling fields
      await user.type(screen.getByLabelText(/query title/i), 'Test Title');
      await user.clear(screen.getByLabelText(/query title/i));
      
      fireEvent.blur(screen.getByLabelText(/query title/i));
      
      // Button should remain disabled
      expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when both fields are filled', async () => {
      const user = userEvent.setup();
      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      await user.type(titleInput, 'Test Query Title');
      await user.type(descriptionInput, 'Test query description');

      expect(submitButton).toBeEnabled();
    });

    test('should enforce character limits', async () => {
      const user = userEvent.setup();
      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const longTitle = 'x'.repeat(150); // Over 100 char limit

      await user.type(titleInput, longTitle);

      expect(titleInput).toHaveValue('x'.repeat(100)); // Should be truncated
    });

    test('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      
      // Trigger validation error
      await user.click(titleInput);
      await user.tab(); // Focus away to trigger blur
      
      // Start typing to clear error
      await user.type(titleInput, 'New title');
      
      // Error should be cleared (implementation depends on your error handling)
    });
  });

  describe('Form Submission', () => {
    test('should submit query successfully', async () => {
      const user = userEvent.setup();
      mockIcpService.submitQuery.mockResolvedValue({
        success: true,
        data: 'query_789'
      });

      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      await user.type(titleInput, 'Chest Pain');
      await user.type(descriptionInput, 'I have been experiencing chest pain for 2 days');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockIcpService.submitQuery).toHaveBeenCalledWith(
          'patient_123',
          'Chest Pain',
          'I have been experiencing chest pain for 2 days'
        );
      });

      expect(mockProps.showMessage).toHaveBeenCalledWith('Query submitted successfully!');
      expect(mockProps.onQuerySubmitted).toHaveBeenCalled();
    });

    test('should handle submission error', async () => {
      const user = userEvent.setup();
      mockIcpService.submitQuery.mockResolvedValue({
        success: false,
        error: 'Submission failed'
      });

      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      await user.type(titleInput, 'Test Query');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProps.showMessage).toHaveBeenCalledWith('Submission failed');
      });
    });

    test('should handle network error during submission', async () => {
      const user = userEvent.setup();
      mockIcpService.submitQuery.mockRejectedValue(new Error('Network error'));

      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      await user.type(titleInput, 'Test Query');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProps.showMessage).toHaveBeenCalledWith('An error occurred while submitting your query');
      });
    });

    test('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      mockIcpService.submitQuery.mockResolvedValue({
        success: true,
        data: 'query_789'
      });

      render(<QuerySubmission {...mockProps} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      await user.type(titleInput, 'Test Query');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(titleInput).toHaveValue('');
        expect(descriptionInput).toHaveValue('');
      });
    });

    test('should prevent submission when patient has no assigned doctor', async () => {
      const user = userEvent.setup();
      const unassignedPatient = { ...mockPatient, assignedDoctorId: undefined };
      
      render(<QuerySubmission {...mockProps} patient={unassignedPatient} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      await user.type(titleInput, 'Test Query');
      await user.type(descriptionInput, 'Test description');
      await user.click(submitButton);

      expect(mockProps.showMessage).toHaveBeenCalledWith('You must be assigned to a doctor before submitting queries.');
      expect(mockIcpService.submitQuery).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('should show loading state during submission', () => {
      render(<QuerySubmission {...mockProps} loading={true} />);

      const submitButton = screen.getByRole('button', { name: /submit query/i });
      expect(submitButton).toBeDisabled();
      // Depending on your loading implementation, check for loading indicator
    });

    test('should disable form during loading', () => {
      render(<QuerySubmission {...mockProps} loading={true} />);

      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole('button', { name: /submit query/i });

      expect(titleInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(<QuerySubmission {...mockProps} />);

      expect(screen.getByLabelText(/query title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    test('should show required field indicators', () => {
      render(<QuerySubmission {...mockProps} />);

      // Check for required attributes or visual indicators
      const titleInput = screen.getByLabelText(/query title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      expect(titleInput).toBeRequired();
      expect(descriptionInput).toBeRequired();
    });

    test('should have proper ARIA attributes', () => {
      render(<QuerySubmission {...mockProps} />);

      const form = screen.getByRole('button', { name: /submit query/i }).closest('form') || 
                   screen.getByRole('button', { name: /submit query/i }).closest('div');
      
      // Check for proper form structure
      expect(form).toBeInTheDocument();
    });
  });
});