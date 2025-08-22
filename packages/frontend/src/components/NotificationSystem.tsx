import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    type?: 'primary' | 'secondary';
  }>;
  persistent?: boolean;
  createdAt: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showMessage: (message: string, type?: NotificationType, options?: {
    title?: string;
    duration?: number;
    persistent?: boolean;
    actions?: Notification['actions'];
  }) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? (notification.persistent ? 0 : 5000)
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    // Auto-remove notification if it has a duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showMessage = useCallback((
    message: string,
    type: NotificationType = 'info',
    options: {
      title?: string;
      duration?: number;
      persistent?: boolean;
      actions?: Notification['actions'];
    } = {}
  ) => {
    return addNotification({
      type,
      title: options.title || getDefaultTitle(type),
      message,
      duration: options.duration,
      persistent: options.persistent,
      actions: options.actions
    });
  }, [addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showMessage
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const getDefaultTitle = (type: NotificationType): string => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Information';
  }
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timeout = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timeout);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const getNotificationStyles = (type: NotificationType) => {
    const baseStyles = "border-l-4";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500 bg-green-50 text-green-800`;
      case 'error':
        return `${baseStyles} border-red-500 bg-red-50 text-red-800`;
      case 'warning':
        return `${baseStyles} border-yellow-500 bg-yellow-50 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} border-blue-500 bg-blue-50 text-blue-800`;
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out shadow-lg rounded-lg p-4 
        ${getNotificationStyles(notification.type)}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'scale-95' : 'scale-100'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{notification.title}</h4>
              <p className="text-sm mt-1 leading-5">{notification.message}</p>
            </div>
            
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    if (!notification.persistent) {
                      handleClose();
                    }
                  }}
                  className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                    action.type === 'primary'
                      ? `${notification.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                          notification.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                          notification.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                          'bg-blue-600 hover:bg-blue-700'} text-white`
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar for timed notifications */}
      {notification.duration && notification.duration > 0 && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{
              width: '100%',
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Hook for query-specific notifications
export const useQueryNotifications = () => {
  const { showMessage } = useNotifications();
  
  return {
    notifyQuerySubmitted: (queryTitle: string) => {
      return showMessage(
        `Your query "${queryTitle}" has been submitted successfully and is being processed by our AI system.`,
        'success',
        { title: 'Query Submitted', duration: 4000 }
      );
    },
    
    notifyQueryAssigned: (queryTitle: string, doctorName: string) => {
      return showMessage(
        `Your query "${queryTitle}" has been assigned to Dr. ${doctorName} for review.`,
        'info',
        { title: 'Query Assigned', duration: 5000 }
      );
    },
    
    notifyResponseReceived: (queryTitle: string, actions?: Notification['actions']) => {
      return showMessage(
        `You have received a response to your query "${queryTitle}".`,
        'success',
        { 
          title: 'New Response', 
          duration: 0, 
          persistent: true,
          actions: actions || [
            { label: 'View Response', action: () => {}, type: 'primary' }
          ]
        }
      );
    },
    
    notifyQueryError: (message: string) => {
      return showMessage(
        message,
        'error',
        { title: 'Query Error', duration: 6000 }
      );
    },
    
    notifySystemMessage: (message: string, type: NotificationType = 'info') => {
      return showMessage(message, type, { title: 'System Notification', duration: 5000 });
    }
  };
};

// Component to show notification stats/management
export const NotificationStats: React.FC = () => {
  const { notifications, clearAll } = useNotifications();
  
  const stats = notifications.reduce((acc, notification) => {
    acc[notification.type] = (acc[notification.type] || 0) + 1;
    return acc;
  }, {} as Record<NotificationType, number>);
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <button
          onClick={clearAll}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Clear All ({notifications.length})
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {Object.entries(stats).map(([type, count]) => (
          <div key={type} className="text-center">
            <div className={`text-lg font-bold ${
              type === 'success' ? 'text-green-600' :
              type === 'error' ? 'text-red-600' :
              type === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`}>
              {count}
            </div>
            <div className="text-gray-600 capitalize">{type}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationProvider;