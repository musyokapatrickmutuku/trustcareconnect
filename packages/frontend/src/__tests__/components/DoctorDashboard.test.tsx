/**
 * Unit Tests for DoctorDashboard Component
 * Tests real-time functionality, WebSocket integration, and medical data display
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DoctorDashboard from '../../components/doctor/DoctorDashboard';
import { Doctor, Patient, MedicalQuery } from '../../types';
import * as websocketModule from '../../services/websocket';
import * as pollingModule from '../../hooks/usePolling';
import trustCareAPI from '../../api/trustcare';

// Mock dependencies
jest.mock('../../services/websocket');
jest.mock('../../hooks/usePolling');
jest.mock('../../api/trustcare');

const mockWebsocket = websocketModule as jest.Mocked<typeof websocketModule>;
const mockPolling = pollingModule as jest.Mocked<typeof pollingModule>;
const mockAPI = trustCareAPI as jest.Mocked<typeof trustCareAPI>;

// Test data
const mockDoctor: Doctor = {
  id: 'doctor-123',
  name: 'Dr. Sarah Johnson',
  specialization: 'Internal Medicine',
  isActive: true,
  email: 'sarah.johnson@example.com'
};

const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    name: 'John Doe',
    condition: 'Diabetes',
    isActive: true,
    assignedDoctorId: 'doctor-123'
  },
  {
    id: 'patient-2',
    name: 'Jane Smith',
    condition: 'Hypertension',
    isActive: true,
    assignedDoctorId: 'doctor-123'
  }
];

const mockQueries: MedicalQuery[] = [
  {
    id: 'query-1',
    title: 'Blood sugar management',
    description: 'Need help with blood sugar control',
    status: 'doctor_review',
    patientId: 'patient-1',
    doctorId: 'doctor-123',
    createdAt: BigInt(Date.now() * 1000000),
    updatedAt: BigInt(Date.now() * 1000000),
    category: 'diabetes'
  },
  {
    id: 'query-2',
    title: 'Medication side effects',
    description: 'Experiencing side effects from medication',
    status: 'completed',
    patientId: 'patient-2',
    doctorId: 'doctor-123',
    createdAt: BigInt(Date.now() * 1000000),
    updatedAt: BigInt(Date.now() * 1000000),
    category: 'medication',
    response: 'Please reduce dosage and monitor symptoms'
  }
];

// Mock WebSocket hook
const mockUseWebSocket = {
  isConnected: true,
  connectionStatus: {
    connected: true,
    reconnecting: false,
    lastConnected: new Date(),
    connectionQuality: 'good' as const
  },
  subscribe: jest.fn(),
  subscribeToSystemStats: jest.fn(),
  setUserStatus: jest.fn()
};

// Mock polling hook
const mockUseSmartPolling = [
  {
    data: null,
    loading: false,
    error: null
  },
  {
    start: jest.fn(),
    stop: jest.fn(),
    refresh: jest.fn()
  }
];

// Wrapper component for testing
const DashboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('DoctorDashboard Component', () => {
  const mockShowMessage = jest.fn();
  const mockSetLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup WebSocket mock
    mockWebsocket.useWebSocket.mockReturnValue(mockUseWebSocket);
    
    // Setup polling mock
    mockPolling.useSmartPolling.mockReturnValue(mockUseSmartPolling);
    
    // Setup API mocks
    mockAPI.getDoctorDashboardData.mockResolvedValue({
      success: true,
      data: {
        patients: { success: true, data: mockPatients },
        queries: { success: true, data: mockQueries },
        pendingQueries: { success: true, data: [] }
      }
    });
    
    mockAPI.getUnassignedPatients.mockResolvedValue({
      success: true,
      data: []
    });
  });

  const defaultProps = {
    currentDoctor: mockDoctor,
    onLogout: jest.fn(),
    showMessage: mockShowMessage,
    loading: false,
    setLoading: mockSetLoading
  };

  describe('Component Rendering', () => {
    it('renders doctor information correctly', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      expect(screen.getByText('👨‍⚕️ Dr. Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Internal Medicine')).toBeInTheDocument();
      expect(screen.getByText('doctor-123')).toBeInTheDocument();
    });

    it('displays navigation tabs correctly', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      expect(screen.getByText('📊 Overview')).toBeInTheDocument();
      expect(screen.getByText('📥 Incoming Queries')).toBeInTheDocument();
      expect(screen.getByText('👥 My Patients')).toBeInTheDocument();
      expect(screen.getByText('💬 All Queries')).toBeInTheDocument();
      expect(screen.getByText('📋 Assignments')).toBeInTheDocument();
    });

    it('shows loading state when data is loading', () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} loading={true} />
        </DashboardWrapper>
      );

      expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    });
  });

  describe('Real-time Functionality', () => {
    it('sets up WebSocket connection on mount', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(mockUseWebSocket.setUserStatus).toHaveBeenCalledWith('online');
        expect(mockUseWebSocket.subscribeToSystemStats).toHaveBeenCalled();
        expect(mockUseWebSocket.subscribe).toHaveBeenCalledWith('query_created', expect.any(Function));
        expect(mockUseWebSocket.subscribe).toHaveBeenCalledWith('query_updated', expect.any(Function));
      });
    });

    it('displays connection status indicator', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });

    it('shows reconnecting status when connection is lost', async () => {
      const disconnectedWebSocket = {
        ...mockUseWebSocket,
        isConnected: false,
        connectionStatus: {
          connected: false,
          reconnecting: true,
          lastConnected: new Date(),
          connectionQuality: 'poor' as const
        }
      };

      mockWebsocket.useWebSocket.mockReturnValue(disconnectedWebSocket);

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Data Loading', () => {
    it('loads dashboard data on mount', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(mockAPI.getDoctorDashboardData).toHaveBeenCalledWith('doctor-123');
      });
    });

    it('displays patient statistics correctly', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total patients
        expect(screen.getByText('1')).toBeInTheDocument(); // Active queries (doctor_review status)
        expect(screen.getByText('1')).toBeInTheDocument(); // Completed queries
      });
    });

    it('handles API errors gracefully', async () => {
      mockAPI.getDoctorDashboardData.mockResolvedValue({
        success: false,
        error: 'Failed to load dashboard data'
      });

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Failed to load dashboard data. Please try refreshing.',
          'error'
        );
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      // Click on Patients tab
      fireEvent.click(screen.getByText('👥 My Patients'));
      
      await waitFor(() => {
        expect(screen.getByText('My Patients (2)')).toBeInTheDocument();
      });

      // Click on Queries tab
      fireEvent.click(screen.getByText('💬 All Queries'));
      
      await waitFor(() => {
        expect(screen.getByText('Medical Queries (2)')).toBeInTheDocument();
      });
    });

    it('shows incoming queries tab with proper styling', async () => {
      const queriesWithPending = [
        ...mockQueries,
        {
          id: 'query-3',
          title: 'New urgent query',
          description: 'Urgent medical concern',
          status: 'pending' as const,
          patientId: 'patient-1',
          doctorId: 'doctor-123',
          createdAt: BigInt(Date.now() * 1000000),
          updatedAt: BigInt(Date.now() * 1000000),
          category: 'urgent'
        }
      ];

      mockAPI.getDoctorDashboardData.mockResolvedValue({
        success: true,
        data: {
          patients: { success: true, data: mockPatients },
          queries: { success: true, data: queriesWithPending },
          pendingQueries: { success: true, data: [queriesWithPending[2]] }
        }
      });

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      // Click on Incoming Queries tab
      fireEvent.click(screen.getByText('📥 Incoming Queries'));
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Incoming Queries (1)')).toBeInTheDocument();
        expect(screen.getByText('⚡ Requires Immediate Attention')).toBeInTheDocument();
      });
    });
  });

  describe('Patient Management', () => {
    it('displays patient cards with correct information', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      // Navigate to patients tab
      fireEvent.click(screen.getByText('👥 My Patients'));

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Diabetes')).toBeInTheDocument();
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
      });
    });

    it('handles empty patient list', async () => {
      mockAPI.getDoctorDashboardData.mockResolvedValue({
        success: true,
        data: {
          patients: { success: true, data: [] },
          queries: { success: true, data: [] },
          pendingQueries: { success: true, data: [] }
        }
      });

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      fireEvent.click(screen.getByText('👥 My Patients'));

      await waitFor(() => {
        expect(screen.getByText('You don\'t have any assigned patients yet.')).toBeInTheDocument();
        expect(screen.getByText('View Available Patients')).toBeInTheDocument();
      });
    });
  });

  describe('Query Management', () => {
    it('displays queries with correct status formatting', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      fireEvent.click(screen.getByText('💬 All Queries'));

      await waitFor(() => {
        expect(screen.getByText('Blood sugar management')).toBeInTheDocument();
        expect(screen.getByText('Medication side effects')).toBeInTheDocument();
      });
    });

    it('shows completed queries with responses', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      fireEvent.click(screen.getByText('💬 All Queries'));

      await waitFor(() => {
        expect(screen.getByText('Please reduce dosage and monitor symptoms')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes dashboard data when refresh button is clicked', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockAPI.getDoctorDashboardData).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('shows refreshing state when loading', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} loading={true} />
        </DashboardWrapper>
      );

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('updates statistics when real-time updates occur', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('0 real-time updates')).toBeInTheDocument();
      });

      // Simulate a real-time update by checking if subscribe was called
      expect(mockUseWebSocket.subscribe).toHaveBeenCalledWith('query_created', expect.any(Function));
    });

    it('displays notification count in header', async () => {
      const pendingQueries = [mockQueries[0]]; // One pending query
      
      mockAPI.getDoctorDashboardData.mockResolvedValue({
        success: true,
        data: {
          patients: { success: true, data: mockPatients },
          queries: { success: true, data: mockQueries },
          pendingQueries: { success: true, data: pendingQueries }
        }
      });

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('🔔 1 Pending')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when dashboard loading fails', async () => {
      mockAPI.getDoctorDashboardData.mockRejectedValue(new Error('Network error'));

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries loading when retry button is clicked', async () => {
      mockAPI.getDoctorDashboardData.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: {
            patients: { success: true, data: mockPatients },
            queries: { success: true, data: mockQueries },
            pendingQueries: { success: true, data: [] }
          }
        });

      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(mockAPI.getDoctorDashboardData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      await waitFor(() => {
        const navigation = screen.getByRole('navigation');
        expect(navigation).toBeInTheDocument();
        
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation', async () => {
      render(
        <DashboardWrapper>
          <DoctorDashboard {...defaultProps} />
        </DashboardWrapper>
      );

      const overviewTab = screen.getByText('📊 Overview');
      overviewTab.focus();
      
      expect(document.activeElement).toBe(overviewTab);
    });
  });
});