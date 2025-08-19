// React Error Boundary for TrustCareConnect
// Catches JavaScript errors in component tree and logs them

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorBoundary } from '../utils/logger';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to our logging system
    logErrorBoundary(error, { componentStack: errorInfo.componentStack || '' });
    
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI or default error message
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-container">
            <h2 className="error-title">
              Oops! Something went wrong
            </h2>
            <p className="error-message">
              We're sorry for the inconvenience. Our team has been notified of this issue.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error?.toString()}</pre>
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error?.stack}</pre>
                </div>
              </details>
            )}
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="error-button primary"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.history.back()}
                className="error-button secondary"
              >
                Go Back
              </button>
            </div>
          </div>
          
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;