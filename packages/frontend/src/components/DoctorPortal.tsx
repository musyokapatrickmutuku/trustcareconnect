import React, { useState, useEffect } from 'react';
import { createActor } from '../declarations/backend';

interface Patient {
  id: string;
  name: string;
  email: string;
  condition: string;
  medicalContext: string;
}

interface Query {
  id: string;
  patientId: string;
  queryText: string;
  status: string;
  aiResponse?: string;
  doctorResponse?: string;
  timestamp: number;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  patientIds: string[];
}

const DoctorPortal: React.FC = () => {
  const [doctorId] = useState<string>('D001'); // Fixed doctor for MVP
  const [pendingQueries, setPendingQueries] = useState<Query[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [doctorResponse, setDoctorResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const actor = createActor(process.env.REACT_APP_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai');

  useEffect(() => {
    loadPendingQueries();
    loadPatients();
  }, []);

  const loadPendingQueries = async () => {
    try {
      const queries = await actor.getDoctorPendingReviews(doctorId);
      setPendingQueries(queries);
    } catch (error) {
      setMessage(`Failed to load pending queries: ${error}`);
    }
  };

  const loadPatients = async () => {
    try {
      const allPatients = await actor.getAllPatients();
      setPatients(allPatients);
    } catch (error) {
      setMessage(`Failed to load patients: ${error}`);
    }
  };

  const getPatientInfo = (patientId: string) => {
    return patients.find(p => p.id === patientId);
  };

  const approveQuery = async (queryId: string) => {
    if (!doctorResponse.trim()) {
      setMessage('Please provide a doctor response before approving.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const success = await actor.doctorReviewQuery(queryId, doctorId, doctorResponse);
      if (success) {
        setMessage('Query approved and response sent to patient!');
        setDoctorResponse('');
        setSelectedQuery(null);
        loadPendingQueries(); // Refresh the list
      } else {
        setMessage('Failed to approve query. Please try again.');
      }
    } catch (error) {
      setMessage(`Failed to approve query: ${error}`);
    }
    setIsLoading(false);
  };

  const selectQuery = (query: Query) => {
    setSelectedQuery(query);
    // Pre-fill doctor response with AI response for editing
    setDoctorResponse(query.aiResponse || '');
    setMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        👨‍⚕️ Doctor Portal - Review AI Consultations
      </h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-blue-900">Dr. Emily Johnson - Endocrinologist</h2>
        <p className="text-blue-700">Reviewing AI-generated responses for diabetes patients</p>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Queries List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            Pending Reviews ({pendingQueries.length})
          </h3>
          
          {pendingQueries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No queries pending review</p>
              <p className="text-sm">AI responses will appear here for doctor verification</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQueries.map((query) => {
                const patient = getPatientInfo(query.patientId);
                return (
                  <div
                    key={query.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedQuery?.id === query.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectQuery(query)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">Query {query.id}</span>
                      <span className="text-xs text-orange-600 font-medium">
                        AI Processed
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        Patient: {patient?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">{patient?.condition}</p>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {query.queryText}
                    </p>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(Number(query.timestamp) / 1000000).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Query Review Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Query Review</h3>
          
          {!selectedQuery ? (
            <div className="text-center py-8 text-gray-500">
              <p>Select a query from the left to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Patient Information</h4>
                {(() => {
                  const patient = getPatientInfo(selectedQuery.patientId);
                  return patient ? (
                    <div className="text-sm">
                      <p><strong>Name:</strong> {patient.name}</p>
                      <p><strong>Condition:</strong> {patient.condition}</p>
                      <p><strong>Medical Context:</strong></p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {patient.medicalContext}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Patient information not available</p>
                  );
                })()}
              </div>

              {/* Patient Query */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Patient Query:</h4>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">{selectedQuery.queryText}</p>
                </div>
              </div>

              {/* AI Response */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">AI Response:</h4>
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedQuery.aiResponse || 'No AI response available'}
                  </pre>
                </div>
              </div>

              {/* Doctor Response */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  Doctor Response (Edit AI response as needed):
                </h4>
                <textarea
                  value={doctorResponse}
                  onChange={(e) => setDoctorResponse(e.target.value)}
                  placeholder="Review and edit the AI response, or provide your own medical guidance..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => approveQuery(selectedQuery.id)}
                  disabled={isLoading || !doctorResponse.trim()}
                  className={`px-4 py-2 rounded-md font-medium ${
                    isLoading || !doctorResponse.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isLoading ? 'Approving...' : 'Approve & Send to Patient'}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedQuery(null);
                    setDoctorResponse('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>🔬 Doctor Review Portal - Verify and approve AI-generated medical responses</p>
        <p>All responses shown are real AI model outputs via HTTP outcalls, not mock data</p>
      </div>
    </div>
  );
};

export default DoctorPortal;