/**
 * Unit Tests for PatientProfile Component
 * Tests patient data display, medical history, and privacy controls
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PatientProfile from '../../components/PatientProfile';
import { Patient, MedicalQuery, Doctor } from '../../types';
import trustCareAPI from '../../api/trustcare';
import { useCache } from '../../utils/cache';

// Mock dependencies
jest.mock('../../api/trustcare');
jest.mock('../../utils/cache');

const mockAPI = trustCareAPI as jest.Mocked<typeof trustCareAPI>;
const mockUseCache = useCache as jest.MockedFunction<typeof useCache>;

// Test data
const mockPatient: Patient = {
  id: 'patient-123',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  dateOfBirth: '1985-03-15',
  phone: '+1-555-0123',
  address: {
    street: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  },
  condition: 'Type 2 Diabetes',
  isActive: true,
  assignedDoctorId: 'doctor-456',
  emergencyContact: {
    name: 'John Johnson',
    relationship: 'Spouse',
    phone: '+1-555-0124',
    email: 'john.johnson@example.com'
  },
  medicalHistory: {
    allergies: ['Penicillin', 'Shellfish'],
    medications: [
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        prescribedBy: 'Dr. Smith',
        startDate: '2023-01-15'
      },
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        prescribedBy: 'Dr. Smith',
        startDate: '2023-02-01'
      }
    ],
    conditions: [
      {
        name: 'Type 2 Diabetes',
        diagnosedDate: '2023-01-10',
        severity: 'Moderate',
        notes: 'Well controlled with medication and diet'
      },
      {
        name: 'Hypertension',
        diagnosedDate: '2023-02-01',
        severity: 'Mild',
        notes: 'Responding well to ACE inhibitor'
      }
    ],
    procedures: [
      {
        name: 'Annual Physical Exam',
        date: '2024-01-15',
        provider: 'Dr. Smith',
        notes: 'All vitals normal, continue current treatment plan'
      }
    ],
    immunizations: [
      {
        vaccine: 'COVID-19',
        date: '2023-09-15',
        provider: 'CVS Pharmacy',
        lotNumber: 'ABC123'
      },
      {
        vaccine: 'Influenza',
        date: '2023-10-01',
        provider: 'Family Practice',
        lotNumber: 'FLU456'
      }
    ]
  },
  preferences: {
    communicationMethod: 'email',
    language: 'English',
    timezone: 'America/New_York',
    privacySettings: {
      shareWithFamily: true,
      shareForResearch: false,
      marketingConsent: false
    }
  },
  createdAt: BigInt(1640995200000 * 1000000),
  updatedAt: BigInt(1704067200000 * 1000000)
};

const mockDoctor: Doctor = {
  id: 'doctor-456',
  name: 'Dr. Michael Smith',
  specialization: 'Endocrinology',
  email: 'dr.smith@hospital.com',
  phone: '+1-555-0199',
  isActive: true
};

const mockQueries: MedicalQuery[] = [
  {
    id: 'query-1',
    title: 'Blood sugar levels concern',
    description: 'My morning blood sugar has been higher than usual',
    status: 'completed',
    patientId: 'patient-123',
    doctorId: 'doctor-456',
    createdAt: BigInt(1703980800000 * 1000000),
    updatedAt: BigInt(1704067200000 * 1000000),
    category: 'diabetes',
    response: 'Please increase testing frequency and adjust diet. Schedule follow-up in 2 weeks.'
  },
  {
    id: 'query-2',
    title: 'Medication side effects',
    description: 'Experiencing mild nausea with new medication',
    status: 'doctor_review',
    patientId: 'patient-123',
    doctorId: 'doctor-456',
    createdAt: BigInt(1704153600000 * 1000000),
    updatedAt: BigInt(1704153600000 * 1000000),
    category: 'medication'
  }
];

describe('PatientProfile Component', () => {
  const mockShowMessage = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnQueryCreate = jest.fn();
  
  const mockCache = {
    cache: {
      patients: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn()
      }
    },
    getStats: jest.fn(),
    clearAll: jest.fn(),
    cleanup: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup cache mock
    mockUseCache.mockReturnValue(mockCache);
    
    // Setup API mocks
    mockAPI.getPatient.mockResolvedValue({
      success: true,
      data: mockPatient
    });
    
    mockAPI.getDoctor.mockResolvedValue({
      success: true,
      data: mockDoctor
    });
    
    mockAPI.getPatientQueries.mockResolvedValue({
      success: true,
      data: mockQueries
    });

    mockAPI.updatePatient.mockResolvedValue({
      success: true,
      data: mockPatient
    });

    mockAPI.exportPatientData.mockResolvedValue({
      success: true,
      data: { downloadUrl: 'mock-url' }
    });
  });

  const defaultProps = {
    patientId: 'patient-123',
    showMessage: mockShowMessage,
    onEdit: mockOnEdit,
    onQueryCreate: mockOnQueryCreate,
    viewMode: 'full' as const,
    canEdit: true
  };

  describe('Component Rendering', () => {
    it('renders patient profile with complete information', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
        expect(screen.getByText('patient-123')).toBeInTheDocument();
        expect(screen.getByText('sarah.johnson@example.com')).toBeInTheDocument();
      });
    });

    it('displays patient contact information correctly', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
        expect(screen.getByText('Boston, MA 02101')).toBeInTheDocument();
        expect(screen.getByText('March 15, 1985')).toBeInTheDocument();
      });
    });

    it('shows assigned doctor information', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Dr. Michael Smith')).toBeInTheDocument();
        expect(screen.getByText('Endocrinology')).toBeInTheDocument();
      });
    });

    it('displays emergency contact details', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('John Johnson')).toBeInTheDocument();
        expect(screen.getByText('Spouse')).toBeInTheDocument();
        expect(screen.getByText('+1-555-0124')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching data', () => {
      mockAPI.getPatient.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<PatientProfile {...defaultProps} />);
      
      expect(screen.getByText('Loading patient profile...')).toBeInTheDocument();
    });
  });

  describe('Medical History Display', () => {
    it('displays allergies correctly', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Allergies')).toBeInTheDocument();
        expect(screen.getByText('Penicillin')).toBeInTheDocument();
        expect(screen.getByText('Shellfish')).toBeInTheDocument();
      });
    });

    it('shows current medications with details', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Current Medications')).toBeInTheDocument();
        expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
        expect(screen.getByText('Twice daily')).toBeInTheDocument();
        expect(screen.getByText('Prescribed by Dr. Smith')).toBeInTheDocument();
      });
    });

    it('displays medical conditions with severity', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Medical Conditions')).toBeInTheDocument();
        expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getByText('Well controlled with medication and diet')).toBeInTheDocument();
      });
    });

    it('shows recent procedures', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Recent Procedures')).toBeInTheDocument();
        expect(screen.getByText('Annual Physical Exam')).toBeInTheDocument();
        expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
      });
    });

    it('displays immunization history', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Immunizations')).toBeInTheDocument();
        expect(screen.getByText('COVID-19')).toBeInTheDocument();
        expect(screen.getByText('Influenza')).toBeInTheDocument();
        expect(screen.getByText('September 15, 2023')).toBeInTheDocument();
      });
    });
  });

  describe('Query History', () => {
    it('displays patient query history', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Recent Queries')).toBeInTheDocument();
        expect(screen.getByText('Blood sugar levels concern')).toBeInTheDocument();
        expect(screen.getByText('Medication side effects')).toBeInTheDocument();
      });
    });

    it('shows query status with appropriate styling', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Under Review')).toBeInTheDocument();
      });
    });

    it('displays query responses when available', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Please increase testing frequency and adjust diet. Schedule follow-up in 2 weeks.')).toBeInTheDocument();
      });
    });

    it('provides link to create new query', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Submit New Query')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Submit New Query'));
      expect(mockOnQueryCreate).toHaveBeenCalledWith('patient-123');
    });
  });

  describe('Privacy and Preferences', () => {
    it('displays communication preferences', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Communication Preferences')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('America/New_York')).toBeInTheDocument();
      });
    });

    it('shows privacy settings with toggle states', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
        
        const shareFamilyToggle = screen.getByRole('checkbox', { name: /share with family/i });
        const shareResearchToggle = screen.getByRole('checkbox', { name: /share for research/i });
        const marketingToggle = screen.getByRole('checkbox', { name: /marketing consent/i });
        
        expect(shareFamilyToggle).toBeChecked();
        expect(shareResearchToggle).not.toBeChecked();
        expect(marketingToggle).not.toBeChecked();
      });
    });

    it('allows privacy settings updates', async () => {
      const user = userEvent.setup();
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
      });

      const shareResearchToggle = screen.getByRole('checkbox', { name: /share for research/i });
      await user.click(shareResearchToggle);

      await waitFor(() => {
        expect(mockAPI.updatePatient).toHaveBeenCalledWith('patient-123', {
          preferences: {
            ...mockPatient.preferences,
            privacySettings: {
              ...mockPatient.preferences.privacySettings,
              shareForResearch: true
            }
          }
        });
      });
    });
  });

  describe('Edit Mode', () => {
    it('shows edit button when canEdit is true', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });

    it('hides edit button when canEdit is false', async () => {
      render(<PatientProfile {...defaultProps} canEdit={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
      });
    });

    it('calls onEdit when edit button is clicked', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));
      expect(mockOnEdit).toHaveBeenCalledWith(mockPatient);
    });
  });

  describe('Data Export', () => {
    it('provides data export functionality', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockAPI.exportPatientData).toHaveBeenCalledWith('patient-123');
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Patient data exported successfully',
          'success'
        );
      });
    });

    it('handles export errors gracefully', async () => {
      mockAPI.exportPatientData.mockRejectedValue(new Error('Export failed'));

      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export Data'));

      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Failed to export patient data: Export failed',
          'error'
        );
      });
    });
  });

  describe('View Modes', () => {
    it('renders in summary mode with limited information', async () => {
      render(<PatientProfile {...defaultProps} viewMode="summary" />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Type 2 Diabetes')).toBeInTheDocument();
        
        // Should not show detailed medical history
        expect(screen.queryByText('Current Medications')).not.toBeInTheDocument();
        expect(screen.queryByText('Medical Conditions')).not.toBeInTheDocument();
      });
    });

    it('renders in card mode with compact layout', async () => {
      render(<PatientProfile {...defaultProps} viewMode="card" />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Dr. Michael Smith')).toBeInTheDocument();
        
        // Should show basic info but not full history
        expect(screen.queryByText('Recent Procedures')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles patient data loading errors', async () => {
      mockAPI.getPatient.mockRejectedValue(new Error('Patient not found'));

      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load patient profile')).toBeInTheDocument();
        expect(screen.getByText('Patient not found')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries loading when retry button is clicked', async () => {
      mockAPI.getPatient.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: mockPatient
        });

      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockAPI.getPatient).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });
    });

    it('handles doctor information loading errors gracefully', async () => {
      mockAPI.getDoctor.mockRejectedValue(new Error('Doctor not found'));

      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        expect(screen.getByText('Assigned Doctor: Not available')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /patient information/i })).toBeInTheDocument();
        expect(screen.getByRole('region', { name: /medical history/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      await user.tab();
      expect(document.activeElement).toBe(screen.getByText('Edit Profile'));
    });

    it('provides proper heading hierarchy', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /sarah johnson/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /contact information/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /medical history/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Caching', () => {
    it('uses cached patient data when available', async () => {
      mockCache.cache.patients.get.mockReturnValue(mockPatient);

      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });

      expect(mockCache.cache.patients.get).toHaveBeenCalledWith('patient-123');
      expect(mockAPI.getPatient).not.toHaveBeenCalled();
    });

    it('caches patient data after successful load', async () => {
      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      });

      expect(mockCache.cache.patients.set).toHaveBeenCalledWith('patient-123', mockPatient);
    });
  });

  describe('Medical Data Security', () => {
    it('masks sensitive information when not authorized', async () => {
      const limitedProps = {
        ...defaultProps,
        viewMode: 'limited' as const,
        canViewSensitive: false
      };

      render(<PatientProfile {...limitedProps} />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
        
        // Sensitive info should be masked
        expect(screen.queryByText('sarah.johnson@example.com')).not.toBeInTheDocument();
        expect(screen.queryByText('+1-555-0123')).not.toBeInTheDocument();
        expect(screen.getByText('***-***-****')).toBeInTheDocument(); // Masked phone
      });
    });

    it('logs access to sensitive medical information', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<PatientProfile {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Current Medications')).toBeInTheDocument();
      });

      // Should log access to medical history
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Medical history accessed'),
        expect.objectContaining({ patientId: 'patient-123' })
      );

      logSpy.mockRestore();
    });
  });
});