// Doctor Dashboard Component
import React, { useState, useEffect } from 'react';
import { Doctor, Patient, MedicalQuery } from '../../types';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import PatientCard from './PatientCard';
import QueryCard from './QueryCard';
import UnassignedPatients from './UnassignedPatients';
import { formatQueryStatus } from '../../utils/formatters';
import icpService from '../../services/icpService';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'queries' | 'assignments'>('overview');
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  const [myQueries, setMyQueries] = useState<MedicalQuery[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeQueries: 0,
    completedQueries: 0,
    unassignedCount: 0
  });
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentDoctor]);

  const loadDashboardData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadMyPatients(),
        loadUnassignedPatients(),
        loadMyQueries()
      ]);
    } finally {
      setDataLoading(false);
    }
  };

  const loadMyPatients = async () => {
    try {
      const result = await icpService.getDoctorPatients(currentDoctor.id);
      if (result.success && result.data) {
        setMyPatients(result.data);
        setStats(prev => ({ ...prev, totalPatients: result.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const loadUnassignedPatients = async () => {
    try {
      const result = await icpService.getUnassignedPatients();
      if (result.success && result.data) {
        setUnassignedPatients(result.data);
        setStats(prev => ({ ...prev, unassignedCount: result.data?.length || 0 }));
      }
    } catch (error) {
      console.error('Failed to load unassigned patients:', error);
    }
  };

  const loadMyQueries = async () => {
    try {
      const result = await icpService.getDoctorQueries(currentDoctor.id);
      if (result.success && result.data) {
        setMyQueries(result.data);
        const activeQueries = result.data.filter(q => 
          formatQueryStatus(q.status) === 'Pending' || formatQueryStatus(q.status) === 'Under Review'
        ).length;
        const completedQueries = result.data.filter(q => 
          formatQueryStatus(q.status) === 'Completed'
        ).length;
        setStats(prev => ({ 
          ...prev, 
          activeQueries,
          completedQueries 
        }));
      }
    } catch (error) {
      console.error('Failed to load queries:', error);
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
                        <p className="text-xs text-gray-500 mt-1">Patient: {query.patientId}</p>
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
            <h1 className="text-2xl font-bold text-gray-900">
              👨‍⚕️ Dr. {currentDoctor.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Specialization: <span className="font-medium">{currentDoctor.specialization}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Doctor ID: <span className="font-mono">{currentDoctor.id}</span>
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={onLogout}
          >
            Switch Account
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: '📊 Overview', count: null },
              { id: 'patients', label: '👥 My Patients', count: stats.totalPatients },
              { id: 'queries', label: '💬 Queries', count: stats.activeQueries },
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