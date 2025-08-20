/**
 * Protected Route Component
 * Restricts access based on user authentication and role
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  redirectTo = '/login',
  fallbackComponent: FallbackComponent = null 
}) => {
  const { 
    isAuthenticated, 
    userRole, 
    authState, 
    isLoading, 
    needsRegistration,
    AUTH_STATES 
  } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (authState === AUTH_STATES.CHECKING || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" message="Checking authentication..." />
      </div>
    );
  }

  // Handle authentication error
  if (authState === AUTH_STATES.ERROR) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">
            There was a problem with the authentication system.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    // Store the attempted location so we can redirect back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authenticated but needs registration, redirect to registration
  if (isAuthenticated && needsRegistration && location.pathname !== '/register') {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (isAuthenticated && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have required role
      if (FallbackComponent) {
        return <FallbackComponent />;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-yellow-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required role(s): {allowedRoles.join(', ')}
              <br />
              Your role: {userRole || 'None'}
            </p>
            <div className="space-x-2">
              <button 
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Go Back
              </button>
              <Navigate to="/" />
            </div>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render the protected content
  return children;
};

/**
 * Higher-order component for role-based protection
 */
export const withRoleProtection = (Component, allowedRoles = []) => {
  return (props) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Specific protected route components for common use cases
 */
export const PatientRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['patient']} {...props}>
    {children}
  </ProtectedRoute>
);

export const DoctorRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['doctor']} {...props}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute allowedRoles={['admin']} {...props}>
    {children}
  </ProtectedRoute>
);

export const AuthenticatedRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={true} {...props}>
    {children}
  </ProtectedRoute>
);

export const PublicRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={false} {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * Role-based visibility component
 * Conditionally renders content based on user role
 */
export const RoleBasedVisibility = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  requireAuth = true 
}) => {
  const { isAuthenticated, userRole } = useAuth();

  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  if (allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      return fallback;
    }
  }

  return children;
};

/**
 * Authentication status component
 * Shows different content based on authentication state
 */
export const AuthenticationStatus = ({ 
  authenticatedContent = null,
  unauthenticatedContent = null,
  loadingContent = null,
  errorContent = null
}) => {
  const { authState, isLoading, error, AUTH_STATES } = useAuth();

  if (isLoading || authState === AUTH_STATES.CHECKING) {
    return loadingContent || (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  if (authState === AUTH_STATES.ERROR) {
    return errorContent || (
      <div className="text-red-600 p-4 text-center">
        <p>Authentication Error: {error}</p>
      </div>
    );
  }

  if (authState === AUTH_STATES.AUTHENTICATED) {
    return authenticatedContent;
  }

  return unauthenticatedContent;
};

export default ProtectedRoute;