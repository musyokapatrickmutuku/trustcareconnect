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

const PatientPortal: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('P001');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [newQuery, setNewQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const actor = createActor(process.env.REACT_APP_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai');

  useEffect(() => {
    loadPatients();
    loadQueries();
  }, [selectedPatientId]);

  const loadPatients = async () => {
    try {
      const allPatients = await actor.getAllPatients();
      setPatients(allPatients);
    } catch (error) {
      setMessage(`Failed to load patients: ${error}`);
    }
  };

  const loadQueries = async () => {
    if (!selectedPatientId) return;
    try {
      const patientQueries = await actor.getPatientQueries(selectedPatientId);
      setQueries(patientQueries);
    } catch (error) {
      setMessage(`Failed to load queries: ${error}`);
    }
  };

  const submitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuery.trim() || !selectedPatientId) return;

    setIsLoading(true);
    setMessage('');
    try {
      const queryId = await actor.submitPatientQuery(selectedPatientId, newQuery);
      setMessage(`Query submitted successfully! ID: ${queryId}`);
      setNewQuery('');
      
      // Reload queries after a short delay to see the new query
      setTimeout(() => {
        loadQueries();
      }, 2000);
    } catch (error) {
      setMessage(`Failed to submit query: ${error}`);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'ai_processed': return 'text-orange-600';
      case 'doctor_approved': return 'text-green-600';
      case 'completed': return 'text-gray-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'processing': return 'AI Processing...';
      case 'ai_processed': return 'Awaiting Doctor Review';
      case 'doctor_approved': return 'Doctor Approved';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        🏥 Patient Portal - Healthcare Consultations
      </h1>

      {/* Patient Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Patient</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPatientId === patient.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPatientId(patient.id)}
            >
              <div className="font-medium">{patient.name}</div>
              <div className="text-sm text-gray-600">{patient.condition}</div>
              <div className="text-xs text-gray-500">{patient.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Patient Info */}
      {selectedPatient && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900">Current Patient: {selectedPatient.name}</h3>
          <p className="text-sm text-blue-700">{selectedPatient.condition}</p>
          <p className="text-xs text-blue-600 mt-2">{selectedPatient.email}</p>
        </div>
      )}

      {/* Query Submission Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Submit Medical Query</h2>
        <form onSubmit={submitQuery}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Question or Concern:
            </label>
            <textarea
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="Describe your symptoms, concerns, or questions about your diabetes management..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !selectedPatientId}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !newQuery.trim() || !selectedPatientId}
            className={`px-6 py-2 rounded-md font-medium ${
              isLoading || !newQuery.trim() || !selectedPatientId
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Submitting...' : 'Submit Query for AI Analysis'}
          </button>
        </form>
      </div>

      {/* Status Message */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6">
          {message}
        </div>
      )}

      {/* Query History */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Query History</h2>
        {queries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No queries submitted yet</p>
        ) : (
          <div className="space-y-4">
            {queries.map((query) => (
              <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-900">Query {query.id}</span>
                  <span className={`text-sm font-medium ${getStatusColor(query.status)}`}>
                    {getStatusText(query.status)}
                  </span>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Your Question:</h4>
                  <p className="text-sm text-gray-600 mt-1">{query.queryText}</p>
                </div>

                {query.aiResponse && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700">AI Analysis:</h4>
                    <div className="bg-gray-50 p-3 rounded-md mt-1">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap">{query.aiResponse}</pre>
                    </div>
                  </div>
                )}

                {query.doctorResponse && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-green-700">Doctor's Final Response:</h4>
                    <div className="bg-green-50 p-3 rounded-md mt-1">
                      <p className="text-sm text-green-800">{query.doctorResponse}</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Submitted: {new Date(Number(query.timestamp) / 1000000).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <p>🔬 This is an MVP demonstrating real AI medical consultations via HTTP outcalls</p>
        <p>All AI responses are generated by real language models, not mock data</p>
      </div>
    </div>
  );
};

export default PatientPortal;