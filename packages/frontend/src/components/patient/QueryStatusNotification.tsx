// Query Status Notification Component - Patient Query Confirmation Messages
import React, { useState, useEffect } from 'react';
import { MedicalQuery, QueryStatus } from '../../types';

interface QueryStatusNotificationProps {
  queries: MedicalQuery[];
  onDismiss?: (queryId: string, type: 'pending' | 'completed') => void;
  showMessage?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const QueryStatusNotification: React.FC<QueryStatusNotificationProps> = ({
  queries,
  onDismiss,
  showMessage
}) => {
  const [dismissedPending, setDismissedPending] = useState<Set<string>>(new Set());
  const [dismissedCompleted, setDismissedCompleted] = useState<Set<string>>(new Set());
  const [newlyCompleted, setNewlyCompleted] = useState<Set<string>>(new Set());

  // Track newly completed queries
  useEffect(() => {
    const completedIds = queries
      .filter(q => q.status === 'completed' && q.response)
      .map(q => q.id);
    
    const previouslyCompleted = Array.from(newlyCompleted);
    const newCompletions = completedIds.filter(id => !previouslyCompleted.includes(id));
    
    if (newCompletions.length > 0) {
      const newSet = new Set([...newlyCompleted, ...newCompletions]);
      setNewlyCompleted(newSet);
      
      // Show success message for newly completed queries
      newCompletions.forEach(queryId => {
        const query = queries.find(q => q.id === queryId);
        if (query) {
          showMessage?.(`✅ Your doctor has responded to "${query.title}"! View the response in your query history.`, 'success');
        }
      });
    }
  }, [queries, newlyCompleted, showMessage]);

  const handleDismiss = (queryId: string, type: 'pending' | 'completed') => {
    if (type === 'pending') {
      setDismissedPending(prev => new Set(prev).add(queryId));
    } else {
      setDismissedCompleted(prev => new Set(prev).add(queryId));
    }
    onDismiss?.(queryId, type);
  };

  const pendingQueries = queries.filter(q => 
    (q.status === 'pending' || q.status === 'in_review') && 
    !dismissedPending.has(q.id)
  );

  const completedQueries = queries.filter(q => 
    q.status === 'completed' && 
    q.response && 
    newlyCompleted.has(q.id) && 
    !dismissedCompleted.has(q.id)
  );

  if (pendingQueries.length === 0 && completedQueries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Pending Query Notifications */}
      {pendingQueries.map(query => (
        <div key={`pending-${query.id}`} className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">
                  Query in Progress: "{query.title}"
                </h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    ✅ <strong>Submitted successfully!</strong> Your query has been processed by our AI system and sent to your doctor.
                  </p>
                  <p>
                    {query.status === 'pending' 
                      ? '⏳ Awaiting doctor review - typically responds within 2-4 hours'
                      : '👨‍⚕️ Currently under doctor review - response expected within 1-2 hours'
                    }
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-blue-600 mt-2">
                    <span>📅 Submitted: {new Date(Number(query.createdAt) / 1000000).toLocaleString()}</span>
                    <span>🔔 You'll be notified when your doctor responds</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(query.id, 'pending')}
              className="flex-shrink-0 text-blue-400 hover:text-blue-600 text-lg leading-none"
              title="Dismiss this notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {/* Completed Query Notifications */}
      {completedQueries.map(query => (
        <div key={`completed-${query.id}`} className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <span className="text-green-500 text-lg">✅</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-800 mb-1">
                  Response Ready: "{query.title}"
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    🎉 <strong>Great news!</strong> Your doctor has reviewed and approved a response to your query.
                  </p>
                  <p>
                    📋 The response has been verified by your healthcare provider and is ready to view in your query history.
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-green-600 mt-2">
                    <span>📅 Responded: {new Date(Number(query.updatedAt) / 1000000).toLocaleString()}</span>
                    <span>👨‍⚕️ Verified and approved by your doctor</span>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      // Scroll to or highlight the completed query
                      const element = document.getElementById(`query-${query.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-2', 'ring-green-300', 'ring-opacity-75');
                        setTimeout(() => {
                          element.classList.remove('ring-2', 'ring-green-300', 'ring-opacity-75');
                        }, 3000);
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                  >
                    📖 View Response
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(query.id, 'completed')}
              className="flex-shrink-0 text-green-400 hover:text-green-600 text-lg leading-none"
              title="Dismiss this notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueryStatusNotification;