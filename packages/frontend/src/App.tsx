// TrustCareConnect Frontend - Main App Component
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Patient, Doctor, ViewState } from './types';
import { UI_MESSAGES } from './constants';
import MessageDisplay from './components/common/MessageDisplay';
import HomePage from './pages/HomePage';
import PatientPortal from './pages/PatientPortal';
import DoctorPortal from './pages/DoctorPortal';
import icpService from './services/icpService';
import './styles/App.css';

// Navigation component that uses React Router
const Navigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="flex space-x-4">
      <Link
        to="/home"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive('/home') 
            ? 'text-blue-600 bg-blue-50' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        Home
      </Link>
      <Link
        to="/patient"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive('/patient') 
            ? 'text-blue-600 bg-blue-50' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        Patient Portal
      </Link>
      <Link
        to="/doctor"
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive('/doctor') 
            ? 'text-blue-600 bg-blue-50' 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        Doctor Portal
      </Link>
    </nav>
  );
};

function App() {
  const [viewState, setViewState] = useState<ViewState>({
    currentView: 'home',
    currentUser: null,
    loading: {},
    message: ''
  });

  useEffect(() => {
    // Test backend connection on load
    testConnection();
  }, []);

  const testConnection = async () => {
    const result = await icpService.healthCheck();
    if (result.success) {
      showMessage(`Backend connected: ${result.data}`);
    } else {
      showMessage(UI_MESSAGES.ERROR.BACKEND_CONNECTION_FAILED);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setViewState(prev => ({ ...prev, message: msg }));
  };

  const setCurrentUser = (user: Patient | Doctor | null) => {
    setViewState(prev => ({ ...prev, currentUser: user }));
  };

  const setLoading = (key: string, loading: boolean) => {
    setViewState(prev => ({
      ...prev,
      loading: { ...prev.loading, [key]: loading }
    }));
  };

  const clearMessage = () => {
    setViewState(prev => ({ ...prev, message: '' }));
  };

  return (
    <Router>
      <div className="app min-h-screen bg-gray-50">
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

        {viewState.message && (
          <MessageDisplay
            message={viewState.message}
            onClose={clearMessage}
            autoHide={true}
          />
        )}

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route 
              path="/home" 
              element={
                <HomePage />
              } 
            />
            <Route 
              path="/patient" 
              element={
                <PatientPortal
                  currentUser={viewState.currentUser as Patient}
                  setCurrentUser={setCurrentUser}
                  showMessage={showMessage}
                  loading={viewState.loading.patient || false}
                  setLoading={(loading) => setLoading('patient', loading)}
                />
              } 
            />
            <Route 
              path="/doctor" 
              element={
                <DoctorPortal
                  currentUser={viewState.currentUser as Doctor}
                  setCurrentUser={setCurrentUser}
                  showMessage={showMessage}
                  loading={viewState.loading.doctor || false}
                  setLoading={(loading) => setLoading('doctor', loading)}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;