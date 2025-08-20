// React Error Boundary for TrustCareConnect
// Catches JavaScript errors in component tree and logs them

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './common/Button';
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
    
    // Log error details for debugging
    if (process.env.NODE_ENV === 'production') {
      // In production, you would send this to your error tracking service
      console.error('Production error logged:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
    
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
              <Button 
                onClick={() => window.location.reload()}
                variant="primary"
                className="mr-3"
              >
                Reload Page
              </Button>
              <Button 
                onClick={() => window.history.back()}
                variant="secondary"
              >
                Go Back
              </Button>
            </div>
          </div>
          
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;