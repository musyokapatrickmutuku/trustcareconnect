import React, { useState, useEffect } from 'react';
import icpApiService from '../services/api';

const ConnectionStatus: React.FC = () => {
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    const updateConnectionInfo = () => {
      const info = icpApiService.getConnectionInfo();
      setConnectionInfo(info);
    };

    // Update immediately
    updateConnectionInfo();

    // Update every 5 seconds
    const interval = setInterval(updateConnectionInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!connectionInfo) return null;

  const getStatusColor = () => {
    switch (connectionInfo.status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'fallback': return 'text-yellow-600 bg-yellow-50';
      case 'connecting': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (connectionInfo.status) {
      case 'connected': return '🟢';
      case 'fallback': return '🟡';
      case 'connecting': return '🔄';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusMessage = () => {
    switch (connectionInfo.status) {
      case 'connected': return 'Connected to ICP Network';
      case 'fallback': return 'Running in Demo Mode (Mock Data)';
      case 'connecting': return 'Connecting to ICP Network...';
      case 'error': return 'Connection Failed';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor()} border shadow-lg z-50`}>
      <div className="flex items-center space-x-2">
        <span>{getStatusIcon()}</span>
        <span>{getStatusMessage()}</span>
        {connectionInfo.status === 'fallback' && (
          <span className="text-xs opacity-75">(Mock Data)</span>
        )}
      </div>
      {connectionInfo.status === 'error' && connectionInfo.retryCount > 0 && (
        <div className="text-xs mt-1 opacity-75">
          Retry {connectionInfo.retryCount}/3
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;