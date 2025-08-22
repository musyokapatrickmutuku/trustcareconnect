import React, { useState, useEffect, useCallback } from 'react';
import { Patient, MedicalQuery, QueryStatus } from '../../types';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import QuerySubmission from './QuerySubmission';
import icpService from '../../services/icpService';
import { formatters } from '../../utils/formatters';
import { useWebSocket } from '../../services/websocket';
import { useSmartPolling } from '../../hooks/usePolling';

interface PatientDashboardProps {
  patient: Patient;
  onLogout: () => void;
  showMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

interface QueryWithEstimate extends MedicalQuery {
  estimatedResponseTime?: string;
  timeRemaining?: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  onLogout,
  showMessage,
  loading: parentLoading = false,
  setLoading: setParentLoading = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'new-query'>('overview');
  const [queries, setQueries] = useState<QueryWithEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);
  
  // WebSocket integration for real-time updates
  const {
    isConnected: wsConnected,
    connectionStatus,
    subscribe,
    setUserStatus
  } = useWebSocket(patient.id, 'patient');
  
  // Smart polling as fallback when WebSocket is not available
  const [pollingState, pollingControls] = useSmartPolling(
    useCallback(async () => {
      const result = await trustCareAPI.getPatientPortalData(patient.id);
      if (result.success && result.data?.queries?.success) {
        return result.data.queries.data || [];
      }
      throw new Error(result.error || 'Failed to load queries');
    }, [patient.id]),
    wsConnected,
    {
      interval: 30000, // Poll every 30 seconds when WebSocket is not connected
      onSuccess: (queryData) => {
        const queriesWithEstimates = queryData.map((query: MedicalQuery) => ({
          ...query,
          estimatedResponseTime: calculateEstimatedResponseTime(query),
          timeRemaining: calculateTimeRemaining(query)
        }));
        
        checkForStatusUpdates(queriesWithEstimates);
        setQueries(queriesWithEstimates);
        setLastRefresh(new Date());
        setError(null);
        setRealtimeUpdates(prev => prev + 1);
      },
      onError: (error) => {
        setError(error.message);
        showMessage('Failed to refresh query data', 'error');
      }
    }
  );

  // WebSocket event listeners
  useEffect(() => {
    if (!wsConnected) return;

    // Set user status as online
    setUserStatus('online');

    // Subscribe to relevant events
    const unsubscribeFunctions = [
      subscribe('query_created', handleQueryCreated),
      subscribe('query_updated', handleQueryUpdated),
      subscribe('response_received', handleResponseReceived),
      subscribe('notification', handleNotification)
    ];

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }, [wsConnected, subscribe, setUserStatus]);

  useEffect(() => {
    loadPatientQueries();
    
    // Set up time estimate updates
    const timeUpdateInterval = setInterval(updateTimeEstimates, 60000); // Update every minute
    return () => clearInterval(timeUpdateInterval);
  }, [patient.id]);

  // WebSocket event handlers
  const handleQueryCreated = useCallback((data: any) => {
    if (data.query && data.query.patientId === patient.id) {
      const queryWithEstimate = {
        ...data.query,
        estimatedResponseTime: calculateEstimatedResponseTime(data.query),
        timeRemaining: calculateTimeRemaining(data.query)
      };
      setQueries(prev => [queryWithEstimate, ...prev]);
      showMessage('Your query has been submitted and is being processed', 'success');
      setRealtimeUpdates(prev => prev + 1);
    }
  }, [patient.id, showMessage]);

  const handleQueryUpdated = useCallback((data: any) => {
    if (data.query && data.query.patientId === patient.id) {
      setQueries(prev => prev.map(query => 
        query.id === data.query.id ? {
          ...data.query,
          estimatedResponseTime: calculateEstimatedResponseTime(data.query),
          timeRemaining: calculateTimeRemaining(data.query)
        } : query
      ));
      setRealtimeUpdates(prev => prev + 1);
      
      // Show notification for status changes
      if (data.previousStatus !== data.newStatus) {
        const statusMessage = 
          data.newStatus === 'doctor_review' ? 'Your query is now being reviewed by your doctor' :
          data.newStatus === 'completed' ? 'Your doctor has responded to your query!' :
          `Query status updated to ${data.newStatus}`;
        
        showMessage(statusMessage, data.newStatus === 'completed' ? 'success' : 'info');
        
        // Add to notifications
        setNotifications(prev => [statusMessage, ...prev].slice(0, 10));
      }
    }
  }, [patient.id, showMessage]);

  const handleResponseReceived = useCallback((data: any) => {
    if (data.query && data.query.patientId === patient.id) {
      setQueries(prev => prev.map(query => 
        query.id === data.query.id ? {
          ...data.query,
          estimatedResponseTime: 'Completed',
          timeRemaining: 'Completed'
        } : query
      ));
      
      showMessage(`You have received a response for "${data.query.title}"!`, 'success');
      setNotifications(prev => [`✅ New response received for "${data.query.title}"`, ...prev].slice(0, 10));
      setRealtimeUpdates(prev => prev + 1);
    }
  }, [patient.id, showMessage]);

