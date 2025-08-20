import { MedicalQuery, SystemStats } from '../types';

export type WebSocketEvent = 
  | 'query_created'
  | 'query_updated' 
  | 'query_assigned'
  | 'response_received'
  | 'doctor_online'
  | 'doctor_offline'
  | 'system_stats_updated'
  | 'notification'
  | 'connection_status';

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: any;
  timestamp: number;
  userId?: string;
  userType?: 'patient' | 'doctor';
}

export interface QueryUpdateData {
  queryId: string;
  query: Partial<MedicalQuery>;
  previousStatus?: string;
  newStatus: string;
  doctorName?: string;
  patientName?: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high';
  targetUser?: string;
  targetUserType?: 'patient' | 'doctor';
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  lastConnected: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private listeners: Map<WebSocketEvent, Set<Function>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private currentUser: { id: string; type: 'patient' | 'doctor' } | null = null;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    reconnecting: false,
    lastConnected: null,
    connectionQuality: 'disconnected'
  };

  constructor() {
    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:8080';
    this.url = `${protocol}//${host}/ws`;

    // Initialize event listeners map
    const events: WebSocketEvent[] = [
      'query_created', 'query_updated', 'query_assigned', 'response_received',
      'doctor_online', 'doctor_offline', 'system_stats_updated', 'notification', 'connection_status'
    ];
    
    events.forEach(event => {
      this.listeners.set(event, new Set());
    });

    // Monitor connection quality
    this.startConnectionMonitoring();
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, userType: 'patient' | 'doctor'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentUser = { id: userId, type: userType };
        
        // Close existing connection
        if (this.ws) {
          this.disconnect();
        }

        this.ws = new WebSocket(`${this.url}?userId=${userId}&userType=${userType}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.connectionStatus.connected = true;
          this.connectionStatus.reconnecting = false;
          this.connectionStatus.lastConnected = new Date();
          this.connectionStatus.connectionQuality = 'good';
          
          this.startHeartbeat();
          this.processMessageQueue();
          this.emit('connection_status', this.connectionStatus);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.connectionStatus.connected = false;
          this.stopHeartbeat();
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          } else {
            this.connectionStatus.connectionQuality = 'disconnected';
            this.emit('connection_status', this.connectionStatus);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus.connectionQuality = 'poor';
          this.emit('connection_status', this.connectionStatus);
          
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.connectionStatus.connected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.stopHeartbeat();
    this.stopConnectionMonitoring();
    this.connectionStatus.connected = false;
    this.connectionStatus.connectionQuality = 'disconnected';
    this.emit('connection_status', this.connectionStatus);
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: WebSocketEvent, callback: Function): () => void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Remove event listener
   */
  off(event: WebSocketEvent, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /**
   * Send message to server
   */
  send(event: WebSocketEvent, data: any): boolean {
    const message: WebSocketMessage = {
      event,
      data,
      timestamp: Date.now(),
      userId: this.currentUser?.id,
      userType: this.currentUser?.type
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.queueMessage(message);
        return false;
      }
    } else {
      // Queue message for later sending
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to query updates for a specific query
   */
  subscribeToQuery(queryId: string): void {
    this.send('query_subscribe', { queryId });
  }

  /**
   * Unsubscribe from query updates
   */
  unsubscribeFromQuery(queryId: string): void {
    this.send('query_unsubscribe', { queryId });
  }

  /**
   * Subscribe to system statistics updates
   */
  subscribeToSystemStats(): void {
    this.send('system_stats_subscribe', {});
  }

  /**
   * Mark user as online/active
   */
  setUserStatus(status: 'online' | 'away' | 'busy'): void {
    this.send('user_status', { status });
  }

  /**
   * Send typing indicator for query responses
   */
  sendTypingIndicator(queryId: string, isTyping: boolean): void {
    this.send('typing_indicator', { queryId, isTyping });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Update connection quality based on message latency
      if (message.timestamp) {
        const latency = Date.now() - message.timestamp;
        this.connectionStatus.latency = latency;
        this.connectionStatus.connectionQuality = 
          latency < 100 ? 'excellent' :
          latency < 300 ? 'good' :
          latency < 1000 ? 'poor' : 'disconnected';
      }

      // Emit event to listeners
      this.emit(message.event, message.data, message);
      
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private emit(event: WebSocketEvent, data: any, originalMessage?: WebSocketMessage): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data, originalMessage);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${event}:`, error);
        }
      });
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionStatus.reconnecting = false;
      this.connectionStatus.connectionQuality = 'disconnected';
      this.emit('connection_status', this.connectionStatus);
      return;
    }

    this.reconnectAttempts++;
    this.connectionStatus.reconnecting = true;
    this.emit('connection_status', this.connectionStatus);

    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.currentUser) {
        this.connect(this.currentUser.id, this.currentUser.type)
          .catch(error => {
            console.error('Reconnection failed:', error);
          });
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startConnectionMonitoring(): void {
    this.connectionCheckInterval = setInterval(() => {
      if (this.ws) {
        if (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED) {
          this.connectionStatus.connected = false;
          this.connectionStatus.connectionQuality = 'disconnected';
          this.emit('connection_status', this.connectionStatus);
        }
      }
    }, 5000);
  }

  private stopConnectionMonitoring(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error processing queued message:', error);
          // Re-queue message if sending fails
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;

// Convenience hooks and utilities
export const useWebSocket = (userId: string, userType: 'patient' | 'doctor') => {
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(
    webSocketService.getConnectionStatus()
  );

  React.useEffect(() => {
    const unsubscribe = webSocketService.on('connection_status', (status: ConnectionStatus) => {
      setConnectionStatus(status);
    });

    // Connect on mount
    webSocketService.connect(userId, userType)
      .catch(error => {
        console.error('WebSocket connection failed:', error);
      });

    return () => {
      unsubscribe();
      webSocketService.disconnect();
    };
  }, [userId, userType]);

  return {
    isConnected: connectionStatus.connected,
    connectionStatus,
    subscribe: webSocketService.on.bind(webSocketService),
    send: webSocketService.send.bind(webSocketService),
    subscribeToQuery: webSocketService.subscribeToQuery.bind(webSocketService),
    unsubscribeFromQuery: webSocketService.unsubscribeFromQuery.bind(webSocketService),
    subscribeToSystemStats: webSocketService.subscribeToSystemStats.bind(webSocketService),
    setUserStatus: webSocketService.setUserStatus.bind(webSocketService),
    sendTypingIndicator: webSocketService.sendTypingIndicator.bind(webSocketService)
  };
};

// React import for hooks (this will be at the top in a real implementation)
import React from 'react';