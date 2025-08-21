/**
 * Unit Tests for QueryManagement Component
 * Tests query filtering, sorting, bulk operations, and medical data handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import QueryManagement from '../../components/QueryManagement';
import { MedicalQuery, QueryStatus } from '../../types';
import trustCareAPI from '../../api/trustcare';
import { useCache } from '../../utils/cache';

// Mock dependencies
jest.mock('../../api/trustcare');
jest.mock('../../utils/cache');

const mockAPI = trustCareAPI as jest.Mocked<typeof trustCareAPI>;
const mockUseCache = useCache as jest.MockedFunction<typeof useCache>;

// Test data
const mockQueries: MedicalQuery[] = [
  {
    id: 'query-1',
    title: 'Blood pressure medication adjustment',
    description: 'Need guidance on adjusting blood pressure medication dosage',
    status: 'pending',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    createdAt: BigInt(1640995200000 * 1000000), // 2022-01-01
    updatedAt: BigInt(1640995200000 * 1000000),
    category: 'cardiology',
    priority: 'high',
    aiDraftResponse: 'Consider reducing dosage by 50% and monitor blood pressure daily.'
  },
  {
    id: 'query-2',
    title: 'Diabetes management consultation',
    description: 'Questions about insulin dosing and diet management',
    status: 'doctor_review',
    patientId: 'patient-2',
    doctorId: 'doctor-1',
    createdAt: BigInt(1641081600000 * 1000000), // 2022-01-02
    updatedAt: BigInt(1641081600000 * 1000000),
    category: 'endocrinology',
    priority: 'medium'
  },
  {
    id: 'query-3',
    title: 'Post-surgery follow-up',
    description: 'Follow-up questions after knee surgery',
    status: 'completed',
    patientId: 'patient-3',
    doctorId: 'doctor-2',
    createdAt: BigInt(1641168000000 * 1000000), // 2022-01-03
    updatedAt: BigInt(1641254400000 * 1000000), // 2022-01-04
    category: 'orthopedics',
    priority: 'low',
    response: 'Recovery is progressing well. Continue physical therapy as prescribed.'
  },
  {
    id: 'query-4',
    title: 'Migraine treatment options',
    description: 'Seeking alternatives to current migraine medication',
    status: 'pending',
    patientId: 'patient-4',
    doctorId: null,
    createdAt: BigInt(1641340800000 * 1000000), // 2022-01-05
    updatedAt: BigInt(1641340800000 * 1000000),
    category: 'neurology',
    priority: 'medium'
  }
];

const mockPatients = [
  { id: 'patient-1', name: 'John Smith' },
  { id: 'patient-2', name: 'Sarah Johnson' },
  { id: 'patient-3', name: 'Michael Brown' },
  { id: 'patient-4', name: 'Emily Davis' }
];

const mockDoctors = [
  { id: 'doctor-1', name: 'Dr. Wilson' },
  { id: 'doctor-2', name: 'Dr. Anderson' }
];

describe('QueryManagement Component', () => {
  const mockShowMessage = jest.fn();
  const mockCache = {
    cache: {
      queries: {
        getList: jest.fn(),
        setList: jest.fn(),
        clear: jest.fn()
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
    mockAPI.getAllQueries.mockResolvedValue({
      success: true,
      data: mockQueries
    });
    
    mockAPI.getPatients.mockResolvedValue({
      success: true,
      data: mockPatients
    });
    
    mockAPI.getDoctors.mockResolvedValue({
      success: true,
      data: mockDoctors
    });

    mockAPI.updateQueryStatus.mockResolvedValue({
      success: true,
      data: {}
    });

    mockAPI.assignQueryToDoctor.mockResolvedValue({
      success: true,
      data: {}
    });

    mockAPI.bulkUpdateQueries.mockResolvedValue({
      success: true,
      data: {}
    });
  });

  const defaultProps = {
    showMessage: mockShowMessage,
    currentUser: { id: 'admin-1', role: 'admin' },
    permissions: ['read', 'write', 'delete', 'assign']
  };

  describe('Component Rendering', () => {
    it('renders query management interface correctly', async () => {
      render(<QueryManagement {...defaultProps} />);

      expect(screen.getByText('Query Management')).toBeInTheDocument();
      expect(screen.getByText('Total Queries')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search queries...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument(); // Total count
      });
    });

    it('displays query statistics correctly', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Pending queries
        expect(screen.getByText('1')).toBeInTheDocument(); // In review
        expect(screen.getByText('1')).toBeInTheDocument(); // Completed
      });
    });

    it('shows loading state while fetching data', () => {
      mockAPI.getAllQueries.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<QueryManagement {...defaultProps} />);
      
      expect(screen.getByText('Loading queries...')).toBeInTheDocument();
    });
  });

  describe('Query Filtering', () => {
    it('filters queries by status', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Filter by pending status
      const statusFilter = screen.getByDisplayValue('all');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
        expect(screen.getByText('Migraine treatment options')).toBeInTheDocument();
        expect(screen.queryByText('Post-surgery follow-up')).not.toBeInTheDocument();
      });
    });

    it('filters queries by category', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText(/cardiology|endocrinology|orthopedics|neurology/)).toHaveLength(4);
      });

      // Filter by cardiology
      const categoryFilter = screen.getByDisplayValue('all-categories');
      fireEvent.change(categoryFilter, { target: { value: 'cardiology' } });

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
        expect(screen.queryByText('Diabetes management consultation')).not.toBeInTheDocument();
      });
    });

    it('filters queries by priority', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Filter by high priority
      const priorityFilter = screen.getByDisplayValue('all-priorities');
      fireEvent.change(priorityFilter, { target: { value: 'high' } });

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
        expect(screen.queryByText('Post-surgery follow-up')).not.toBeInTheDocument();
      });
    });

    it('searches queries by text', async () => {
      const user = userEvent.setup();
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search queries...');
      await user.type(searchInput, 'diabetes');

      await waitFor(() => {
        expect(screen.getByText('Diabetes management consultation')).toBeInTheDocument();
        expect(screen.queryByText('Blood pressure medication adjustment')).not.toBeInTheDocument();
      });
    });

    it('combines multiple filters', async () => {
      const user = userEvent.setup();
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByRole('row')).toHaveLength(5); // Header + 4 data rows
      });

      // Apply status filter
      const statusFilter = screen.getByDisplayValue('all');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      // Apply priority filter
      const priorityFilter = screen.getByDisplayValue('all-priorities');
      fireEvent.change(priorityFilter, { target: { value: 'high' } });

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
        expect(screen.queryByText('Migraine treatment options')).not.toBeInTheDocument();
      });
    });
  });

  describe('Query Sorting', () => {
    it('sorts queries by date created', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Migraine treatment options')).toBeInTheDocument();
      });

      // Click sort by date
      const sortSelect = screen.getByDisplayValue('newest');
      fireEvent.change(sortSelect, { target: { value: 'oldest' } });

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });
    });

    it('sorts queries by priority', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('newest');
      fireEvent.change(sortSelect, { target: { value: 'priority' } });

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Blood pressure medication adjustment')).toBeInTheDocument(); // High priority first
      });
    });

    it('sorts queries by status', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      const sortSelect = screen.getByDisplayValue('newest');
      fireEvent.change(sortSelect, { target: { value: 'status' } });

      await waitFor(() => {
        // Completed queries should come first when sorted by status
        const rows = screen.getAllByRole('row');
        expect(within(rows[1]).getByText('Post-surgery follow-up')).toBeInTheDocument();
      });
    });
  });

  describe('Query Selection and Bulk Operations', () => {
    it('selects individual queries', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]); // First query checkbox (excluding select all)

      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Bulk Actions')).toBeInTheDocument();
    });

    it('selects all queries with select all checkbox', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);

      expect(screen.getByText('4 selected')).toBeInTheDocument();
    });

    it('performs bulk status update', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Select queries
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      // Open bulk actions menu
      fireEvent.click(screen.getByText('Bulk Actions'));
      fireEvent.click(screen.getByText('Update Status'));

      // Select new status
      const statusSelect = screen.getByDisplayValue('pending');
      fireEvent.change(statusSelect, { target: { value: 'doctor_review' } });

      // Apply changes
      fireEvent.click(screen.getByText('Apply to Selected'));

      await waitFor(() => {
        expect(mockAPI.bulkUpdateQueries).toHaveBeenCalledWith(
          ['query-1', 'query-2'],
          { status: 'doctor_review' }
        );
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Successfully updated 2 queries',
          'success'
        );
      });
    });

    it('performs bulk doctor assignment', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Migraine treatment options')).toBeInTheDocument();
      });

      // Select unassigned query
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[4]); // Migraine query (unassigned)

      // Open bulk actions
      fireEvent.click(screen.getByText('Bulk Actions'));
      fireEvent.click(screen.getByText('Assign Doctor'));

      // Select doctor
      const doctorSelect = screen.getByDisplayValue('');
      fireEvent.change(doctorSelect, { target: { value: 'doctor-1' } });

      // Apply assignment
      fireEvent.click(screen.getByText('Assign to Selected'));

      await waitFor(() => {
        expect(mockAPI.assignQueryToDoctor).toHaveBeenCalledWith('query-4', 'doctor-1');
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Successfully assigned doctor to query',
          'success'
        );
      });
    });
  });

  describe('Query Details and Actions', () => {
    it('displays query details in expandable rows', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Click to expand first query
      const expandButton = screen.getAllByText('▶')[0];
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Need guidance on adjusting blood pressure medication dosage')).toBeInTheDocument();
        expect(screen.getByText('AI Draft Response:')).toBeInTheDocument();
        expect(screen.getByText('Consider reducing dosage by 50% and monitor blood pressure daily.')).toBeInTheDocument();
      });
    });

    it('shows different actions based on query status', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Expand pending query
      const expandButtons = screen.getAllByText('▶');
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Assign Doctor')).toBeInTheDocument();
        expect(screen.getByText('Mark as Review')).toBeInTheDocument();
      });

      // Expand completed query
      fireEvent.click(expandButtons[2]); // Post-surgery follow-up

      await waitFor(() => {
        expect(screen.getByText('View Response')).toBeInTheDocument();
        expect(screen.getByText('Reopen Query')).toBeInTheDocument();
      });
    });

    it('updates query status through action buttons', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Expand query and click status update
      const expandButton = screen.getAllByText('▶')[0];
      fireEvent.click(expandButton);

      await waitFor(() => {
        const markReviewButton = screen.getByText('Mark as Review');
        fireEvent.click(markReviewButton);
      });

      await waitFor(() => {
        expect(mockAPI.updateQueryStatus).toHaveBeenCalledWith('query-1', 'doctor_review');
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Query status updated successfully',
          'success'
        );
      });
    });
  });

  describe('Export and Reporting', () => {
    it('exports queries to CSV', async () => {
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      const mockAnchor = {
        click: jest.fn(),
        href: '',
        download: '',
        style: { display: '' }
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export'));
      fireEvent.click(screen.getByText('Export as CSV'));

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('generates analytics report', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Analytics'));

      await waitFor(() => {
        expect(screen.getByText('Query Analytics Report')).toBeInTheDocument();
        expect(screen.getByText('Average Response Time')).toBeInTheDocument();
        expect(screen.getByText('Most Common Categories')).toBeInTheDocument();
        expect(screen.getByText('Query Status Distribution')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockAPI.getAllQueries.mockRejectedValue(new Error('Network error'));

      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Failed to load queries: Network error',
          'error'
        );
      });
    });

    it('handles bulk operation errors', async () => {
      mockAPI.bulkUpdateQueries.mockRejectedValue(new Error('Update failed'));

      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Select and try to update
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);
      
      fireEvent.click(screen.getByText('Bulk Actions'));
      fireEvent.click(screen.getByText('Update Status'));
      
      const statusSelect = screen.getByDisplayValue('pending');
      fireEvent.change(statusSelect, { target: { value: 'completed' } });
      
      fireEvent.click(screen.getByText('Apply to Selected'));

      await waitFor(() => {
        expect(mockShowMessage).toHaveBeenCalledWith(
          'Failed to update queries: Update failed',
          'error'
        );
      });
    });
  });

  describe('Permissions and Access Control', () => {
    it('hides actions when user lacks permissions', () => {
      const limitedProps = {
        ...defaultProps,
        permissions: ['read'] // Only read permission
      };

      render(<QueryManagement {...limitedProps} />);

      expect(screen.queryByText('Bulk Actions')).not.toBeInTheDocument();
      expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });

    it('shows read-only mode for limited permissions', async () => {
      const readOnlyProps = {
        ...defaultProps,
        permissions: ['read']
      };

      render(<QueryManagement {...readOnlyProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blood pressure medication adjustment')).toBeInTheDocument();
      });

      // Should not have checkboxes for selection
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(3); // Status, category, priority filters
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search queries...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search queries...');
      await user.tab();
      
      expect(document.activeElement).toBe(searchInput);
    });

    it('announces filter changes to screen readers', async () => {
      render(<QueryManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Showing 4 queries')).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue('all');
      fireEvent.change(statusFilter, { target: { value: 'pending' } });

      await waitFor(() => {
        expect(screen.getByText('Showing 2 queries')).toBeInTheDocument();
      });
    });
  });
});