// Patient Portal Page Component
import React, { useState } from 'react';
import { Patient, ComponentProps } from '../types';
import PatientLogin from '../components/patient/PatientLogin';
import PatientDashboard from '../components/patient/PatientDashboard';
import PatientRegistration from '../components/patient/PatientRegistration';

interface PatientPortalProps {
  currentUser: Patient | null;
  setCurrentUser?: (user: Patient | null) => void;
  showMessage?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({
  currentUser,
  setCurrentUser,
  showMessage,
  loading,
  setLoading
}) => {
  const [showRegistration, setShowRegistration] = useState(false);

  const handleLoginSuccess = (patient: Patient) => {
    setCurrentUser?.(patient);
  };

  const handleRegistrationSuccess = (patient: Patient) => {
    setCurrentUser?.(patient);
    setShowRegistration(false);
    showMessage?.('Registration successful! You can now submit queries once assigned to a doctor.');
  };

  const handleLogout = () => {
    setCurrentUser?.(null);
    setShowRegistration(false);
  };

  if (currentUser) {
    return (
      <PatientDashboard
        patient={currentUser}
        onLogout={handleLogout}
        showMessage={showMessage || (() => {})}
        loading={loading ?? false}
        setLoading={setLoading || (() => {})}
      />
    );
  }

  if (showRegistration) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowRegistration(false)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Login
          </button>
        </div>
        <PatientRegistration
          onRegistrationSuccess={handleRegistrationSuccess}
          showMessage={showMessage || (() => {})}
          loading={loading}
          setLoading={setLoading || (() => {})}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PatientLogin
        onLoginSuccess={handleLoginSuccess}
        showMessage={showMessage || (() => {})}
        loading={loading ?? false}
        setLoading={setLoading || (() => {})}
      />
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowRegistration(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          New patient? Register here →
        </button>
      </div>
    </div>
  );
};

export default PatientPortal;