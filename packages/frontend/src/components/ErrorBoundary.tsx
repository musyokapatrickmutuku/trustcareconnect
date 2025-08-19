// React Error Boundary for TrustCareConnect
// Catches JavaScript errors in component tree and logs them

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logErrorBoundary } from '../utils/logger';

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
    logErrorBoundary(error, errorInfo);
    
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
          
          <style jsx>{`
            .error-boundary {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 400px;
              padding: 20px;
              background-color: #f8f9fa;
            }
            
            .error-container {
              max-width: 600px;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            
            .error-title {
              color: #dc3545;
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            
            .error-message {
              color: #6c757d;
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 24px;
            }
            
            .error-details {
              text-align: left;
              margin: 20px 0;
              padding: 16px;
              background-color: #f8f9fa;
              border-radius: 4px;
              border: 1px solid #dee2e6;
            }
            
            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: #495057;
              margin-bottom: 12px;
            }
            
            .error-stack {
              margin-top: 12px;
            }
            
            .error-stack h4 {
              color: #495057;
              font-size: 14px;
              font-weight: 600;
              margin: 12px 0 8px 0;
            }
            
            .error-stack pre {
              background-color: #343a40;
              color: #f8f9fa;
              padding: 12px;
              border-radius: 4px;
              font-size: 12px;
              line-height: 1.4;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            
            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 24px;
            }
            
            .error-button {
              padding: 12px 24px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            
            .error-button.primary {
              background-color: #007bff;
              color: white;
            }
            
            .error-button.primary:hover {
              background-color: #0056b3;
            }
            
            .error-button.secondary {
              background-color: #6c757d;
              color: white;
            }
            
            .error-button.secondary:hover {
              background-color: #545b62;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;