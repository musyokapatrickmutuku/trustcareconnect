// TrustCareConnect Frontend - Main App Component with Internet Identity Authentication
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Patient, Doctor } from './types';
import { UI_MESSAGES } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import ProtectedRoute, { PatientRoute, DoctorRoute, AuthenticatedRoute, AuthenticationStatus, RoleBasedVisibility } from './components/ProtectedRoute.js';
import MessageDisplay from './components/common/MessageDisplay';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import trustCareAPI from './api/trustcare.js';
import './styles/App.css';

// Lazy loaded components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const PatientPortal = lazy(() => import('./pages/PatientPortal'));
const DoctorPortal = lazy(() => import('./pages/DoctorPortal'));

// Remove lazy imports for components that aren't used in current App structure

// Loading fallback component for lazy-loaded components
const LazyLoadingFallback: React.FC<{ message?: string }> = ({ 
  message = "Loading..." 
}) => (
  <div className="flex justify-center items-center min-h-[200px]">
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

// Preload components for better UX
const preloadComponents = () => {
  // Preload critical components when user is likely to navigate to them
  const componentsToPreload = [
    () => import('./pages/HomePage'),
    () => import('./pages/PatientPortal'),
    () => import('./pages/DoctorPortal'),
    () => import('./components/patient/PatientDashboard'),
    () => import('./components/doctor/DoctorDashboard'),
  ];
  
  // Preload after a short delay to not block initial render
  setTimeout(() => {
    componentsToPreload.forEach(loadComponent => {
      loadComponent().catch(error => {
        console.warn('Failed to preload component:', error);
      });
    });
  }, 2000);
};

// Login component for unauthenticated users
const LoginPage: React.FC<{showMessage: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void}> = ({ showMessage }) => {
  const { login, isLoading } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      showMessage(`Login failed: ${error}`, 'error');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            🏥 TrustCareConnect
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure Healthcare Communication Platform
          </p>
          <p className="mt-4 text-gray-700">
            Connect with Internet Identity to access your healthcare portal
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <>🔐 Login with Internet Identity</>
            )}
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              New to TrustCareConnect? You'll be prompted to register after logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Registration component for users who need to set up their profile
const RegistrationPage: React.FC<{showMessage: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void}> = ({ showMessage }) => {
  const { registerUser, principal, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    condition: '', // for patients
    specialization: '' // for doctors
  });
  
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      showMessage('Please select a role', 'error');
      return;
    }
    
    const userData = {
      name: formData.name,
      email: formData.email,
      isActive: true,
      ...(selectedRole === 'patient' ? { condition: formData.condition || 'General' } : {}),
      ...(selectedRole === 'doctor' ? { specialization: formData.specialization || 'General Practice' } : {})
    };
    
    const result = await registerUser(userData, selectedRole);
    if (result.success) {
      showMessage('Registration successful! Welcome to TrustCareConnect.', 'success');
    } else {
      showMessage(result.error || 'Registration failed', 'error');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Complete Your Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Principal: {principal}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegistration}>
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  selectedRole === 'patient'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">🏥</div>
                <div className="font-medium">Patient</div>
                <div className="text-sm text-gray-500">Seeking medical care</div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`p-4 rounded-lg border-2 text-center transition-colors ${
                  selectedRole === 'doctor'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">👨‍⚕️</div>
                <div className="font-medium">Doctor</div>
                <div className="text-sm text-gray-500">Healthcare provider</div>
              </button>
            </div>
          </div>
          
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {selectedRole === 'patient' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Medical Condition/Concern
                </label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  placeholder="e.g., Diabetes, Hypertension, General Health"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {selectedRole === 'doctor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                  placeholder="e.g., Cardiology, Internal Medicine, Family Practice"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !selectedRole || !formData.name.trim()}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Navigation component with authentication awareness
const Navigation: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, userRole, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  if (!isAuthenticated) {
    return null; // Don't show navigation when not authenticated
  }
  
  return (
    <nav className="flex items-center space-x-4">
      <Link
        to="/"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive('/') 
            ? 'text-blue-600 bg-blue-50' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        🏠 Home
      </Link>
      
      <RoleBasedVisibility allowedRoles={['patient']}>
        <Link
          to="/patient"
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/patient') 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          🏥 Patient Portal
        </Link>
      </RoleBasedVisibility>
      
      <RoleBasedVisibility allowedRoles={['doctor']}>
        <Link
          to="/doctor"
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/doctor') 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          👨‍⚕️ Doctor Portal
        </Link>
      </RoleBasedVisibility>
      
      <div className="flex items-center space-x-2 ml-4">
        <span className="text-sm text-gray-600">
          {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)}` : 'User'}
        </span>
        <button
          onClick={logout}
          className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors"
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

