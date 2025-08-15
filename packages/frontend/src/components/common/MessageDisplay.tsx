// Message Display Component
import React from 'react';

interface MessageDisplayProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ 
  message, 
  type = 'info', 
  onClose,
  autoHide = true,
  duration = 3000
}) => {
  React.useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, onClose, duration]);

  if (!message) return null;

  const typeClasses = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };

  const iconClasses = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div 
      className={`border px-4 py-3 rounded mb-4 relative ${typeClasses[type]}`}
      role="alert"
    >
      <div className="flex items-center">
        <span className="mr-2 font-bold">{iconClasses[type]}</span>
        <span className="flex-1">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-lg font-semibold hover:opacity-75"
            aria-label="Close message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageDisplay;