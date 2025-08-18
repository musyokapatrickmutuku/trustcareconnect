// Patient Portal Page Component
import React, { useState, useEffect } from 'react';
import { Patient, MedicalQuery, ComponentProps } from '../types';
import PatientRegistration from '../components/patient/PatientRegistration';
import QuerySubmission from '../components/patient/QuerySubmission';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatQueryStatus, formatTimestamp } from '../utils/formatters';
import icpService from '../services/icpService';

interface PatientPortalProps extends ComponentProps {
  currentUser: Patient | null;
}

const PatientPortal: React.FC<PatientPortalProps> = ({
  currentUser,
  setCurrentUser,
  showMessage,
  loading,
  setLoading
}) => {
  const [queries, setQueries] = useState<MedicalQuery[]>([]);
  const [assignedDoctor, setAssignedDoctor] = useState<any>(null);
  const [queriesLoading, setQueriesLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadPatientQueries();
      loadAssignedDoctor();
    }
  }, [currentUser]);

  const loadPatientQueries = async () => {
    if (!currentUser) return;
    
    setQueriesLoading(true);
    try {
      const result = await icpService.getPatientQueries(currentUser.id);
      if (result.success && result.data) {
        setQueries(result.data);
      }
    } catch (error) {
      console.error('Failed to load queries:', error);
    } finally {
      setQueriesLoading(false);
    }
  };

  const loadAssignedDoctor = async () => {
    if (!currentUser?.assignedDoctorId) {
      setAssignedDoctor(null);
      return;
    }
    
    try {
      const result = await icpService.getDoctor(currentUser.assignedDoctorId);
      if (result.success && result.data) {
        setAssignedDoctor(result.data);
      }
    } catch (error) {
      console.error('Failed to load assigned doctor:', error);
    }
  };

  const handleRegistrationSuccess = (patient: Patient) => {
    setCurrentUser?.(patient);
    loadPatientQueries();
  };

  const handleQuerySubmitted = () => {
    loadPatientQueries();
  };

  const handleLogout = () => {
    setCurrentUser?.(null);
    setQueries([]);
    setAssignedDoctor(null);
  };

  if (!currentUser) {
    return (
      <div className="patient-portal max-w-2xl mx-auto">
        <PatientRegistration
          onRegistrationSuccess={handleRegistrationSuccess}
          showMessage={showMessage}
          loading={loading}
          setLoading={setLoading}
        />
      </div>
    );
  }

  return (
    <div className="patient-portal max-w-4xl mx-auto space-y-6">
      {/* User Info Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name}</h2>
            <p className="text-gray-600 mt-1">
              Condition: <span className="font-medium">{currentUser.condition}</span> | 
              Email: <span className="font-medium">{currentUser.email}</span>
            </p>
            {assignedDoctor ? (
              <p className="text-green-600 mt-2">
                <span className="font-medium">Assigned Doctor:</span> Dr. {assignedDoctor.name} ({assignedDoctor.specialization})
              </p>
            ) : (
              <p className="text-amber-600 mt-2 flex items-center">
                <span className="mr-2">⚠️</span>
                No doctor assigned yet. Please wait for a doctor to assign you to start submitting queries.
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="ml-4"
          >
            Switch Patient
          </Button>
        </div>
      </div>

      {/* Query Submission */}
      {assignedDoctor ? (
        <div className="bg-white rounded-lg shadow p-6">
          <QuerySubmission
            patient={currentUser}
            assignedDoctorName={assignedDoctor.name}
            onQuerySubmitted={handleQuerySubmitted}
            showMessage={showMessage}
            loading={loading}
            setLoading={setLoading}
          />
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Waiting for Doctor Assignment
          </h3>
          <p className="text-yellow-700">
            Once a doctor assigns you as their patient, you'll be able to submit queries and receive personalized care.
          </p>
        </div>
      )}

      {/* Patient Queries */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            My Queries ({queries.length})
          </h3>
          <Button
            variant="secondary"
            size="small"
            onClick={loadPatientQueries}
            loading={queriesLoading}
          >
            Refresh
          </Button>
        </div>

        {queriesLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner message="Loading your queries..." />
          </div>
        ) : queries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No queries submitted yet.</p>
            {assignedDoctor && (
              <p className="mt-2">Submit your first query using the form above.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map((query) => (
              <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{query.title}</h4>
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
                <p className="text-gray-600 mb-3">{query.description}</p>
                
                {query.response && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                    <h5 className="font-medium text-green-800 mb-2">Doctor's Response:</h5>
                    <p className="text-green-700">{query.response}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Created: {formatTimestamp(query.createdAt)}
                  {query.updatedAt !== query.createdAt && (
                    <> | Updated: {formatTimestamp(query.updatedAt)}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;