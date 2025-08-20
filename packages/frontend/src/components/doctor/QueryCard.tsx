// Query Card Component for Doctor Dashboard
import React, { useState } from 'react';
import { MedicalQuery, Doctor } from '../../types';
import Button from '../common/Button';
import FormField from '../common/FormField';
import ClinicalResponseDisplay from './ClinicalResponseDisplay';
import { formatQueryStatus, formatTimestamp } from '../../utils/formatters';
import { UI_MESSAGES } from '../../constants';
import icpService from '../../services/icpService';

interface QueryCardProps {
  query: MedicalQuery;
  currentDoctor: Doctor;
  onUpdate: () => void;
  showMessage: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  patientName?: string;
}

const QueryCard: React.FC<QueryCardProps> = ({
  query,
  currentDoctor,
  onUpdate,
  showMessage,
  loading,
  setLoading,
  patientName
}) => {
  const [responseForm, setResponseForm] = useState({ response: '' });
  const [showResponse, setShowResponse] = useState(false);

  const status = formatQueryStatus(query.status);

  const handleTakeQuery = async () => {
    setLoading(true);
    try {
      const result = await icpService.takeQuery(query.id, currentDoctor.id);
      if (result.success) {
        showMessage(UI_MESSAGES.SUCCESS.QUERY_TAKEN, 'success');
        onUpdate();
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showMessage('Failed to take query. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseForm.response.trim()) return;
    
    setLoading(true);
    try {
      const result = await icpService.respondToQuery(
        query.id,
        currentDoctor.id,
        responseForm.response
      );
      
      if (result.success) {
        showMessage(UI_MESSAGES.SUCCESS.RESPONSE_SUBMITTED, 'success');
        setResponseForm({ response: '' });
        setShowResponse(false);
        onUpdate();
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      showMessage('Failed to submit response. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const useAIDraft = () => {
    if (query.aiDraftResponse) {
      setResponseForm({ response: query.aiDraftResponse });
      setShowResponse(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(status)}`}>
      {/* Query Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{query.title}</h4>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span>Patient: <span className="font-medium text-gray-900">{patientName || query.patientId}</span></span>
            <span>Created: {formatTimestamp(query.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
            {status}
          </span>
          {status === 'Pending' && (
            <Button
              size="small"
              onClick={handleTakeQuery}
              disabled={loading}
            >
              Start Review
            </Button>
          )}
        </div>
      </div>

      {/* Patient Input & AI Response Side-by-Side */}
      <div className="mb-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Patient Query Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <h5 className="font-medium text-gray-900">Patient Query</h5>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 text-sm leading-relaxed">{query.description}</p>
            </div>
          </div>
          
          {/* Clinical Decision Support Response */}
          {query.aiDraftResponse && (
            <div className="space-y-3">
              <ClinicalResponseDisplay
                rawResponse={query.aiDraftResponse}
                patientId={query.patientId}
                queryId={query.id}
                onEditResponse={(editedResponse) => {
                  setResponseForm({ response: editedResponse });
                  setShowResponse(true);
                }}
                onApproveResponse={() => {
                  if (query.aiDraftResponse) {
                    setResponseForm({ response: query.aiDraftResponse });
                    setShowResponse(true);
                  }
                }}
                onOrderAction={(action) => {
                  console.log(`Clinical action ordered: ${action} for patient ${query.patientId}`);
                  showMessage(`Action "${action}" has been noted in the clinical workflow`, 'info');
                }}
              />
              {status === 'Pending' && (
                <div className="text-xs text-blue-600 italic bg-blue-50 p-2 rounded border">
                  💡 Click "Start Review" above to begin working with this clinical decision support
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Section for Under Review Queries */}
      {status === 'Under Review' && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✏️</span>
            <h5 className="font-medium text-green-800">Doctor's Response Editor</h5>
          </div>
          
          {!showResponse && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-green-800 text-sm font-medium">Ready to respond to this patient query?</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowResponse(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✏️ Write Response
                </Button>
                {query.aiDraftResponse && (
                  <Button
                    variant="secondary"
                    onClick={useAIDraft}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    📝 Use Clinical Draft
                  </Button>
                )}
              </div>
            </div>
          )}

          {showResponse && (
            <div className="bg-white border-2 border-green-200 rounded-lg p-4">
              <form onSubmit={handleRespondToQuery} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-green-700 font-medium">
                    {responseForm.response ? '✨ Editing your response...' : '📝 Compose your medical response'}
                  </p>
                  <span className="text-xs text-gray-500">
                    {responseForm.response.length}/2000 characters
                  </span>
                </div>
                <FormField
                  label="Your Professional Medical Response"
                  type="textarea"
                  name="response"
                  value={responseForm.response}
                  onChange={(e) => setResponseForm({ response: e.target.value })}
                  placeholder="Provide your professional medical response to this patient query. Review and modify the AI draft as needed to ensure accuracy and personalization..."
                  rows={6}
                  maxLength={2000}
                  required
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || !responseForm.response.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? '📤 Submitting...' : '📤 Submit Response to Patient'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowResponse(false);
                      setResponseForm({ response: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {query.aiDraftResponse && !responseForm.response && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border">
                    💡 <strong>Tip:</strong> Click "Edit AI Draft" above to start with the AI-generated response, then modify it as needed.
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* Final Response for Completed Queries */}
      {query.response && status === 'Completed' && (
        <div className="mt-4 bg-white/70 border border-green-200 rounded p-3">
          <h5 className="font-medium text-green-800 mb-2">✅ Your Final Response:</h5>
          <p className="text-green-700 bg-white p-3 rounded border text-sm">
            {query.response}
          </p>
        </div>
      )}
    </div>
  );
};

export default QueryCard;