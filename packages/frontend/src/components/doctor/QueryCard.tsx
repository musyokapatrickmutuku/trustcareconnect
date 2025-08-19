// Query Card Component for Doctor Dashboard
import React, { useState } from 'react';
import { MedicalQuery, Doctor } from '../../types';
import Button from '../common/Button';
import FormField from '../common/FormField';
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
}

const QueryCard: React.FC<QueryCardProps> = ({
  query,
  currentDoctor,
  onUpdate,
  showMessage,
  loading,
  setLoading
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
            <span>Patient ID: <span className="font-mono">{query.patientId}</span></span>
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

      {/* Query Description */}
      <div className="mb-4">
        <p className="text-gray-700 bg-white/50 p-3 rounded border">
          {query.description}
        </p>
      </div>

      {/* AI Draft Response */}
      {query.aiDraftResponse && status === 'Under Review' && (
        <div className="mb-4 bg-white/70 border rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-medium text-blue-800">🤖 AI-Generated Draft Response:</h5>
            <Button
              size="small"
              variant="secondary"
              onClick={useAIDraft}
            >
              Use Draft
            </Button>
          </div>
          <div className="bg-white p-3 rounded border text-gray-700 text-sm">
            {query.aiDraftResponse}
          </div>
        </div>
      )}

      {/* Response Section for Under Review Queries */}
      {status === 'Under Review' && (
        <div className="mt-4">
          {!showResponse && (
            <div className="flex gap-2">
              <Button
                size="small"
                onClick={() => setShowResponse(true)}
              >
                Write Response
              </Button>
              {query.aiDraftResponse && (
                <Button
                  size="small"
                  variant="secondary"
                  onClick={useAIDraft}
                >
                  Edit AI Draft
                </Button>
              )}
            </div>
          )}

          {showResponse && (
            <form onSubmit={handleRespondToQuery} className="space-y-3">
              <FormField
                label="Your Medical Response"
                type="textarea"
                name="response"
                value={responseForm.response}
                onChange={(e) => setResponseForm({ response: e.target.value })}
                placeholder="Provide your professional medical response to this patient query..."
                rows={4}
                required
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || !responseForm.response.trim()}
                  size="small"
                >
                  {loading ? 'Submitting...' : 'Submit Response'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setShowResponse(false);
                    setResponseForm({ response: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
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