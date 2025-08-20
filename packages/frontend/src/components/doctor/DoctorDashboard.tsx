// Doctor Dashboard Component - Enhanced with Real Backend Integration
import React, { useState, useEffect } from 'react';
import { Doctor, Patient, MedicalQuery } from '../../types';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import PatientCard from './PatientCard';
import QueryCard from './QueryCard';
import UnassignedPatients from './UnassignedPatients';
import { formatQueryStatus } from '../../utils/formatters';
import trustCareAPI from '../../api/trustcare';

interface DoctorDashboardProps {
  currentDoctor: Doctor;
  onLogout: () => void;
  showMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  currentDoctor,
  onLogout,
  showMessage,
  loading,
  setLoading
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'queries' | 'incoming' | 'assignments'>('overview');
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  const [myQueries, setMyQueries] = useState<MedicalQuery[]>([]);
  const [pendingQueries, setPendingQueries] = useState<MedicalQuery[]>([]);
  const [patientNameMap, setPatientNameMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeQueries: 0,
    completedQueries: 0,
    pendingQueries: 0,
    unassignedCount: 0
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Set up periodic refresh for real-time updates
    const interval = setInterval(loadDashboardData, 45000); // Refresh every 45 seconds
    return () => clearInterval(interval);
  }, [currentDoctor]);

  const loadDashboardData = async () => {
    setDataLoading(true);
    setError(null);
    
    try {
      console.log(`Loading dashboard data for doctor: ${currentDoctor.id}`);
      
      // Use the enhanced batch API to load all doctor dashboard data efficiently
      const result = await trustCareAPI.getDoctorDashboardData(currentDoctor.id);
      console.log('Doctor dashboard data result:', result);
      
      if (result.success && result.data) {
        const { doctor, patients, queries, pendingQueries, stats } = result.data;
        
        // Update assigned patients
        if (patients?.success && patients.data) {
          setMyPatients(patients.data);
          setStats(prev => ({ ...prev, totalPatients: patients.data.length }));
          
          // Build patient name mapping
          const nameMap: Record<string, string> = {};
          patients.data.forEach((patient: Patient) => {
            nameMap[patient.id] = patient.name;
          });
          setPatientNameMap(prev => ({ ...prev, ...nameMap }));
        }
        
        // Update doctor's queries
        if (queries?.success && queries.data) {
          setMyQueries(queries.data);
          
          // Calculate query statistics
          const activeQueries = queries.data.filter((q: MedicalQuery) => q.status === 'doctor_review').length;
          const completedQueries = queries.data.filter((q: MedicalQuery) => q.status === 'completed').length;
          
          setStats(prev => ({ 
            ...prev, 
            activeQueries,
            completedQueries
          }));
        }
        
        // Update pending queries
        if (pendingQueries?.success && pendingQueries.data) {
          setPendingQueries(pendingQueries.data);
          setStats(prev => ({ ...prev, pendingQueries: pendingQueries.data.length }));
        }
        
        // Load unassigned patients separately (not included in batch operation)
        await loadUnassignedPatients();
        
        setLastRefresh(new Date());
        console.log('Dashboard data loaded successfully');
        
        // Log any partial errors from batch operation
        if (result.errors && result.errors.length > 0) {
          console.warn('Some dashboard data failed to load:', result.errors);
          showMessage('Some dashboard data may be incomplete. Please try refreshing.', 'warning');
        }
      } else {
        throw new Error(result.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading doctor dashboard:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      showMessage('Failed to load dashboard data. Please try refreshing.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const loadUnassignedPatients = async () => {
    try {
      const result = await trustCareAPI.getUnassignedPatients();
      if (result.success && result.data) {
        setUnassignedPatients(result.data);
        setStats(prev => ({ ...prev, unassignedCount: result.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load unassigned patients:', error);
    }
  };

  // Individual refresh functions for specific data (used by child components)
  const refreshPatients = async () => {
    try {
      const result = await trustCareAPI.getDoctorPatients(currentDoctor.id);
      if (result.success && result.data) {
        setMyPatients(result.data);
        setStats(prev => ({ ...prev, totalPatients: result.data.length }));
        
        const nameMap: Record<string, string> = {};
        result.data.forEach((patient: Patient) => {
          nameMap[patient.id] = patient.name;
        });
        setPatientNameMap(prev => ({ ...prev, ...nameMap }));
      }
    } catch (error) {
      console.error('Failed to refresh patients:', error);
    }
  };

  const refreshQueries = async () => {
    try {
      const result = await trustCareAPI.getDoctorQueries(currentDoctor.id);
      if (result.success && result.data) {
        setMyQueries(result.data);
        
        const activeQueries = result.data.filter((q: MedicalQuery) => q.status === 'doctor_review').length;
        const completedQueries = result.data.filter((q: MedicalQuery) => q.status === 'completed').length;
        
        setStats(prev => ({ 
          ...prev, 
          activeQueries,
          completedQueries
        }));
      }
    } catch (error) {
      console.error('Failed to refresh queries:', error);
    }
  };

  const handleAssignPatient = async (patientId: string) => {
    setLoading(true);
    try {
      const result = await icpService.assignPatientToDoctor(patientId, currentDoctor.id);
      if (result.success) {
        showMessage('Patient successfully assigned to your care!', 'success');
        await loadDashboardData();
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showMessage('Failed to assign patient. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignPatient = async (patientId: string) => {
    const confirmUnassign = window.confirm('Are you sure you want to unassign this patient?');
    if (!confirmUnassign) return;
    
    setLoading(true);
    try {
      const result = await icpService.unassignPatient(patientId, currentDoctor.id);
      if (result.success) {
        showMessage('Patient unassigned successfully.', 'success');
        await loadDashboardData();
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showMessage('Failed to unassign patient. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (dataLoading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Loading dashboard data..." />
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800">My Patients</h3>
                <p className="text-2xl font-bold text-blue-900">{stats.totalPatients}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800">Active Queries</h3>
                <p className="text-2xl font-bold text-yellow-900">{stats.activeQueries}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-800">Completed</h3>
                <p className="text-2xl font-bold text-green-900">{stats.completedQueries}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800">Unassigned</h3>
                <p className="text-2xl font-bold text-purple-900">{stats.unassignedCount}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Patients</h3>
                {myPatients.slice(0, 5).map((patient) => (
                  <div key={patient.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.condition}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
                {myPatients.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No patients assigned yet</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
                {myQueries.slice(0, 5).map((query) => (
                  <div key={query.id} className="py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{query.title}</p>
                        <p className="text-xs text-gray-500 mt-1">Patient: {patientNameMap[query.patientId] || query.patientId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        formatQueryStatus(query.status) === 'Completed' 
                          ? 'bg-green-100 text-green-800'
                          : formatQueryStatus(query.status) === 'Under Review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formatQueryStatus(query.status)}
                      </span>
                    </div>
                  </div>
                ))}
                {myQueries.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No queries yet</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              My Patients ({myPatients.length})
            </h3>
            {myPatients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have any assigned patients yet.</p>
                <Button
                  onClick={() => setActiveTab('assignments')}
                  variant="primary"
                >
                  View Available Patients
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onUnassign={() => handleUnassignPatient(patient.id)}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'queries':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Medical Queries ({myQueries.length})
            </h3>
            {myQueries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No queries from your patients yet.</p>
            ) : (
              <div className="space-y-4">
                {myQueries.map((query) => (
                  <QueryCard
                    key={query.id}
                    query={query}
                    currentDoctor={currentDoctor}
                    onUpdate={loadMyQueries}
                    showMessage={showMessage}
                    loading={loading}
                    setLoading={setLoading}
                    patientName={patientNameMap[query.patientId]}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'incoming':
        const pendingQueries = myQueries.filter(q => formatQueryStatus(q.status) === 'Pending');
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                🔔 Incoming Queries ({pendingQueries.length})
              </h3>
              {pendingQueries.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  <span>⚡ Requires Immediate Attention</span>
                </div>
              )}
            </div>
            
            {pendingQueries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-lg font-medium text-gray-900 mb-2">All caught up!</p>
                <p className="text-gray-500">No pending queries at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <span className="text-orange-500 mr-3 mt-0.5">💡</span>
                    <div>
                      <p className="text-orange-800 text-sm font-medium">Quick Action Guide:</p>
                      <p className="text-orange-700 text-sm mt-1">
                        Click "Start Review" on any query to begin editing the AI-generated response. 
                        The AI has already analyzed each query and provided a draft response for your review.
                      </p>
                    </div>
                  </div>
                </div>
                
                {pendingQueries.map((query) => (
                  <QueryCard
                    key={query.id}
                    query={query}
                    currentDoctor={currentDoctor}
                    onUpdate={loadMyQueries}
                    showMessage={showMessage}
                    loading={loading}
                    setLoading={setLoading}
                    patientName={patientNameMap[query.patientId]}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'assignments':
        return (
          <UnassignedPatients
            unassignedPatients={unassignedPatients}
            onAssign={handleAssignPatient}
            loading={loading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="doctor-dashboard max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                👨‍⚕️ Dr. {currentDoctor.name}
              </h1>
              {stats.pendingQueries > 0 && (
                <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">🔔 {stats.pendingQueries} Pending</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Specialization: <span className="font-medium">{currentDoctor.specialization}</span>
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span>Doctor ID: <span className="font-mono">{currentDoctor.id}</span></span>
              {lastRefresh && (
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={loadDashboardData}
              variant="secondary"
              size="small"
              disabled={dataLoading}
            >
              {dataLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="secondary"
              onClick={onLogout}
            >
              Switch Account
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-lg">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-1">
                Some features may not work properly. Please try refreshing the dashboard.
              </p>
            </div>
            <Button
              onClick={loadDashboardData}
              size="small"
              variant="secondary"
              className="ml-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: '📊 Overview', count: null },
              { id: 'incoming', label: '📥 Incoming Queries', count: stats.pendingQueries },
              { id: 'patients', label: '👥 My Patients', count: stats.totalPatients },
              { id: 'queries', label: '💬 All Queries', count: stats.activeQueries },
              { id: 'assignments', label: '📋 Assignments', count: stats.unassignedCount }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;