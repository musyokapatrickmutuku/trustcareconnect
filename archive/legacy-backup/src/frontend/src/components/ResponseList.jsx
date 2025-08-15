import React, { useState } from 'react';

function ResponseList({ responses, backend, queryId, currentUserId }) {
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!newResponse.trim() || !backend) return;

    setIsSubmitting(true);
    try {
      await backend.createResponse(
        queryId,
        currentUserId,
        newResponse.trim(),
        'false' // Not AI generated for now
      );
      setNewResponse('');
      // In a real app, you'd refresh the responses here
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="response-list">
      <h4>Responses ({responses.length})</h4>
      
      {responses.map(response => (
        <div key={response.id} className="response-item">
          <div className="response-content">
            {response.content}
          </div>
          <div className="response-meta">
            <span className="response-date">{response.createdAt}</span>
            {response.isAIGenerated === 'true' && (
              <span className="ai-badge">AI Generated</span>
            )}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmitResponse} className="response-form">
        <div className="form-group">
          <label htmlFor="response">Add Response:</label>
          <textarea
            id="response"
            value={newResponse}
            onChange={(e) => setNewResponse(e.target.value)}
            placeholder="Share your thoughts or advice..."
            rows="3"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-btn small"
        >
          {isSubmitting ? 'Submitting...' : 'Add Response'}
        </button>
      </form>
    </div>
  );
}

export default ResponseList;