  const handleNotification = useCallback((data: any) => {
    if (data.targetUser === patient.id || data.targetUserType === 'patient') {
      showMessage(data.message, data.type || 'info');
      setNotifications(prev => [data.message, ...prev].slice(0, 10));
    }
  }, [patient.id, showMessage]);

  const loadPatientQueries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Loading queries for patient: ${patient.id}`);
      
      // Use the enhanced API to load patient portal data (includes patient info and queries)
      const result = await trustCareAPI.getPatientPortalData(patient.id);
      console.log('Patient portal data result:', result);
      
      if (result.success && result.data?.queries?.success && result.data.queries.data) {
        const queryData = result.data.queries.data;
        console.log(`Found ${queryData.length} queries for patient`);
        
        const queriesWithEstimates = queryData.map((query: MedicalQuery) => ({
          ...query,
          estimatedResponseTime: calculateEstimatedResponseTime(query),
          timeRemaining: calculateTimeRemaining(query)
        }));
        
        // Check for status changes and add notifications
        checkForStatusUpdates(queriesWithEstimates);
        
        setQueries(queriesWithEstimates);
        setLastRefresh(new Date());
        
        // Log any partial errors from batch operation
        if (result.errors && result.errors.length > 0) {
          console.warn('Some patient data failed to load:', result.errors);
        }
      } else if (result.success && result.data?.queries?.success && !result.data.queries.data) {
        // No queries found (empty array)
        console.log('No queries found for patient');
        setQueries([]);
        setLastRefresh(new Date());
      } else {
        // API error
        const errorMessage = result.data?.queries?.error || result.error || 'Failed to load queries';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error loading patient queries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      showMessage('Failed to load your queries. Please try refreshing the page.', 'error');
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedResponseTime = (query: MedicalQuery): string => {
    const now = Date.now();
    const createdTime = Number(query.createdAt) / 1000000; // Convert nanoseconds to milliseconds
    const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);

    switch (query.status) {
      case 'pending':
        return 'Within 2-4 hours';
      case 'doctor_review':
        return 'Within 1-2 hours';
      case 'completed':
        return 'Completed';
      default:
        return 'Processing...';
    }
  };

  const calculateTimeRemaining = (query: MedicalQuery): string => {
    if (query.status === 'completed') return 'Completed';
    
    const now = Date.now();
    const createdTime = Number(query.createdAt) / 1000000; // Convert nanoseconds to milliseconds
    const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);
    
    let targetHours = 4; // Default estimate
    if (query.status === 'doctor_review') targetHours = 2;
    
    const remainingHours = Math.max(0, targetHours - hoursElapsed);
    
    if (remainingHours < 1) {
      const remainingMinutes = Math.floor(remainingHours * 60);
      return `${remainingMinutes} minutes remaining`;
    } else {
      return `${Math.ceil(remainingHours)} hours remaining`;
    }
  };

  const checkForStatusUpdates = (newQueries: QueryWithEstimate[]) => {
    const newNotifications: string[] = [];
    
    newQueries.forEach(query => {
      const existingQuery = queries.find(q => q.id === query.id);
      
      // Check for new queries (first time seeing this query)
      if (!existingQuery && query.status === 'pending') {
        newNotifications.push(`🤖 Query "${query.title}" has been processed by AI and sent to your doctor for review`);
      }
      
      // Check for status changes
      if (existingQuery && existingQuery.status !== query.status) {
        switch (query.status) {
          case 'doctor_review':
            newNotifications.push(`👨‍⚕️ Your query "${query.title}" is now being reviewed by your doctor`);
            break;
          case 'completed':
            newNotifications.push(`✅ Your query "${query.title}" has been answered by your doctor!`);
            break;
        }
      }
    });
    
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Keep last 10 notifications
    }
  };

  const updateTimeEstimates = () => {
    setQueries(prev => prev.map(query => ({
      ...query,
      timeRemaining: calculateTimeRemaining(query)
    })));
  };

  const dismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: QueryStatus) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'doctor_review': return '👨‍⚕️';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getStatusText = (status: QueryStatus) => {
    switch (status) {
      case 'pending': return '🤖 AI Analyzed - Awaiting Doctor Review';
      case 'doctor_review': return '👨‍⚕️ Under Doctor Review';
      case 'completed': return '✅ Doctor Response Received';
      default: return 'Processing';
    }
  };

  const getStatusColor = (status: QueryStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'doctor_review': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const pendingQueries = queries.filter(q => q.status === 'pending' || q.status === 'doctor_review');
  const completedQueries = queries.filter(q => q.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {patient.name}
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Patient ID: {patient.id}</p>
              <p>Condition: {patient.condition}</p>
              <p>Status: {patient.isActive ? 'Active' : 'Inactive'}</p>
              {patient.assignedDoctorId && (
                <p>Assigned Doctor: {patient.assignedDoctorId}</p>
              )}
              {lastRefresh && (
                <p className="text-xs text-gray-400">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
              {/* Connection Status */}
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  wsConnected ? 'bg-green-500 animate-pulse' : 
                  connectionStatus.reconnecting ? 'bg-yellow-500 animate-ping' : 
                  'bg-red-500'
                }`} />
                <span className={
                  wsConnected ? 'text-green-600' : 
                  connectionStatus.reconnecting ? 'text-yellow-600' : 
                  'text-red-600'
                }>
                  {wsConnected ? 'Live updates' : 
                   connectionStatus.reconnecting ? 'Reconnecting...' : 
                   'Offline mode'}
                </span>
                {realtimeUpdates > 0 && (
                  <span className="text-blue-600">
                    ({realtimeUpdates} updates)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadPatientQueries}
              variant="secondary"
              size="small"
              disabled={loading}
              className="text-sm"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={onLogout}
              variant="secondary"
              className="text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-lg">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Unable to Load Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <Button
              onClick={loadPatientQueries}
              size="small"
              variant="secondary"
              className="ml-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.slice(0, 3).map((notification, index) => (
            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-start">
              <div className="flex items-start">
                <span className="text-blue-500 mr-3 mt-0.5">🔔</span>
                <p className="text-blue-800 text-sm">{notification}</p>
              </div>
              <button
                onClick={() => dismissNotification(index)}
                className="text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', count: queries.length },
              { id: 'queries', label: 'Query History', count: null },
              { id: 'new-query', label: 'Submit New Query', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold text-gray-900">{queries.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingQueries.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedQueries.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Queries */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Queries</h3>
              <Button
                onClick={() => setActiveTab('new-query')}
                size="small"
              >
                Submit New Query
              </Button>
            </div>
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-8 text-center">
                  <LoadingSpinner />
                </div>
              ) : queries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">📋</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">No queries yet</p>
                  <p className="text-sm text-gray-500 mb-4">Submit your first medical query to get started!</p>
                  {!patient.assignedDoctorId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ You need to be assigned to a doctor before you can submit queries.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                queries.slice(0, 5).map((query) => (
                  <div key={query.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{getStatusIcon(query.status)}</span>
                          <h4 className="text-lg font-medium text-gray-900">{query.title}</h4>
                        </div>
                        <p className="text-gray-600 mb-3">{query.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Submitted: {formatters.formatDate(new Date(Number(query.createdAt) / 1000000))}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(query.status)}`}>
                            {getStatusText(query.status)}
                          </span>
                          {query.status !== 'completed' && (
                            <span className="text-blue-600 font-medium">
                              {query.timeRemaining}
                            </span>
                          )}
                        </div>
                        {/* AI responses are only visible to doctors */}
                        {query.response && (
                          <div className="mt-3 p-4 bg-green-50 rounded-md">
                            <p className="text-sm font-medium text-green-800 mb-2">Doctor's Response:</p>
                            <p className="text-sm text-green-700">{query.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queries' && (
        <div className="space-y-6">
          {/* Pending Queries */}
          {pendingQueries.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Pending Queries ({pendingQueries.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingQueries.map((query) => (
                  <div key={query.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{getStatusIcon(query.status)}</span>
                          <h4 className="text-lg font-medium text-gray-900">{query.title}</h4>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs ${getStatusColor(query.status)}`}>
                            {getStatusText(query.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{query.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>Submitted: {formatters.formatDate(new Date(Number(query.createdAt) / 1000000))}</span>
                          <span className="text-blue-600 font-medium">
                            Est. Response: {query.estimatedResponseTime}
                          </span>
                          <span className="text-orange-600 font-medium">
                            {query.timeRemaining}
                          </span>
                        </div>
                        {query.aiDraftResponse && (
                          <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>AI Analysis:</strong> {query.aiDraftResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Queries */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Completed Queries ({completedQueries.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {completedQueries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No completed queries yet.</p>
                </div>
              ) : (
                completedQueries.map((query) => (
                  <div key={query.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{getStatusIcon(query.status)}</span>
                          <h4 className="text-lg font-medium text-gray-900">{query.title}</h4>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs ${getStatusColor(query.status)}`}>
                            Completed
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{query.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>Submitted: {formatters.formatDate(new Date(Number(query.createdAt) / 1000000))}</span>
                          <span>Completed: {formatters.formatDate(new Date(Number(query.updatedAt) / 1000000))}</span>
                        </div>
                        {query.response && (
                          <div className="p-4 bg-green-50 rounded-md">
                            <p className="text-sm font-medium text-green-800 mb-2">Doctor's Response:</p>
                            <p className="text-sm text-green-700">{query.response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'new-query' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submit New Medical Query</h3>
          <QuerySubmission
            patient={patient}
            onQuerySubmitted={() => {
              loadPatientQueries();
              setActiveTab('overview');
              showMessage('Query submitted successfully! You will receive updates as it progresses.', 'success');
            }}
            showMessage={showMessage}
            loading={parentLoading}
            setLoading={setParentLoading}
          />
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;