import React, { useState, useEffect, useCallback } from 'react';
import { ErrorDetails } from '../utils/errorHandler';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface FeedbackProps {
  message: FeedbackMessage;
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}

interface FeedbackSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxMessages?: number;
}

// Individual Feedback Message Component
const FeedbackItem: React.FC<FeedbackProps> = ({ 
  message, 
  onDismiss,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!message.persistent && message.duration !== 0) {
      const duration = message.duration || getDefaultDuration(message.type);
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDismiss = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(message.id);
    }, 300); // Wait for exit animation
  }, [message.id, onDismiss]);

  const getDefaultDuration = (type: FeedbackType): number => {
    switch (type) {
      case 'success': return 4000;
      case 'info': return 5000;
      case 'warning': return 6000;
      case 'error': return 8000;
      default: return 5000;
    }
  };

  const getIcon = (type: FeedbackType): string => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getColorClasses = (type: FeedbackType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getProgressColor = (type: FeedbackType): string => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      className={`
        relative max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 
          position === 'top' ? '-translate-y-2 opacity-0' : 'translate-y-2 opacity-0'}
        ${getColorClasses(message.type)}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-lg">{getIcon(message.type)}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            {message.title && (
              <p className="text-sm font-medium">{message.title}</p>
            )}
            <p className={`text-sm ${message.title ? 'mt-1' : ''}`}>
              {message.message}
            </p>
            
            {message.actions && message.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {message.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`
                      text-xs font-medium px-2 py-1 rounded
                      ${action.variant === 'primary' 
                        ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                        : 'hover:bg-white hover:bg-opacity-10'
                      }
                      transition-colors duration-200
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {!message.persistent && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleDismiss}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar for timed messages */}
      {!message.persistent && message.duration !== 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
          <div
            className={`h-full ${getProgressColor(message.type)} transition-all ease-linear`}
            style={{
              animation: `shrink ${message.duration || getDefaultDuration(message.type)}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Feedback System Component
export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({ 
  position = 'top-right',
  maxMessages = 5
}) => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const addMessage = useCallback((message: Omit<FeedbackMessage, 'id'>) => {
    const newMessage: FeedbackMessage = {
      ...message,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setMessages(prev => {
      const updated = [newMessage, ...prev];
      return updated.slice(0, maxMessages);
    });

    return newMessage.id;
  }, [maxMessages]);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  // Expose methods globally for easy access
  useEffect(() => {
    (window as any).feedbackSystem = {
      success: (message: string, options?: Partial<FeedbackMessage>) => 
        addMessage({ type: 'success', message, ...options }),
      error: (message: string, options?: Partial<FeedbackMessage>) => 
        addMessage({ type: 'error', message, ...options }),
      warning: (message: string, options?: Partial<FeedbackMessage>) => 
        addMessage({ type: 'warning', message, ...options }),
      info: (message: string, options?: Partial<FeedbackMessage>) => 
        addMessage({ type: 'info', message, ...options }),
      clear: clearAll
    };

    return () => {
      delete (window as any).feedbackSystem;
    };
  }, [addMessage, clearAll]);

  const getPositionClasses = (): string => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (messages.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      <div className={`fixed z-50 ${getPositionClasses()}`}>
        <div className="flex flex-col space-y-3">
          {messages.map((message) => (
            <FeedbackItem
              key={message.id}
              message={message}
              onDismiss={removeMessage}
              position={position.includes('top') ? 'top' : 'bottom'}
            />
          ))}
        </div>
      </div>
    </>
  );
};

// Hook for using the feedback system
export const useFeedback = () => {
  const showMessage = useCallback((message: string, type: FeedbackType = 'info', options?: Partial<FeedbackMessage>) => {
    const feedbackSystem = (window as any).feedbackSystem;
    if (feedbackSystem && feedbackSystem[type]) {
      return feedbackSystem[type](message, options);
    }
  }, []);

  const showSuccess = useCallback((message: string, options?: Partial<FeedbackMessage>) => 
    showMessage(message, 'success', options), [showMessage]);

  const showError = useCallback((message: string | ErrorDetails, options?: Partial<FeedbackMessage>) => {
    const errorMessage = typeof message === 'string' ? message : message.message;
    const errorOptions = typeof message === 'object' ? 
      { ...options, title: 'Error', persistent: message.code === 'NETWORK_ERROR' } : 
      options;
    
    return showMessage(errorMessage, 'error', errorOptions);
  }, [showMessage]);

  const showWarning = useCallback((message: string, options?: Partial<FeedbackMessage>) => 
    showMessage(message, 'warning', options), [showMessage]);

  const showInfo = useCallback((message: string, options?: Partial<FeedbackMessage>) => 
    showMessage(message, 'info', options), [showMessage]);

  const clearAll = useCallback(() => {
    const feedbackSystem = (window as any).feedbackSystem;
    if (feedbackSystem && feedbackSystem.clear) {
      feedbackSystem.clear();
    }
  }, []);

  return {
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };
};

// Simple inline feedback components
export const SuccessMessage: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex items-center p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg ${className}`}>
    <span className="mr-2">✅</span>
    {children}
  </div>
);

export const ErrorMessage: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg ${className}`}>
    <span className="mr-2">❌</span>
    {children}
  </div>
);

export const WarningMessage: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex items-center p-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
    <span className="mr-2">⚠️</span>
    {children}
  </div>
);

export const InfoMessage: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex items-center p-3 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
    <span className="mr-2">ℹ️</span>
    {children}
  </div>
);

export default FeedbackSystem;