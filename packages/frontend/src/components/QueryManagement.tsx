import React, { useState, useEffect, useMemo } from 'react';
import { MedicalQuery, QueryStatus, ComponentProps } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import Button from './common/Button';
import FormField from './common/FormField';
import trustCareAPI from '../api/trustcare';

interface QueryManagementProps extends ComponentProps {
  patientId?: string;
  doctorId?: string;
  onQuerySelect?: (query: MedicalQuery) => void;
}

interface FilterOptions {
  status: QueryStatus | 'all';
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

const QueryManagement: React.FC<QueryManagementProps> = ({
  patientId,
  doctorId,
  onQuerySelect,
  showMessage,
  loading,
  setLoading
}) => {
  const [queries, setQueries] = useState<MedicalQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    dateRange: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Filtered and sorted queries
  const filteredQueries = useMemo(() => {
    let filtered = queries.filter(query => {
      // Text search
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          query.title.toLowerCase().includes(search) ||
          query.description.toLowerCase().includes(search) ||
          (query.response && query.response.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && query.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = Date.now();
        const queryDate = query.createdAt;
        let cutoff = 0;
        
        switch (filters.dateRange) {
          case 'today':
            cutoff = now - 24 * 60 * 60 * 1000;
            break;
          case 'week':
            cutoff = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            cutoff = now - 30 * 24 * 60 * 60 * 1000;
            break;
        }
        
        if (queryDate < cutoff) return false;
      }

      return true;
    });

    // Sort queries
    filtered.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];
      
      if (filters.sortBy === 'title') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [queries, searchTerm, filters]);

  // Paginated queries
  const paginatedQueries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQueries.slice(start, start + itemsPerPage);
  }, [filteredQueries, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredQueries.length / itemsPerPage);

  const fetchQueries = async () => {
    setLoading?.(true);
    try {
      let result;
      if (patientId) {
        result = await trustCareAPI.getPatientQueries(patientId);
      } else if (doctorId) {
        result = await trustCareAPI.getDoctorQueries(doctorId);
      } else {
        result = await trustCareAPI.getAllQueries();
      }

      if (result.success && result.data) {
        setQueries(result.data);
      } else {
        showMessage?.(result.error || 'Failed to load queries', 'error');
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
      showMessage?.('Failed to load queries', 'error');
    } finally {
      setLoading?.(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    fetchQueries();
    
    // Set up refresh interval for real-time updates
    const interval = setInterval(fetchQueries, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (interval) clearInterval(interval);
    };
  }, [patientId, doctorId]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusColor = (status: QueryStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'doctor_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && queries.length === 0) {
    return <LoadingSpinner message="Loading queries..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Query Management</h2>
        <Button onClick={fetchQueries} className="bg-blue-600 hover:bg-blue-700">
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <FormField
            label="Search"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="doctor_review">Doctor Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="updatedAt-desc">Recently Updated</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {paginatedQueries.length} of {filteredQueries.length} queries
        </div>
      </div>

      {/* Query List */}
      <div className="space-y-4">
        {paginatedQueries.length > 0 ? (
          paginatedQueries.map((query) => (
            <div
              key={query.id}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onQuerySelect?.(query)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex-1 mr-4">
                  {query.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(query.status)}`}>
                  {query.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <p className="text-gray-600 mb-3 line-clamp-2">
                {query.description}
              </p>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="space-x-4">
                  <span>Created: {formatDate(query.createdAt)}</span>
                  {query.updatedAt !== query.createdAt && (
                    <span>Updated: {formatDate(query.updatedAt)}</span>
                  )}
                </div>
                {query.response && (
                  <div className="text-green-600 font-medium">
                    ✓ Response Available
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No queries found</div>
            <p className="text-gray-500">
              {searchTerm || filters.status !== 'all' || filters.dateRange !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No queries have been submitted yet'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm"
          >
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default QueryManagement;