// Main App component with authentication
const AppContent: React.FC = () => {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [message, setMessage] = useState('');
  const { isAuthenticated, needsRegistration } = useAuth();

  useEffect(() => {
    // Test backend connection on load
    if (isAuthenticated) {
      testConnection();
      // Preload components for better user experience
      preloadComponents();
    }
  }, [isAuthenticated]);

  const testConnection = async () => {
    const result = await trustCareAPI.healthCheck();
    if (result.success) {
      showMessage(`Backend connected: ${result.data}`, 'success');
    } else {
      showMessage('Backend connection failed. Some features may not work properly.', 'warning');
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setMessage(msg);
  };

  const setLoadingState = (key: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [key]: isLoading }));
  };

  const clearMessage = () => {
    setMessage('');
  };

  // Show registration page for authenticated users without roles
  if (needsRegistration) {
    return <RegistrationPage showMessage={showMessage} />;
  }

  return (
    <div className="app min-h-screen bg-gray-50">
      <AuthenticationStatus
        unauthenticatedContent={<LoginPage showMessage={showMessage} />}
        loadingContent={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}
        errorContent={<div className="min-h-screen flex items-center justify-center text-red-600">Authentication Error</div>}
        authenticatedContent={
          <>
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      🏥 TrustCareConnect
                    </h1>
                  </div>
                  <Navigation />
                </div>
              </div>
            </header>

            {message && (
              <MessageDisplay
                message={message}
                onClose={clearMessage}
                autoHide={true}
              />
            )}

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <ErrorBoundary>
                <Suspense fallback={<LazyLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/login" element={<Navigate to="/" replace />} />
                    <Route path="/register" element={<RegistrationPage showMessage={showMessage} />} />
                    
                    <Route 
                      path="/home" 
                      element={
                        <AuthenticatedRoute>
                          <HomePage />
                        </AuthenticatedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/patient/*" 
                      element={
                        <PatientRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading patient portal..." />}>
                            <PatientPortal
                              currentUser={currentPatient}
                              setCurrentUser={setCurrentPatient}
                              showMessage={showMessage}
                              loading={loading.patient || false}
                              setLoading={(isLoading) => setLoadingState('patient', isLoading)}
                            />
                          </Suspense>
                        </PatientRoute>
                      } 
                    />
                    
                    <Route 
                      path="/doctor/*" 
                      element={
                        <DoctorRoute>
                          <Suspense fallback={<LazyLoadingFallback message="Loading doctor portal..." />}>
                            <DoctorPortal
                              currentUser={currentDoctor}
                              setCurrentUser={setCurrentDoctor}
                              showMessage={showMessage}
                              loading={loading.doctor || false}
                              setLoading={(isLoading) => setLoadingState('doctor', isLoading)}
                            />
                          </Suspense>
                        </DoctorRoute>
                      } 
                    />
                    
                    {/* Catch-all route for unknown paths */}
                    <Route 
                      path="*" 
                      element={
                        <div className="text-center py-12">
                          <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
                          <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                          <Link to="/" className="text-blue-600 hover:text-blue-800 underline">
                            Return to Home
                          </Link>
                        </div>
                      } 
                    />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
          </>
        }
      />
      
      {/* Connection Status Indicator */}
      <ConnectionStatus />
    </div>
  );
};

// Wrapper App component with AuthProvider
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;