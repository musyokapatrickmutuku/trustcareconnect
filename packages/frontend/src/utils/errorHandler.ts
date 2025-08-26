export interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp: string;
}

export interface APIError {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

export interface NetworkError extends Error {
  isNetworkError: boolean;
  status?: number;
  statusText?: string;
}

export interface HttpError extends Error {
  response?: {
    status: number;
    data?: APIError;
    statusText?: string;
  };
  request?: any;
  isHttpError?: boolean;
}

/**
 * Central error handler for the application
 */
export class ErrorHandler {
  /**
   * Handle API errors and return user-friendly messages
   */
  static handleAPIError(error: any): ErrorDetails {
    const timestamp = new Date().toISOString();
    
    // Handle HTTP errors (fetch API or custom)
    if (this.isHttpError(error)) {
      const httpError = error as HttpError;
      
      if (httpError.response) {
        // Server responded with error status
        const { status, data } = httpError.response;
        
        return {
          message: this.getStatusMessage(status, data?.error),
          code: data?.code || `HTTP_${status}`,
          status,
          details: data?.details,
          timestamp
        };
      } else if (httpError.request) {
        // Request made but no response received
        return {
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          code: 'NETWORK_ERROR',
          timestamp
        };
      }
    }

    // Handle custom API errors
    if (this.isAPIError(error)) {
      return {
        message: error.error || 'An unexpected error occurred',
        code: error.code || 'API_ERROR',
        details: error.details,
        timestamp
      };
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return {
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: error.status,
        timestamp
      };
    }

    // Handle generic errors
    if (error instanceof Error) {
      return {
        message: this.getGenericErrorMessage(error.message),
        code: 'GENERIC_ERROR',
        details: error.stack,
        timestamp
      };
    }

    // Handle unknown errors
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      details: error,
      timestamp
    };
  }

  /**
   * Get user-friendly message for HTTP status codes
   */
  private static getStatusMessage(status: number, serverMessage?: string): string {
    // Use server message if it's user-friendly
    if (serverMessage && this.isUserFriendlyMessage(serverMessage)) {
      return serverMessage;
    }

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in to continue.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict with existing data. Please refresh and try again.';
      case 422:
        return 'Invalid data provided. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified and is working on a fix.';
      case 502:
        return 'Service temporarily unavailable. Please try again in a few minutes.';
      case 503:
        return 'Service maintenance in progress. Please try again later.';
      case 504:
        return 'Request timeout. The server took too long to respond.';
      default:
        return serverMessage || `Server error (${status}). Please try again.`;
    }
  }

  /**
   * Get user-friendly message for generic errors
   */
  private static getGenericErrorMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (lowerMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
      return 'Authentication required. Please log in to continue.';
    }
    
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('access denied')) {
      return 'Access denied. You don\'t have permission to perform this action.';
    }
    
    // Return generic message for technical errors
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if message is user-friendly (doesn't contain technical jargon)
   */
  private static isUserFriendlyMessage(message: string): boolean {
    const technicalTerms = [
      'null', 'undefined', 'exception', 'stack trace',
      'internal server error', 'sql', 'database', 'query',
      'mongodb', 'connection refused', 'timeout expired',
      'syntax error', 'runtime error'
    ];
    
    const lowerMessage = message.toLowerCase();
    return !technicalTerms.some(term => lowerMessage.includes(term));
  }

  /**
   * Type guards
   */
  private static isHttpError(error: any): error is HttpError {
    return error && (error.isHttpError === true || (error.response && error.request));
  }

  private static isAPIError(error: any): error is APIError {
    return error && typeof error === 'object' && 
           error.success === false && 
           typeof error.error === 'string';
  }

  private static isNetworkError(error: any): error is NetworkError {
    return error && error.isNetworkError === true;
  }

  /**
   * Log error to console with context
   */
  static logError(error: ErrorDetails, context?: any): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error: ${error.message}`);
      console.error('Error Details:', logData);
      console.groupEnd();
    } else {
      // In production, send to error tracking service
      console.error('Error logged:', logData);
      // TODO: Send to Sentry, LogRocket, or other error tracking service
    }
  }

  private static getCurrentUserId(): string | null {
    // Get current user ID from your auth system
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }
}

/**
 * React hook for error handling
 */
export const useErrorHandler = () => {
  const handleError = (error: any, context?: any) => {
    const errorDetails = ErrorHandler.handleAPIError(error);
    ErrorHandler.logError(errorDetails, context);
    return errorDetails;
  };

  return { handleError };
};

/**
 * Utility functions
 */
export const errorUtils = {
  /**
   * Create a network error
   */
  createNetworkError: (message: string, status?: number): NetworkError => {
    const error = new Error(message) as NetworkError;
    error.isNetworkError = true;
    error.status = status;
    return error;
  },

  /**
   * Create an API error
   */
  createAPIError: (message: string, code?: string, details?: any): APIError => ({
    success: false,
    error: message,
    code,
    details
  }),

  /**
   * Check if error is retryable
   */
  isRetryable: (error: ErrorDetails): boolean => {
    const retryableCodes = ['NETWORK_ERROR', 'HTTP_429', 'HTTP_502', 'HTTP_503', 'HTTP_504'];
    return retryableCodes.includes(error.code || '');
  },

  /**
   * Get retry delay based on error type
   */
  getRetryDelay: (error: ErrorDetails, attemptNumber: number): number => {
    if (error.code === 'HTTP_429') {
      // Rate limited - longer delay
      return Math.min(1000 * Math.pow(2, attemptNumber), 30000);
    }
    
    if (error.code === 'NETWORK_ERROR') {
      // Network error - exponential backoff
      return Math.min(500 * Math.pow(2, attemptNumber), 10000);
    }
    
    // Default exponential backoff
    return Math.min(1000 * attemptNumber, 5000);
  }
};

export default ErrorHandler;