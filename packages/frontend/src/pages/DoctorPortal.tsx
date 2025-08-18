// Doctor Portal Page Component
import React, { useState, useEffect } from 'react';
import { Doctor, Patient, MedicalQuery, ComponentProps } from '../types';
import Button from '../components/common/Button';
import FormField from '../components/common/FormField';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatQueryStatus, formatTimestamp } from '../utils/formatters';
import { MEDICAL_SPECIALIZATIONS, UI_MESSAGES } from '../constants';
import icpService from '../services/icpService';

interface DoctorPortalProps {
  currentUser: Doctor | null;
  setCurrentUser?: (user: Doctor | null) => void;
  showMessage?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

const DoctorPortal: React.FC<DoctorPortalProps> = ({
  currentUser,
  setCurrentUser,
  showMessage,
  loading,
  setLoading
}) => {
  const [activeTab, setActiveTab] = useState<'patients' | 'queries'>('patients');
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [unassignedPatients, setUnassignedPatients] = useState<Patient[]>([]);
  const [myQueries, setMyQueries] = useState<MedicalQuery[]>([]);
  const [responseForm, setResponseForm] = useState({ queryId: '', response: '' });
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadDoctorData();
    }
  }, [currentUser]);

  const loadDoctorData = async () => {
    if (!currentUser) return;
    
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
    if (!currentUser) return;
    
    try {
      const result = await icpService.getDoctorPatients(currentUser.id);
      if (result.success && result.data) {
        setMyPatients(result.data);
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
      }
    } catch (error) {
      console.error('Failed to load unassigned patients:', error);
    }
  };

  const loadMyQueries = async () => {
    if (!currentUser) return;
    
    try {
      const result = await icpService.getDoctorQueries(currentUser.id);
      if (result.success && result.data) {
        setMyQueries(result.data);
      }
    } catch (error) {
      console.error('Failed to load queries:', error);
    }
  };

  const handleDoctorRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const specialization = formData.get('specialization') as string;

    if (!name.trim() || !specialization) {
      showMessage?.('Please fill in all fields');
      return;
    }

    setLoading?.(true);
    try {
      const result = await icpService.registerDoctor(name, specialization);
      if (result.success && result.data) {
        const doctorResult = await icpService.getDoctor(result.data);
        if (doctorResult.success && doctorResult.data) {
          setCurrentUser?.(doctorResult.data);
          showMessage?.(UI_MESSAGES.SUCCESS.DOCTOR_REGISTERED);
        }
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Registration failed. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  const handleAssignPatient = async (patientId: string) => {
    if (!currentUser) return;
    
    setLoading?.(true);
    try {
      const result = await icpService.assignPatientToDoctor(patientId, currentUser.id);
      if (result.success) {
        showMessage?.(UI_MESSAGES.SUCCESS.PATIENT_ASSIGNED);
        await loadDoctorData();
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Failed to assign patient. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  const handleUnassignPatient = async (patientId: string) => {
    if (!currentUser) return;
    
    const confirmUnassign = window.confirm('Are you sure you want to unassign this patient?');
    if (!confirmUnassign) return;
    
    setLoading?.(true);
    try {
      const result = await icpService.unassignPatient(patientId, currentUser.id);
      if (result.success) {
        showMessage?.(UI_MESSAGES.SUCCESS.PATIENT_UNASSIGNED);
        await loadDoctorData();
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Failed to unassign patient. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  const handleTakeQuery = async (queryId: string) => {
    if (!currentUser) return;
    
    setLoading?.(true);
    try {
      const result = await icpService.takeQuery(queryId, currentUser.id);
      if (result.success) {
        showMessage?.(UI_MESSAGES.SUCCESS.QUERY_TAKEN);
        await loadMyQueries();
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Failed to take query. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  const handleRespondToQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !responseForm.response.trim()) return;
    
    setLoading?.(true);
    try {
      const result = await icpService.respondToQuery(
        responseForm.queryId,
        currentUser.id,
        responseForm.response
      );
      
      if (result.success) {
        showMessage?.(UI_MESSAGES.SUCCESS.RESPONSE_SUBMITTED);
        setResponseForm({ queryId: '', response: '' });
        await loadMyQueries();
      } else {
        showMessage?.(`Error: ${result.error}`);
      }
    } catch (error) {
      showMessage?.('Failed to submit response. Please try again.');
    } finally {
      setLoading?.(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser?.(null);
    setMyPatients([]);
    setUnassignedPatients([]);
    setMyQueries([]);
    setResponseForm({ queryId: '', response: '' });
  };

  if (!currentUser) {
    return (
      <div className="doctor-portal max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Registration</h2>
          <form onSubmit={handleDoctorRegistration} className="space-y-4">
            <FormField
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              required
            />
            <FormField
              label="Specialization"
              type="select"
              name="specialization"
              placeholder="Select your specialization"
              required
              options={[...MEDICAL_SPECIALIZATIONS]}
            />
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              fullWidth
              className="mt-6"
            >
              {loading ? UI_MESSAGES.LOADING.REGISTERING : 'Register as Doctor'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-portal max-w-6xl mx-auto space-y-6">
      {/* Doctor Info Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dr. {currentUser.name}</h2>
            <p className="text-gray-600 mt-1">
              Specialization: <span className="font-medium">{currentUser.specialization}</span>
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
          >
            Switch Doctor
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('patients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'patients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Patient Management
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'queries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Query Management
            </button>
          </nav>
        </div>

        <div className="p-6">
          {dataLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner message="Loading doctor data..." />
            </div>
          )}

          {!dataLoading && activeTab === 'patients' && (
            <div className="space-y-6">
              {/* My Patients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  My Patients ({myPatients.length})
                </h3>
                {myPatients.length === 0 ? (
                  <p className="text-gray-500">No patients assigned yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {myPatients.map((patient) => (
                      <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{patient.name}</h4>
                            <p className="text-gray-600 text-sm">
                              Condition: {patient.condition} | Email: {patient.email}
                            </p>
                            <p className="text-sm mt-1">
                              Status: <span className={patient.isActive ? 'text-green-600' : 'text-gray-500'}>
                                {patient.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() => handleUnassignPatient(patient.id)}
                            disabled={loading}
                          >
                            Unassign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unassigned Patients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Patients ({unassignedPatients.length})
                </h3>
                {unassignedPatients.length === 0 ? (
                  <p className="text-gray-500">No unassigned patients available.</p>
                ) : (
                  <div className="grid gap-4">
                    {unassignedPatients.map((patient) => (
                      <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{patient.name}</h4>
                            <p className="text-gray-600 text-sm">
                              Condition: {patient.condition} | Email: {patient.email}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              Seeking care for: {patient.condition}
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleAssignPatient(patient.id)}
                            disabled={loading}
                          >
                            Assign to My Care
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!dataLoading && activeTab === 'queries' && (
            <div className="space-y-6">
              {/* Pending Queries */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Queries from My Patients ({myQueries.filter(q => formatQueryStatus(q.status) === 'Pending').length})
                </h3>
                {myQueries.filter(q => formatQueryStatus(q.status) === 'Pending').length === 0 ? (
                  <p className="text-gray-500">No pending queries from your patients.</p>
                ) : (
                  <div className="space-y-4">
                    {myQueries.filter(q => formatQueryStatus(q.status) === 'Pending').map((query) => (
                      <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{query.title}</h4>
                          <Button
                            size="small"
                            onClick={() => handleTakeQuery(query.id)}
                            disabled={loading}
                          >
                            Start Review
                          </Button>
                        </div>
                        <p className="text-gray-600 mb-2">{query.description}</p>
                        <p className="text-xs text-gray-500">
                          Patient ID: {query.patientId} | Created: {formatTimestamp(query.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Queries Under Review */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Queries Under Review & Completed ({myQueries.filter(q => formatQueryStatus(q.status) !== 'Pending').length})
                </h3>
                {myQueries.filter(q => formatQueryStatus(q.status) !== 'Pending').length === 0 ? (
                  <p className="text-gray-500">No queries in review or completed yet.</p>
                ) : (
                  <div className="space-y-4">
                    {myQueries.filter(q => formatQueryStatus(q.status) !== 'Pending').map((query) => (
                      <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{query.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            formatQueryStatus(query.status) === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {formatQueryStatus(query.status)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{query.description}</p>

                        {/* AI Draft Response */}
                        {query.aiDraftResponse && formatQueryStatus(query.status) === 'Under Review' && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                            <h5 className="font-medium text-blue-800 mb-2">🤖 AI-Generated Draft Response:</h5>
                            <div className="bg-white p-2 rounded text-blue-700 mb-2">
                              <p>{query.aiDraftResponse}</p>
                            </div>
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => setResponseForm({ 
                                queryId: query.id, 
                                response: query.aiDraftResponse || '' 
                              })}
                            >
                              Use AI Draft
                            </Button>
                          </div>
                        )}

                        {/* Response Form */}
                        {formatQueryStatus(query.status) === 'Under Review' && (
                          <form onSubmit={handleRespondToQuery} className="mt-3">
                            <FormField
                              label="Your Final Response"
                              type="textarea"
                              name="response"
                              value={responseForm.queryId === query.id ? responseForm.response : ''}
                              onChange={(e) => setResponseForm({ queryId: query.id, response: e.target.value })}
                              placeholder="Edit the AI draft above or write your own response..."
                              rows={4}
                              required
                            />
                            <Button
                              type="submit"
                              loading={loading}
                              disabled={loading || responseForm.queryId !== query.id}
                              className="mt-2"
                            >
                              {loading ? 'Submitting...' : 'Submit Final Response'}
                            </Button>
                          </form>
                        )}

                        {/* Final Response */}
                        {query.response && (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                            <h5 className="font-medium text-green-800 mb-2">Your Response:</h5>
                            <p className="text-green-700">{query.response}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          Patient ID: {query.patientId} | Created: {formatTimestamp(query.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPortal;